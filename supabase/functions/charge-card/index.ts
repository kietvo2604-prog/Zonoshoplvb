import { serve } from "https://deno.land";
import { createClient } from "https://esm.sh";
import { crypto } from "https://deno.land";
import { encode as hexEncode } from "https://deno.land";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Hàm tạo chuỗi MD5 chữ thường chuẩn API
async function md5(message: string): Promise<string> {
  const msgUint8 = new TextEncoder().encode(message);
  const hashBuffer = await crypto.subtle.digest("MD5", msgUint8);
  const hexType = hexEncode(new Uint8Array(hashBuffer));
  return new TextDecoder().decode(hexType).toLowerCase(); // Đảm bảo chữ thường
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { telco, code, serial, amount, user_id, topup_request_id } = await req.json();

    // Kiểm tra đầu vào
    if (!telco || !code || !serial || !amount || !user_id) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Lấy thông tin cấu hình cổng gạch thẻ
    const { data: apiSetting } = await supabase
      .from("shop_settings")
      .select("value")
      .eq("key", "charge_card_api")
      .maybeSingle();

    const provider = apiSetting?.value === "thesieure" ? "thesieure" : "gachthefast";
    const partnerId = provider === "thesieure" ? Deno.env.get("TSR_PARTNER_ID") : Deno.env.get("GTF_PARTNER_ID");
    const partnerKey = provider === "thesieure" ? Deno.env.get("TSR_PARTNER_KEY") : Deno.env.get("GTF_PARTNER_KEY");
    const endpoint = provider === "thesieure" ? "https://thesieure.com" : "https://gachthefast.com";

    if (!partnerId || !partnerKey) {
      return new Response(
        JSON.stringify({ error: `${provider} API credentials not configured` }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Tạo request_id duy nhất
    const request_id = `${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
    const command = "charging";
    const telcoUpper = telco.toUpperCase();

    // SỬA LỖI TẠI ĐÂY: Chuỗi sign chuẩn API V2 của Thesieure và Gachthefast
    const signString = partnerKey + code + serial;
    const sign = await md5(signString);

    // Đóng gói FormData
    const formData = new URLSearchParams();
    formData.append("telco", telcoUpper);
    formData.append("code", code);
    formData.append("serial", serial);
    formData.append("amount", amount.toString());
    formData.append("request_id", request_id);
    formData.append("partner_id", partnerId);
    formData.append("command", command);
    formData.append("sign", sign);

    console.log(`Sending card to ${provider}:`, { telco: telcoUpper, amount, request_id });

    // Gọi API
    const apiResponse = await fetch(endpoint, {
      method: "POST",
      headers: { 
        "Content-Type": "application/x-www-form-urlencoded",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)" // Tránh bị chặn bởi tường lửa một số bên
      },
      body: formData.toString(),
    });

    const result = await apiResponse.json();
    console.log(`${provider} response:`, result);

    // Cập nhật trạng thái vào database Supabase
    if (topup_request_id) {
      await supabase
        .from("topup_requests")
        .update({ request_id, card_result: JSON.stringify({ provider, ...result }) })
        .eq("id", topup_request_id);
    }

    return new Response(
      JSON.stringify({ success: true, request_id, api_result: result }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("charge-card error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { createHash } from "https://deno.land/std@0.168.0/crypto/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

async function md5(message: string): Promise<string> {
  const hash = createHash("md5");
  hash.update(message);
  return hash.toString();
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { telco, code, serial, amount, user_id, topup_request_id } = await req.json();

    // Validate inputs
    if (!telco || !code || !serial || !amount || !user_id) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Đọc cấu hình từ shop_settings
    const { data: apiSetting } = await supabase
      .from("shop_settings")
      .select("value")
      .eq("key", "charge_card_api")
      .maybeSingle();

    const provider = apiSetting?.value === "thesieure" ? "thesieure" : "gachthefast";
    
    let partnerId: string | undefined;
    let partnerKey: string | undefined;
    let endpoint: string;

    // Cấu hình cho TheSieuRe
    if (provider === "thesieure") {
      partnerId = Deno.env.get("TSR_PARTNER_ID");
      partnerKey = Deno.env.get("TSR_PARTNER_KEY");
      endpoint = "https://thesieure.com/chargingws/v2";
    } else {
      partnerId = Deno.env.get("GTF_PARTNER_ID");
      partnerKey = Deno.env.get("GTF_PARTNER_KEY");
      endpoint = "https://gachthefast.com/chargingws/v2";
    }

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

    // ========== QUAN TRỌNG: TẠO CHỮ KÝ ĐÚNG CHO THE SIEU RE ==========
    // Thứ tự: partner_key + code + command + partner_id + request_id + serial + telco
    const signString = partnerKey + code + command + partnerId + request_id + serial + telcoUpper;
    const sign = await md5(signString);

    // Log để debug
    console.log("=== SENDING TO THE SIEU RE ===");
    console.log("Provider:", provider);
    console.log("Endpoint:", endpoint);
    console.log("Partner ID:", partnerId);
    console.log("Request ID:", request_id);
    console.log("Telco:", telcoUpper);
    console.log("Amount:", amount);
    console.log("Sign String:", signString);
    console.log("Sign MD5:", sign);

    // Tạo form data gửi sang TheSieuRe
    const formData = new URLSearchParams();
    formData.append("telco", telcoUpper);
    formData.append("code", code);
    formData.append("serial", serial);
    formData.append("amount", amount.toString());
    formData.append("request_id", request_id);
    formData.append("partner_id", partnerId);
    formData.append("command", command);
    formData.append("sign", sign);

    // Gửi request đến TheSieuRe
    const apiResponse = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: formData.toString(),
    });

    const result = await apiResponse.json();
    console.log("TheSieuRe Response:", result);

    // Cập nhật topup_request nếu có topup_request_id
    if (topup_request_id) {
      const { error: updateError } = await supabase
        .from("topup_requests")
        .update({ 
          request_id, 
          card_result: JSON.stringify({ 
            provider, 
            request_id, 
            sent_at: new Date().toISOString(),
            api_response: result 
          })
        })
        .eq("id", topup_request_id);
      
      if (updateError) {
        console.error("Failed to update topup_request:", updateError);
      }
    }

    // Trả về kết quả cho frontend
    return new Response(
      JSON.stringify({ 
        success: true, 
        request_id, 
        api_result: result 
      }),
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

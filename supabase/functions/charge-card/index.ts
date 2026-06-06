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

    const request_id = `${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
    const command = "charging";
    const telcoUpper = telco.toUpperCase();

    // Tạo chữ ký - thứ tự đúng cho TheSieuRe
    const signString = partnerKey + code + command + partnerId + request_id + serial + telcoUpper;
    const sign = await md5(signString);

    console.log("Provider:", provider);
    console.log("Request ID:", request_id);
    console.log("Sign String:", signString);

    // Gửi request đến API đối tác
    const formData = new URLSearchParams();
    formData.append("telco", telcoUpper);
    formData.append("code", code);
    formData.append("serial", serial);
    formData.append("amount", amount.toString());
    formData.append("request_id", request_id);
    formData.append("partner_id", partnerId);
    formData.append("command", command);
    formData.append("sign", sign);

    const apiResponse = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: formData.toString(),
    });

    const result = await apiResponse.json();
    console.log("API Response:", result);

    // Cập nhật topup_request nếu có ID
    if (topup_request_id) {
      await supabase
        .from("topup_requests")
        .update({ 
          request_id, 
          card_result: JSON.stringify({ provider, ...result }) 
        })
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
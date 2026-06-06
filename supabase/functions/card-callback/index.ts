import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { createHash } from "https://deno.land/std@0.168.0/crypto/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
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
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const GTF_PARTNER_KEY = Deno.env.get("GTF_PARTNER_KEY");
    const TSR_PARTNER_KEY = Deno.env.get("TSR_PARTNER_KEY");
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Parse callback data
    let data: Record<string, string>;
    const contentType = req.headers.get("content-type") || "";
    
    if (contentType.includes("application/x-www-form-urlencoded")) {
      const formData = await req.formData();
      data = {};
      formData.forEach((value, key) => {
        data[key] = value.toString();
      });
    } else if (contentType.includes("application/json")) {
      data = await req.json();
    } else {
      const body = await req.text();
      data = {};
      new URLSearchParams(body).forEach((value, key) => {
        data[key] = value;
      });
    }

    console.log("Card callback received:", data);

    const {
      status,
      request_id,
      declared_value,
      value,
      amount,
      code: card_code,
      serial: card_serial,
      callback_sign,
      message,
    } = data;

    if (!request_id) {
      return new Response(
        JSON.stringify({ error: "Missing request_id" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verify callback_sign
    if (callback_sign && card_code && card_serial) {
      let isValid = false;
      
      // Thử với GTF key
      if (GTF_PARTNER_KEY) {
        const gtfSign = await md5(GTF_PARTNER_KEY + card_code + card_serial);
        if (gtfSign === callback_sign) isValid = true;
      }
      
      // Thử với TSR key
      if (TSR_PARTNER_KEY && !isValid) {
        const tsrSign = await md5(TSR_PARTNER_KEY + card_code + card_serial);
        if (tsrSign === callback_sign) isValid = true;
      }
      
      if (!isValid) {
        console.error("Invalid callback_sign!", { received: callback_sign });
        return new Response(
          JSON.stringify({ error: "Invalid signature" }),
          { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // Find topup_request
    const { data: topupRequest, error: findError } = await supabase
      .from("topup_requests")
      .select("*")
      .eq("request_id", request_id)
      .single();

    if (findError || !topupRequest) {
      console.error("Topup request not found:", request_id);
      return new Response(
        JSON.stringify({ error: "Request not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (topupRequest.status !== "pending") {
      return new Response(
        JSON.stringify({ success: true, message: "Already processed" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const cardStatus = parseInt(status || "0");
    const actualValue = parseInt(value || amount || "0");
    const declaredVal = parseInt(declared_value || "0");

    if (cardStatus === 1 || cardStatus === 2) {
      const creditAmount = Math.floor(actualValue * 0.8);

      const { data: profile } = await supabase
        .from("profiles")
        .select("balance")
        .eq("user_id", topupRequest.user_id)
        .single();

      if (profile) {
        await supabase
          .from("profiles")
          .update({ balance: profile.balance + creditAmount })
          .eq("user_id", topupRequest.user_id);
      }

      const resultNote = cardStatus === 2
        ? `Sai mệnh giá. Khai: ${declaredVal}, Thực: ${actualValue}. +${creditAmount}đ`
        : `Thẻ hợp lệ ${actualValue}đ, +${creditAmount}đ`;

      await supabase
        .from("topup_requests")
        .update({
          status: "approved",
          card_result: JSON.stringify({ ...data, credit_amount: creditAmount }),
          note: topupRequest.note + ` | ${resultNote}`,
          amount: actualValue,
        })
        .eq("id", topupRequest.id);

      console.log(`✅ Approved: user ${topupRequest.user_id} +${creditAmount}đ`);
    } else {
      await supabase
        .from("topup_requests")
        .update({
          status: "rejected",
          card_result: JSON.stringify(data),
          note: topupRequest.note + ` | Thẻ không hợp lệ: ${message || "Sai hoặc đã dùng"}`,
        })
        .eq("id", topupRequest.id);

      console.log(`❌ Rejected: user ${topupRequest.user_id}`);
    }

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("card-callback error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
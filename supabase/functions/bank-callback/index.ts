import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { transfer_content, amount, secret_key } = await req.json();

    // Validate secret key to prevent unauthorized calls
    const WEBHOOK_SECRET = Deno.env.get("TOPUP_WEBHOOK_SECRET");
    if (!WEBHOOK_SECRET || secret_key !== WEBHOOK_SECRET) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate inputs
    if (!transfer_content || !amount || typeof amount !== "number" || amount <= 0) {
      return new Response(
        JSON.stringify({ error: "Missing or invalid fields. Required: transfer_content (string), amount (number > 0)" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Extract NNQxxx code from transfer content
    const match = transfer_content.toUpperCase().match(/NNQ\d{3}/);
    if (!match) {
      return new Response(
        JSON.stringify({ error: "No valid NNQ code found in transfer content", transfer_content }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const NNQCode = match[0];

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Find user by transfer_code
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("user_id, balance, display_name, transfer_code")
      .eq("transfer_code", NNQCode)
      .single();

    if (profileError || !profile) {
      return new Response(
        JSON.stringify({ error: "No user found with transfer code: " + NNQCode }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Calculate bonus: under 50k → +10%, 50k+ → +5%
    const bonusRate = amount < 50000 ? 0.10 : 0.05;
    const bonusAmount = Math.floor(amount * bonusRate);
    const creditAmount = amount + bonusAmount;

    // Create approved topup_request
    const { error: insertError } = await supabase.from("topup_requests").insert({
      user_id: profile.user_id,
      amount: creditAmount,
      method: "Chuyển khoản ATM/ZaloPay",
      status: "approved",
      note: `Nội dung: ${transfer_content} | Gốc: ${amount}đ + Bonus ${bonusRate * 100}%: ${bonusAmount}đ`,
    });

    if (insertError) {
      console.error("Insert topup error:", insertError);
      return new Response(
        JSON.stringify({ error: "Failed to create topup record" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Credit balance
    const { error: updateError } = await supabase
      .from("profiles")
      .update({ balance: profile.balance + creditAmount })
      .eq("user_id", profile.user_id);

    if (updateError) {
      console.error("Update balance error:", updateError);
      return new Response(
        JSON.stringify({ error: "Failed to update balance" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Topup success: ${NNQCode} → ${profile.display_name} → +${creditAmount}đ (${amount} + ${bonusAmount} bonus)`);

    return new Response(
      JSON.stringify({
        success: true,
        transfer_code: NNQCode,
        user: profile.display_name,
        original_amount: amount,
        bonus_rate: `${bonusRate * 100}%`,
        bonus_amount: bonusAmount,
        credit_amount: creditAmount,
        new_balance: profile.balance + creditAmount,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("bank-callback error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

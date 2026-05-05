import { NextResponse } from "next/server";
import { Client } from "@upstash/qstash";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

// Initialize QStash Client
const qstash = new Client({
  token: process.env.QSTASH_TOKEN || "",
});

// Initialize Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const supabase = createClient(supabaseUrl, supabaseKey);

export async function POST(req: Request) {
  try {
    // 🛑 SECURITY LOCK
    const authHeader = req.headers.get("authorization");
    if (authHeader !== `Bearer ${process.env.CLAWLINK_MASTER_SECRET}`) {
      return NextResponse.json({ success: false, reply: "Access Denied." }, { status: 401 });
    }

    const { email, campaignId, platform, messageTemplate } = await req.json();

    if (!campaignId || !messageTemplate) {
      return NextResponse.json({ success: false, error: "Missing campaign data" }, { status: 400 });
    }

    // 1. Fetch all Leads for this Campaign from Supabase
    // (Assuming you have a leads table linked to campaigns)
    const { data: leads, error } = await supabase
      .from("leads")
      .select("phone_or_chat_id, name")
      .eq("campaign_id", campaignId);

    if (error || !leads || leads.length === 0) {
      return NextResponse.json({ success: false, error: "No leads found for this campaign" }, { status: 404 });
    }

    console.log(`[BROADCAST] Pushing ${leads.length} contacts to QStash Queue...`);

    // 2. Loop through leads and push them to QStash Queue
    // QStash will hold these and send them to our "Worker" API slowly
    const WORKER_URL = `https://${req.headers.get("host")}/api/broadcast/worker`;

    // 💡 PRO-TIP: Send in batches to QStash if leads > 1000 to save time
    const publishPromises = leads.map((lead) => {
      // Personalize message
      const finalMessage = messageTemplate.replace("{{name}}", lead.name || "Customer");

      return qstash.publishJSON({
        url: WORKER_URL,
        body: {
          platform: platform, // "whatsapp", "telegram", "instagram"
          to: lead.phone_or_chat_id,
          message: finalMessage,
          email: email, // For billing deduction in worker
        },
        // optional: add delay or upstash rate limit group here
      });
    });

    await Promise.all(publishPromises);

    // 3. Update Campaign Status
    await supabase.from("campaigns").update({ status: "processing" }).eq("id", campaignId);

    return NextResponse.json({ 
      success: true, 
      reply: `Broadcast started! ${leads.length} messages queued in background.` 
    });

  } catch (error: any) {
    // 🔥 ALWAYS LOG TO TG ADMIN
    console.error("🚨 [BROADCAST TRIGGER ERROR] Sending to TG Admin:", error.message);
    // TODO: fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage...`)
    
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
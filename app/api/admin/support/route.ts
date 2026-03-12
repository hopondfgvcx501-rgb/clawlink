import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sendEmail } from "../../../lib/email"; // Fixed path based on your folder structure

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const supabase = createClient(supabaseUrl, supabaseKey);

export async function GET(req: Request) {
  try {
    const { data, error } = await supabase
      .from("support_tickets")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw new Error(error.message);

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error("Admin Support API Error:", error.message);
    return NextResponse.json({ success: false, error: "Failed to fetch support tickets" }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const { id, status } = body;

    if (!id || !status) {
      return NextResponse.json({ success: false, error: "Invalid parameters" }, { status: 400 });
    }

    const { data: ticketData, error: fetchError } = await supabase
      .from("support_tickets")
      .select("user_email, issue_type")
      .eq("id", id)
      .single();

    if (fetchError || !ticketData) throw new Error("Ticket not found");

    const { data, error } = await supabase
      .from("support_tickets")
      .update({ status: status })
      .eq("id", id)
      .select();

    if (error) throw new Error(error.message);

    if (status === "Resolved" && ticketData.user_email) {
      const emailHtml = `
        <div style="font-family: monospace; max-w: 600px; margin: 0 auto; background: #0A0A0B; color: #ffffff; padding: 40px; border-radius: 15px; border: 1px solid #333;">
          <h2 style="color: #22c55e; letter-spacing: 2px;">STATUS: RESOLVED</h2>
          <p style="color: #cccccc; font-size: 16px;">Hello,</p>
          <p style="color: #cccccc; font-size: 16px; line-height: 1.6;">Your support ticket regarding <strong style="color: #ffffff;">${ticketData.issue_type}</strong> has been officially marked as <strong>Resolved</strong> by our Global Technical Desk.</p>
          <p style="color: #cccccc; font-size: 16px; line-height: 1.6;">If your systems are still facing anomalies, please generate a new ticket via your dashboard.</p>
          <br/>
          <a href="https://clawlink.com/dashboard" style="background: #ffffff; color: #000000; padding: 12px 24px; text-decoration: none; font-weight: bold; border-radius: 8px;">Access Dashboard</a>
          <hr style="border: 0; border-top: 1px solid #333; margin: 40px 0 20px 0;" />
          <p style="color: #666666; font-size: 12px; letter-spacing: 1px;">© 2026 CLAWLINK INC. GLOBAL AI SAAS INFRASTRUCTURE.</p>
        </div>
      `;
      await sendEmail(ticketData.user_email, "ClawLink Support: Issue Resolved", emailHtml);
    }

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error("Admin Ticket Update Error:", error.message);
    return NextResponse.json({ success: false, error: "Failed to update ticket" }, { status: 500 });
  }
}
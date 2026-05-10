import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getToken } from "next-auth/jwt"; 

export const dynamic = "force-dynamic";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const supabaseAdmin = createClient(supabaseUrl, supabaseKey);

export async function GET(req: Request) {
    try {
        // 🛡️ SECURITY LOCK: Only logged-in users can see their bills
        const token = await getToken({ req: req as any, secret: process.env.NEXTAUTH_SECRET });
        if (!token || !token.email) {
            return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
        }

        const email = token.email.toLowerCase();

        // 📥 Fetch all past invoices for this user
        const { data, error } = await supabaseAdmin
            .from("billing_history")
            .select("*")
            .eq("email", email)
            .order("created_at", { ascending: false });

        if (error) throw error;

        return NextResponse.json({ success: true, data: data || [] });
    } catch (error: any) {
        console.error("[BILLING_HISTORY_ERROR]:", error);
        return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
    }
}
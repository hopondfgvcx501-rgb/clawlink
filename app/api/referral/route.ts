import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";

export const dynamic = "force-dynamic";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const supabase = createClient(supabaseUrl, supabaseKey);

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const email = searchParams.get('email');

        if (!email) return NextResponse.json({ success: false, error: "Email required" }, { status: 400 });

        // 1. Fetch User Data
        let { data: user, error } = await supabase
            .from("user_configs")
            .select("referral_code, total_referrals, referral_earnings")
            .eq("email", email)
            .single();

        if (error && error.code !== 'PGRST116') throw error; // PGRST116 is "Not Found"

        // 2. Generate Unique Referral Code if not exists
        if (user && !user.referral_code) {
            // Generate a random 6-character hex code
            const newCode = "CLAW" + crypto.randomBytes(3).toString("hex").toUpperCase();
            
            await supabase
                .from("user_configs")
                .update({ referral_code: newCode, total_referrals: 0, referral_earnings: 0 })
                .eq("email", email);
            
            user.referral_code = newCode;
            user.total_referrals = 0;
            user.referral_earnings = 0;
        }

        return NextResponse.json({ success: true, data: user });

    } catch (error: any) {
        console.error("Referral API Error:", error.message);
        return NextResponse.json({ success: false, error: "Failed to fetch referral stats" }, { status: 500 });
    }
}
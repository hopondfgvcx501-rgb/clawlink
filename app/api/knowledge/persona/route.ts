/**
 * ==============================================================================================
 * CLAWLINK ENTERPRISE: OMNI-CHANNEL PERSONA CONTROLLER
 * ==============================================================================================
 * @description Saves channel-specific AI personas (WhatsApp, Telegram, Instagram) securely.
 * * ALL RIGHTS RESERVED. CLAWLINK INC.
 * ==============================================================================================
 */

import { NextResponse, NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getToken } from "next-auth/jwt";

export const dynamic = "force-dynamic";

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

export async function POST(req: NextRequest) {
    try {
        const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
        if (!token || !token.email) {
            return NextResponse.json({ success: false, error: "Unauthorized session. Token missing or invalid." }, { status: 401 });
        }

        const email = token.email.toLowerCase();
        const { channel, persona } = await req.json();

        if (!channel || persona === undefined) {
            return NextResponse.json({ success: false, error: "Missing channel or persona payload." }, { status: 400 });
        }

        // Determine the correct database column based on the requested channel
        let updateColumn = "";
        if (channel === "whatsapp") updateColumn = "whatsapp_persona";
        else if (channel === "telegram") updateColumn = "telegram_persona";
        else if (channel === "instagram") updateColumn = "instagram_persona";
        else return NextResponse.json({ success: false, error: "Invalid channel specified." }, { status: 400 });

        // Save Persona to user_configs securely
        const { error } = await supabase
            .from("user_configs")
            .update({ [updateColumn]: persona })
            .eq("email", email);

        if (error) throw new Error(error.message);

        return NextResponse.json({ success: true, message: `${channel.toUpperCase()} Persona saved successfully.` });

    } catch (error: any) {
        console.error("[PERSONA_API_ERROR]", error);
        return NextResponse.json({ success: false, error: "Server Error saving persona." }, { status: 500 });
    }
}

// 🗑️ NEW: DELETE PERSONA API (Clear channel-specific persona)
export async function DELETE(req: NextRequest) {
    try {
        const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
        if (!token || !token.email) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

        const { searchParams } = new URL(req.url);
        const channel = searchParams.get("channel");

        let updateColumn = "";
        if (channel === "whatsapp") updateColumn = "whatsapp_persona";
        else if (channel === "telegram") updateColumn = "telegram_persona";
        else if (channel === "instagram") updateColumn = "instagram_persona";
        else return NextResponse.json({ success: false, error: "Invalid channel" }, { status: 400 });

        // Set persona to NULL to clear it securely
        const { error } = await supabase
            .from("user_configs")
            .update({ [updateColumn]: null })
            .eq("email", token.email.toLowerCase());
        
        if (error) throw error;
        return NextResponse.json({ success: true, message: "Persona deleted successfully." });
    } catch (error: any) {
        console.error("[PERSONA_DELETE_ERROR]", error);
        return NextResponse.json({ success: false, error: "Server Error deleting persona." }, { status: 500 });
    }
}
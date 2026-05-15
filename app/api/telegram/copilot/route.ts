/**
 * ==============================================================================================
 * CLAWLINK ENTERPRISE: MULTI-PERSONA AI API
 * ==============================================================================================
 * @file app/api/telegram/copilot/route.ts
 * @description Master CRUD API for managing unlimited AI Personas per tenant.
 * * ALL RIGHTS RESERVED. CLAWLINK INC.
 * ==============================================================================================
 */
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "", 
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "", 
    { auth: { persistSession: false } }
);

// 🚀 GET: Fetch all saved personas
export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const email = searchParams.get("email");
        if (!email) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

        const { data, error } = await supabaseAdmin
            .from("ai_personas")
            .select("*")
            .eq("email", email.toLowerCase())
            .order("created_at", { ascending: false });

        if (error) throw error;
        return NextResponse.json({ success: true, personas: data || [] });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

// 🚀 POST: Create or Update a Persona
export async function POST(req: Request) {
    try {
        const { email, id, personaName, systemPrompt, isActive } = await req.json();
        if (!email || !personaName || !systemPrompt) return NextResponse.json({ success: false, error: "Missing fields" }, { status: 400 });

        const safeEmail = email.toLowerCase();

        // If setting this one as active, deactivate all others first
        if (isActive) {
            await supabaseAdmin.from("ai_personas").update({ is_active: false }).eq("email", safeEmail);
            // Also sync active prompt to user_configs so Webhook reads it easily (Legacy support)
            await supabaseAdmin.from("user_configs").update({ system_prompt_telegram: systemPrompt }).eq("email", safeEmail);
        }

        if (id) {
            // Update
            const { error } = await supabaseAdmin.from("ai_personas").update({ 
                persona_name: personaName, system_prompt: systemPrompt, is_active: isActive, updated_at: new Date().toISOString()
            }).eq("id", id).eq("email", safeEmail);
            if (error) throw error;
        } else {
            // Create
            const { error } = await supabaseAdmin.from("ai_personas").insert({ 
                email: safeEmail, persona_name: personaName, system_prompt: systemPrompt, is_active: isActive 
            });
            if (error) throw error;
        }

        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

// 🚀 DELETE: Remove a Persona
export async function DELETE(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const email = searchParams.get("email");
        const id = searchParams.get("id");

        if (!email || !id) return NextResponse.json({ success: false, error: "Missing params" }, { status: 400 });

        const { error } = await supabaseAdmin.from("ai_personas").delete().eq("id", id).eq("email", email.toLowerCase());
        if (error) throw error;

        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const supabase = createClient(supabaseUrl, supabaseKey);

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { email, text } = body;

        if (!email || !text) {
            return NextResponse.json({ success: false, error: "Email and Content are required." }, { status: 400 });
        }

        // 🚀 1. CONVERT TEXT TO VECTORS USING GEMINI EMBEDDING MODEL
        const geminiKey = process.env.GEMINI_API_KEY;
        const embedUrl = `https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent?key=${geminiKey}`;
        
        const embedRes = await fetch(embedUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                model: "models/text-embedding-004",
                content: { parts: [{ text: text }] }
            })
        });

        const embedData = await embedRes.json();
        
        if (!embedRes.ok) {
            throw new Error(embedData.error?.message || "Failed to generate AI embeddings");
        }

        const vector = embedData.embedding.values;

        // 🚀 2. SAVE SECURELY TO SUPABASE VECTOR DATABASE
        const { error } = await supabase.from("knowledge_base").insert({
            user_email: email,
            content: text,
            embedding: vector
        });

        if (error) throw new Error(error.message);

        return NextResponse.json({ success: true, message: "Knowledge successfully injected into AI brain." });

    } catch (error: any) {
        console.error("Knowledge Base Error:", error.message);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

// FETCH EXISTING KNOWLEDGE
export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const email = searchParams.get('email');

        if (!email) return NextResponse.json({ success: false, error: "Email required" });

        const { data, error } = await supabase
            .from("knowledge_base")
            .select("id, content, created_at")
            .eq("user_email", email)
            .order("created_at", { ascending: false });

        if (error) throw error;

        return NextResponse.json({ success: true, data });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
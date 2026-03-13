import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const supabase = createClient(supabaseUrl, supabaseKey);

// GEMINI EMBEDDING FUNCTION
async function generateEmbedding(text: string) {
  try {
    const embedUrl = `https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent?key=${process.env.GEMINI_API_KEY}`;
    const res = await fetch(embedUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "models/text-embedding-004",
        content: { parts: [{ text: text }] },
      }),
    });
    const data = await res.json();
    return res.ok ? data.embedding.values : null;
  } catch (e) {
    console.error("Embedding Error:", e);
    return null;
  }
}

// 1. FETCH ALL KNOWLEDGE BLOCKS
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const email = searchParams.get("email");

    if (!email) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

    const { data, error } = await supabase
      .from("knowledge_base")
      .select("id, content, created_at")
      .eq("user_email", email)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return NextResponse.json({ success: true, data: data || [] });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// 2. INJECT NEW KNOWLEDGE INTO VECTOR DB
export async function POST(req: Request) {
  try {
    const { email, text } = await req.json();

    if (!email || !text) {
      return NextResponse.json({ success: false, error: "Missing data" }, { status: 400 });
    }

    // Convert text to 768-dimensional Vector
    const vector = await generateEmbedding(text);
    if (!vector) {
      return NextResponse.json({ success: false, error: "Failed to generate AI embedding" }, { status: 500 });
    }

    // Store in Supabase
    const { error } = await supabase.from("knowledge_base").insert({
      user_email: email,
      content: text,
      embedding: vector,
    });

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Knowledge Insert Error:", error);
    return NextResponse.json({ success: false, error: "Failed to save knowledge" }, { status: 500 });
  }
}
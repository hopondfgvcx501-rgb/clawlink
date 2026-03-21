import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const supabase = createClient(supabaseUrl, supabaseKey);

// 🚀 ROBUST GEMINI EMBEDDING FUNCTION (Safe Version)
async function generateEmbedding(text: string) {
  if (!process.env.GEMINI_API_KEY) {
    console.error("CRITICAL: GEMINI_API_KEY is missing in environment variables!");
    return null;
  }

  try {
    // FIXED: Using stable embedding-001 with exact Google required payload
    const embedUrl = `https://generativelanguage.googleapis.com/v1beta/models/embedding-001:embedContent?key=${process.env.GEMINI_API_KEY}`;
    const res = await fetch(embedUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        content: { parts: [{ text: text }] } // Strict format
      }),
    });
    
    const data = await res.json();
    
    if (!res.ok) {
      console.error("Vector API Error Response:", data);
      return null;
    }
    
    return data.embedding.values;
  } catch (e) {
    console.error("Embedding Try-Catch Error:", e);
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
      .eq("user_email", email) // 🚀 FIXED: matches Supabase column
      .order("created_at", { ascending: false });

    if (error) throw error;
    return NextResponse.json({ success: true, data: data || [] });
  } catch (error: any) {
    console.error("GET Knowledge Error:", error);
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
      // 🔒 FIXED ERROR MESSAGE: If you see THIS error, it means the code updated successfully!
      return NextResponse.json({ 
        success: false, 
        error: "System Overload: Failed to encrypt data into Vector DB. Please verify GEMINI_API_KEY in Vercel." 
      }, { status: 500 });
    }

    // Store in Supabase
    const { error } = await supabase.from("knowledge_base").insert({
      user_email: email, // 🚀 FIXED: matches Supabase column
      content: text,
      embedding: vector,
    });

    if (error) {
      console.error("Supabase Knowledge Insert Error:", error);
      throw error;
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Knowledge Endpoint Error:", error);
    return NextResponse.json({ success: false, error: "Failed to save knowledge" }, { status: 500 });
  }
}
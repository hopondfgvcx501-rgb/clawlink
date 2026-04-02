import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getToken } from "next-auth/jwt"; // 🛡️ THE MASTER SECURITY LOCK

export const dynamic = "force-dynamic";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const supabase = createClient(supabaseUrl, supabaseKey);

// 🚀 ROBUST GEMINI EMBEDDING FUNCTION (Fixed for Google's Latest 2026 API Update)
async function generateEmbedding(text: string) {
  if (!process.env.GEMINI_API_KEY) {
    return { error: "GEMINI_API_KEY is missing in Vercel environment variables!" };
  }

  try {
    // 🌟 FIXED: Google recently deprecated old models. The NEW official one is 'gemini-embedding-001'
    const embedUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-001:embedContent?key=${process.env.GEMINI_API_KEY}`;
    const res = await fetch(embedUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        content: { parts: [{ text: text }] }
      }),
    });
    
    const data = await res.json();
    
    // 🛑 SMART ERROR CATCHER
    if (!res.ok) {
      console.error("Vector API Error Response:", data);
      return { error: data.error?.message || "Google Gemini API rejected the request." };
    }
    
    return { values: data.embedding.values };
  } catch (e: any) {
    console.error("Embedding Try-Catch Error:", e);
    return { error: e.message || "Network error while connecting to Gemini." };
  }
}

// 1. FETCH ALL KNOWLEDGE BLOCKS
export async function GET(req: NextRequest) {
  try {
    // 🛡️ SECURITY LOCK: Verify Session First
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    
    if (!token || !token.email) {
      console.error("🚨 [SECURITY BREACH] Unauthenticated Knowledge GET attempt blocked.");
      return NextResponse.json({ success: false, error: "Unauthorized. Invalid Session." }, { status: 401 });
    }

    // 🔥 Overwrite user input with cryptographic token email
    const email = token.email.toLowerCase();

    const { data, error } = await supabase
      .from("knowledge_base")
      .select("id, content, created_at")
      .eq("user_email", email) 
      .order("created_at", { ascending: false });

    if (error) throw error;
    return NextResponse.json({ success: true, data: data || [] });
  } catch (error: any) {
    console.error("GET Knowledge Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// 2. INJECT NEW KNOWLEDGE INTO VECTOR DB
export async function POST(req: NextRequest) {
  try {
    // 🛡️ SECURITY LOCK: Verify Session First
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    
    if (!token || !token.email) {
      return NextResponse.json({ success: false, error: "Unauthorized. Invalid Session." }, { status: 401 });
    }

    const { text } = await req.json();

    // 🔥 Overwrite user input with cryptographic token email
    const email = token.email.toLowerCase();

    if (!text) {
      return NextResponse.json({ success: false, error: "Missing data payload" }, { status: 400 });
    }

    // Convert text to Vector
    const embedResult = await generateEmbedding(text);
    
    // 🚨 If embedding failed, send the EXACT error to the frontend
    if (embedResult.error || !embedResult.values) {
      return NextResponse.json({ 
        success: false, 
        error: `Gemini API Error: ${embedResult.error}` 
      }, { status: 500 });
    }

    // Store in Supabase
    const { error } = await supabase.from("knowledge_base").insert({
      user_email: email, 
      content: text,
      embedding: embedResult.values, 
    });

    if (error) {
      console.error("Supabase Knowledge Insert Error:", error);
      throw error;
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Knowledge Endpoint Error:", error);
    return NextResponse.json({ success: false, error: "Failed to save knowledge to database" }, { status: 500 });
  }
}
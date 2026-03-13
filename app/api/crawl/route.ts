import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const supabase = createClient(supabaseUrl, supabaseKey);

// Helper: Generate Embeddings using Gemini
async function generateEmbedding(text: string) {
    try {
        const embedUrl = `https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent?key=${process.env.GEMINI_API_KEY}`;
        const res = await fetch(embedUrl, {
            method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ model: "models/text-embedding-004", content: { parts: [{ text: text }] } })
        });
        const data = await res.json();
        return res.ok ? data.embedding.values : null;
    } catch (e) {
        return null;
    }
}

// 🚀 THE DEEP WEB SCRAPER
export async function POST(req: Request) {
    try {
        const { email, url } = await req.json();

        if (!email || !url) {
            return NextResponse.json({ success: false, error: "Missing Target URL or Email" }, { status: 400 });
        }

        // 1. Fetch the Target Website
        const response = await fetch(url);
        if (!response.ok) throw new Error("Failed to access the website. It might be protected.");
        const html = await response.text();

        // 2. Bruteforce HTML Stripping (Extracting only meaningful text)
        // Removes scripts, styles, and HTML tags to get pure data
        let textData = html.replace(/<script[^>]*>([\S\s]*?)<\/script>/gmi, '');
        textData = textData.replace(/<style[^>]*>([\S\s]*?)<\/style>/gmi, '');
        textData = textData.replace(/<\/?[^>]+(>|$)/g, " ");
        textData = textData.replace(/\s+/g, ' ').trim();

        if (textData.length < 50) {
             return NextResponse.json({ success: false, error: "Not enough readable content found on this URL." }, { status: 400 });
        }

        // 3. Chunking the Data (Split large website text into 1000-character blocks)
        const chunkSize = 1000;
        const chunks = [];
        for (let i = 0; i < textData.length; i += chunkSize) {
            chunks.push(textData.substring(i, i + chunkSize));
        }

        // 4. Vectorize and Inject into Brain (Max 10 chunks to avoid timeout on Vercel free tier)
        const maxChunks = chunks.slice(0, 10);
        let injectedCount = 0;

        await Promise.all(maxChunks.map(async (chunk) => {
            const vector = await generateEmbedding(`[Source: ${url}] ` + chunk);
            if (vector) {
                await supabase.from("knowledge_base").insert({
                    user_email: email,
                    content: `[Source: ${url}] ` + chunk,
                    embedding: vector,
                });
                injectedCount++;
            }
        }));

        return NextResponse.json({ success: true, message: `Successfully injected ${injectedCount} data blocks from ${url}` });

    } catch (error: any) {
        console.error("Crawler Error:", error.message);
        return NextResponse.json({ success: false, error: "Failed to scrape and inject data." }, { status: 500 });
    }
}
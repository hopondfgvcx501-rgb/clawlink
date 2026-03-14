import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import * as cheerio from "cheerio";

export const dynamic = "force-dynamic";

// 🚀 INITIALIZE SUPABASE
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const supabase = createClient(supabaseUrl, supabaseKey);

// 🚀 GEMINI EMBEDDING GENERATOR
async function generateEmbedding(text: string) {
    try {
        const embedUrl = `https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent?key=${process.env.GEMINI_API_KEY}`;
        const res = await fetch(embedUrl, {
            method: "POST", 
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ 
                model: "models/text-embedding-004", 
                content: { parts: [{ text: text }] } 
            })
        });
        const data = await res.json();
        return res.ok ? data.embedding.values : null;
    } catch (e) {
        console.error("Embedding generation failed:", e);
        return null;
    }
}

// 🚀 HELPER: CHUNK TEXT (Splits large website text into smaller AI-digestible pieces)
function chunkText(text: string, maxLength: number = 1000): string[] {
    const words = text.split(" ");
    const chunks = [];
    let currentChunk = "";

    for (const word of words) {
        if ((currentChunk + word).length > maxLength) {
            chunks.push(currentChunk.trim());
            currentChunk = "";
        }
        currentChunk += `${word} `;
    }
    if (currentChunk) chunks.push(currentChunk.trim());
    return chunks;
}

export async function POST(req: Request) {
    try {
        const { email, url } = await req.json();

        if (!email || !url) {
            return NextResponse.json({ success: false, error: "Missing Email or URL" }, { status: 400 });
        }

        // 1. Fetch HTML from the Target URL
        const fetchRes = await fetch(url, {
            headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36" }
        });

        if (!fetchRes.ok) {
            return NextResponse.json({ success: false, error: "Failed to access the website. It might be protected." });
        }

        const html = await fetchRes.text();

        // 2. Parse HTML and Extract pure Text using Cheerio
        const $ = cheerio.load(html);
        
        // Remove scripts, styles, and non-text elements
        $('script, style, noscript, iframe, img, svg').remove();
        
        let cleanText = $('body').text().replace(/\s+/g, ' ').trim();

        if (!cleanText || cleanText.length < 50) {
            return NextResponse.json({ success: false, error: "Not enough readable text found on this page." });
        }

        // 3. Chunk the text into smaller pieces
        const textChunks = chunkText(cleanText, 1500);

        // 4. Process each chunk: Generate Vector Embedding & Save to Supabase
        let successCount = 0;
        for (const chunk of textChunks) {
            const embedding = await generateEmbedding(chunk);
            
            if (embedding) {
                // IMPORTANT: Ensure you have a table named 'knowledge_base' with columns: email, content, source_url, embedding (vector type)
                const { error } = await supabase.from('knowledge_base').insert({
                    email: email,
                    content: chunk,
                    source_url: url,
                    embedding: embedding
                });

                if (!error) successCount++;
            }
        }

        if (successCount === 0) {
            return NextResponse.json({ success: false, error: "Failed to generate AI memory vectors." });
        }

        return NextResponse.json({ 
            success: true, 
            message: `Deep Scan Complete! Injected ${successCount} data blocks into AI Brain.` 
        });

    } catch (error: any) {
        console.error("Crawler API Error:", error.message);
        return NextResponse.json({ success: false, error: "Internal Server Error during deep scan." }, { status: 500 });
    }
}
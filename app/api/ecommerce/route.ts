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

export async function POST(req: Request) {
    try {
        const { email, shopUrl, accessToken } = await req.json();

        if (!email || !shopUrl || !accessToken) {
            return NextResponse.json({ success: false, error: "Missing Shopify details" }, { status: 400 });
        }

        // Clean the Shop URL
        const cleanShopUrl = shopUrl.replace(/^https?:\/\//, '').replace(/\/$/, '');

        // 1. Fetch Products from Shopify Storefront API (GraphQL)
        const shopifyQuery = `
        {
          products(first: 20) {
            edges {
              node {
                title
                description
                handle
                variants(first: 1) {
                  edges {
                    node {
                      price { amount currencyCode }
                    }
                  }
                }
              }
            }
          }
        }`;

        const shopifyRes = await fetch(`https://${cleanShopUrl}/api/2024-01/graphql.json`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "X-Shopify-Storefront-Access-Token": accessToken
            },
            body: JSON.stringify({ query: shopifyQuery })
        });

        if (!shopifyRes.ok) throw new Error("Failed to connect to Shopify. Check your Access Token.");
        const shopifyData = await shopifyRes.json();

        if (!shopifyData.data || !shopifyData.data.products) {
             return NextResponse.json({ success: false, error: "Invalid Storefront token or no products found." }, { status: 400 });
        }

        const products = shopifyData.data.products.edges;
        let syncedCount = 0;

        // 2. Convert Products into AI Knowledge Vectors
        await Promise.all(products.map(async (item: any) => {
            const product = item.node;
            const price = product.variants.edges[0]?.node?.price?.amount || "N/A";
            const currency = product.variants.edges[0]?.node?.price?.currencyCode || "";
            const checkoutUrl = `https://${cleanShopUrl}/products/${product.handle}`;

            // Create a super-optimized string for the AI to understand
            const productText = `[ECOMMERCE PRODUCT] Name: ${product.title}. Price: ${price} ${currency}. Description: ${product.description}. To buy this product, give the user this exact link: ${checkoutUrl}`;

            const vector = await generateEmbedding(productText);
            
            if (vector) {
                // Save it into the existing RAG knowledge base!
                await supabase.from("knowledge_base").insert({
                    user_email: email,
                    content: productText,
                    embedding: vector,
                });
                syncedCount++;
            }
        }));

        return NextResponse.json({ success: true, message: `Successfully synced ${syncedCount} products to the AI Brain!` });

    } catch (error: any) {
        console.error("Shopify Sync Error:", error.message);
        return NextResponse.json({ success: false, error: "Shopify Sync Failed: " + error.message }, { status: 500 });
    }
}
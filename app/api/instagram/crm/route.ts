/**
 * ==============================================================================================
 * CLAWLINK ENTERPRISE: LIVE CRM API (INSTAGRAM)
 * ==============================================================================================
 * @file app/api/instagram/crm/route.ts
 * @description Serves real-time chat history to the CRM Dashboard and handles manual Admin replies.
 * 🚀 UPGRADE: Fused original Database schema (is_admin, is_bot, sender_id) with Live Meta Graph API.
 * * ALL RIGHTS RESERVED. CLAWLINK INC.
 * ==============================================================================================
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getToken } from "next-auth/jwt";

export const dynamic = "force-dynamic";

// Initialize Supabase Client securely
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const supabase = createClient(supabaseUrl, supabaseKey);

// 🚀 GET: Real-time DB se Instagram DMs/Comments uthana
export async function GET(req: NextRequest) {
  try {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    if (!token || !token.email) {
        return NextResponse.json({ success: false, error: "Unauthorized User" }, { status: 401 });
    }

    const email = token.email.toLowerCase();

    // 🚀 ASLI DB FETCH: chat_history table se Instagram ke chats laana using 'email'
    const { data: rawChats, error } = await supabase
      .from('chat_history')
      .select('*')
      .eq('email', email) 
      .eq('platform', 'instagram') // 🔥 Updated to match your Webhook insert ('platform' not 'channel')
      .order('created_at', { ascending: true }); // Oldest first for chat flow

    if (error) {
        console.error("[CRM_IG_GET_ERROR] Fetch failed:", error.message);
        throw error;
    }

    // 🧠 GROUPING LOGIC: Messages ko unique user (platform_chat_id) ke hisaab se group karna
    const groupedChats: any = {};
    const latestChatsMap: any = {};
    
    rawChats?.forEach(msg => {
       const chatId = msg.platform_chat_id || msg.sender_id; // Support both old and new schema
       if (!chatId) return;

       if (!groupedChats[chatId]) {
           groupedChats[chatId] = [];
       }
       
       // Determine sender type mapping correctly based on your DB columns
       let finalSender = "user";
       if (msg.sender_type === "bot" || msg.is_bot) finalSender = "bot";
       if (msg.sender_type === "admin" || msg.is_admin) finalSender = "admin";

       groupedChats[chatId].push({
           id: msg.id.toString(),
           sender: finalSender,
           text: msg.message,
           time: new Date(msg.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
       });

       // Overwrite with latest info for sidebar
       latestChatsMap[chatId] = {
           id: chatId,
           userId: chatId,
           name: msg.customer_name || `IG Lead (${chatId.substring(0,6)})`, 
           lastMessage: msg.message,
           last_time: msg.created_at,
           time: new Date(msg.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
           unread: 0, 
           aiPaused: false, // Will be fetched from automation_rules later if needed
       };
    });

    // Sort sidebar list by most recent message
    const formattedChats = Object.values(latestChatsMap).sort((a: any, b: any) => 
        new Date(b.last_time).getTime() - new Date(a.last_time).getTime()
    );

    return NextResponse.json({ 
        success: true, 
        chats: formattedChats,
        groupedChats: groupedChats
    });
  } catch (error: any) {
    console.error("[CRM_IG_GET_FATAL]", error.message);
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}

// 🚀 POST: Admin manually message bhej raha hai (With LIVE Meta Graph Delivery)
export async function POST(req: NextRequest) {
  try {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    if (!token || !token.email) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

    const email = token.email.toLowerCase();
    const body = await req.json();
    const { chatId, message } = body;

    if (!chatId || !message) {
        return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 });
    }

    // 1. Fetch User's Meta Token to actually send the message to Instagram
    const { data: config, error: configError } = await supabase
        .from("user_configs")
        .select("instagram_token")
        .eq("email", email)
        .single();

    if (configError || !config?.instagram_token) {
        console.error("[CRM_IG_POST_ERROR] Unauthorized or missing IG Token.");
        return NextResponse.json({ success: false, error: "Meta API Token missing. Please reconnect Instagram." }, { status: 401 });
    }

    const metaApiToken = config.instagram_token.trim();

    // 2. 🚀 LIVE TRIGGER: Send message directly to Meta Graph API
    const metaRes = await fetch(`https://graph.facebook.com/v18.0/me/messages?access_token=${metaApiToken}`, {
        method: "POST", 
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recipient: { id: chatId }, message: { text: message } })
    });

    const metaResponseData = await metaRes.json();
    
    if (metaResponseData.error) {
        console.error("🔥 META CRM REJECTION:", JSON.stringify(metaResponseData.error));
        throw new Error(`Meta API Rejected: ${metaResponseData.error.message}`);
    }

    // 3. 🚀 Save Admin Reply to Database (Using BOTH column styles for safety)
    const { error: dbError } = await supabase
      .from('chat_history')
      .insert({
          email: email,
          platform: 'instagram', // Used by the Webhook logic
          channel: 'instagram',  // Kept for backward compatibility
          platform_chat_id: chatId, // Used by the Webhook logic
          sender_id: chatId,        // Kept for backward compatibility
          customer_name: "IG Customer",
          message: message,
          sender_type: 'admin',     // New schema mapping
          is_bot: false,            // Legacy schema mapping
          is_admin: true            // Legacy schema mapping
      });

    if (dbError) throw dbError;

    return NextResponse.json({ success: true, message: "Reply delivered to IG and saved to DB." });
  } catch (error: any) {
    console.error("[CRM_IG_POST_ERROR]", error.message);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// 🚀 PUT: AI Bot ko Pause/Resume karna (Handover logic)
export async function PUT(req: NextRequest) {
  try {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    if (!token) return NextResponse.json({ success: false }, { status: 401 });

    const { chatId, aiPaused } = await req.json();
    
    // TODO: In Phase 3, this will save the 'aiPaused' state to a dedicated table so the webhook knows to stop
    console.log(`[INSTAGRAM] AI Paused status for chat ${chatId} is now ${aiPaused}`);
    
    return NextResponse.json({ success: true, message: `AI Pause state set to ${aiPaused}` });
  } catch (error) {
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
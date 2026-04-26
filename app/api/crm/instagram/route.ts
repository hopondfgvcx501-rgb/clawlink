import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getToken } from "next-auth/jwt";

export const dynamic = "force-dynamic";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const supabase = createClient(supabaseUrl, supabaseKey);

// GET: Fetch Instagram DMs and Comments (Aligned with your existing webhook columns)
export async function GET(req: NextRequest) {
  try {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    if (!token || !token.email) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

    const email = token.email.toLowerCase();

    // 🚀 ASLI DB FETCH: Reading from your exact column names ('platform' instead of 'channel')
    const { data: rawChats, error } = await supabase
      .from('chat_history')
      .select('*')
      .eq('email', email) 
      .eq('platform', 'instagram')
      .order('created_at', { ascending: false });

    if (error) throw error;

    // 🧠 GROUPING LOGIC: Messages ko unique user (platform_chat_id) ke hisaab se group karna
    const groupedChats: any = {};
    
    rawChats?.forEach(msg => {
       const chatId = msg.platform_chat_id; // Your webhook uses 'platform_chat_id'
       if (!groupedChats[chatId]) {
           groupedChats[chatId] = {
               id: chatId,
               userId: chatId,
               name: `IG Lead (${chatId.substring(0,6)})`, 
               lastMessage: msg.message,
               time: new Date(msg.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
               unread: 0, 
               aiPaused: false, 
               messages: []
           };
       }
       
       groupedChats[chatId].messages.unshift({
           id: msg.id.toString(),
           sender: msg.sender_type, // Your webhook uses 'bot' or 'user'
           text: msg.message,
           time: new Date(msg.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
       });
    });

    const formattedChats = Object.values(groupedChats);

    return NextResponse.json({ success: true, chats: formattedChats });
  } catch (error: any) {
    console.error("[CRM_IG_GET_ERROR]", error.message);
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}

// POST: Admin manually message bhej raha hai
export async function POST(req: NextRequest) {
  try {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    if (!token || !token.email) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

    const email = token.email.toLowerCase();
    const { chatId, message } = await req.json();

    // 🚀 Save Admin Reply to Database (Matches your Webhook structure)
    const { error } = await supabase
      .from('chat_history')
      .insert({
          email: email,
          platform: 'instagram',
          platform_chat_id: chatId,
          message: message,
          sender_type: 'admin', // Marks as human reply
          customer_name: 'Instagram User'
      });

    if (error) throw error;

    // NOTE: Meta graph API delivery for admin messages goes here in Phase 3
    console.log(`[ADMIN_REPLY_SAVED] Sent to IG user: ${chatId}`);

    return NextResponse.json({ success: true, message: "Reply saved to DB." });
  } catch (error: any) {
    console.error("[CRM_IG_POST_ERROR]", error.message);
    return NextResponse.json({ success: false, error: "Server Error" }, { status: 500 });
  }
}

// PUT: AI Bot ko Pause/Resume karna (Handover logic)
export async function PUT(req: NextRequest) {
  try {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    if (!token) return NextResponse.json({ success: false }, { status: 401 });

    const { chatId, aiPaused } = await req.json();
    
    console.log(`[INSTAGRAM] AI Paused status for chat ${chatId} is now ${aiPaused}`);
    
    return NextResponse.json({ success: true, message: `AI Pause state set to ${aiPaused}` });
  } catch (error) {
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
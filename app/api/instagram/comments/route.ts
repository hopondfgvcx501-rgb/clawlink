import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getToken } from "next-auth/jwt";

export const dynamic = "force-dynamic";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const supabase = createClient(supabaseUrl, supabaseKey);

// GET: Fetch moderated comments from DB
export async function GET(req: NextRequest) {
  try {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    if (!token || !token.email) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

    const email = token.email.toLowerCase();

    // Fetching from chat_history or comments table. (Assuming you save comments in chat_history with a flag, or a new table later)
    // For now, fetching chat_history where sender_type is 'user' as a baseline for comments.
    const { data: rawComments, error } = await supabase
      .from('chat_history')
      .select('*')
      .eq('email', email)
      .eq('platform', 'instagram')
      .order('created_at', { ascending: false })
      .limit(50); // Fetch latest 50

    if (error) throw error;

    // Formatting for the UI
    const formattedComments = rawComments?.map(c => ({
        id: c.id,
        user: `@${c.customer_name || 'user'}_${c.platform_chat_id.substring(0, 4)}`, // Fallback format
        text: c.message,
        post: "Latest Post", // Meta API will provide exact post IDs later
        status: c.is_bot ? 'auto_replied' : 'approved', // Simple logic for now based on if bot replied
        time: new Date(c.created_at).toLocaleDateString() + " " + new Date(c.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
    }));

    return NextResponse.json({ success: true, comments: formattedComments });
  } catch (error: any) {
    console.error("[IG_COMMENTS_API_ERROR]", error.message);
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}

// DELETE: Delete a comment
export async function DELETE(req: NextRequest) {
  try {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    if (!token || !token.email) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

    const { commentId } = await req.json();

    // 1. Delete from Supabase Database
    const { error } = await supabase
      .from('chat_history')
      .delete()
      .eq('id', commentId);

    if (error) throw error;

    // 2. TODO: Delete from Instagram natively using Meta Graph API (Phase 3)

    return NextResponse.json({ success: true, message: "Comment deleted." });
  } catch (error: any) {
    console.error("[IG_COMMENTS_DELETE_ERROR]", error.message);
    return NextResponse.json({ success: false, error: "Server Error" }, { status: 500 });
  }
}
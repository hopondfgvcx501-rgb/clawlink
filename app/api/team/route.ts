import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const supabase = createClient(supabaseUrl, supabaseKey);

// 🚀 GET: Fetch Team Members
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const email = searchParams.get("email");

    if (!email) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

    const safeEmail = email.toLowerCase();

    const { data, error } = await supabase
        .from("team_members") // Tumhari existing table ka naam
        .select("*")
        .eq("owner_email", safeEmail);

    if (error) throw error;

    // UI expects 'members_email', so we format it exactly how the frontend wants it!
    const formattedMembers = (data || []).map(member => ({
        id: member.id,
        member_email: member.member_email,
        role: member.role,
        status: member.status || 'Active'
    }));

    // Owner ko sabse upar dikhane ka logic
    const allMembers = [
        { id: 'owner-id', member_email: safeEmail, role: 'OWNER', status: 'Active' },
        ...formattedMembers
    ];

    // UI `members` dhoondh raha hai, `data` nahi. FIXED!
    return NextResponse.json({ success: true, members: allMembers });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// 🚀 POST: Invite New Member
export async function POST(req: Request) {
  try {
    // UI se aane wale EXACT variables (Snake Case)
    const { owner_email, member_email, role } = await req.json();

    if (!owner_email || !member_email || !role) {
      return NextResponse.json({ success: false, error: "Missing fields! Emails are required." }, { status: 400 });
    }

    if (owner_email.toLowerCase() === member_email.toLowerCase()) {
      return NextResponse.json({ success: false, error: "You cannot invite yourself!" }, { status: 400 });
    }

    const { error } = await supabase.from("team_members").insert({
      owner_email: owner_email.toLowerCase(),
      member_email: member_email.toLowerCase(),
      role: role,
      status: "Active" // Auto active for now to skip email verification phase
    });

    if (error) {
        if (error.code === '23505') return NextResponse.json({ success: false, error: "User is already invited!" }, { status: 400 });
        throw error;
    }
    
    return NextResponse.json({ success: true, message: "Invite sent successfully" });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// 🚀 DELETE: Remove Member
export async function DELETE(req: Request) {
  try {
    // UI search params nahi, JSON body bhej raha hai. FIXED!
    const { owner_email, id } = await req.json();

    if (!owner_email || !id) return NextResponse.json({ success: false, error: "Missing ID or Owner Email" }, { status: 400 });

    const { error } = await supabase
        .from("team_members")
        .delete()
        .eq("owner_email", owner_email.toLowerCase())
        .eq("id", id);

    if (error) throw error;

    return NextResponse.json({ success: true, message: "Member removed" });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
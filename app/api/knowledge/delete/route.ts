import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Initialize Supabase Admin
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const supabaseAdmin = createClient(supabaseUrl, supabaseKey);

export async function DELETE(req: Request) {
    try {
        const body = await req.json();
        const { email, blockId, clearAll } = body;

        if (!email) {
            return NextResponse.json({ success: false, error: "Email is required" }, { status: 400 });
        }

        // Logic 1: CLEAR ALL MEMORY (Pura Database Wipe for this user)
        if (clearAll) {
            const { error } = await supabaseAdmin
                .from("knowledge_base") // Tera Vector table ka jo bhi naam ho, wo yahan daalna
                .delete()
                .eq("email", email);

            if (error) throw new Error(error.message);
            return NextResponse.json({ success: true, message: "All memory cleared!" });
        }

        // Logic 2: DELETE SINGLE BLOCK
        if (blockId) {
            const { error } = await supabaseAdmin
                .from("knowledge_base")
                .delete()
                .eq("id", blockId)
                .eq("email", email);

            if (error) throw new Error(error.message);
            return NextResponse.json({ success: true, message: "Block deleted!" });
        }

        return NextResponse.json({ success: false, error: "Provide blockId or clearAll flag" }, { status: 400 });

    } catch (error: any) {
        console.error("[RAG_DELETE_ERROR]", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
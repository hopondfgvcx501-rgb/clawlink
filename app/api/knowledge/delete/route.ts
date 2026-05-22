/**
 * ==============================================================================================
 * CLAWLINK ENTERPRISE KNOWLEDGE BASE - MEMORY WIPE
 * ==============================================================================================
 * @description Handles deletion of specific knowledge blocks or complete memory wipes.
 * * ALL RIGHTS RESERVED. CLAWLINK INC.
 * ==============================================================================================
 */

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const supabaseAdmin = createClient(supabaseUrl, supabaseKey);

export async function DELETE(req: Request) {
    try {
        const body = await req.json();
        const { email, blockId, clearAll } = body;

        if (!email) {
            return NextResponse.json({ success: false, error: "Email is required." }, { status: 400 });
        }

        // Logic 1: CLEAR ALL MEMORY (Wipe Omni-Channel Database)
        if (clearAll) {
            const { error } = await supabaseAdmin
                .from("knowledge_base")
                .delete()
                .eq("user_email", email.toLowerCase());

            if (error) throw new Error(error.message);
            return NextResponse.json({ success: true, message: "All memory cleared across all channels!" });
        }

        // Logic 2: DELETE SINGLE KNOWLEDGE BLOCK
        if (blockId) {
            const { error } = await supabaseAdmin
                .from("knowledge_base")
                .delete()
                .eq("id", blockId)
                .eq("user_email", email.toLowerCase());

            if (error) throw new Error(error.message);
            return NextResponse.json({ success: true, message: "Knowledge block deleted successfully!" });
        }

        return NextResponse.json({ success: false, error: "Provide blockId or clearAll flag." }, { status: 400 });

    } catch (error: any) {
        console.error("[RAG_DELETE_ERROR]", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
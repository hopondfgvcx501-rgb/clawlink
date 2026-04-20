import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const supabase = createClient(supabaseUrl, supabaseKey);

// 🛡️ SECURITY: Allowed MIME types
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'video/mp4', 'application/pdf'];
const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

// 1. 🚀 GET SECURE MEDIA FILES
export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const email = searchParams.get("email");

        if (!email) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

        const safeEmail = email.toLowerCase();

        const { data: files, error } = await supabase
            .from("media_library")
            .select("*")
            .eq("email", safeEmail)
            .order("created_at", { ascending: false });

        if (error) throw error;

        const formattedFiles = (files || []).map(f => ({
            id: f.id,
            name: f.file_name,
            type: f.file_type,
            size: f.file_size,
            date: new Date(f.created_at).toLocaleDateString()
        }));

        return NextResponse.json({ success: true, files: formattedFiles });

    } catch (error: any) {
        console.error("[MEDIA_GET_ERROR]", error.message);
        return NextResponse.json({ success: false, error: "Server Error" }, { status: 500 });
    }
}

// 2. 🚀 UPLOAD TO SECURE VAULT
export async function POST(req: Request) {
    try {
        // Next.js App Router handles FormData natively
        const formData = await req.formData();
        const file = formData.get("file") as File;
        const email = formData.get("email") as string;

        if (!file || !email) {
            return NextResponse.json({ success: false, error: "Missing file or user credentials." }, { status: 400 });
        }

        const safeEmail = email.toLowerCase();

        // 🛡️ SECURITY CHECKS
        if (!ALLOWED_TYPES.includes(file.type)) {
            return NextResponse.json({ success: false, error: "Security Alert: Invalid file type." }, { status: 403 });
        }
        if (file.size > MAX_FILE_SIZE) {
            return NextResponse.json({ success: false, error: "File exceeds 50MB limit." }, { status: 400 });
        }

        // Convert File to ArrayBuffer for Supabase Storage
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        // Create secure unique path: email/timestamp-filename
        const fileExtension = file.name.split('.').pop();
        const uniqueFileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExtension}`;
        const storagePath = `${safeEmail}/${uniqueFileName}`;

        // 1. Upload to Supabase Storage (Bucket name: 'telegram_media')
        const { data: storageData, error: storageError } = await supabase.storage
            .from('telegram_media')
            .upload(storagePath, buffer, {
                contentType: file.type,
                upsert: false
            });

        if (storageError) {
            console.error("Storage Error:", storageError);
            throw new Error("Failed to upload to cloud vault.");
        }

        // Calculate size for UI
        const sizeInMb = (file.size / (1024 * 1024)).toFixed(2);
        let displaySize = `${sizeInMb} MB`;
        if (parseFloat(sizeInMb) < 1) displaySize = `${(file.size / 1024).toFixed(0)} KB`;

        let generalType = 'document';
        if (file.type.startsWith('image/')) generalType = 'image';
        if (file.type.startsWith('video/')) generalType = 'video';

        // 2. Save metadata to Database
        const { error: dbError } = await supabase.from("media_library").insert({
            email: safeEmail,
            file_name: file.name,
            file_type: generalType,
            file_size: displaySize,
            storage_path: storagePath,
            mime_type: file.type
        });

        if (dbError) {
            // Rollback: Delete from storage if DB fails
            await supabase.storage.from('telegram_media').remove([storagePath]);
            throw dbError;
        }

        return NextResponse.json({ success: true });

    } catch (error: any) {
        console.error("[MEDIA_POST_ERROR]", error.message);
        return NextResponse.json({ success: false, error: error.message || "Upload Failed" }, { status: 500 });
    }
}

// 3. 🚀 SECURE DELETE
export async function DELETE(req: Request) {
    try {
        const { email, fileId } = await req.json();
        const safeEmail = email.toLowerCase();

        // 1. Fetch file path to ensure the user owns it before deleting
        const { data: fileData, error: fetchError } = await supabase
            .from("media_library")
            .select("storage_path")
            .eq("id", fileId)
            .eq("email", safeEmail)
            .single();

        if (fetchError || !fileData) {
            return NextResponse.json({ success: false, error: "File not found or unauthorized." }, { status: 403 });
        }

        // 2. Delete from Storage
        await supabase.storage.from('telegram_media').remove([fileData.storage_path]);

        // 3. Delete from DB
        await supabase.from("media_library").delete().eq("id", fileId);

        return NextResponse.json({ success: true });

    } catch (error: any) {
        return NextResponse.json({ success: false, error: "Server Error" }, { status: 500 });
    }
}
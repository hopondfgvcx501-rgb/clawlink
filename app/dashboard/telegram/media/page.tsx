"use client";

/**
 * ==============================================================================================
 * CLAWLINK ENTERPRISE: TELEGRAM MEDIA LIBRARY
 * ==============================================================================================
 * @file app/dashboard/telegram/media/page.tsx
 * @description Secure cloud storage for Telegram broadcast and flow media assets.
 * 🚀 SECURED: Fetches and uploads actual files to real database/storage.
 * 🚀 FIXED: Removed dummy simulation. Integrated real <input type="file"> and FormData POST.
 * 🚀 FIXED: Implemented HTML5 Drag & Drop event listeners.
 * 🚀 FIXED: Upgraded to premium SpinnerCounter.
 * * ALL RIGHTS RESERVED. CLAWLINK INC.
 * ==============================================================================================
 */

import React, { useState, useEffect, useRef } from 'react';
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { 
  Folder, UploadCloud, Image as ImageIcon, 
  Film, FileText, Trash2, Copy, Activity 
} from "lucide-react";
import TopHeader from "@/components/TopHeader";
import SpinnerCounter from "@/components/SpinnerCounter"; // 🚀 Premium Loader Imported

interface MediaFile {
  id: string;
  name: string;
  type: string;
  size: string;
  date: string;
}

export default function TelegramMediaLibrary() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false); // 🚀 Track Drag state
  const [files, setFiles] = useState<MediaFile[]>([]);
  
  // 🚀 Reference for the hidden file input
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (status === "unauthenticated") router.replace("/");
  }, [status, router]);

  // 🚀 FETCH SECURE MEDIA FILES
  const fetchMedia = async () => {
    if (status === "authenticated" && session?.user?.email) {
      try {
        const res = await fetch(`/api/telegram/media?email=${encodeURIComponent(session.user.email)}&t=${Date.now()}`, {
          headers: { 'Cache-Control': 'no-store' }
        });
        const data = await res.json();
        if (data.success && data.files) {
           setFiles(data.files);
        }
      } catch (error) {
        console.error("Failed to load media files", error);
      } finally {
        setIsLoading(false);
      }
    }
  };

  useEffect(() => {
    fetchMedia();
  }, [session, status]);

  const copyToClipboard = (id: string) => {
    navigator.clipboard.writeText(`{{media:${id}}}`);
    alert("Media Variable copied to clipboard! Paste this in your broadcasts or flows.");
  };

  const deleteFile = async (id: string) => {
    if(!confirm("Are you sure? Flows using this media will break.")) return;
    
    // Optimistic UI update
    setFiles(files.filter(f => f.id !== id));
    
    try {
      const res = await fetch('/api/telegram/media', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: session?.user?.email, fileId: id })
      });
      const data = await res.json();
      if (!data.success) {
         alert("Failed to delete from server: " + data.error);
         fetchMedia(); // Revert optimistic update on failure
      }
    } catch(err) {
      console.error("Failed to delete from DB");
      fetchMedia();
    }
  };

  // 🚀 REAL UPLOAD LOGIC TO BACKEND
  const processFileUpload = async (file: File) => {
    if (!session?.user?.email) return;
    
    setIsUploading(true);
    
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('email', session.user.email);

      const res = await fetch('/api/telegram/media', {
        method: 'POST',
        body: formData // Note: Do not set Content-Type header manually when using FormData
      });

      const data = await res.json();
      
      if (data.success) {
        alert("File securely uploaded to ClawLink Storage.");
        await fetchMedia(); // Refresh list with real DB data
      } else {
        alert(`Upload Failed: ${data.error}`);
      }
    } catch (error) {
      console.error("Upload Catch Error:", error);
      alert("Network error during file upload.");
    } finally {
      setIsUploading(false);
      // Reset input value so the same file can be selected again if needed
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Triggered when user selects a file via dialog
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFileUpload(e.target.files[0]);
    }
  };

  // 🚀 DRAG AND DROP EVENT HANDLERS
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFileUpload(e.dataTransfer.files[0]);
    }
  };

  const getFileIcon = (type: string) => {
    switch(type) {
      case 'image': return <ImageIcon className="w-8 h-8 text-pink-400"/>;
      case 'video': return <Film className="w-8 h-8 text-purple-400"/>;
      case 'document': return <FileText className="w-8 h-8 text-[#2AABEE]"/>;
      default: return <FileText className="w-8 h-8 text-gray-400"/>;
    }
  };

  const btnHover = "transition-all duration-[120ms] ease-out active:scale-[0.95] transform-gpu will-change-transform";

  // 🚀 Secure Premium Anti-Flicker Loading State
  if (isLoading || status === "loading") {
    return <SpinnerCounter text="SYNCING SECURE MEDIA VAULT..." />;
  }

  return (
    <div className="flex flex-col h-screen bg-[#07070A] text-white overflow-hidden selection:bg-[#2AABEE]/30">
      <TopHeader title="Media Library" session={session} />
      
      <div className="flex-1 overflow-y-auto custom-scrollbar p-6 md:p-8">
        <div className="max-w-[1200px] mx-auto space-y-8">
          
          {/* 🚀 REAL UPLOAD ZONE WITH DRAG & DROP */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} 
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`w-full bg-[#0A0A0D] border-2 border-dashed rounded-[32px] p-10 flex flex-col items-center justify-center text-center transition-colors group 
              ${isDragging ? 'border-[#2AABEE] bg-[#2AABEE]/5 scale-[1.02]' : 'border-white/10 hover:border-[#2AABEE]/50'}
              ${isUploading ? 'opacity-50 cursor-wait pointer-events-none' : 'cursor-pointer'}
            `}>
            
            <div className={`w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4 transition-all ${isDragging ? 'bg-[#2AABEE]/20 scale-110' : 'group-hover:bg-[#2AABEE]/10 group-hover:scale-110'}`}>
              {isUploading ? <Activity className="w-8 h-8 text-[#2AABEE] animate-spin"/> : <UploadCloud className={`w-8 h-8 transition-colors ${isDragging ? 'text-[#2AABEE]' : 'text-gray-400 group-hover:text-[#2AABEE]'}`}/>}
            </div>
            
            <h3 className="text-lg font-black text-white mb-2">
              {isUploading ? "Uploading Securely..." : isDragging ? "Drop File Here" : "Click or Drag & Drop Media Here"}
            </h3>
            <p className="text-[13px] text-gray-500 mb-6">Supports Images (JPG, PNG), Videos (MP4), and Documents (PDF) up to 50MB.</p>
            
            {/* Hidden actual file input */}
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileSelect} 
              className="hidden" 
              accept="image/jpeg, image/png, video/mp4, application/pdf"
            />
            
            <button 
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading} 
              className={`bg-[#2AABEE] text-white px-8 py-3 rounded-xl text-[12px] font-black uppercase tracking-widest shadow-[0_0_15px_rgba(42,171,238,0.3)] disabled:opacity-50 ${btnHover}`}
            >
              {isUploading ? "Processing..." : "Browse Files"}
            </button>
          </motion.div>

          {/* FILES GRID */}
          <div>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-black text-white flex items-center gap-2">
                <Folder className="w-5 h-5 text-[#2AABEE]"/> Secure Hosted Assets 
              </h3>
              <span className="text-[12px] font-mono text-gray-500">{files.length} items</span>
            </div>

            {files.length === 0 ? (
               <div className="text-center py-10 bg-[#0A0A0D] rounded-3xl border border-white/5">
                 <Folder className="w-10 h-10 text-gray-700 mx-auto mb-3 opacity-50" />
                 <p className="text-sm text-gray-500">Vault is empty. Upload your first media file.</p>
               </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
                {files.map((file, idx) => (
                  <motion.div key={file.id} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: idx * 0.05 }}
                    className="bg-[#0A0A0D] border border-white/5 hover:border-white/10 rounded-[20px] p-4 group transition-colors flex flex-col">
                    
                    <div className="bg-[#111114] h-[140px] rounded-xl mb-4 flex items-center justify-center border border-white/5 relative overflow-hidden">
                      {getFileIcon(file.type)}
                      <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-sm">
                        <button onClick={() => copyToClipboard(file.id)} className={`bg-[#2AABEE]/20 hover:bg-[#2AABEE]/40 text-[#2AABEE] p-3 rounded-xl m-1 ${btnHover}`} title="Copy Variable ID">
                          <Copy className="w-5 h-5"/>
                        </button>
                        <button onClick={() => deleteFile(file.id)} className={`bg-red-500/20 hover:bg-red-500/40 text-red-400 p-3 rounded-xl m-1 ${btnHover}`} title="Delete from Cloud">
                          <Trash2 className="w-5 h-5"/>
                        </button>
                      </div>
                    </div>

                    <div className="flex-1">
                      <p className="text-[13px] font-bold text-white truncate mb-2" title={file.name}>{file.name}</p>
                      <div className="flex items-center justify-between text-[10px] text-gray-500 font-mono">
                        <span className="bg-white/5 px-2 py-1 rounded">{file.size}</span>
                        <span>{file.date}</span>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
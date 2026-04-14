"use client";

/**
 * ==============================================================================================
 * CLAWLINK ENTERPRISE: TELEGRAM MEDIA LIBRARY
 * ==============================================================================================
 * @file app/dashboard/telegram/media/page.tsx
 * @description Cloud storage interface for managing images, videos, and documents.
 * Files uploaded here can be dynamically attached to flow nodes and broadcasts.
 * * ALL RIGHTS RESERVED. CLAWLINK INC.
 * ==============================================================================================
 */

import React, { useState } from 'react';
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { 
  FolderVideo, UploadCloud, Image as ImageIcon, 
  Film, FileText, Trash2, Copy, CheckCircle2 
} from "lucide-react";
import TopHeader from "@/components/TopHeader";

export default function TelegramMediaLibrary() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  const [files, setFiles] = useState([
    { id: 'file-01', name: "Promo_Banner_April.jpg", type: "image", size: "2.4 MB", date: "Today" },
    { id: 'file-02', name: "Onboarding_Video_V2.mp4", type: "video", size: "18.5 MB", date: "Yesterday" },
    { id: 'file-03', name: "Pricing_SaaS_Guide.pdf", type: "document", size: "4.1 MB", date: "Mar 12" },
    { id: 'file-04', name: "Discount_Coupon.png", type: "image", size: "1.1 MB", date: "Mar 10" },
  ]);

  if (status === "unauthenticated") router.push("/");

  const copyToClipboard = (id: string) => {
    navigator.clipboard.writeText(`{{media:${id}}}`);
    alert("Media Variable copied to clipboard!");
  };

  const deleteFile = (id: string) => {
    setFiles(files.filter(f => f.id !== id));
  };

  const getFileIcon = (type: string) => {
    switch(type) {
      case 'image': return <ImageIcon className="w-6 h-6 text-pink-400"/>;
      case 'video': return <Film className="w-6 h-6 text-purple-400"/>;
      case 'document': return <FileText className="w-6 h-6 text-blue-400"/>;
      default: return <FileText className="w-6 h-6 text-gray-400"/>;
    }
  };

  const btnHover = "transition-all duration-[120ms] ease-out active:scale-[0.95] transform-gpu will-change-transform";

  return (
    <div className="flex flex-col h-screen bg-[#07070A] text-white overflow-hidden selection:bg-[#2AABEE]/30">
      <TopHeader title="Media Library" session={session} />
      
      <div className="flex-1 overflow-y-auto custom-scrollbar p-6 md:p-8">
        <div className="max-w-[1200px] mx-auto space-y-8">
          
          {/* UPLOAD ZONE */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} 
            className="w-full bg-[#0A0A0D] border-2 border-dashed border-white/10 hover:border-[#2AABEE]/50 rounded-[32px] p-10 flex flex-col items-center justify-center text-center cursor-pointer transition-colors group">
            
            <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4 group-hover:bg-[#2AABEE]/10 group-hover:scale-110 transition-all">
              <UploadCloud className="w-8 h-8 text-gray-400 group-hover:text-[#2AABEE] transition-colors"/>
            </div>
            <h3 className="text-lg font-black text-white mb-2">Drag & Drop Media Here</h3>
            <p className="text-[13px] text-gray-500 mb-6">Supports Images (JPG, PNG), Videos (MP4), and Documents (PDF) up to 50MB.</p>
            
            <button className={`bg-white text-black px-6 py-3 rounded-xl text-[12px] font-black uppercase tracking-widest shadow-lg hover:shadow-xl ${btnHover}`}>
              Browse Files
            </button>
          </motion.div>

          {/* FILES GRID */}
          <div>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-black text-white flex items-center gap-2">
                <FolderVideo className="w-5 h-5 text-[#2AABEE]"/> Hosted Assets
              </h3>
              <span className="text-[12px] font-mono text-gray-500">{files.length} items</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {files.map((file, idx) => (
                <motion.div key={file.id} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: idx * 0.05 }}
                  className="bg-[#0A0A0D] border border-white/5 hover:border-white/10 rounded-[20px] p-4 group transition-colors flex flex-col">
                  
                  <div className="bg-[#111114] h-[120px] rounded-xl mb-4 flex items-center justify-center border border-white/5 relative overflow-hidden">
                    {getFileIcon(file.type)}
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => copyToClipboard(file.id)} className={`bg-white/10 hover:bg-white/20 text-white backdrop-blur-md p-2 rounded-lg m-1 ${btnHover}`} title="Copy ID">
                        <Copy className="w-4 h-4"/>
                      </button>
                      <button onClick={() => deleteFile(file.id)} className={`bg-red-500/20 hover:bg-red-500/40 text-red-400 backdrop-blur-md p-2 rounded-lg m-1 ${btnHover}`} title="Delete">
                        <Trash2 className="w-4 h-4"/>
                      </button>
                    </div>
                  </div>

                  <div className="flex-1">
                    <p className="text-[13px] font-bold text-white truncate mb-1" title={file.name}>{file.name}</p>
                    <div className="flex items-center justify-between text-[10px] text-gray-500 font-mono">
                      <span>{file.size}</span>
                      <span>{file.date}</span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
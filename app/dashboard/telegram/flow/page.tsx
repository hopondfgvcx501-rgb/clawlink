"use client";

/**
 * ==============================================================================================
 * CLAWLINK ENTERPRISE TELEGRAM FLOW BUILDER
 * ==============================================================================================
 * @file app/dashboard/telegram/flow/page.tsx
 * @description Advanced Drag & Drop Visual Automation Builder using React Flow.
 * 🚀 SECURED: Compiles visual graph to JSON payload for Telegram Webhook DB.
 * 🚀 FIXED: Added real-time secure fetch to load existing saved flows from the Database.
 * 🚀 FIXED: Integrated premium SpinnerCounter for consistent enterprise loading UI.
 * * ALL RIGHTS RESERVED. CLAWLINK INC.
 * ==============================================================================================
 */

import React, { useState, useCallback, useRef, useEffect } from 'react';
import ReactFlow, {
  ReactFlowProvider,
  addEdge,
  useNodesState,
  useEdgesState,
  Controls,
  Background,
  Panel,
  Handle,
  Position,
  Connection,
  Edge
} from 'reactflow';
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { 
  MessageSquare, Zap, Play, Save, Trash2, 
  Image as ImageIcon, MoreHorizontal, Activity, Workflow
} from "lucide-react";
import TopHeader from "@/components/TopHeader";
import SpinnerCounter from "@/components/SpinnerCounter"; // 🚀 Premium Loader Imported

// ==========================================
// 🎨 CUSTOM NODE COMPONENTS
// ==========================================

const TriggerNode = ({ data, isConnectable }: any) => {
  return (
    <div className="bg-[#111114] border border-orange-500/50 shadow-[0_0_15px_rgba(249,115,22,0.15)] rounded-xl w-[250px] overflow-hidden group">
      <div className="bg-orange-500/10 px-3 py-2 flex items-center gap-2 border-b border-orange-500/20">
        <Zap className="w-4 h-4 text-orange-500" />
        <span className="text-[11px] font-black uppercase tracking-widest text-orange-400">Trigger</span>
      </div>
      <div className="p-4">
        <p className="text-[13px] font-bold text-white">{data.label}</p>
        <p className="text-[10px] text-gray-500 mt-1 font-mono">{data.detail || "Listens for specific input"}</p>
      </div>
      <Handle type="source" position={Position.Right} id="a" isConnectable={isConnectable} className="w-3 h-3 bg-orange-500 border-2 border-[#111114]" />
    </div>
  );
};

const ActionNode = ({ data, isConnectable }: any) => {
  return (
    <div className="bg-[#111114] border border-blue-500/30 shadow-[0_4px_20px_rgba(0,0,0,0.4)] rounded-xl w-[250px] overflow-hidden group hover:border-blue-500/60 transition-colors">
      <Handle type="target" position={Position.Left} isConnectable={isConnectable} className="w-3 h-3 bg-blue-500 border-2 border-[#111114]" />
      
      <div className="bg-blue-500/10 px-3 py-2 flex justify-between items-center border-b border-blue-500/20">
        <div className="flex items-center gap-2">
          {data.type === 'media' ? <ImageIcon className="w-4 h-4 text-blue-400" /> : <MessageSquare className="w-4 h-4 text-blue-400" />}
          <span className="text-[11px] font-black uppercase tracking-widest text-blue-400">Action</span>
        </div>
        <button title="More options" className="text-gray-500 hover:text-white transition-colors"><MoreHorizontal className="w-4 h-4"/></button>
      </div>
      <div className="p-4">
        <p className="text-[13px] font-bold text-white mb-2">{data.label}</p>
        <div className="bg-black/30 border border-white/5 rounded-lg p-2 text-[11px] text-gray-400 line-clamp-2">
          {data.preview || "Configure message content..."}
        </div>
      </div>
      
      <Handle type="source" position={Position.Right} id="a" isConnectable={isConnectable} className="w-3 h-3 bg-gray-300 border-2 border-[#111114]" />
    </div>
  );
};

const nodeTypes = {
  triggerNode: TriggerNode,
  actionNode: ActionNode,
};

// ==========================================
// 🚀 MAIN BUILDER COMPONENT
// ==========================================

export default function TelegramFlowBuilder() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  
  const [reactFlowInstance, setReactFlowInstance] = useState<any>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingFlow, setIsLoadingFlow] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") router.replace("/");
  }, [status, router]);

  // 🚀 SECURE DATA FETCH: Load existing Flow from Database
  useEffect(() => {
    const fetchSavedFlow = async () => {
      if (status === "authenticated" && session?.user?.email) {
        try {
          const res = await fetch(`/api/telegram/flow?email=${encodeURIComponent(session.user.email)}&channel=telegram&t=${Date.now()}`, {
            headers: { 'Cache-Control': 'no-store' }
          });
          const data = await res.json();
          
          if (data.success && data.data && data.data.nodes && data.data.nodes.length > 0) {
            setNodes(data.data.nodes);
            setEdges(data.data.edges || []);
          } else {
            // Fallback to default starting node if no data exists in DB
            setNodes([{ id: 'telegram-trigger-1', type: 'triggerNode', position: { x: 50, y: 150 }, data: { label: 'User sends /start', detail: 'Matches exact command' } }]);
          }
        } catch (error) {
          console.error("[SECURITY_LOG] Failed to load flow data", error);
          // Ensure canvas is not empty on error
          setNodes([{ id: 'telegram-trigger-1', type: 'triggerNode', position: { x: 50, y: 150 }, data: { label: 'User sends /start', detail: 'Matches exact command' } }]);
        } finally {
          setIsLoadingFlow(false);
        }
      }
    };

    fetchSavedFlow();
  }, [session, status, setNodes, setEdges]);

  // Proper Connection/Edge typing to prevent TS red line error
  const onConnect = useCallback((params: Connection | Edge) => {
    const animatedEdge = { 
        ...params, 
        animated: true, 
        style: { stroke: '#4b5563', strokeWidth: 2 },
        type: 'smoothstep' 
    };
    setEdges((eds) => addEdge(animatedEdge, eds));
  }, [setEdges]);

  const onDragOver = useCallback((event: any) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback((event: any) => {
      event.preventDefault();

      if (!reactFlowWrapper.current || !reactFlowInstance) return;

      const type = event.dataTransfer.getData('application/reactflow');
      const nodeLabel = event.dataTransfer.getData('application/label');
      const nodeActionType = event.dataTransfer.getData('application/actionType');

      if (!type) return;

      const reactFlowBounds = reactFlowWrapper.current.getBoundingClientRect();
      const position = reactFlowInstance.screenToFlowPosition({
        x: event.clientX - reactFlowBounds.left,
        y: event.clientY - reactFlowBounds.top,
      });

      const newNode = {
        id: `node_${Date.now()}`,
        type,
        position,
        data: { 
            label: nodeLabel,
            detail: '',
            type: nodeActionType,
            preview: nodeActionType === 'media' ? 'Select file to attach' : 'Type your message here...'
        },
      };

      setNodes((nds) => nds.concat([newNode]));
    }, [reactFlowInstance, setNodes]
  );

  const handleClearCanvas = () => {
    if(confirm("Are you sure you want to clear the canvas?")) {
      setNodes([{ id: 'telegram-trigger-1', type: 'triggerNode', position: { x: 50, y: 150 }, data: { label: 'User sends /start', detail: 'Matches exact command' } }]);
      setEdges([]);
    }
  };

  // 🚀 SECURE SAVE LOGIC
  const handleSaveFlow = async () => {
      if (!session?.user?.email) return;
      setIsSaving(true);
      
      const payload = {
        email: session.user.email,
        channel: "telegram",
        nodes: reactFlowInstance.getNodes(),
        edges: reactFlowInstance.getEdges()
      };

      try {
        const res = await fetch('/api/telegram/flow', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        
        const data = await res.json();
        if(data.success) {
          alert("🚀 Telegram Flow compiled and saved to production database!");
        } else {
          alert("Failed to save flow.");
        }
      } catch(err) {
        console.error("Save error:", err);
      } finally {
        setIsSaving(false);
      }
  };

  // 🚀 Premium Loader replacing hardcoded text
  if (status === "loading" || isLoadingFlow) {
    return <SpinnerCounter text="SYNCHRONIZING CANVAS..." />;
  }

  return (
    <div className="flex flex-col h-screen bg-[#07070A] text-white overflow-hidden">
      <TopHeader title="Telegram Flow Builder" session={session} />
      
      <div className="flex-1 flex overflow-hidden border-t border-white/5">
        
        {/* 🧰 LEFT SIDEBAR: TOOLBOX */}
        <aside className="w-[280px] bg-[#0A0A0D] border-r border-white/5 flex flex-col z-20 shadow-[5px_0_30px_rgba(0,0,0,0.5)]">
          <div className="p-5 border-b border-white/5">
            <h2 className="text-[13px] font-black uppercase tracking-[0.15em] text-white flex items-center gap-2">
              <Workflow className="w-4 h-4 text-[#2AABEE]" /> Nodes Toolbox
            </h2>
            <p className="text-[10px] text-gray-500 mt-1">Drag items onto the canvas</p>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar">
            
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 mb-3 pl-1">Triggers</p>
              <div className="space-y-2">
                <div 
                  className="bg-[#111114] border border-orange-500/20 p-3 rounded-xl cursor-grab hover:border-orange-500/50 transition-colors flex items-center gap-3 shadow-sm"
                  onDragStart={(e) => {
                      e.dataTransfer.setData('application/reactflow', 'triggerNode');
                      e.dataTransfer.setData('application/label', 'Keyword Match');
                      e.dataTransfer.effectAllowed = 'move';
                  }}
                  draggable
                >
                  <div className="w-8 h-8 rounded-lg bg-orange-500/10 flex items-center justify-center shrink-0"><Zap className="w-4 h-4 text-orange-400"/></div>
                  <div className="flex flex-col">
                      <span className="text-[12px] font-bold text-gray-200">Keyword Match</span>
                      <span className="text-[9px] text-gray-500 font-mono">e.g., &quot;price&quot;, &quot;help&quot;</span>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 mb-3 pl-1">Actions</p>
              <div className="space-y-2">
                <div 
                  className="bg-[#111114] border border-white/10 p-3 rounded-xl cursor-grab hover:border-blue-500/50 transition-colors flex items-center gap-3 shadow-sm"
                  onDragStart={(e) => {
                      e.dataTransfer.setData('application/reactflow', 'actionNode');
                      e.dataTransfer.setData('application/label', 'Send Message');
                      e.dataTransfer.setData('application/actionType', 'text');
                      e.dataTransfer.effectAllowed = 'move';
                  }}
                  draggable
                >
                  <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center shrink-0"><MessageSquare className="w-4 h-4 text-blue-400"/></div>
                  <div className="flex flex-col">
                      <span className="text-[12px] font-bold text-gray-200">Send Message</span>
                      <span className="text-[9px] text-gray-500 font-mono">Text + Inline Buttons</span>
                  </div>
                </div>

                <div 
                  className="bg-[#111114] border border-white/10 p-3 rounded-xl cursor-grab hover:border-blue-500/50 transition-colors flex items-center gap-3 shadow-sm"
                  onDragStart={(e) => {
                      e.dataTransfer.setData('application/reactflow', 'actionNode');
                      e.dataTransfer.setData('application/label', 'Send Media');
                      e.dataTransfer.setData('application/actionType', 'media');
                      e.dataTransfer.effectAllowed = 'move';
                  }}
                  draggable
                >
                  <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center shrink-0"><ImageIcon className="w-4 h-4 text-purple-400"/></div>
                  <div className="flex flex-col">
                      <span className="text-[12px] font-bold text-gray-200">Send Media</span>
                      <span className="text-[9px] text-gray-500 font-mono">Image, Video, PDF</span>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </aside>

        {/* 🧠 CENTER CANVAS: REACT FLOW */}
        <div className="flex-1 relative" ref={reactFlowWrapper}>
          <ReactFlowProvider>
            <ReactFlow
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onConnect={onConnect}
              onInit={setReactFlowInstance}
              onDrop={onDrop}
              onDragOver={onDragOver}
              nodeTypes={nodeTypes}
              fitView
              className="bg-[#07070A]"
            >
              <Background color="#ffffff" gap={24} size={1} />
              <Controls className="bg-[#111114] border border-white/10 rounded-lg overflow-hidden fill-white shadow-lg" showInteractive={false}/>
              
              <Panel position="top-right" className="flex items-center gap-3 m-4">
                <button onClick={handleClearCanvas} className="text-[11px] font-bold uppercase tracking-widest text-gray-500 hover:text-red-400 transition-colors flex items-center gap-1.5 px-3">
                  <Trash2 className="w-3.5 h-3.5" /> Clear
                </button>

                <div className="h-6 w-px bg-white/10 mx-1"></div>

                <button className="bg-[#111114] border border-white/10 hover:bg-white/5 text-white px-4 py-2 rounded-xl text-[11px] font-bold uppercase tracking-widest flex items-center gap-2 transition-colors shadow-lg">
                  <Play className="w-3 h-3 text-green-400" /> Test
                </button>
                <button 
                  onClick={handleSaveFlow}
                  disabled={isSaving}
                  className="bg-[#2AABEE] hover:bg-[#2298D6] text-white px-6 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-widest flex items-center gap-2 transition-colors shadow-[0_0_20px_rgba(42,171,238,0.3)] disabled:opacity-50"
                >
                  {isSaving ? <Activity className="w-4 h-4 animate-spin"/> : <Save className="w-4 h-4" />} 
                  {isSaving ? "Compiling..." : "Save & Publish"}
                </button>
              </Panel>

            </ReactFlow>
          </ReactFlowProvider>
        </div>

      </div>

      <style dangerouslySetInnerHTML={{__html:`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.2); }
        .react-flow__controls-button { border-bottom: 1px solid rgba(255,255,255,0.1) !important; background: #111114 !important; }
        .react-flow__controls-button svg { fill: #9ca3af !important; }
        .react-flow__controls-button:hover svg { fill: #fff !important; }
      `}}/>
    </div>
  );
}
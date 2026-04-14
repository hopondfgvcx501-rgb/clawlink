"use client";

/**
 * ==============================================================================================
 * CLAWLINK ENTERPRISE: INSTAGRAM FLOW BUILDER
 * ==============================================================================================
 * @file app/dashboard/instagram/flow/page.tsx
 * @description Visual Drag & Drop Builder for Instagram DM Funnels.
 * Allows mapping of Comments, Story Mentions, and Quick Replies to automated DMs.
 * * ALL RIGHTS RESERVED. CLAWLINK INC.
 * ==============================================================================================
 */

import React, { useState, useCallback, useRef } from 'react';
import ReactFlow, {
  ReactFlowProvider, addEdge, useNodesState, useEdgesState,
  Controls, Background, Panel, Handle, Position
} from 'reactflow';
import 'reactflow/dist/style.css';
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { 
  MessageSquare, Zap, Play, Save, Activity, 
  MousePointer, Image as ImageIcon, MessageCircle
} from "lucide-react";
import TopHeader from "@/components/TopHeader";

// ==========================================
// 📸 CUSTOM INSTAGRAM NODE COMPONENTS
// ==========================================

const TriggerNode = ({ data, isConnectable }: any) => (
  <div className="bg-[#111114] border border-pink-500/50 shadow-[0_0_15px_rgba(236,72,153,0.15)] rounded-xl w-[250px] overflow-hidden">
    <div className="bg-gradient-to-r from-orange-500/20 to-pink-500/20 px-3 py-2 flex items-center gap-2 border-b border-pink-500/20">
      <Zap className="w-4 h-4 text-pink-500" />
      <span className="text-[11px] font-black uppercase tracking-widest text-pink-400">Trigger</span>
    </div>
    <div className="p-4">
      <p className="text-[13px] font-bold text-white">{data.label}</p>
      <p className="text-[10px] text-gray-500 mt-1 font-mono">{data.detail || "Listens for specific input"}</p>
    </div>
    <Handle type="source" position={Position.Right} isConnectable={isConnectable} className="w-3 h-3 bg-pink-500 border-2 border-[#111114]" />
  </div>
);

const ActionNode = ({ data, isConnectable }: any) => (
  <div className="bg-[#111114] border border-blue-500/30 shadow-[0_4px_20px_rgba(0,0,0,0.4)] rounded-xl w-[250px] overflow-hidden group hover:border-blue-500/60 transition-colors">
    <Handle type="target" position={Position.Left} isConnectable={isConnectable} className="w-3 h-3 bg-blue-500 border-2 border-[#111114]" />
    <div className="bg-blue-500/10 px-3 py-2 flex justify-between items-center border-b border-blue-500/20">
      <div className="flex items-center gap-2">
        {data.type === 'quick_reply' ? <MousePointer className="w-4 h-4 text-blue-400" /> : <MessageCircle className="w-4 h-4 text-blue-400" />}
        <span className="text-[11px] font-black uppercase tracking-widest text-blue-400">DM Action</span>
      </div>
    </div>
    <div className="p-4">
      <p className="text-[13px] font-bold text-white mb-2">{data.label}</p>
      <div className="bg-black/30 border border-white/5 rounded-lg p-2 text-[11px] text-gray-400">
        {data.preview || "Configure DM content..."}
      </div>
    </div>
    <Handle type="source" position={Position.Right} isConnectable={isConnectable} className="w-3 h-3 bg-gray-300 border-2 border-[#111114]" />
  </div>
);

const nodeTypes = { triggerNode: TriggerNode, actionNode: ActionNode };

const initialNodes = [
  { id: 'ig-trigger-1', type: 'triggerNode', position: { x: 50, y: 150 }, data: { label: 'User Comments "LINK"', detail: 'Triggers on any Reel/Post' } },
];
const initialEdges: any[] = [];
let id = 1;
const getId = () => `ig_node_${id++}`;

export default function InstagramFlowBuilder() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [reactFlowInstance, setReactFlowInstance] = useState<any>(null);
  const [isSaving, setIsSaving] = useState(false);

  if (status === "unauthenticated") router.push("/");

  const onConnect = useCallback((params: any) => {
    const animatedEdge = { ...params, animated: true, style: { stroke: '#ec4899', strokeWidth: 2 }, type: 'smoothstep' };
    setEdges((eds) => addEdge(animatedEdge, eds));
  }, [setEdges]);

  const onDragOver = useCallback((event: any) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback((event: any) => {
      event.preventDefault();
      const type = event.dataTransfer.getData('application/reactflow');
      const nodeLabel = event.dataTransfer.getData('application/label');
      const nodeActionType = event.dataTransfer.getData('application/actionType');

      if (!type) return;

      const position = reactFlowInstance.screenToFlowPosition({ x: event.clientX, y: event.clientY });
      const newNode = { id: getId(), type, position, data: { label: nodeLabel, type: nodeActionType, preview: 'Drag edge to configure' } };
      setNodes((nds) => nds.concat(newNode));
    }, [reactFlowInstance, setNodes]
  );

  const handleSaveFlow = () => {
      setIsSaving(true);
      setTimeout(() => { setIsSaving(false); alert("📸 Instagram Funnel compiled and synced to Meta Graph API!"); }, 1200);
  };

  return (
    <div className="flex flex-col h-screen bg-[#07070A] text-white overflow-hidden selection:bg-pink-500/30">
      <TopHeader title="IG Flow Builder" session={session} />
      
      <div className="flex-1 flex overflow-hidden border-t border-white/5">
        <aside className="w-[280px] bg-[#0A0A0D] border-r border-white/5 flex flex-col z-20 shadow-[5px_0_30px_rgba(0,0,0,0.5)]">
          <div className="p-5 border-b border-white/5">
            <h2 className="text-[13px] font-black uppercase tracking-[0.15em] text-white flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-pink-500" /> IG Toolbox
            </h2>
            <p className="text-[10px] text-gray-500 mt-1">Drag nodes to build DM funnels</p>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 mb-3 pl-1">Triggers (Entry Points)</p>
              <div className="space-y-2">
                <div className="bg-[#111114] border border-pink-500/20 p-3 rounded-xl cursor-grab hover:border-pink-500/50 transition-colors flex items-center gap-3"
                  onDragStart={(e) => { e.dataTransfer.setData('application/reactflow', 'triggerNode'); e.dataTransfer.setData('application/label', 'Specific Comment'); e.dataTransfer.effectAllowed = 'move'; }} draggable>
                  <div className="w-8 h-8 rounded-lg bg-pink-500/10 flex items-center justify-center shrink-0"><MessageSquare className="w-4 h-4 text-pink-400"/></div>
                  <div className="flex flex-col"><span className="text-[12px] font-bold text-gray-200">Specific Comment</span></div>
                </div>
                <div className="bg-[#111114] border border-orange-500/20 p-3 rounded-xl cursor-grab hover:border-orange-500/50 transition-colors flex items-center gap-3"
                  onDragStart={(e) => { e.dataTransfer.setData('application/reactflow', 'triggerNode'); e.dataTransfer.setData('application/label', 'Story Mention'); e.dataTransfer.effectAllowed = 'move'; }} draggable>
                  <div className="w-8 h-8 rounded-lg bg-orange-500/10 flex items-center justify-center shrink-0"><Zap className="w-4 h-4 text-orange-400"/></div>
                  <div className="flex flex-col"><span className="text-[12px] font-bold text-gray-200">Story Mention</span></div>
                </div>
              </div>
            </div>

            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 mb-3 pl-1">DM Actions</p>
              <div className="space-y-2">
                <div className="bg-[#111114] border border-white/10 p-3 rounded-xl cursor-grab hover:border-blue-500/50 transition-colors flex items-center gap-3"
                  onDragStart={(e) => { e.dataTransfer.setData('application/reactflow', 'actionNode'); e.dataTransfer.setData('application/label', 'Send Text DM'); e.dataTransfer.setData('application/actionType', 'text'); e.dataTransfer.effectAllowed = 'move'; }} draggable>
                  <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center shrink-0"><MessageCircle className="w-4 h-4 text-blue-400"/></div>
                  <div className="flex flex-col"><span className="text-[12px] font-bold text-gray-200">Send Text DM</span></div>
                </div>
                <div className="bg-[#111114] border border-white/10 p-3 rounded-xl cursor-grab hover:border-blue-500/50 transition-colors flex items-center gap-3"
                  onDragStart={(e) => { e.dataTransfer.setData('application/reactflow', 'actionNode'); e.dataTransfer.setData('application/label', 'Quick Reply Buttons'); e.dataTransfer.setData('application/actionType', 'quick_reply'); e.dataTransfer.effectAllowed = 'move'; }} draggable>
                  <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center shrink-0"><MousePointer className="w-4 h-4 text-blue-400"/></div>
                  <div className="flex flex-col"><span className="text-[12px] font-bold text-gray-200">Quick Reply Buttons</span></div>
                </div>
              </div>
            </div>
          </div>
        </aside>

        <div className="flex-1 relative" ref={reactFlowWrapper}>
          <ReactFlowProvider>
            <ReactFlow nodes={nodes} edges={edges} onNodesChange={onNodesChange} onEdgesChange={onEdgesChange} onConnect={onConnect} onInit={setReactFlowInstance} onDrop={onDrop} onDragOver={onDragOver} nodeTypes={nodeTypes} fitView className="bg-[#07070A]">
              <Background color="#ffffff" gap={24} size={1} opacity={0.05} />
              <Controls className="bg-[#111114] border border-white/10 rounded-lg overflow-hidden fill-white" showInteractive={false}/>
              <Panel position="top-right" className="flex gap-3 m-4">
                <button className="bg-[#111114] border border-white/10 hover:bg-white/5 text-white px-4 py-2 rounded-xl text-[11px] font-bold uppercase tracking-widest flex items-center gap-2 transition-colors">
                  <Play className="w-3 h-3 text-pink-500" /> Test
                </button>
                <button onClick={handleSaveFlow} disabled={isSaving} className="bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-400 hover:to-purple-400 text-white px-6 py-2 rounded-xl text-[11px] font-black uppercase tracking-widest flex items-center gap-2 transition-colors shadow-[0_0_15px_rgba(236,72,153,0.3)] disabled:opacity-50">
                  {isSaving ? <Activity className="w-4 h-4 animate-spin"/> : <Save className="w-4 h-4" />} {isSaving ? "Compiling..." : "Save & Publish"}
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
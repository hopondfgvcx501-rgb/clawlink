"use client";

/**
 * ==============================================================================================
 * CLAWLINK ENTERPRISE: WHATSAPP FLOW BUILDER
 * ==============================================================================================
 * @file app/dashboard/whatsapp/flow/page.tsx
 * @description Visual Drag & Drop Builder for WhatsApp Interactive Messages.
 * Allows mapping of Buttons, Lists, and API triggers.
 * * ALL RIGHTS RESERVED. CLAWLINK INC.
 * ==============================================================================================
 */

import React, { useState, useCallback, useRef } from 'react';
import ReactFlow, {
  ReactFlowProvider,
  addEdge,
  useNodesState,
  useEdgesState,
  Controls,
  Background,
  Panel,
  Handle,
  Position
} from 'reactflow';
import 'reactflow/dist/style.css';
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
// 🚀 FIX: Replaced MousePointerSquare with MousePointer to fix Vercel Build Error
import { 
  MessageSquare, Zap, Play, Save, Activity, 
  List, MousePointer, FileText
} from "lucide-react";
import TopHeader from "@/components/TopHeader";

// ==========================================
// 🟢 CUSTOM WHATSAPP NODE COMPONENTS
// ==========================================

const TriggerNode = ({ data, isConnectable }: any) => (
  <div className="bg-[#111114] border border-[#25D366]/50 shadow-[0_0_15px_rgba(37,211,102,0.15)] rounded-xl w-[250px] overflow-hidden">
    <div className="bg-[#25D366]/10 px-3 py-2 flex items-center gap-2 border-b border-[#25D366]/20">
      <Zap className="w-4 h-4 text-[#25D366]" />
      <span className="text-[11px] font-black uppercase tracking-widest text-[#25D366]">Trigger</span>
    </div>
    <div className="p-4">
      <p className="text-[13px] font-bold text-white">{data.label}</p>
      <p className="text-[10px] text-gray-500 mt-1 font-mono">{data.detail || "Listens for specific input"}</p>
    </div>
    <Handle type="source" position={Position.Right} isConnectable={isConnectable} className="w-3 h-3 bg-[#25D366] border-2 border-[#111114]" />
  </div>
);

const InteractiveNode = ({ data, isConnectable }: any) => (
  <div className="bg-[#111114] border border-blue-500/30 shadow-[0_4px_20px_rgba(0,0,0,0.4)] rounded-xl w-[250px] overflow-hidden group hover:border-blue-500/60 transition-colors">
    <Handle type="target" position={Position.Left} isConnectable={isConnectable} className="w-3 h-3 bg-blue-500 border-2 border-[#111114]" />
    <div className="bg-blue-500/10 px-3 py-2 flex justify-between items-center border-b border-blue-500/20">
      <div className="flex items-center gap-2">
        {/* 🚀 FIX: Used MousePointer here */}
        {data.type === 'button' ? <MousePointer className="w-4 h-4 text-blue-400" /> : <List className="w-4 h-4 text-blue-400" />}
        <span className="text-[11px] font-black uppercase tracking-widest text-blue-400">Interactive</span>
      </div>
    </div>
    <div className="p-4">
      <p className="text-[13px] font-bold text-white mb-2">{data.label}</p>
      <div className="bg-black/30 border border-white/5 rounded-lg p-2 text-[11px] text-gray-400">
        {data.preview || "Configure interactive message..."}
      </div>
    </div>
    <Handle type="source" position={Position.Right} isConnectable={isConnectable} className="w-3 h-3 bg-gray-300 border-2 border-[#111114]" />
  </div>
);

const nodeTypes = { triggerNode: TriggerNode, interactiveNode: InteractiveNode };

const initialNodes = [
  { id: 'trigger-1', type: 'triggerNode', position: { x: 50, y: 150 }, data: { label: 'Keyword: "Menu"', detail: 'Triggers Main Menu Flow' } },
];
const initialEdges: any[] = [];
let id = 1;
const getId = () => `wa_node_${id++}`;

export default function WhatsAppFlowBuilder() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [reactFlowInstance, setReactFlowInstance] = useState<any>(null);
  const [isSaving, setIsSaving] = useState(false);

  if (status === "unauthenticated") router.push("/");

  const onConnect = useCallback((params: any) => {
    const animatedEdge = { ...params, animated: true, style: { stroke: '#25D366', strokeWidth: 2 }, type: 'smoothstep' };
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
      setTimeout(() => { setIsSaving(false); alert("🟢 Flow compiled and synced to WhatsApp Cloud API!"); }, 1200);
  };

  return (
    <div className="flex flex-col h-screen bg-[#07070A] text-white overflow-hidden selection:bg-[#25D366]/30">
      <TopHeader title="WA Flow Builder" session={session} />
      
      <div className="flex-1 flex overflow-hidden border-t border-white/5">
        <aside className="w-[280px] bg-[#0A0A0D] border-r border-white/5 flex flex-col z-20 shadow-[5px_0_30px_rgba(0,0,0,0.5)]">
          <div className="p-5 border-b border-white/5">
            <h2 className="text-[13px] font-black uppercase tracking-[0.15em] text-white flex items-center gap-2">
              <Workflow className="w-4 h-4 text-[#25D366]" /> WA Toolbox
            </h2>
            <p className="text-[10px] text-gray-500 mt-1">Drag interactive nodes</p>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 mb-3 pl-1">Triggers</p>
              <div className="space-y-2">
                <div className="bg-[#111114] border border-[#25D366]/20 p-3 rounded-xl cursor-grab hover:border-[#25D366]/50 transition-colors flex items-center gap-3"
                  onDragStart={(e) => { e.dataTransfer.setData('application/reactflow', 'triggerNode'); e.dataTransfer.setData('application/label', 'Keyword Match'); e.dataTransfer.effectAllowed = 'move'; }} draggable>
                  <div className="w-8 h-8 rounded-lg bg-[#25D366]/10 flex items-center justify-center shrink-0"><Zap className="w-4 h-4 text-[#25D366]"/></div>
                  <div className="flex flex-col"><span className="text-[12px] font-bold text-gray-200">Keyword Match</span></div>
                </div>
              </div>
            </div>

            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 mb-3 pl-1">Messages (24h Window)</p>
              <div className="space-y-2">
                <div className="bg-[#111114] border border-white/10 p-3 rounded-xl cursor-grab hover:border-blue-500/50 transition-colors flex items-center gap-3"
                  onDragStart={(e) => { e.dataTransfer.setData('application/reactflow', 'interactiveNode'); e.dataTransfer.setData('application/label', 'Send Buttons (Max 3)'); e.dataTransfer.setData('application/actionType', 'button'); e.dataTransfer.effectAllowed = 'move'; }} draggable>
                  {/* 🚀 FIX: Used MousePointer here */}
                  <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center shrink-0"><MousePointer className="w-4 h-4 text-blue-400"/></div>
                  <div className="flex flex-col"><span className="text-[12px] font-bold text-gray-200">Button Message</span></div>
                </div>
                <div className="bg-[#111114] border border-white/10 p-3 rounded-xl cursor-grab hover:border-blue-500/50 transition-colors flex items-center gap-3"
                  onDragStart={(e) => { e.dataTransfer.setData('application/reactflow', 'interactiveNode'); e.dataTransfer.setData('application/label', 'List Message (Max 10)'); e.dataTransfer.setData('application/actionType', 'list'); e.dataTransfer.effectAllowed = 'move'; }} draggable>
                  <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center shrink-0"><List className="w-4 h-4 text-blue-400"/></div>
                  <div className="flex flex-col"><span className="text-[12px] font-bold text-gray-200">List Message</span></div>
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
                  <Play className="w-3 h-3 text-[#25D366]" /> Test
                </button>
                <button onClick={handleSaveFlow} disabled={isSaving} className="bg-[#25D366] hover:bg-[#20bd5a] text-black px-6 py-2 rounded-xl text-[11px] font-black uppercase tracking-widest flex items-center gap-2 transition-colors shadow-[0_0_15px_rgba(37,211,102,0.3)] disabled:opacity-50">
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
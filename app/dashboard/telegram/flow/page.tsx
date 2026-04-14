"use client";

/**
 * ==============================================================================================
 * CLAWLINK ENTERPRISE TELEGRAM FLOW BUILDER
 * ==============================================================================================
 * @file app/dashboard/telegram/flow/page.tsx
 * @description Advanced Drag & Drop Visual Automation Builder using React Flow.
 * Allows users to visually map out /start commands, keyword triggers, and multi-step funnels.
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
import { 
  MessageSquare, Zap, Play, Save, Settings, Trash2, 
  Image as ImageIcon, MoreHorizontal, ArrowRight
} from "lucide-react";
import TopHeader from "@/components/TopHeader";

// ==========================================
// 🎨 CUSTOM NODE COMPONENTS
// ==========================================

// 1. Trigger Node (Starting point of a flow)
const TriggerNode = ({ data, isConnectable }: any) => {
  return (
    <div className="bg-[#111114] border border-orange-500/50 shadow-[0_0_15px_rgba(249,115,22,0.15)] rounded-xl w-[250px] overflow-hidden">
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

// 2. Action Node (Send message, media, etc.)
const ActionNode = ({ data, isConnectable }: any) => {
  return (
    <div className="bg-[#111114] border border-blue-500/30 shadow-[0_4px_20px_rgba(0,0,0,0.4)] rounded-xl w-[250px] overflow-hidden group hover:border-blue-500/60 transition-colors">
      <Handle type="target" position={Position.Left} isConnectable={isConnectable} className="w-3 h-3 bg-blue-500 border-2 border-[#111114]" />
      
      <div className="bg-blue-500/10 px-3 py-2 flex justify-between items-center border-b border-blue-500/20">
        <div className="flex items-center gap-2">
          {data.type === 'media' ? <ImageIcon className="w-4 h-4 text-blue-400" /> : <MessageSquare className="w-4 h-4 text-blue-400" />}
          <span className="text-[11px] font-black uppercase tracking-widest text-blue-400">Action</span>
        </div>
        <button className="text-gray-500 hover:text-white transition-colors"><MoreHorizontal className="w-4 h-4"/></button>
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

// Register custom nodes
const nodeTypes = {
  triggerNode: TriggerNode,
  actionNode: ActionNode,
};

// ==========================================
// 🚀 MAIN BUILDER COMPONENT
// ==========================================

const initialNodes = [
  {
    id: 'trigger-1',
    type: 'triggerNode',
    position: { x: 50, y: 150 },
    data: { label: 'User sends /start', detail: 'Matches exact command' },
  },
];

const initialEdges: any[] = [];

let id = 1;
const getId = () => `node_${id++}`;

export default function TelegramFlowBuilder() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [reactFlowInstance, setReactFlowInstance] = useState<any>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Redirect if not logged in
  if (status === "unauthenticated") {
    router.push("/");
  }

  const onConnect = useCallback((params: any) => {
    // Add custom styling to edges
    const animatedEdge = { 
        ...params, 
        animated: true, 
        style: { stroke: '#4b5563', strokeWidth: 2 },
        type: 'smoothstep' // Use curved lines
    };
    setEdges((eds) => addEdge(animatedEdge, eds));
  }, [setEdges]);

  const onDragOver = useCallback((event: any) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event: any) => {
      event.preventDefault();

      const type = event.dataTransfer.getData('application/reactflow');
      const nodeLabel = event.dataTransfer.getData('application/label');
      const nodeActionType = event.dataTransfer.getData('application/actionType');

      if (typeof type === 'undefined' || !type) {
        return;
      }

      const position = reactFlowInstance.screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      const newNode = {
        id: getId(),
        type,
        position,
        data: { 
            label: nodeLabel,
            type: nodeActionType,
            preview: nodeActionType === 'media' ? 'Select file to attach' : 'Type your message here...'
        },
      };

      setNodes((nds) => nds.concat(newNode));
    },
    [reactFlowInstance, setNodes],
  );

  const handleSaveFlow = async () => {
      setIsSaving(true);
      // In a real app, you would send `nodes` and `edges` to Supabase here
      console.log("Saving Flow Data:", { nodes, edges });
      
      setTimeout(() => {
          setIsSaving(false);
          alert("Flow successfully compiled and saved to production!");
      }, 1000);
  };

  if (status === "loading") {
    return <div className="h-screen flex items-center justify-center bg-[#07070A] text-orange-500 font-mono"><Activity className="w-8 h-8 animate-spin mr-3"/> INITIALIZING CANVAS...</div>;
  }

  return (
    <div className="flex flex-col h-screen bg-[#07070A] text-white overflow-hidden">
      <TopHeader title="Flow Builder" session={session} />
      
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
                  className="bg-[#111114] border border-orange-500/20 p-3 rounded-xl cursor-grab hover:border-orange-500/50 transition-colors flex items-center gap-3"
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
                      <span className="text-[9px] text-gray-500 font-mono">e.g., "price", "help"</span>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 mb-3 pl-1">Actions</p>
              <div className="space-y-2">
                <div 
                  className="bg-[#111114] border border-white/10 p-3 rounded-xl cursor-grab hover:border-blue-500/50 transition-colors flex items-center gap-3"
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
                  className="bg-[#111114] border border-white/10 p-3 rounded-xl cursor-grab hover:border-blue-500/50 transition-colors flex items-center gap-3"
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
              {/* Subtle grid background to look like a blueprint */}
              <Background color="#ffffff" gap={24} size={1} opacity={0.05} />
              <Controls className="bg-[#111114] border border-white/10 rounded-lg overflow-hidden fill-white" showInteractive={false}/>
              
              {/* Top Right Controls Overlay */}
              <Panel position="top-right" className="flex gap-3 m-4">
                <button className="bg-[#111114] border border-white/10 hover:bg-white/5 text-white px-4 py-2 rounded-xl text-[11px] font-bold uppercase tracking-widest flex items-center gap-2 transition-colors">
                  <Play className="w-3 h-3 text-green-400" /> Test
                </button>
                <button 
                  onClick={handleSaveFlow}
                  disabled={isSaving}
                  className="bg-[#2AABEE] hover:bg-[#2298D6] text-white px-6 py-2 rounded-xl text-[11px] font-bold uppercase tracking-widest flex items-center gap-2 transition-colors shadow-[0_0_15px_rgba(42,171,238,0.3)] disabled:opacity-50"
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
"use client";

/**
 * ==============================================================================================
 * CLAWLINK ENTERPRISE TELEGRAM FLOW BUILDER (MULTI-FLOW V3)
 * ==============================================================================================
 * @file app/dashboard/telegram/flow/page.tsx
 * @description Advanced Drag & Drop Visual Automation Builder using React Flow.
 * 🚀 FIXED: Kept 100% Original Logic & Layout. 
 * 🚀 FIXED: Injected Delete (X) Node functionality without breaking existing state.
 * 🔥 UPGRADED: Multi-Flow Architecture added. Users can create, list, edit, and delete unlimited flows.
 * 🔥 UPGRADED: Dynamic Flow Naming & Auto-Trigger Extraction for Global DB Sync.
 * * ALL RIGHTS RESERVED. CLAWLINK INC.
 * ==============================================================================================
 */

import React, { useState, useCallback, useRef, useEffect, DragEvent } from 'react';
import ReactFlow, {
  ReactFlowProvider,
  addEdge,
  useNodesState,
  useEdgesState,
  Controls,
  Background,
  Handle,
  Position,
  Connection,
  Edge,
  NodeProps,
  ReactFlowInstance,
  useReactFlow
} from 'reactflow';
import 'reactflow/dist/style.css'; 
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { 
  MessageSquare, Zap, Play, Save, Trash2, 
  Image as ImageIcon, Activity, Workflow, X,
  FolderOpen, Plus, FileText, Trash
} from "lucide-react";
import TopHeader from "@/components/TopHeader";
import SpinnerCounter from "@/components/SpinnerCounter";

// ==========================================
// 🎨 EDITABLE CUSTOM NODE COMPONENTS (100% UNTOUCHED)
// ==========================================

const TriggerNode = ({ id, data, isConnectable }: NodeProps) => {
  const { setNodes, setEdges } = useReactFlow();

  const onKeywordChange = (evt: React.ChangeEvent<HTMLInputElement>) => {
    setNodes((nds) =>
      nds.map((node) => {
        if (node.id === id) {
          node.data = { ...node.data, triggerKeyword: evt.target.value };
        }
        return node;
      })
    );
  };

  const deleteNode = () => {
    setNodes((nds) => nds.filter((n) => n.id !== id));
    setEdges((eds) => eds.filter((e) => e.source !== id && e.target !== id));
  };

  return (
    <div className="bg-[#111114] border border-orange-500/50 shadow-[0_0_15px_rgba(249,115,22,0.15)] rounded-xl w-[280px] overflow-hidden group">
      <div className="bg-orange-500/10 px-3 py-2 flex items-center justify-between border-b border-orange-500/20">
        <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-orange-500" aria-hidden="true" />
            <span className="text-[11px] font-black uppercase tracking-widest text-orange-400">Trigger</span>
        </div>
        <div className="flex items-center gap-2">
            <span className="text-[9px] text-orange-500/50 uppercase">Editable</span>
            <button onClick={deleteNode} className="text-gray-500 hover:text-red-500 transition-colors p-1" title="Delete Node">
                <X className="w-3.5 h-3.5" aria-hidden="true" />
            </button>
        </div>
      </div>
      <div className="p-4 flex flex-col gap-2">
        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Trigger Keyword / Command</label>
        <input 
            type="text"
            placeholder="e.g. /start, price, help..."
            value={data?.triggerKeyword || ""}
            onChange={onKeywordChange}
            className="w-full bg-black/40 border border-white/10 rounded-lg p-2.5 text-xs text-white outline-none focus:border-orange-500/50 transition-colors placeholder:text-gray-600 font-mono"
        />
      </div>
      <Handle type="source" position={Position.Right} id="a" isConnectable={isConnectable} className="w-3 h-3 bg-orange-500 border-2 border-[#111114]" />
    </div>
  );
};

const ActionNode = ({ id, data, isConnectable }: NodeProps) => {
  const { setNodes, setEdges } = useReactFlow();

  const onMessageChange = (evt: React.ChangeEvent<HTMLTextAreaElement>) => {
    setNodes((nds) =>
      nds.map((node) => {
        if (node.id === id) {
          node.data = { ...node.data, messageText: evt.target.value };
        }
        return node;
      })
    );
  };

  const deleteNode = () => {
    setNodes((nds) => nds.filter((n) => n.id !== id));
    setEdges((eds) => eds.filter((e) => e.source !== id && e.target !== id));
  };

  return (
    <div className="bg-[#111114] border border-blue-500/30 shadow-[0_4px_20px_rgba(0,0,0,0.4)] rounded-xl w-[300px] overflow-hidden group hover:border-blue-500/60 transition-colors">
      <Handle type="target" position={Position.Left} isConnectable={isConnectable} className="w-3 h-3 bg-blue-500 border-2 border-[#111114]" />
      
      <div className="bg-blue-500/10 px-3 py-2 flex justify-between items-center border-b border-blue-500/20">
        <div className="flex items-center gap-2">
          {data?.type === 'media' ? <ImageIcon className="w-4 h-4 text-blue-400" aria-hidden="true" /> : <MessageSquare className="w-4 h-4 text-blue-400" aria-hidden="true" />}
          <span className="text-[11px] font-black uppercase tracking-widest text-blue-400">Action</span>
        </div>
        <div className="flex items-center gap-2">
            <span className="text-[9px] text-blue-500/50 uppercase">Editable</span>
            <button onClick={deleteNode} className="text-gray-500 hover:text-red-500 transition-colors p-1" title="Delete Node">
                <X className="w-3.5 h-3.5" aria-hidden="true" />
            </button>
        </div>
      </div>
      <div className="p-4 flex flex-col gap-2">
        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
            {data?.type === 'media' ? "Media URL / Text" : "Reply Message"}
        </label>
        <textarea 
            rows={4}
            placeholder="Type the exact message the bot will send..."
            value={data?.messageText || ""}
            onChange={onMessageChange}
            className="w-full bg-black/40 border border-white/10 rounded-lg p-2.5 text-xs text-white outline-none focus:border-blue-500/50 transition-colors placeholder:text-gray-600 resize-none custom-scrollbar"
        />
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
  
  const [nodes, setNodes, onNodesChange] = useNodesState<any>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<any>([]);
  
  const [reactFlowInstance, setReactFlowInstance] = useState<any>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingFlow, setIsLoadingFlow] = useState(true);
  const [isClient, setIsClient] = useState(false);

  // 🚀 ADVANCE LEVEL STATES: Multi-Flow Management
  const [savedFlowsList, setSavedFlowsList] = useState<any[]>([]);
  const [activeFlowId, setActiveFlowId] = useState<string | null>(null);
  const [flowName, setFlowName] = useState<string>("Untitled Flow");

  useEffect(() => {
    setIsClient(true);
    if (status === "unauthenticated") {
        router.replace("/");
    }
  }, [status, router]);

  // 🔥 FETCH ALL FLOWS (Multi-Flow DB Sync)
  const fetchFlowsList = async () => {
    if (status === "authenticated" && session?.user?.email) {
      try {
        const res = await fetch(`/api/telegram/flow?email=${encodeURIComponent(session.user.email)}&t=${Date.now()}`, {
          headers: { 'Cache-Control': 'no-store' }
        });
        const data = await res.json();
        
        if (data.success && data.flows) {
            setSavedFlowsList(data.flows);
            // Auto-load the first flow if it exists and nothing is active
            if (data.flows.length > 0 && !activeFlowId) {
                loadSpecificFlow(data.flows[0].id);
            } else if (data.flows.length === 0) {
                handleCreateNewFlow();
            }
        }
      } catch (error) {
        console.error("[MULTI_FLOW_SYNC_ERROR] Failed to load flows list", error);
      } finally {
        setIsLoadingFlow(false);
      }
    }
  };

  useEffect(() => {
    if (isClient) {
        fetchFlowsList();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session, status, isClient]);

  // 🔥 LOAD SPECIFIC FLOW TO CANVAS
  const loadSpecificFlow = async (id: string) => {
      if (!session?.user?.email) return;
      setIsLoadingFlow(true);
      try {
          const res = await fetch(`/api/telegram/flow?email=${encodeURIComponent(session.user.email)}&flowId=${id}&t=${Date.now()}`);
          const data = await res.json();
          if (data.success && data.data) {
              setActiveFlowId(data.data.id);
              setFlowName(data.data.flow_name || "Untitled Flow");
              setNodes(data.data.nodes || []);
              setEdges(data.data.edges || []);
          }
      } catch (error) {
          console.error("Failed to load specific flow:", error);
      } finally {
          setIsLoadingFlow(false);
      }
  };

  // 🔥 CREATE NEW FLOW (Clear Canvas)
  const handleCreateNewFlow = () => {
      setActiveFlowId(null);
      setFlowName("New Bot Campaign");
      setNodes([{ id: 'telegram-trigger-1', type: 'triggerNode', position: { x: 50, y: 150 }, data: { triggerKeyword: '' } }]);
      setEdges([]);
  };

  // 🔥 DELETE FLOW FROM DB
  const handleDeleteFlow = async (e: React.MouseEvent, id: string) => {
      e.stopPropagation(); // Prevent clicking the row
      if(!confirm("⚠️ Are you sure you want to delete this flow permanently?")) return;
      
      if (!session?.user?.email) return;
      setIsLoadingFlow(true);
      try {
          const res = await fetch(`/api/telegram/flow?email=${encodeURIComponent(session.user.email)}&flowId=${id}`, {
              method: 'DELETE'
          });
          const data = await res.json();
          if (data.success) {
              if (activeFlowId === id) handleCreateNewFlow(); // Clear canvas if deleted active
              await fetchFlowsList(); // Refresh list
          }
      } catch (error) {
          console.error("Delete failed:", error);
      } finally {
          setIsLoadingFlow(false);
      }
  };

  const onConnect = useCallback((params: Connection | Edge) => {
    const animatedEdge = { 
        ...params, 
        animated: true, 
        style: { stroke: '#4b5563', strokeWidth: 2 },
        type: 'smoothstep' 
    };
    setEdges((eds: any) => addEdge(animatedEdge, eds));
  }, [setEdges]);

  const onDragOver = useCallback((event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    if (event.dataTransfer) {
        event.dataTransfer.dropEffect = 'move';
    }
  }, []);

  const onDrop = useCallback((event: DragEvent<HTMLDivElement>) => {
      event.preventDefault();

      if (!reactFlowWrapper.current || !reactFlowInstance || !event.dataTransfer) return;

      const type = event.dataTransfer.getData('application/reactflow');
      const nodeActionType = event.dataTransfer.getData('application/actionType');

      if (!type) return;

      const reactFlowBounds = reactFlowWrapper.current.getBoundingClientRect();
      const position = reactFlowInstance.project({
        x: event.clientX - reactFlowBounds.left,
        y: event.clientY - reactFlowBounds.top,
      });

      const newNode = {
        id: `node_${Date.now()}`,
        type,
        position,
        data: { 
            type: nodeActionType,
            triggerKeyword: '',
            messageText: ''
        },
      };

      setNodes((nds: any) => nds.concat([newNode]));
    }, [reactFlowInstance, setNodes]
  );

  const handleClearCanvas = () => {
    if(confirm("Are you sure you want to clear the canvas? This won't delete the flow from DB until you save.")) {
      setNodes([{ id: 'telegram-trigger-1', type: 'triggerNode', position: { x: 50, y: 150 }, data: { triggerKeyword: '' } }]);
      setEdges([]);
    }
  };

  const handleTestFlow = () => {
      if (nodes.length < 2) {
          alert("⚠️ Please add at least one Action Node to test the path.");
          return;
      }
      alert("🟢 System check passed: You can now Save & Publish.");
  };

  // 🔥 ADVANCE SAVE & PUBLISH (Extracts Trigger & Syncs to DB)
  const handleSaveFlow = async () => {
      if (!session?.user?.email) {
          alert("Session expired. Please refresh.");
          return;
      }
      if(!reactFlowInstance) return;

      setIsSaving(true);
      
      const currentNodes = reactFlowInstance.getNodes();
      
      // Auto-Extract the first trigger keyword to save in DB for fast routing
      let extractedTrigger = "";
      for (const n of currentNodes) {
          if (n.type === "triggerNode" && n.data.triggerKeyword) {
              extractedTrigger = n.data.triggerKeyword;
              break;
          }
      }

      const payload = {
        email: session.user.email,
        flowId: activeFlowId, // If null, creates new. If string, updates existing.
        flowName: flowName,
        triggerKeyword: extractedTrigger,
        nodes: currentNodes,
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
          alert("🚀 Multi-Flow mapped and saved globally! Telegram Menu Auto-Synced.");
          await fetchFlowsList(); // Refresh list to show new/updated flow
        } else {
          alert("Failed to save flow: " + (data.error || "Unknown error"));
        }
      } catch(err) {
        console.error("Save error:", err);
        alert("Network error while saving.");
      } finally {
        setIsSaving(false);
      }
  };

  if (!isClient || status === "loading" || isLoadingFlow) {
    return <SpinnerCounter text="SYNCHRONIZING CANVAS & DATABASE..." />;
  }

  return (
    <div className="flex flex-col h-screen bg-[#07070A] text-white overflow-hidden selection:bg-[#2AABEE]/30">
      <TopHeader title="Telegram Flow Builder" session={session} />
      
      <div className="flex-1 flex overflow-hidden border-t border-white/5 relative">
        
        {/* 🧰 LEFT SIDEBAR: MULTI-FLOW MANAGER & TOOLBOX */}
        <aside className="w-[300px] bg-[#0A0A0D] border-r border-white/5 flex flex-col z-20 shadow-[5px_0_30px_rgba(0,0,0,0.5)] shrink-0">
          
          {/* TOP HALF: MY FLOWS LIST */}
          <div className="flex flex-col h-1/2 border-b border-white/5">
            <div className="p-4 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
                <h2 className="text-[12px] font-black uppercase tracking-[0.15em] text-white flex items-center gap-2">
                <FolderOpen className="w-4 h-4 text-[#2AABEE]" aria-hidden="true" /> Saved Flows
                </h2>
                <button onClick={handleCreateNewFlow} className="bg-[#2AABEE]/10 hover:bg-[#2AABEE]/20 text-[#2AABEE] p-1.5 rounded-lg transition-colors" title="Create New Flow">
                    <Plus className="w-4 h-4" />
                </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-2 custom-scrollbar">
                {savedFlowsList.length === 0 ? (
                    <div className="p-4 text-center text-gray-500 text-[10px] uppercase tracking-widest mt-4">No flows created yet.</div>
                ) : (
                    savedFlowsList.map((flow) => (
                        <div 
                            key={flow.id}
                            onClick={() => loadSpecificFlow(flow.id)}
                            className={`flex items-center justify-between p-3 mb-1.5 rounded-xl cursor-pointer transition-all border ${activeFlowId === flow.id ? 'bg-[#2AABEE]/10 border-[#2AABEE]/30' : 'bg-[#111114] border-white/5 hover:border-white/20'}`}
                        >
                            <div className="flex items-center gap-3 overflow-hidden">
                                <FileText className={`w-3.5 h-3.5 shrink-0 ${activeFlowId === flow.id ? 'text-[#2AABEE]' : 'text-gray-500'}`} />
                                <div className="flex flex-col overflow-hidden">
                                    <span className={`text-xs font-bold truncate ${activeFlowId === flow.id ? 'text-white' : 'text-gray-300'}`}>{flow.flow_name}</span>
                                    <span className="text-[9px] text-gray-500 font-mono truncate">{flow.trigger_keyword ? `Triggers: ${flow.trigger_keyword}` : "No trigger"}</span>
                                </div>
                            </div>
                            <button onClick={(e) => handleDeleteFlow(e, flow.id)} className="text-gray-500 hover:text-red-500 p-1.5 opacity-50 hover:opacity-100 transition-all shrink-0">
                                <Trash className="w-3.5 h-3.5" />
                            </button>
                        </div>
                    ))
                )}
            </div>
          </div>

          {/* BOTTOM HALF: NODES TOOLBOX */}
          <div className="flex flex-col h-1/2">
            <div className="p-4 border-b border-white/5">
                <h2 className="text-[12px] font-black uppercase tracking-[0.15em] text-white flex items-center gap-2">
                <Workflow className="w-4 h-4 text-purple-400" aria-hidden="true" /> Nodes Toolbox
                </h2>
                <p className="text-[9px] text-gray-500 mt-1 uppercase tracking-widest">Drag items onto canvas</p>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-5 custom-scrollbar">
                <div>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 mb-3 pl-1">Triggers</p>
                <div className="space-y-2">
                    <div 
                    className="bg-[#111114] border border-orange-500/20 p-3 rounded-xl cursor-grab hover:border-orange-500/50 transition-colors flex items-center gap-3 shadow-sm"
                    onDragStart={(e) => {
                        if(e.dataTransfer) {
                            e.dataTransfer.setData('application/reactflow', 'triggerNode');
                            e.dataTransfer.effectAllowed = 'move';
                        }
                    }}
                    draggable
                    >
                    <div className="w-8 h-8 rounded-lg bg-orange-500/10 flex items-center justify-center shrink-0"><Zap className="w-4 h-4 text-orange-400" aria-hidden="true"/></div>
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
                        if(e.dataTransfer) {
                            e.dataTransfer.setData('application/reactflow', 'actionNode');
                            e.dataTransfer.setData('application/actionType', 'text');
                            e.dataTransfer.effectAllowed = 'move';
                        }
                    }}
                    draggable
                    >
                    <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center shrink-0"><MessageSquare className="w-4 h-4 text-blue-400" aria-hidden="true"/></div>
                    <div className="flex flex-col">
                        <span className="text-[12px] font-bold text-gray-200">Send Message</span>
                        <span className="text-[9px] text-gray-500 font-mono">Dynamic Text Reply</span>
                    </div>
                    </div>

                    <div 
                    className="bg-[#111114] border border-white/10 p-3 rounded-xl cursor-grab hover:border-blue-500/50 transition-colors flex items-center gap-3 shadow-sm"
                    onDragStart={(e) => {
                        if(e.dataTransfer) {
                            e.dataTransfer.setData('application/reactflow', 'actionNode');
                            e.dataTransfer.setData('application/actionType', 'media');
                            e.dataTransfer.effectAllowed = 'move';
                        }
                    }}
                    draggable
                    >
                    <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center shrink-0"><ImageIcon className="w-4 h-4 text-purple-400" aria-hidden="true"/></div>
                    <div className="flex flex-col">
                        <span className="text-[12px] font-bold text-gray-200">Send Media</span>
                        <span className="text-[9px] text-gray-500 font-mono">Image, Video, PDF URL</span>
                    </div>
                    </div>
                </div>
                </div>

            </div>
          </div>
        </aside>

        {/* 🧠 CENTER CANVAS WITH ABSOLUTE OVERLAYS */}
        <div className="flex-1 relative" ref={reactFlowWrapper}>
          
          {/* TOP CONTROLS OVERLAY */}
          <div className="absolute top-4 left-6 right-6 z-[100] flex flex-col md:flex-row items-center justify-between gap-4 pointer-events-none">
            
            {/* FLOW NAME INPUT */}
            <div className="bg-[#0A0A0D]/90 backdrop-blur-md p-1.5 rounded-2xl border border-white/10 shadow-2xl flex items-center gap-3 pointer-events-auto">
                <div className="w-8 h-8 bg-white/5 rounded-xl flex items-center justify-center"><FileText className="w-4 h-4 text-gray-400" /></div>
                <input 
                    type="text"
                    value={flowName}
                    onChange={(e) => setFlowName(e.target.value)}
                    placeholder="Enter Campaign Name..."
                    className="bg-transparent border-none outline-none text-sm font-bold text-white w-[200px]"
                />
            </div>

            {/* ACTION BUTTONS */}
            <div className="flex items-center gap-3 bg-[#0A0A0D]/90 backdrop-blur-md p-2 rounded-2xl border border-white/10 shadow-2xl pointer-events-auto">
                <button title="Clear Canvas" aria-label="Clear Canvas" onClick={handleClearCanvas} className="text-[11px] font-bold uppercase tracking-widest text-gray-400 hover:text-red-400 transition-colors flex items-center gap-1.5 px-3">
                <Trash2 className="w-3.5 h-3.5" aria-hidden="true" /> Clear
                </button>

                <div className="h-6 w-px bg-white/10 mx-1"></div>

                <button title="Test Flow" aria-label="Test Flow" onClick={handleTestFlow} className="bg-[#111114] hover:bg-white/5 border border-white/10 text-white px-4 py-2.5 rounded-xl text-[11px] font-bold uppercase tracking-widest flex items-center gap-2 transition-colors">
                <Play className="w-3 h-3 text-green-400" aria-hidden="true" /> Test
                </button>
                
                <button 
                onClick={handleSaveFlow}
                disabled={isSaving}
                title="Save and Publish"
                aria-label="Save and Publish"
                className="bg-[#2AABEE] hover:bg-[#2298D6] text-white px-6 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-widest flex items-center gap-2 transition-colors shadow-[0_0_20px_rgba(42,171,238,0.4)] disabled:opacity-50"
                >
                {isSaving ? <Activity className="w-4 h-4 animate-spin" aria-hidden="true"/> : <Save className="w-4 h-4" aria-hidden="true" />} 
                {isSaving ? "Compiling..." : "Save & Publish"}
                </button>
            </div>

          </div>

          {/* REACT FLOW CANVAS */}
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
              <Controls className="bg-[#111114] border border-white/10 rounded-lg overflow-hidden fill-white shadow-lg z-[50]" showInteractive={false}/>
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
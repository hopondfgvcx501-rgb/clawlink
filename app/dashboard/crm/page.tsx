"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { ArrowLeft, Edit3, Save, X, Phone, DollarSign, Package, Ticket } from "lucide-react";

interface CustomerMemory {
  id: string;
  customer_phone: string;
  customer_name: string;
  outstanding_balance: number;
  last_order_status: string;
  active_ticket_id: string;
  past_behavior_notes: string;
  last_interaction: string;
}

export default function CRMEditor() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  const [customers, setCustomers] = useState<CustomerMemory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<CustomerMemory>>({});

  useEffect(() => {
    if (status === "unauthenticated") router.push("/");
    
    if (session?.user?.email) {
      fetchCRMData(session.user.email);
    }
  }, [session, status]);

  const fetchCRMData = async (email: string) => {
    try {
      const res = await fetch(`/api/crm?email=${email}`);
      const data = await res.json();
      if (data.success) setCustomers(data.data);
    } catch (error) {
      console.error("Failed to fetch CRM records", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditClick = (customer: CustomerMemory) => {
    setEditingId(customer.id);
    setEditForm(customer);
  };

  const handleSave = async () => {
    if (!session?.user?.email || !editingId) return;

    try {
      const res = await fetch("/api/crm", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: session.user.email,
          ...editForm
        })
      });
      
      const data = await res.json();
      if (data.success) {
        setCustomers(customers.map(c => c.id === editingId ? { ...c, ...editForm } : c));
        setEditingId(null);
      } else {
        alert("Failed to sync data with the AI Engine.");
      }
    } catch (error) {
      alert("Network error during synchronization.");
    }
  };

  if (isLoading || status === "loading") {
    return <div className="min-h-screen bg-[#0A0A0B] flex items-center justify-center text-white"><span className="animate-spin text-4xl">⚙️</span></div>;
  }

  return (
    <div className="min-h-screen bg-[#0A0A0B] text-white p-6 md:p-12 font-sans selection:bg-blue-500/30">
      
      <nav className="max-w-6xl mx-auto flex justify-between items-center mb-12 border-b border-white/10 pb-6">
        <div className="flex items-center gap-4">
          <button onClick={() => router.push('/dashboard')} className="p-2 bg-white/5 hover:bg-white/10 rounded-full transition-colors">
            <ArrowLeft className="w-5 h-5 text-gray-400" />
          </button>
          <div className="text-2xl font-bold tracking-wider font-mono">workflow<span className="text-orange-500">.</span>editor</div>
        </div>
        <div className="text-xs font-mono text-green-400 border border-green-500/30 bg-green-500/10 px-3 py-1.5 rounded-full flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></span> LIVE DB SYNC
        </div>
      </nav>

      <main className="max-w-6xl mx-auto">
        <div className="mb-10">
          <h1 className="text-3xl font-black tracking-tight mb-2">Customer Intelligence Matrix</h1>
          <p className="text-gray-400 text-sm">Update billing, order tracking, and support status here. The AI Agent will instantly adapt its responses based on this context.</p>
        </div>

        {customers.length === 0 ? (
          <div className="bg-[#111] border border-white/5 rounded-2xl p-12 text-center">
            <div className="text-4xl mb-4">📭</div>
            <h3 className="text-xl font-bold mb-2">No Active Customers Yet</h3>
            <p className="text-gray-400 text-sm">When customers interact with your WhatsApp or Telegram bot, their profiles will automatically appear here.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            <AnimatePresence>
              {customers.map((customer) => (
                <motion.div 
                  key={customer.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-[#111] border border-white/10 rounded-2xl p-6 relative shadow-xl hover:border-white/20 transition-all group"
                >
                  <div className="flex justify-between items-start mb-6 border-b border-white/5 pb-4">
                    <div>
                      <h3 className="font-bold text-lg text-white mb-1 flex items-center gap-2">
                        {customer.customer_name}
                      </h3>
                      <p className="text-xs text-gray-500 font-mono flex items-center gap-1"><Phone className="w-3 h-3"/> {customer.customer_phone}</p>
                    </div>
                    <button onClick={() => handleEditClick(customer)} className="text-gray-500 hover:text-white p-2 bg-black/50 rounded-lg transition-colors">
                      <Edit3 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="space-y-4 text-sm">
                    <div className="flex justify-between items-center bg-black/40 p-3 rounded-xl border border-white/5">
                      <span className="text-gray-400 flex items-center gap-2"><DollarSign className="w-4 h-4 text-red-400"/> Balance</span>
                      <span className={`font-mono font-bold ${customer.outstanding_balance > 0 ? 'text-red-400' : 'text-green-400'}`}>
                        ${customer.outstanding_balance.toFixed(2)}
                      </span>
                    </div>

                    <div className="flex justify-between items-center bg-black/40 p-3 rounded-xl border border-white/5">
                      <span className="text-gray-400 flex items-center gap-2"><Package className="w-4 h-4 text-blue-400"/> Order</span>
                      <span className="font-medium text-blue-300 truncate max-w-[120px]">{customer.last_order_status}</span>
                    </div>

                    <div className="flex justify-between items-center bg-black/40 p-3 rounded-xl border border-white/5">
                      <span className="text-gray-400 flex items-center gap-2"><Ticket className="w-4 h-4 text-orange-400"/> Ticket</span>
                      <span className="font-mono text-orange-300">{customer.active_ticket_id}</span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </main>

      {/* 🚀 EDIT MODAL */}
      <AnimatePresence>
        {editingId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }} 
              animate={{ opacity: 1, scale: 1 }} 
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#0A0A0B] border border-white/20 rounded-3xl w-full max-w-lg p-8 shadow-[0_0_50px_rgba(0,0,0,0.5)]"
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-white">Edit Customer Context</h2>
                <button onClick={() => setEditingId(null)} className="text-gray-500 hover:text-white"><X className="w-5 h-5"/></button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Customer Name</label>
                  <input type="text" value={editForm.customer_name || ""} onChange={(e) => setEditForm({...editForm, customer_name: e.target.value})} className="w-full bg-[#111] border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-orange-500 outline-none text-white transition-all"/>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Outstanding Bill ($)</label>
                    <input type="number" value={editForm.outstanding_balance || 0} onChange={(e) => setEditForm({...editForm, outstanding_balance: parseFloat(e.target.value)})} className="w-full bg-[#111] border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-red-500 outline-none font-mono text-white transition-all"/>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Active Ticket ID</label>
                    <input type="text" value={editForm.active_ticket_id || ""} onChange={(e) => setEditForm({...editForm, active_ticket_id: e.target.value})} className="w-full bg-[#111] border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-orange-500 outline-none font-mono text-white transition-all"/>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Order Tracking Status</label>
                  <input type="text" value={editForm.last_order_status || ""} onChange={(e) => setEditForm({...editForm, last_order_status: e.target.value})} placeholder="e.g., Shipped - Arriving Today" className="w-full bg-[#111] border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-blue-500 outline-none text-white transition-all"/>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">AI Behavioral Notes (Instructions for Bot)</label>
                  <textarea rows={3} value={editForm.past_behavior_notes || ""} onChange={(e) => setEditForm({...editForm, past_behavior_notes: e.target.value})} placeholder="e.g., VIP Customer, offer 10% discount on next purchase." className="w-full bg-[#111] border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-green-500 outline-none text-white transition-all resize-none"></textarea>
                </div>
              </div>

              <button onClick={handleSave} className="w-full mt-8 bg-white text-black font-black py-4 rounded-xl text-sm hover:bg-gray-200 transition-all uppercase tracking-widest flex justify-center items-center gap-2">
                <Save className="w-4 h-4"/> Sync to AI Engine
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
"use client";
import { signIn, useSession } from "next-auth/react";
import LandingUI from "../components/LandingUI";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";

export default function Home() {
  const { data: session, status } = useSession();
  const router = useRouter(); // Added router for redirection
  
  // State for ultra-fast popup
  const [showPricing, setShowPricing] = useState(false);
  const [selectedConfig, setSelectedConfig] = useState({ model: "", channel: "" });
  
  // Dynamic Currency Detection (Ultra-fast, zero API delay)
  const [userCurrency, setUserCurrency] = useState("USD");
  const [currencySymbol, setCurrencySymbol] = useState("$");

  useEffect(() => {
    // Check if user is in India based on Timezone
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (timezone === "Asia/Calcutta" || timezone === "Asia/Kolkata") {
      setUserCurrency("INR");
      setCurrencySymbol("₹");
    }

    // Load Razorpay Script seamlessly
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    document.body.appendChild(script);
  }, []);

  // SimpleClaw Style Plans
  const plans = [
    {
      id: "hobby",
      name: "Starter / Hobby",
      price_inr: 999,
      price_usd: 12,
      features: ["5,000 Messages / month", "Standard Speed", "Community Support", "1 Active Agent"],
    },
    {
      id: "pro",
      name: "Business Pro",
      price_inr: 2499,
      price_usd: 29,
      features: ["Unlimited Messages", "Priority Engine Speed", "24/7 Premium Support", "5 Active Agents"],
      isPopular: true,
    }
  ];

  // The Payment Function
  const handlePayment = async (planAmount: number) => {
    setShowPricing(false); // Close modal instantly for speed
    
    // Razorpay needs the smallest unit (Paise for INR, Cents for USD)
    const amountInSmallestUnit = planAmount * 100;

    // Call dynamic backend
    const response = await fetch("/api/razorpay", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount: amountInSmallestUnit, currency: userCurrency }),
    });
    
    const order = await response.json();

    const options = {
      key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID, 
      amount: order.amount,
      currency: order.currency,
      name: "ClawLink Infrastructure",
      description: `Server Deployment for ${selectedConfig.model}`,
      order_id: order.id,
      handler: function (response: any) {
        console.log("Success ID:", response.razorpay_payment_id);
        
        // REDIRECT THE USER DIRECTLY TO THE DASHBOARD
        router.push("/dashboard"); 
      },
      prefill: {
        name: session?.user?.name || "ClawLink User",
        email: session?.user?.email || "",
      },
      theme: { color: "#10A37F" },
    };

    const rzp = new (window as any).Razorpay(options);
    rzp.open();
  };

  // Main Deploy Logic
  const handleDeployProcess = (model: string, channel: string) => {
    if (status === "unauthenticated") {
      signIn("google");
    } else {
      // User is logged in! Instantly show pricing plans
      setSelectedConfig({ model, channel });
      setShowPricing(true);
    }
  };

  return (
    <>
      <LandingUI onDeploy={handleDeployProcess} />

      <AnimatePresence>
        {showPricing && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-[#111214] border border-white/10 p-8 rounded-2xl w-full max-w-4xl shadow-2xl relative"
            >
              <button 
                onClick={() => setShowPricing(false)}
                className="absolute top-4 right-4 text-gray-400 hover:text-white"
              >
                ✕
              </button>
              
              <div className="text-center mb-10">
                <h2 className="text-3xl font-bold mb-2">Select Your Deployment Plan</h2>
                <p className="text-gray-400">Deploying {selectedConfig.model} connected to {selectedConfig.channel}</p>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                {plans.map((plan) => {
                  const displayPrice = userCurrency === "INR" ? plan.price_inr : plan.price_usd;
                  
                  return (
                    <div key={plan.id} className={`relative p-6 rounded-xl border ${plan.isPopular ? 'border-green-500 bg-green-500/5' : 'border-white/10 bg-white/5'}`}>
                      {plan.isPopular && <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-green-500 text-black text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">Most Popular</span>}
                      
                      <h3 className="text-xl font-bold mb-2">{plan.name}</h3>
                      <div className="text-4xl font-extrabold mb-6">
                        {currencySymbol}{displayPrice} <span className="text-sm text-gray-400 font-normal">/ month</span>
                      </div>
                      
                      <ul className="space-y-3 mb-8 text-gray-300 text-sm">
                        {plan.features.map((feature, i) => (
                          <li key={i} className="flex items-center gap-2">
                            <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                            {feature}
                          </li>
                        ))}
                      </ul>

                      <button 
                        onClick={() => handlePayment(displayPrice)}
                        className={`w-full py-3 rounded-lg font-bold transition-all ${plan.isPopular ? 'bg-white text-black hover:bg-gray-200' : 'bg-[#2A2A2A] text-white hover:bg-[#3A3A3A]'}`}
                      >
                        Deploy Now
                      </button>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}  
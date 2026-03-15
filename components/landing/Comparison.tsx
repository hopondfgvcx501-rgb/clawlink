"use client";

export default function Comparison() {
  return (
    <section id="features" className="py-24 relative z-10 border-t border-white/5 bg-[#1C1D21]">
        <div className="max-w-6xl mx-auto px-6 relative">
          <div className="text-center mb-12">
            <h3 className="text-white text-2xl font-serif inline-block border-b-2 border-[#D95B30] pb-1 mb-2">Comparison</h3>
            <h2 className="text-4xl md:text-[3.5rem] text-white tracking-tight font-serif">Traditional Method vs clawlink</h2>
          </div>

          <div className="flex flex-col md:flex-row justify-between items-end gap-12 font-serif pb-8 relative pt-4">
            <div className="w-full md:w-[60%] border-t-4 border-white pt-6">
              <ul className="space-y-5 text-gray-300 text-lg md:text-xl">
                <li className="flex justify-between items-center pr-10">
                  <div className="flex items-center gap-3"><div className="w-1.5 h-1.5 bg-white rounded-full"></div>Purchasing local virtual machine</div>
                  <span>15 min</span>
                </li>
                {/* ... Baaki points (Same as your code) ... */}
                <li className="flex justify-between items-center pr-10"><div className="flex items-center gap-3"><div className="w-1.5 h-1.5 bg-white rounded-full"></div>Pairing with Telegram</div><span>4 min</span></li>
              </ul>
              
              <div className="border-t-[3px] border-white mt-6 pt-2 flex justify-between items-center pr-10">
                <span className="text-xl">total</span>
                <span className="text-xl">60 MINUTES</span>
              </div>
            </div>

            <div className="w-full md:w-[40%] flex flex-col items-center text-center pb-12">
              <h3 className="text-[4rem] font-serif text-white leading-none">clawlink</h3>
              <div className="text-[3.5rem] font-serif text-white mb-4 leading-none">&lt;30 sec</div>
              <p className="text-[12px] text-gray-300 leading-tight font-serif max-w-[320px]">
                Servers, SSH and OpenClaw Environment are already set up, waiting to get assigned.
              </p>
            </div>
          </div>
        </div>
      </section>
  );
}
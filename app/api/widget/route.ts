import { NextResponse } from "next/server";

// ⚡ Edge Runtime for instant JS delivery across the globe
export const runtime = "edge";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const email = searchParams.get("id"); // User passes their email as ID

    // If no email is provided, return a silent error in console
    if (!email) {
        return new NextResponse("console.error('[ClawLink Widget] Missing Account ID.');", {
            headers: { "Content-Type": "application/javascript" }
        });
    }

    // 🚀 THE MAGIC SCRIPT: This injects a beautiful React-like UI using Vanilla JS
    const jsCode = `
      (function() {
        const clawlinkEmail = "${email}";
        const sessionId = "sess_" + Math.random().toString(36).substr(2, 9);
        const baseUrl = "https://clawlink-six.vercel.app";

        // 1. Inject Modern Font
        const font = document.createElement('link');
        font.href = 'https://fonts.googleapis.com/css2?family=Inter:wght@400;600;800&display=swap';
        font.rel = 'stylesheet';
        document.head.appendChild(font);

        // 2. Inject Dark-Mode Enterprise CSS
        const style = document.createElement('style');
        style.innerHTML = \`
          #clawlink-widget-container {
            position: fixed; bottom: 20px; right: 20px; z-index: 2147483647; font-family: 'Inter', sans-serif;
          }
          #clawlink-chat-window {
            display: none; width: 380px; height: 550px; background: #0A0A0B; border: 1px solid rgba(255,255,255,0.1); 
            border-radius: 16px; box-shadow: 0 15px 50px rgba(0,0,0,0.6); flex-direction: column; overflow: hidden;
            margin-bottom: 15px; opacity: 0; transform: translateY(20px); transition: all 0.3s ease;
          }
          #clawlink-chat-window.open {
            display: flex; opacity: 1; transform: translateY(0);
          }
          #clawlink-chat-header {
            background: linear-gradient(135deg, #0052D4, #00BFFF); color: white; padding: 18px 20px; 
            font-weight: 800; display: flex; justify-content: space-between; align-items: center; letter-spacing: 0.5px;
          }
          #clawlink-chat-header .title { display: flex; align-items: center; gap: 8px; font-size: 15px; }
          #clawlink-chat-header .status { width: 8px; height: 8px; background: #22c55e; border-radius: 50%; box-shadow: 0 0 8px #22c55e; }
          #clawlink-chat-body {
            flex: 1; padding: 20px; overflow-y: auto; background: #111; display: flex; flex-direction: column; gap: 12px;
          }
          .claw-msg { max-width: 85%; padding: 12px 16px; border-radius: 12px; font-size: 14px; line-height: 1.5; word-wrap: break-word; }
          .claw-msg.user { align-self: flex-end; background: #00BFFF; color: white; border-bottom-right-radius: 2px; }
          .claw-msg.bot { align-self: flex-start; background: #1A1A1A; color: #eee; border: 1px solid rgba(255,255,255,0.05); border-bottom-left-radius: 2px; }
          .claw-typing { font-size: 12px; color: #888; font-style: italic; }
          #clawlink-input-area {
            display: flex; padding: 15px; background: #0A0A0B; border-top: 1px solid rgba(255,255,255,0.05);
          }
          #clawlink-input {
            flex: 1; background: #1A1A1A; border: 1px solid rgba(255,255,255,0.1); padding: 12px 15px; 
            border-radius: 10px; color: white; outline: none; font-size: 14px; transition: border 0.2s;
          }
          #clawlink-input:focus { border-color: #00BFFF; }
          #clawlink-input::placeholder { color: #666; }
          #clawlink-send-btn {
            background: #00BFFF; color: white; border: none; padding: 0 18px; margin-left: 10px; 
            border-radius: 10px; cursor: pointer; font-weight: 600; transition: background 0.2s; display: flex; align-items: center; justify-content: center;
          }
          #clawlink-send-btn:hover { background: #0052D4; }
          #clawlink-trigger {
            width: 65px; height: 65px; background: linear-gradient(135deg, #0052D4, #00BFFF); border-radius: 50%;
            cursor: pointer; box-shadow: 0 8px 25px rgba(0,191,255,0.4); display: flex; justify-content: center; align-items: center;
            transition: transform 0.2s, box-shadow 0.2s; float: right; position: relative;
          }
          #clawlink-trigger:hover { transform: scale(1.05); box-shadow: 0 10px 30px rgba(0,191,255,0.6); }
          #clawlink-trigger svg { width: 32px; height: 32px; fill: white; }
          /* Custom Scrollbar */
          #clawlink-chat-body::-webkit-scrollbar { width: 5px; }
          #clawlink-chat-body::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.15); border-radius: 5px; }
        \`;
        document.head.appendChild(style);

        // 3. Inject HTML Structure
        const container = document.createElement('div');
        container.id = 'clawlink-widget-container';
        container.innerHTML = \`
          <div id="clawlink-chat-window">
            <div id="clawlink-chat-header">
              <div class="title"><div class="status"></div> AI Support</div>
              <span id="clawlink-close" style="cursor:pointer; opacity:0.8; font-size:18px;">✕</span>
            </div>
            <div id="clawlink-chat-body">
              <div class="claw-msg bot">Hi there! 👋 How can I assist you today?</div>
            </div>
            <div id="clawlink-input-area">
              <input type="text" id="clawlink-input" placeholder="Type your message..." autocomplete="off" />
              <button id="clawlink-send-btn">
                <svg viewBox="0 0 24 24" width="18" height="18" fill="white"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>
              </button>
            </div>
          </div>
          <div id="clawlink-trigger">
            <svg viewBox="0 0 24 24"><path d="M12 2C6.477 2 2 6.477 2 12c0 1.7.44 3.29 1.2 4.67L2 22l5.48-1.12c1.33.68 2.87 1.08 4.52 1.08 5.523 0 10-4.477 10-10S17.523 2 12 2z"/></svg>
          </div>
        \`;
        document.body.appendChild(container);

        // 4. Interactive Logic
        const trigger = document.getElementById('clawlink-trigger');
        const windowEl = document.getElementById('clawlink-chat-window');
        const closeBtn = document.getElementById('clawlink-close');
        const input = document.getElementById('clawlink-input');
        const sendBtn = document.getElementById('clawlink-send-btn');
        const chatBody = document.getElementById('clawlink-chat-body');

        trigger.addEventListener('click', () => {
          if (windowEl.classList.contains('open')) {
            windowEl.classList.remove('open');
            setTimeout(() => windowEl.style.display = 'none', 300);
          } else {
            windowEl.style.display = 'flex';
            setTimeout(() => windowEl.classList.add('open'), 10);
            input.focus();
          }
        });

        closeBtn.addEventListener('click', () => {
          windowEl.classList.remove('open');
          setTimeout(() => windowEl.style.display = 'none', 300);
        });

        const appendMsg = (text, sender) => {
          const msg = document.createElement('div');
          msg.className = 'claw-msg ' + sender;
          msg.innerText = text;
          chatBody.appendChild(msg);
          chatBody.scrollTop = chatBody.scrollHeight;
        };

        const sendMessage = async () => {
          const text = input.value.trim();
          if (!text) return;
          
          appendMsg(text, 'user');
          input.value = '';
          
          const typingId = 'typing-' + Date.now();
          const typingMsg = document.createElement('div');
          typingMsg.className = 'claw-msg bot claw-typing';
          typingMsg.id = typingId;
          typingMsg.innerText = 'AI is typing...';
          chatBody.appendChild(typingMsg);
          chatBody.scrollTop = chatBody.scrollHeight;

          try {
            // 🚀 Call the Chat Endpoint we built earlier
            const res = await fetch(baseUrl + '/api/widget/chat', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ email: clawlinkEmail, message: text, sessionId: sessionId })
            });
            const data = await res.json();
            document.getElementById(typingId).remove();
            
            if (data.success) {
              appendMsg(data.reply, 'bot');
            } else {
              appendMsg('Sorry, I encountered a temporary network error.', 'bot');
            }
          } catch (e) {
            document.getElementById(typingId).remove();
            appendMsg('Network disconnected. Please try again.', 'bot');
          }
        };

        sendBtn.addEventListener('click', sendMessage);
        input.addEventListener('keypress', (e) => {
          if (e.key === 'Enter') sendMessage();
        });
      })();
    `;

    // 🔒 CORS is critical here: Allow this script to be loaded by any domain
    return new NextResponse(jsCode, {
        headers: {
            "Content-Type": "application/javascript",
            "Access-Control-Allow-Origin": "*",
            "Cache-Control": "public, max-age=3600" // Cache for 1 hour for speed
        }
    });
}
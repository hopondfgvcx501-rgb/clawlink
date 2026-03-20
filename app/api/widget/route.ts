import { NextResponse } from "next/server";

export const runtime = "edge";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const email = searchParams.get("id"); 

    if (!email) {
        return new NextResponse("console.error('[ClawLink Widget] Missing Account ID.');", {
            headers: { "Content-Type": "application/javascript" }
        });
    }

    // 🚀 INJECTS BEAUTIFUL UI WITH TEXT + VOICE SUPPORT
    const jsCode = `
      (function() {
        const clawlinkEmail = "${email}";
        const sessionId = "sess_" + Math.random().toString(36).substr(2, 9);
        const baseUrl = "https://clawlink-six.vercel.app";

        const font = document.createElement('link');
        font.href = 'https://fonts.googleapis.com/css2?family=Inter:wght@400;600;800&display=swap';
        font.rel = 'stylesheet';
        document.head.appendChild(font);

        const style = document.createElement('style');
        style.innerHTML = \`
          #clawlink-widget-container { position: fixed; bottom: 20px; right: 20px; z-index: 2147483647; font-family: 'Inter', sans-serif; }
          #clawlink-chat-window { display: none; width: 380px; height: 550px; background: #0A0A0B; border: 1px solid rgba(255,255,255,0.1); border-radius: 16px; box-shadow: 0 15px 50px rgba(0,0,0,0.6); flex-direction: column; overflow: hidden; margin-bottom: 15px; opacity: 0; transform: translateY(20px); transition: all 0.3s ease; }
          #clawlink-chat-window.open { display: flex; opacity: 1; transform: translateY(0); }
          #clawlink-chat-header { background: linear-gradient(135deg, #0052D4, #00BFFF); color: white; padding: 18px 20px; font-weight: 800; display: flex; justify-content: space-between; align-items: center; letter-spacing: 0.5px; }
          #clawlink-chat-header .title { display: flex; align-items: center; gap: 8px; font-size: 15px; }
          #clawlink-chat-header .status { width: 8px; height: 8px; background: #22c55e; border-radius: 50%; box-shadow: 0 0 8px #22c55e; }
          #clawlink-chat-body { flex: 1; padding: 20px; overflow-y: auto; background: #111; display: flex; flex-direction: column; gap: 12px; }
          .claw-msg { max-width: 85%; padding: 12px 16px; border-radius: 12px; font-size: 14px; line-height: 1.5; word-wrap: break-word; }
          .claw-msg.user { align-self: flex-end; background: #00BFFF; color: white; border-bottom-right-radius: 2px; }
          .claw-msg.bot { align-self: flex-start; background: #1A1A1A; color: #eee; border: 1px solid rgba(255,255,255,0.05); border-bottom-left-radius: 2px; }
          .claw-typing { font-size: 12px; color: #888; font-style: italic; }
          
          #clawlink-input-area { display: flex; padding: 15px; background: #0A0A0B; border-top: 1px solid rgba(255,255,255,0.05); align-items: center; gap: 8px; }
          #clawlink-input { flex: 1; background: #1A1A1A; border: 1px solid rgba(255,255,255,0.1); padding: 12px 15px; border-radius: 10px; color: white; outline: none; font-size: 14px; transition: border 0.2s; }
          #clawlink-input:focus { border-color: #00BFFF; }
          
          .claw-btn { width: 40px; height: 40px; border-radius: 10px; border: none; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.2s; flex-shrink: 0; }
          #clawlink-mic-btn { background: #1A1A1A; color: #00BFFF; border: 1px solid rgba(255,255,255,0.1); }
          #clawlink-mic-btn:hover { background: #222; }
          #clawlink-mic-btn.recording { background: #ef4444; color: white; animation: pulse-red 1.5s infinite; border-color: #ef4444; }
          
          #clawlink-send-btn { background: #00BFFF; color: white; }
          #clawlink-send-btn:hover { background: #0052D4; }
          
          #clawlink-trigger { width: 65px; height: 65px; background: linear-gradient(135deg, #0052D4, #00BFFF); border-radius: 50%; cursor: pointer; box-shadow: 0 8px 25px rgba(0,191,255,0.4); display: flex; justify-content: center; align-items: center; transition: transform 0.2s, box-shadow 0.2s; float: right; position: relative; }
          #clawlink-trigger:hover { transform: scale(1.05); box-shadow: 0 10px 30px rgba(0,191,255,0.6); }
          #clawlink-trigger svg { width: 32px; height: 32px; fill: white; }
          
          #clawlink-chat-body::-webkit-scrollbar { width: 5px; }
          #clawlink-chat-body::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.15); border-radius: 5px; }
          @keyframes pulse-red { 0% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.7); } 70% { box-shadow: 0 0 0 10px rgba(239, 68, 68, 0); } 100% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); } }
        \`;
        document.head.appendChild(style);

        const container = document.createElement('div');
        container.id = 'clawlink-widget-container';
        container.innerHTML = \`
          <div id="clawlink-chat-window">
            <div id="clawlink-chat-header">
              <div class="title"><div class="status"></div> AI Support</div>
              <span id="clawlink-close" style="cursor:pointer; opacity:0.8; font-size:18px;">✕</span>
            </div>
            <div id="clawlink-chat-body">
              <div class="claw-msg bot">Hi there! 👋 How can I assist you today? Type a message or send a voice note.</div>
            </div>
            <div id="clawlink-input-area">
              <button id="clawlink-mic-btn" class="claw-btn" title="Hold to Record Voice">
                <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/><path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/></svg>
              </button>
              <input type="text" id="clawlink-input" placeholder="Type a message..." autocomplete="off" />
              <button id="clawlink-send-btn" class="claw-btn">
                <svg viewBox="0 0 24 24" width="18" height="18" fill="white"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>
              </button>
            </div>
          </div>
          <div id="clawlink-trigger">
            <svg viewBox="0 0 24 24"><path d="M12 2C6.477 2 2 6.477 2 12c0 1.7.44 3.29 1.2 4.67L2 22l5.48-1.12c1.33.68 2.87 1.08 4.52 1.08 5.523 0 10-4.477 10-10S17.523 2 12 2z"/></svg>
          </div>
        \`;
        document.body.appendChild(container);

        const trigger = document.getElementById('clawlink-trigger');
        const windowEl = document.getElementById('clawlink-chat-window');
        const closeBtn = document.getElementById('clawlink-close');
        const input = document.getElementById('clawlink-input');
        const sendBtn = document.getElementById('clawlink-send-btn');
        const micBtn = document.getElementById('clawlink-mic-btn');
        const chatBody = document.getElementById('clawlink-chat-body');

        let mediaRecorder;
        let audioChunks = [];
        let isRecording = false;

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

        const executeChatCall = async (payload) => {
          const typingId = 'typing-' + Date.now();
          const typingMsg = document.createElement('div');
          typingMsg.className = 'claw-msg bot claw-typing';
          typingMsg.id = typingId;
          typingMsg.innerText = 'AI is thinking...';
          chatBody.appendChild(typingMsg);
          chatBody.scrollTop = chatBody.scrollHeight;

          try {
            const res = await fetch(baseUrl + '/api/widget/chat', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(payload)
            });
            const data = await res.json();
            document.getElementById(typingId).remove();
            if (data.success) { appendMsg(data.reply, 'bot'); } 
            else { appendMsg('Sorry, I encountered an error.', 'bot'); }
          } catch (e) {
            document.getElementById(typingId).remove();
            appendMsg('Network error. Please try again.', 'bot');
          }
        };

        const sendMessage = () => {
          const text = input.value.trim();
          if (!text) return;
          appendMsg(text, 'user');
          input.value = '';
          executeChatCall({ email: clawlinkEmail, message: text, sessionId: sessionId });
        };

        sendBtn.addEventListener('click', sendMessage);
        input.addEventListener('keypress', (e) => { if (e.key === 'Enter') sendMessage(); });

        // 🎤 VOICE RECORDING LOGIC
        micBtn.addEventListener('click', async () => {
          if (!isRecording) {
            try {
              const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
              mediaRecorder = new MediaRecorder(stream);
              audioChunks = [];
              
              mediaRecorder.ondataavailable = e => audioChunks.push(e.data);
              mediaRecorder.onstop = () => {
                const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
                const reader = new FileReader();
                reader.readAsDataURL(audioBlob);
                reader.onloadend = () => {
                  const base64AudioMessage = reader.result.split(',')[1];
                  appendMsg("🎤 Voice Note Sent", 'user');
                  executeChatCall({ email: clawlinkEmail, message: "", audio: base64AudioMessage, sessionId: sessionId });
                };
              };
              
              mediaRecorder.start();
              isRecording = true;
              micBtn.classList.add('recording');
            } catch (err) {
              alert("Microphone access denied.");
            }
          } else {
            mediaRecorder.stop();
            isRecording = false;
            micBtn.classList.remove('recording');
            // Stop mic tracks
            mediaRecorder.stream.getTracks().forEach(track => track.stop());
          }
        });

      })();
    `;

    return new NextResponse(jsCode, {
        headers: {
            "Content-Type": "application/javascript",
            "Access-Control-Allow-Origin": "*",
            "Cache-Control": "public, max-age=3600"
        }
    });
}
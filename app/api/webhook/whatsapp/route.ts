import { NextRequest, NextResponse } from "next/server";
import { supabase } from "../../../lib/supabase";
import { generateAIReply } from "../../../lib/ai-router"; // 🚀 Hamara Naya Dimaag

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    if (
      !body.entry ||
      !body.entry[0].changes ||
      !body.entry[0].changes[0].value.messages ||
      !body.entry[0].changes[0].value.messages[0]
    ) {
      return NextResponse.json({ ok: true }); 
    }

    const messageObj = body.entry[0].changes[0].value.messages[0];
    if (messageObj.type !== "text") {
      return NextResponse.json({ ok: true }); 
    }

    const userPhone = messageObj.from;
    const userText = messageObj.text.body;
    const phoneNumberId = body.entry[0].changes[0].value.metadata.phone_number_id;

    // 1. Fetch Config from Supabase
    const { data: config, error: configErr } = await supabase
      .from("user_configs")
      .select("*")
      .eq("whatsapp_phone_id", phoneNumberId)
      .single();

    if (configErr || !config) {
      console.error("❌ WhatsApp Config Not Found");
      return NextResponse.json({ ok: true });
    }

    // 2. FETCH MEMORY (Chat History) 🧠
    const { data: historyData } = await supabase
      .from("chat_history")
      .select("*")
      .eq("session_id", userPhone)
      .order("created_at", { ascending: true })
      .limit(20);

    const history = historyData || [];

    // 3. 🚀 MASTER AI ROUTER KO CALL KARNA
    const provider = config.ai_provider || "gemini";
    const modelName = config.ai_model || "gemini-1.5-flash";

    const aiReply = await generateAIReply(
      provider,
      modelName,
      config.system_prompt || "You are a helpful AI.",
      history,
      userText
    );

    // 4. Send Reply to WhatsApp
    const metaResponse = await fetch(`https://graph.facebook.com/v18.0/${phoneNumberId}/messages`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${config.whatsapp_token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to: userPhone,
        text: { body: aiReply },
      }),
    });
    
    const metaData = await metaResponse.json();
    
    // 5. Check Meta Response & Save Memory
    if (metaData.error) {
       console.error("❌ META REJECTED OUR REPLY:", JSON.stringify(metaData));
    } else {
       await supabase.from("chat_history").insert([
         { session_id: userPhone, role: "user", message: userText },
         { session_id: userPhone, role: "assistant", message: aiReply }
       ]);

       await supabase.from("usage_logs").insert({
         email: config.email,
         model_used: `${provider}-${modelName}`,
         estimated_tokens: Math.ceil((userText.length + aiReply.length) / 4)
       });
    }

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    console.error("🚨 CRITICAL ERROR IN WHATSAPP:", error.message);
    // 🚀 FIX: Hamesha {ok: true} return karein taaki Meta ka spam loop hamesha ke liye band ho jaye!
    return NextResponse.json({ ok: true });
  }
}
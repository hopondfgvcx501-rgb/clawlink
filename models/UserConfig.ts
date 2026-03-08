import mongoose, { Schema, model, models } from "mongoose";

const UserConfigSchema = new Schema(
  {
    email: { type: String, required: true, unique: true },
    
    // What the user selected on the landing page
    selectedModel: { type: String, required: true, default: "gpt-5.2" },
    selectedChannel: { type: String, required: true, default: "telegram" },
    
    // Channel Keys
    telegramToken: { type: String, default: "" },
    whatsappToken: { type: String, default: "" },
    whatsappPhoneId: { type: String, default: "" }, // WhatsApp requires a Phone ID too
    
    // AI Model Keys
    openAIKey: { type: String, default: "" },
    anthropicKey: { type: String, default: "" },
    geminiKey: { type: String, default: "" },
  },
  { timestamps: true }
);

const UserConfig = models.UserConfig || model("UserConfig", UserConfigSchema);

export default UserConfig;
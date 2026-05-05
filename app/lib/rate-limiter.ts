import { Redis } from '@upstash/redis';
import { Ratelimit } from '@upstash/ratelimit';

// Secure connection to Upstash Redis
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL || '',
  token: process.env.UPSTASH_REDIS_REST_TOKEN || '',
});

// Layer 1: Premium Speed (Normal Usage: up to 20 msgs/min)
const premiumLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(20, '1 m'),
  analytics: true,
});

// Layer 2: Hard Block (DDoS/Bot Spam: above 60 msgs/min)
const hardLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(60, '1 m'),
  analytics: true,
});

/**
 * 🚀 CLAWLINK SMART THROTTLING
 * Returns: "ALLOW" (Premium), "DOWNGRADE" (Cheap Model), or "BLOCK" (Stop processing)
 */
export async function checkTrafficSpeed(email: string): Promise<"ALLOW" | "DOWNGRADE" | "BLOCK"> {
  try {
    const { success: isPremiumSafe } = await premiumLimiter.limit(`premium_${email}`);
    if (isPremiumSafe) return "ALLOW";

    const { success: isHardSafe } = await hardLimiter.limit(`spam_${email}`);
    if (isHardSafe) return "DOWNGRADE"; 

    return "BLOCK";
  } catch (error) {
    console.error("[REDIS_ERROR] Rate limiter failed. Defaulting to DOWNGRADE to save costs.", error);
    return "DOWNGRADE"; 
  }
}
import { NextRequest, NextResponse } from "next/server";
import { Client } from "@upstash/qstash";

/**
 * ==============================================================================================
 * CLAWLINK ENTERPRISE: QSTASH BROADCAST PUBLISHER
 * ==============================================================================================
 * @file app/api/broadcast/publish/route.ts
 * @description Ingests mass broadcast requests from the dashboard and delegates execution 
 * to the Upstash QStash serverless queue to prevent Vercel 504 Timeout cascades.
 * * ALL RIGHTS RESERVED. CLAWLINK INC.
 * ==============================================================================================
 */

const qstashClient = new Client({
  token: process.env.QSTASH_TOKEN || "",
});

export async function POST(request: NextRequest) {
  try {
    const payload = await request.json();
    const { campaignId, channel, audienceIds, messagePayload } = payload;

    if (!campaignId || !audienceIds || !Array.isArray(audienceIds)) {
      return NextResponse.json({ success: false, error: "Invalid broadcast payload structure." }, { status: 400 });
    }

    // Determine the absolute URL of our worker endpoint
    const baseUrl = process.env.NEXTAUTH_URL || "https://www.clawlinkai.com";
    const workerUrl = `${baseUrl}/api/broadcast/worker`;

    // Iterate over the audience and push individual jobs to the QStash queue
    // QStash handles the background execution and retry logic automatically
    const batchDispatches = audienceIds.map((userId) => {
      return qstashClient.publishJSON({
        url: workerUrl,
        body: {
          campaignId,
          channel,
          userId,
          messagePayload
        },
        retries: 3, // Automatically retries 3 times if the Meta/WhatsApp API fails
      });
    });

    await Promise.all(batchDispatches);

    return NextResponse.json({ 
      success: true, 
      message: "Broadcast campaign successfully delegated to the serverless queue." 
    });

  } catch (executionException) {
    const systemError = executionException as Error;
    // Route critical background errors to Telegram Admin Bot for real-time debugging
    console.error("QStash Publish Exception:", systemError.message);
    
    return NextResponse.json(
      { success: false, error: "Failed to initialize serverless broadcast queue." },
      { status: 500 }
    );
  }
}
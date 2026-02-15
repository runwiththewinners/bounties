import { NextRequest, NextResponse } from "next/server";
import { whopsdk } from "@/lib/whop-sdk";

// POST /api/transfers - Send a payout to a user via Whop Transfers API
export async function POST(req: NextRequest) {
  const body = await req.json();

  const { submissionId, userId, amount, bountyTitle } = body;

  if (!userId || !amount || !submissionId) {
    return NextResponse.json(
      { error: "Missing required fields: userId, amount, submissionId" },
      { status: 400 }
    );
  }

  const companyId = process.env.NEXT_PUBLIC_WHOP_COMPANY_ID;

  if (!companyId) {
    return NextResponse.json(
      { error: "Company ID not configured" },
      { status: 500 }
    );
  }

  try {
    // Create a transfer from your company balance to the user's Whop balance
    const transfer = await whopsdk.transfers.create({
      amount: amount,
      currency: "usd",
      destination_id: userId, // user_xxxxx
      origin_id: companyId, // biz_xxxxx (your RWTW company)
      notes: `Bounty payout: ${bountyTitle || "Bounty reward"}`,
      idempotence_key: `bounty-${submissionId}`, // Prevents duplicate payouts
    });

    return NextResponse.json({
      success: true,
      transferId: transfer.id,
      amount: amount,
      destination: userId,
    });
  } catch (error: any) {
    console.error("Whop transfer failed:", error);
    return NextResponse.json(
      {
        error: "Transfer failed",
        details: error.message || "Unknown error",
      },
      { status: 500 }
    );
  }
}

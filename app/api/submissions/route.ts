import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

// GET /api/submissions
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId");
  const status = searchParams.get("status");

  let query = supabase.from("submissions").select("*").order("created_at", { ascending: false });

  if (userId) query = query.eq("user_id", userId);
  if (status) query = query.eq("status", status);

  const { data, error } = await query;

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const submissions = (data || []).map((s) => ({
    id: s.id,
    bountyId: s.bounty_id,
    userId: s.user_id,
    userName: s.user_name,
    userInitials: s.user_initials,
    userTier: s.user_tier,
    proofLink: s.proof_link,
    proofNotes: s.proof_notes,
    status: s.status,
    reward: Number(s.reward),
    createdAt: s.created_at,
    reviewedAt: s.reviewed_at,
    transferId: s.transfer_id,
  }));

  return NextResponse.json(submissions);
}

// POST /api/submissions
export async function POST(req: NextRequest) {
  const body = await req.json();

  const { data, error } = await supabase
    .from("submissions")
    .insert({
      bounty_id: body.bountyId,
      user_id: body.userId,
      user_name: body.userName,
      user_initials: body.userInitials,
      user_tier: body.userTier || null,
      proof_link: body.proofLink || null,
      proof_notes: body.proofNotes || null,
      status: "pending",
      reward: body.reward,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({
    id: data.id,
    bountyId: data.bounty_id,
    userId: data.user_id,
    userName: data.user_name,
    userInitials: data.user_initials,
    userTier: data.user_tier,
    proofLink: data.proof_link,
    proofNotes: data.proof_notes,
    status: data.status,
    reward: Number(data.reward),
    createdAt: data.created_at,
    reviewedAt: data.reviewed_at,
    transferId: data.transfer_id,
  }, { status: 201 });
}

// PATCH /api/submissions
export async function PATCH(req: NextRequest) {
  const body = await req.json();

  const dbUpdates: any = {};
  if (body.status !== undefined) dbUpdates.status = body.status;
  if (body.transferId !== undefined) dbUpdates.transfer_id = body.transferId;
  if (body.status === "approved" || body.status === "declined") {
    dbUpdates.reviewed_at = new Date().toISOString();
  }

  const { data, error } = await supabase
    .from("submissions")
    .update(dbUpdates)
    .eq("id", body.id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({
    id: data.id,
    bountyId: data.bounty_id,
    userId: data.user_id,
    userName: data.user_name,
    userInitials: data.user_initials,
    userTier: data.user_tier,
    proofLink: data.proof_link,
    proofNotes: data.proof_notes,
    status: data.status,
    reward: Number(data.reward),
    createdAt: data.created_at,
    reviewedAt: data.reviewed_at,
    transferId: data.transfer_id,
  });
}

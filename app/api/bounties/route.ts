import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

// GET /api/bounties
export async function GET() {
  const { data, error } = await supabase
    .from("bounties")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const bounties = (data || []).map((b) => ({
    id: b.id,
    title: b.title,
    description: b.description,
    reward: Number(b.reward),
    difficulty: b.difficulty,
    maxClaims: b.max_claims,
    claimed: b.claimed,
    expiry: b.expiry,
    status: b.status,
    requirements: b.requirements || [],
    requirementIcons: b.requirement_icons || [],
    hot: b.hot,
    createdAt: b.created_at,
  }));

  return NextResponse.json(bounties);
}

// POST /api/bounties
export async function POST(req: NextRequest) {
  const body = await req.json();

  const { data, error } = await supabase
    .from("bounties")
    .insert({
      title: body.title,
      description: body.description,
      reward: body.reward,
      difficulty: body.difficulty || "easy",
      max_claims: body.maxClaims || 0,
      claimed: 0,
      expiry: body.expiry || null,
      status: "active",
      requirements: body.requirements || [],
      requirement_icons: body.requirementIcons || [],
      hot: false,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({
    id: data.id,
    title: data.title,
    description: data.description,
    reward: Number(data.reward),
    difficulty: data.difficulty,
    maxClaims: data.max_claims,
    claimed: data.claimed,
    expiry: data.expiry,
    status: data.status,
    requirements: data.requirements || [],
    requirementIcons: data.requirement_icons || [],
    hot: data.hot,
    createdAt: data.created_at,
  }, { status: 201 });
}

// PATCH /api/bounties
export async function PATCH(req: NextRequest) {
  const body = await req.json();
  const { id, ...updates } = body;

  const dbUpdates: any = {};
  if (updates.title !== undefined) dbUpdates.title = updates.title;
  if (updates.description !== undefined) dbUpdates.description = updates.description;
  if (updates.reward !== undefined) dbUpdates.reward = updates.reward;
  if (updates.difficulty !== undefined) dbUpdates.difficulty = updates.difficulty;
  if (updates.maxClaims !== undefined) dbUpdates.max_claims = updates.maxClaims;
  if (updates.claimed !== undefined) dbUpdates.claimed = updates.claimed;
  if (updates.expiry !== undefined) dbUpdates.expiry = updates.expiry;
  if (updates.status !== undefined) dbUpdates.status = updates.status;
  if (updates.requirements !== undefined) dbUpdates.requirements = updates.requirements;
  if (updates.requirementIcons !== undefined) dbUpdates.requirement_icons = updates.requirementIcons;
  if (updates.hot !== undefined) dbUpdates.hot = updates.hot;

  const { data, error } = await supabase
    .from("bounties")
    .update(dbUpdates)
    .eq("id", id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({
    id: data.id,
    title: data.title,
    description: data.description,
    reward: Number(data.reward),
    difficulty: data.difficulty,
    maxClaims: data.max_claims,
    claimed: data.claimed,
    expiry: data.expiry,
    status: data.status,
    requirements: data.requirements || [],
    requirementIcons: data.requirement_icons || [],
    hot: data.hot,
    createdAt: data.created_at,
  });
}

// DELETE /api/bounties
export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");

  const { error } = await supabase.from("bounties").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}

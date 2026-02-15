import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

// GET /api/leaderboard
export async function GET() {
  const { data, error } = await supabase
    .from("leaderboard")
    .select("*")
    .order("earned", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const entries = (data || []).map((e) => ({
    id: e.id,
    name: e.name,
    initials: e.initials,
    earned: Number(e.earned),
  }));

  return NextResponse.json(entries);
}

// POST /api/leaderboard - Add new entry
export async function POST(req: NextRequest) {
  const body = await req.json();

  const { data, error } = await supabase
    .from("leaderboard")
    .insert({
      name: body.name,
      initials: body.initials,
      earned: body.earned || 0,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({
    id: data.id,
    name: data.name,
    initials: data.initials,
    earned: Number(data.earned),
  }, { status: 201 });
}

// PATCH /api/leaderboard - Update entry
export async function PATCH(req: NextRequest) {
  const body = await req.json();
  const { id, ...updates } = body;

  const dbUpdates: any = {};
  if (updates.name !== undefined) dbUpdates.name = updates.name;
  if (updates.initials !== undefined) dbUpdates.initials = updates.initials;
  if (updates.earned !== undefined) dbUpdates.earned = updates.earned;

  const { data, error } = await supabase
    .from("leaderboard")
    .update(dbUpdates)
    .eq("id", id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({
    id: data.id,
    name: data.name,
    initials: data.initials,
    earned: Number(data.earned),
  });
}

// DELETE /api/leaderboard
export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");

  const { error } = await supabase.from("leaderboard").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}

import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

// GET /api/stats
export async function GET() {
  const { data, error } = await supabase
    .from("stats")
    .select("*")
    .eq("id", 1)
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({
    totalPaid: Number(data.total_paid),
    completedCount: data.completed_count,
  });
}

// PATCH /api/stats
export async function PATCH(req: NextRequest) {
  const body = await req.json();

  const dbUpdates: any = {};
  if (body.totalPaid !== undefined) dbUpdates.total_paid = body.totalPaid;
  if (body.completedCount !== undefined) dbUpdates.completed_count = body.completedCount;

  const { data, error } = await supabase
    .from("stats")
    .update(dbUpdates)
    .eq("id", 1)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({
    totalPaid: Number(data.total_paid),
    completedCount: data.completed_count,
  });
}

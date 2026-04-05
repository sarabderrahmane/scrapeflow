import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: projectId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Non authentifie" }, { status: 401 });
  }

  const { data: members } = await supabase
    .from("project_members")
    .select(`
      *,
      profiles:user_id(id, email, full_name, avatar_url)
    `)
    .eq("project_id", projectId)
    .order("joined_at", { ascending: true });

  return NextResponse.json({ members: members ?? [] });
}

const inviteSchema = z.object({
  email: z.string().email(),
  role: z.enum(["editor", "viewer"]),
});

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: projectId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Non authentifie" }, { status: 401 });
  }

  // Check user is owner
  const { data: membership } = await supabase
    .from("project_members")
    .select("role")
    .eq("project_id", projectId)
    .eq("user_id", user.id)
    .single();

  if (!membership || membership.role !== "owner") {
    return NextResponse.json({ error: "Seul le owner peut inviter" }, { status: 403 });
  }

  const body = await request.json();
  const parsed = inviteSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Donnees invalides" }, { status: 400 });
  }

  // Find user by email
  const { data: profile } = await supabase
    .from("profiles")
    .select("id")
    .eq("email", parsed.data.email)
    .single();

  if (!profile) {
    return NextResponse.json(
      { error: "Utilisateur introuvable. Il doit d'abord creer un compte." },
      { status: 404 }
    );
  }

  // Check not already member
  const { data: existing } = await supabase
    .from("project_members")
    .select("id")
    .eq("project_id", projectId)
    .eq("user_id", profile.id)
    .single();

  if (existing) {
    return NextResponse.json(
      { error: "Cet utilisateur est deja membre du projet" },
      { status: 409 }
    );
  }

  const { error } = await supabase.from("project_members").insert({
    project_id: projectId,
    user_id: profile.id,
    role: parsed.data.role,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: projectId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Non authentifie" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const memberId = searchParams.get("memberId");

  if (!memberId) {
    return NextResponse.json({ error: "memberId requis" }, { status: 400 });
  }

  const { error } = await supabase
    .from("project_members")
    .delete()
    .eq("id", memberId)
    .eq("project_id", projectId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

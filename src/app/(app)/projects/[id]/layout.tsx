import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { cn } from "@/lib/utils";
import { BarChart3, Search, Table2, Users, Settings } from "lucide-react";

const tabs = [
  { href: "", label: "Dashboard", icon: BarChart3 },
  { href: "/search", label: "Recherche", icon: Search },
  { href: "/results", label: "Resultats", icon: Table2 },
  { href: "/members", label: "Membres", icon: Users },
  { href: "/settings", label: "Parametres", icon: Settings },
];

export default async function ProjectLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: project } = await supabase
    .from("projects")
    .select("*")
    .eq("id", id)
    .single();

  if (!project) {
    notFound();
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">{project.name}</h1>
        {project.description && (
          <p className="text-muted-foreground mt-1">{project.description}</p>
        )}
      </div>

      <div className="flex gap-1 border-b border-border mb-6 overflow-x-auto">
        {tabs.map((tab) => (
          <Link
            key={tab.href}
            href={`/projects/${id}${tab.href}`}
            className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-muted-foreground hover:text-foreground border-b-2 border-transparent hover:border-primary/50 transition-colors whitespace-nowrap"
          >
            <tab.icon className="h-4 w-4" />
            {tab.label}
          </Link>
        ))}
      </div>

      {children}
    </div>
  );
}

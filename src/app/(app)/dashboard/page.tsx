import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, FolderOpen, Users, Search } from "lucide-react";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: projects } = await supabase
    .from("projects")
    .select(`
      *,
      project_members(count),
      search_queries(count)
    `)
    .order("created_at", { ascending: false });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Mes Projets</h1>
          <p className="text-muted-foreground">
            Gerez vos projets de scraping
          </p>
        </div>
        <Link href="/projects/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Nouveau Projet
          </Button>
        </Link>
      </div>

      {!projects || projects.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FolderOpen className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">Aucun projet</h3>
            <p className="text-muted-foreground mb-4">
              Creez votre premier projet pour commencer le scraping
            </p>
            <Link href="/projects/new">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Creer un projet
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map((project) => (
            <Link key={project.id} href={`/projects/${project.id}`}>
              <Card className="hover:border-primary/50 transition-colors cursor-pointer h-full">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span className="truncate">{project.name}</span>
                    <Badge variant="secondary">
                      {project.owner_id === user?.id ? "Owner" : "Member"}
                    </Badge>
                  </CardTitle>
                  <CardDescription className="line-clamp-2">
                    {project.description || "Aucune description"}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Search className="h-3.5 w-3.5" />
                      <span>{project.search_queries?.[0]?.count ?? 0} recherches</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Users className="h-3.5 w-3.5" />
                      <span>{project.project_members?.[0]?.count ?? 0} membres</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

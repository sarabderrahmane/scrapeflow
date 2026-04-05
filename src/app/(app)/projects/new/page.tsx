"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function NewProjectPage() {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast.error("Non authentifie");
      setLoading(false);
      return;
    }

    const { data: project, error } = await supabase
      .from("projects")
      .insert({ name, description, owner_id: user.id })
      .select()
      .single();

    if (error) {
      toast.error(error.message);
      setLoading(false);
      return;
    }

    // Owner is auto-added via database trigger
    toast.success("Projet cree !");
    router.push(`/projects/${project.id}`);
  }

  return (
    <div className="max-w-xl mx-auto">
      <Link
        href="/dashboard"
        className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 text-sm"
      >
        <ArrowLeft className="h-4 w-4" />
        Retour au dashboard
      </Link>

      <Card>
        <CardHeader>
          <CardTitle>Nouveau Projet</CardTitle>
          <CardDescription>
            Creez un projet pour organiser vos recherches de scraping
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleCreate}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nom du projet</Label>
              <Input
                id="name"
                placeholder="Ex: Restaurants Paris"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description (optionnel)</Label>
              <Textarea
                id="description"
                placeholder="Decrivez l'objectif de ce projet..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
              />
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Creation..." : "Creer le projet"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}

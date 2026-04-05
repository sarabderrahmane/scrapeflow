"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";

export default function SettingsPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;
  const supabase = createClient();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState("");

  // Load project data
  if (!loaded) {
    supabase
      .from("projects")
      .select("*")
      .eq("id", projectId)
      .single()
      .then(({ data }) => {
        if (data) {
          setName(data.name);
          setDescription(data.description || "");
        }
        setLoaded(true);
      });
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    const { error } = await supabase
      .from("projects")
      .update({ name, description })
      .eq("id", projectId);

    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Projet mis a jour");
      router.refresh();
    }
    setSaving(false);
  }

  async function handleDelete() {
    if (confirmDelete !== name) {
      toast.error("Le nom ne correspond pas");
      return;
    }
    setDeleting(true);

    const { error } = await supabase
      .from("projects")
      .delete()
      .eq("id", projectId);

    if (error) {
      toast.error(error.message);
      setDeleting(false);
    } else {
      toast.success("Projet supprime");
      router.push("/dashboard");
    }
  }

  if (!loaded) {
    return <div className="text-muted-foreground">Chargement...</div>;
  }

  return (
    <div className="max-w-xl space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Parametres du projet</CardTitle>
        </CardHeader>
        <form onSubmit={handleSave}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Nom du projet</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
              />
            </div>
            <Button type="submit" disabled={saving}>
              {saving ? "Sauvegarde..." : "Sauvegarder"}
            </Button>
          </CardContent>
        </form>
      </Card>

      <Card className="border-destructive/50">
        <CardHeader>
          <CardTitle className="text-destructive">Zone de danger</CardTitle>
          <CardDescription>
            Cette action est irreversible. Toutes les donnees seront supprimees.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>
              Tapez <strong>{name}</strong> pour confirmer
            </Label>
            <Input
              value={confirmDelete}
              onChange={(e) => setConfirmDelete(e.target.value)}
              placeholder={name}
            />
          </div>
          <Button
            variant="destructive"
            disabled={confirmDelete !== name || deleting}
            onClick={handleDelete}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            {deleting ? "Suppression..." : "Supprimer le projet"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

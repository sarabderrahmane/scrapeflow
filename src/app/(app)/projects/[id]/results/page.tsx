"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Globe, MapPin, Clock, CheckCircle2, XCircle, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";

interface SearchQuery {
  id: string;
  query_text: string;
  search_type: "serp" | "maps";
  country: string;
  language: string;
  status: string;
  results_count: number;
  created_at: string;
}

export default function ResultsPage() {
  const params = useParams();
  const projectId = params.id as string;
  const [queries, setQueries] = useState<SearchQuery[]>([]);
  const [loading, setLoading] = useState(true);

  async function loadQueries() {
    const res = await fetch(`/api/projects/${projectId}/results`);
    const data = await res.json();
    setQueries(data.queries ?? []);
    setLoading(false);
  }

  useEffect(() => {
    loadQueries();
  }, [projectId]);

  async function handleDelete(queryId: string) {
    const res = await fetch(
      `/api/projects/${projectId}/results?deleteQuery=${queryId}`,
      { method: "DELETE" }
    );
    if (res.ok) {
      setQueries((prev) => prev.filter((q) => q.id !== queryId));
      toast.success("Recherche supprimee");
    } else {
      toast.error("Erreur lors de la suppression");
    }
  }

  if (loading) {
    return <div className="text-muted-foreground">Chargement...</div>;
  }

  if (queries.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Search className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">Aucune recherche</h3>
          <p className="text-muted-foreground mb-4">
            Lancez votre premiere recherche
          </p>
          <Link href={`/projects/${projectId}/search`}>
            <Button>Nouvelle recherche</Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Mot-cle</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Pays</TableHead>
              <TableHead>Resultats</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Date</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {queries.map((query) => (
              <TableRow key={query.id}>
                <TableCell className="font-medium">{query.query_text}</TableCell>
                <TableCell>
                  <Badge variant="outline" className="gap-1">
                    {query.search_type === "serp" ? (
                      <Globe className="h-3 w-3" />
                    ) : (
                      <MapPin className="h-3 w-3" />
                    )}
                    {query.search_type === "serp" ? "SERP" : "Maps"}
                  </Badge>
                </TableCell>
                <TableCell className="uppercase">{query.country}</TableCell>
                <TableCell>{query.results_count}</TableCell>
                <TableCell>
                  {query.status === "completed" ? (
                    <Badge className="bg-green-500/10 text-green-500 border-green-500/20">
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      OK
                    </Badge>
                  ) : query.status === "failed" ? (
                    <Badge variant="destructive">
                      <XCircle className="h-3 w-3 mr-1" />
                      Echec
                    </Badge>
                  ) : (
                    <Badge variant="secondary">
                      <Clock className="h-3 w-3 mr-1" />
                      {query.status}
                    </Badge>
                  )}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {new Date(query.created_at).toLocaleDateString("fr-FR")}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    {query.status === "completed" && query.results_count > 0 && (
                      <Link href={`/projects/${projectId}/results/${query.id}`}>
                        <Button variant="ghost" size="sm">
                          Voir
                        </Button>
                      </Link>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(query.id)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

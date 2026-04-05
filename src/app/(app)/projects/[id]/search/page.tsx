"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { countries } from "@/lib/constants/countries";
import { languages } from "@/lib/constants/languages";
import { Globe, MapPin, Loader2 } from "lucide-react";

export default function SearchPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;

  const [searchType, setSearchType] = useState<"serp" | "maps">("serp");
  const [keywordsText, setKeywordsText] = useState("");
  const [country, setCountry] = useState("fr");
  const [language, setLanguage] = useState("fr");
  const [loading, setLoading] = useState(false);

  const keywords = keywordsText
    .split("\n")
    .map((k) => k.trim())
    .filter(Boolean);

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();

    if (keywords.length === 0) {
      toast.error("Ajoutez au moins un mot-cle");
      return;
    }

    if (keywords.length > 10) {
      toast.error("Maximum 10 mots-cles par batch");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/scrape", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId,
          keywords,
          searchType,
          country,
          language,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Erreur lors du scraping");
        setLoading(false);
        return;
      }

      const completed = data.results.filter(
        (r: { status: string }) => r.status === "completed"
      ).length;
      const failed = data.results.filter(
        (r: { status: string }) => r.status === "failed"
      ).length;

      if (completed > 0) {
        toast.success(`${completed} recherche(s) terminee(s)`);
      }
      if (failed > 0) {
        toast.error(`${failed} recherche(s) echouee(s)`);
      }

      router.push(`/projects/${projectId}/results`);
    } catch {
      toast.error("Erreur reseau");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle>Nouvelle Recherche</CardTitle>
        </CardHeader>
        <form onSubmit={handleSearch}>
          <CardContent className="space-y-6">
            {/* Search Type */}
            <div className="space-y-2">
              <Label>Type de recherche</Label>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant={searchType === "serp" ? "default" : "outline"}
                  className="flex-1"
                  onClick={() => setSearchType("serp")}
                >
                  <Globe className="h-4 w-4 mr-2" />
                  Google SERP
                </Button>
                <Button
                  type="button"
                  variant={searchType === "maps" ? "default" : "outline"}
                  className="flex-1"
                  onClick={() => setSearchType("maps")}
                >
                  <MapPin className="h-4 w-4 mr-2" />
                  Google Maps
                </Button>
              </div>
            </div>

            {/* Keywords */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="keywords">Mots-cles (1 par ligne)</Label>
                <Badge variant="secondary">{keywords.length}/10</Badge>
              </div>
              <Textarea
                id="keywords"
                placeholder={
                  searchType === "serp"
                    ? "agence web paris\nfreelance developpeur\nmeilleur hebergeur"
                    : "restaurant italien paris\nplombier lyon\ncoiffeur marseille"
                }
                value={keywordsText}
                onChange={(e) => setKeywordsText(e.target.value)}
                rows={6}
                required
              />
            </div>

            {/* Country & Language */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Pays</Label>
                <Select value={country} onValueChange={(v) => v && setCountry(v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {countries.map((c) => (
                      <SelectItem key={c.code} value={c.code}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Langue</Label>
                <Select value={language} onValueChange={(v) => v && setLanguage(v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {languages.map((l) => (
                      <SelectItem key={l.code} value={l.code}>
                        {l.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={loading || keywords.length === 0}
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Scraping en cours...
                </>
              ) : (
                `Lancer ${keywords.length} recherche(s)`
              )}
            </Button>
          </CardContent>
        </form>
      </Card>
    </div>
  );
}

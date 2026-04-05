"use client";

import { useEffect, useState, useMemo } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
} from "@tanstack/react-table";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ArrowLeft,
  ArrowUpDown,
  Download,
  ExternalLink,
  Star,
  Globe,
  MapPin,
  Trash2,
} from "lucide-react";

function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
    </svg>
  );
}

interface SerpResult {
  id: string;
  position: number;
  title: string;
  link: string;
  snippet: string;
  domain: string;
  displayed_link: string;
}

interface MapsResult {
  id: string;
  position: number;
  title: string;
  address: string;
  phone: string | null;
  rating: number | null;
  reviews_count: number | null;
  website: string | null;
  category: string | null;
  place_id: string | null;
  instagram: string | null;
}

interface SearchQuery {
  id: string;
  query_text: string;
  search_type: "serp" | "maps";
  country: string;
  language: string;
  results_count: number;
  created_at: string;
}

const getSerpColumns = (onDelete: (id: string) => void): ColumnDef<SerpResult>[] => [
  {
    accessorKey: "position",
    header: ({ column }) => (
      <Button
        variant="ghost"
        size="sm"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        # <ArrowUpDown className="ml-1 h-3 w-3" />
      </Button>
    ),
    cell: ({ row }) => (
      <Badge variant="outline" className="font-mono">
        {row.getValue("position")}
      </Badge>
    ),
  },
  {
    accessorKey: "title",
    header: "Titre",
    cell: ({ row }) => (
      <div className="max-w-[300px]">
        <a
          href={row.original.link}
          target="_blank"
          rel="noopener noreferrer"
          className="font-medium text-blue-400 hover:underline flex items-center gap-1"
        >
          {row.getValue("title")}
          <ExternalLink className="h-3 w-3 shrink-0" />
        </a>
      </div>
    ),
  },
  {
    accessorKey: "domain",
    header: ({ column }) => (
      <Button
        variant="ghost"
        size="sm"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Domaine <ArrowUpDown className="ml-1 h-3 w-3" />
      </Button>
    ),
    cell: ({ row }) => (
      <Badge variant="secondary">{row.getValue("domain")}</Badge>
    ),
  },
  {
    accessorKey: "snippet",
    header: "Extrait",
    cell: ({ row }) => (
      <p className="text-sm text-muted-foreground max-w-[400px] line-clamp-2">
        {row.getValue("snippet")}
      </p>
    ),
  },
  {
    id: "actions",
    header: "",
    cell: ({ row }) => (
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onDelete(row.original.id)}
      >
        <Trash2 className="h-4 w-4 text-destructive" />
      </Button>
    ),
  },
];

const getMapsColumns = (onDelete: (id: string) => void): ColumnDef<MapsResult>[] => [
  {
    accessorKey: "position",
    header: "#",
    cell: ({ row }) => (
      <Badge variant="outline" className="font-mono">
        {row.getValue("position")}
      </Badge>
    ),
  },
  {
    accessorKey: "title",
    header: "Nom",
    cell: ({ row }) => (
      <span className="font-medium">{row.getValue("title")}</span>
    ),
  },
  {
    accessorKey: "address",
    header: "Adresse",
    cell: ({ row }) => (
      <span className="text-sm text-muted-foreground max-w-[200px] truncate block">
        {row.getValue("address")}
      </span>
    ),
  },
  {
    accessorKey: "phone",
    header: "Telephone",
    cell: ({ row }) => row.getValue("phone") || "-",
  },
  {
    accessorKey: "rating",
    header: ({ column }) => (
      <Button
        variant="ghost"
        size="sm"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Note <ArrowUpDown className="ml-1 h-3 w-3" />
      </Button>
    ),
    cell: ({ row }) => {
      const rating = row.getValue("rating") as number | null;
      if (!rating) return "-";
      return (
        <div className="flex items-center gap-1">
          <Star className="h-3.5 w-3.5 fill-yellow-500 text-yellow-500" />
          <span>{rating}</span>
        </div>
      );
    },
  },
  {
    accessorKey: "reviews_count",
    header: ({ column }) => (
      <Button
        variant="ghost"
        size="sm"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Avis <ArrowUpDown className="ml-1 h-3 w-3" />
      </Button>
    ),
    cell: ({ row }) => row.getValue("reviews_count") ?? "-",
  },
  {
    accessorKey: "website",
    header: "Site Web",
    cell: ({ row }) => {
      const website = row.getValue("website") as string | null;
      if (!website) {
        return (
          <Badge variant="destructive" className="text-xs">
            Pas de site
          </Badge>
        );
      }
      return (
        <a
          href={website}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-400 hover:underline flex items-center gap-1 text-sm"
        >
          <Globe className="h-3 w-3" />
          Voir
        </a>
      );
    },
    filterFn: (row, columnId, filterValue) => {
      if (filterValue === "no_website") {
        return !row.getValue(columnId);
      }
      if (filterValue === "has_website") {
        return !!row.getValue(columnId);
      }
      return true;
    },
  },
  {
    accessorKey: "instagram",
    header: "Instagram",
    cell: ({ row }) => {
      const ig = row.getValue("instagram") as string | null;
      if (!ig) return "-";
      return (
        <a
          href={ig}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-sm text-pink-400 hover:underline"
        >
          <InstagramIcon className="h-3.5 w-3.5" />
          Profil
        </a>
      );
    },
  },
  {
    accessorKey: "category",
    header: "Categorie",
    cell: ({ row }) => {
      const cat = row.getValue("category") as string | null;
      return cat ? <Badge variant="outline">{cat}</Badge> : "-";
    },
  },
  {
    id: "maps_link",
    header: "Maps",
    cell: ({ row }) => {
      const placeId = row.original.place_id;
      const title = row.original.title;
      const url = placeId
        ? `https://www.google.com/maps/place/?q=place_id:${placeId}`
        : `https://www.google.com/maps/search/${encodeURIComponent(title)}`;
      return (
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-sm text-blue-400 hover:underline"
        >
          <MapPin className="h-3 w-3" />
          Voir
        </a>
      );
    },
  },
  {
    id: "actions",
    header: "",
    cell: ({ row }) => (
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onDelete(row.original.id)}
      >
        <Trash2 className="h-4 w-4 text-destructive" />
      </Button>
    ),
  },
];

export default function QueryResultsPage() {
  const params = useParams();
  const projectId = params.id as string;
  const queryId = params.queryId as string;

  const [query, setQuery] = useState<SearchQuery | null>(null);
  const [results, setResults] = useState<(SerpResult | MapsResult)[]>([]);
  const [loading, setLoading] = useState(true);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [websiteFilter, setWebsiteFilter] = useState<string>("all");
  const [ratingFilter, setRatingFilter] = useState<string>("all");
  const [locationFilter, setLocationFilter] = useState<string>("all");

  async function handleDelete(resultId: string) {
    const type = query?.search_type;
    const res = await fetch(
      `/api/projects/${projectId}/results?resultId=${resultId}&type=${type}`,
      { method: "DELETE" }
    );
    if (res.ok) {
      setResults((prev) => prev.filter((r) => r.id !== resultId));
      toast.success("Resultat supprime");
    } else {
      toast.error("Erreur lors de la suppression");
    }
  }

  // Extract unique location parts from addresses (cities, neighborhoods)
  const locationOptions = useMemo(() => {
    if (query?.search_type !== "maps") return [];
    const counts: Record<string, number> = {};
    for (const r of results) {
      const mr = r as MapsResult;
      if (!mr.address) continue;
      // Split address by commas and clean each part
      const parts = mr.address.split(",").map((p) => p.trim()).filter(Boolean);
      for (const part of parts) {
        // Skip parts that are just numbers (zip codes, street numbers)
        if (/^\d+$/.test(part)) continue;
        counts[part] = (counts[part] ?? 0) + 1;
      }
    }
    // Sort by count descending, keep only locations with 2+ results
    return Object.entries(counts)
      .filter(([, count]) => count >= 1)
      .sort((a, b) => b[1] - a[1])
      .map(([name, count]) => ({ name, count }));
  }, [results, query?.search_type]);

  useEffect(() => {
    async function load() {
      const res = await fetch(
        `/api/projects/${projectId}/results?queryId=${queryId}`
      );
      const data = await res.json();
      setQuery(data.query);
      setResults(data.results ?? []);
      setLoading(false);
    }
    load();
  }, [projectId, queryId]);

  const filteredResults = useMemo(() => {
    let filtered = [...results];

    // Global text filter
    if (globalFilter) {
      const search = globalFilter.toLowerCase();
      filtered = filtered.filter((r) =>
        Object.values(r).some(
          (v) => v && String(v).toLowerCase().includes(search)
        )
      );
    }

    // Website filter for maps
    if (query?.search_type === "maps" && websiteFilter !== "all") {
      filtered = filtered.filter((r) => {
        const mr = r as MapsResult;
        if (websiteFilter === "no_website") return !mr.website;
        if (websiteFilter === "has_website") return !!mr.website;
        return true;
      });
    }

    // Rating filter for maps (x et plus)
    if (query?.search_type === "maps" && ratingFilter !== "all") {
      filtered = filtered.filter((r) => {
        const mr = r as MapsResult;
        if (ratingFilter === "no_rating") return !mr.rating;
        if (!mr.rating) return false;
        const min = parseFloat(ratingFilter);
        return mr.rating >= min;
      });
    }

    // Location filter for maps
    if (query?.search_type === "maps" && locationFilter !== "all") {
      filtered = filtered.filter((r) => {
        const mr = r as MapsResult;
        return mr.address?.toLowerCase().includes(locationFilter.toLowerCase());
      });
    }

    return filtered;
  }, [results, globalFilter, websiteFilter, ratingFilter, locationFilter, query?.search_type]);

  const table = useReactTable({
    data: filteredResults,
    columns: (query?.search_type === "serp" ? getSerpColumns(handleDelete) : getMapsColumns(handleDelete)) as ColumnDef<
      SerpResult | MapsResult
    >[],
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  if (loading) {
    return <div className="text-muted-foreground">Chargement...</div>;
  }

  if (!query) {
    return <div>Recherche introuvable</div>;
  }

  return (
    <div>
      <Link
        href={`/projects/${projectId}/results`}
        className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-4 text-sm"
      >
        <ArrowLeft className="h-4 w-4" />
        Retour aux resultats
      </Link>

      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            {query.search_type === "serp" ? (
              <Globe className="h-5 w-5" />
            ) : (
              <MapPin className="h-5 w-5" />
            )}
            &laquo;{query.query_text}&raquo;
          </h2>
          <p className="text-sm text-muted-foreground">
            {filteredResults.length} resultat(s) | {query.country.toUpperCase()} |{" "}
            {new Date(query.created_at).toLocaleDateString("fr-FR")}
          </p>
        </div>
        <a href={`/api/export/${queryId}`}>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Exporter CSV
          </Button>
        </a>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 mb-4">
        <div className="flex items-center gap-3">
          <Input
            placeholder="Rechercher dans les resultats..."
            value={globalFilter}
            onChange={(e) => setGlobalFilter(e.target.value)}
            className="max-w-sm"
          />
        </div>

        {query.search_type === "maps" && (
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Site web:</span>
              <Button
                variant={websiteFilter === "all" ? "default" : "outline"}
                size="sm"
                onClick={() => setWebsiteFilter("all")}
              >
                Tous
              </Button>
              <Button
                variant={websiteFilter === "no_website" ? "default" : "outline"}
                size="sm"
                onClick={() => setWebsiteFilter("no_website")}
              >
                Sans site
              </Button>
              <Button
                variant={websiteFilter === "has_website" ? "default" : "outline"}
                size="sm"
                onClick={() => setWebsiteFilter("has_website")}
              >
                Avec site
              </Button>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Note:</span>
              <Button
                variant={ratingFilter === "all" ? "default" : "outline"}
                size="sm"
                onClick={() => setRatingFilter("all")}
              >
                Toutes
              </Button>
              {["4.5", "4", "3.5", "3", "2"].map((val) => (
                <Button
                  key={val}
                  variant={ratingFilter === val ? "default" : "outline"}
                  size="sm"
                  onClick={() => setRatingFilter(val)}
                >
                  <Star className="h-3 w-3 fill-yellow-500 text-yellow-500 mr-1" />
                  {val}+
                </Button>
              ))}
              <Button
                variant={ratingFilter === "no_rating" ? "default" : "outline"}
                size="sm"
                onClick={() => setRatingFilter("no_rating")}
              >
                Sans note
              </Button>
            </div>

            {locationOptions.length > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Localite:</span>
                <Select
                  value={locationFilter}
                  onValueChange={(v) => v && setLocationFilter(v)}
                >
                  <SelectTrigger className="w-[220px] h-8 text-sm">
                    <SelectValue placeholder="Toutes les localites" />
                  </SelectTrigger>
                  <SelectContent className="max-h-[300px]">
                    <SelectItem value="all">Toutes les localites</SelectItem>
                    {locationOptions.map((loc) => (
                      <SelectItem key={loc.name} value={loc.name}>
                        {loc.name} ({loc.count})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={table.getAllColumns().length}
                  className="h-24 text-center"
                >
                  Aucun resultat
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

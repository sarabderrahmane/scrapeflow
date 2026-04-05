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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ArrowLeft,
  ArrowUpDown,
  Download,
  ExternalLink,
  Star,
  Globe,
  MapPin,
} from "lucide-react";

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

const serpColumns: ColumnDef<SerpResult>[] = [
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
];

const mapsColumns: ColumnDef<MapsResult>[] = [
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

    // Rating filter for maps
    if (query?.search_type === "maps" && ratingFilter !== "all") {
      filtered = filtered.filter((r) => {
        const mr = r as MapsResult;
        if (!mr.rating) return ratingFilter === "no_rating";
        if (ratingFilter === "no_rating") return !mr.rating;
        if (ratingFilter === "5") return mr.rating >= 4.5;
        if (ratingFilter === "4") return mr.rating >= 4.0 && mr.rating < 4.5;
        if (ratingFilter === "3") return mr.rating >= 3.0 && mr.rating < 4.0;
        if (ratingFilter === "low") return mr.rating < 3.0;
        return true;
      });
    }

    return filtered;
  }, [results, globalFilter, websiteFilter, ratingFilter, query?.search_type]);

  const table = useReactTable({
    data: filteredResults,
    columns: (query?.search_type === "serp" ? serpColumns : mapsColumns) as ColumnDef<
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
              <Button
                variant={ratingFilter === "5" ? "default" : "outline"}
                size="sm"
                onClick={() => setRatingFilter("5")}
              >
                <Star className="h-3 w-3 fill-yellow-500 text-yellow-500 mr-1" />
                4.5+
              </Button>
              <Button
                variant={ratingFilter === "4" ? "default" : "outline"}
                size="sm"
                onClick={() => setRatingFilter("4")}
              >
                <Star className="h-3 w-3 fill-yellow-500 text-yellow-500 mr-1" />
                4.0-4.5
              </Button>
              <Button
                variant={ratingFilter === "3" ? "default" : "outline"}
                size="sm"
                onClick={() => setRatingFilter("3")}
              >
                <Star className="h-3 w-3 fill-yellow-500 text-yellow-500 mr-1" />
                3.0-4.0
              </Button>
              <Button
                variant={ratingFilter === "low" ? "default" : "outline"}
                size="sm"
                onClick={() => setRatingFilter("low")}
              >
                &lt;3.0
              </Button>
              <Button
                variant={ratingFilter === "no_rating" ? "default" : "outline"}
                size="sm"
                onClick={() => setRatingFilter("no_rating")}
              >
                Sans note
              </Button>
            </div>
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

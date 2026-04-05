"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Search,
  Globe,
  MapPin,
  Star,
  BarChart3,
  Globe2,
  AlertTriangle,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

interface Stats {
  totalSearches: number;
  serpSearches: number;
  mapsSearches: number;
  serp: {
    totalResults: number;
    avgPosition: number;
    topDomains: { domain: string; count: number }[];
  };
  maps: {
    totalResults: number;
    avgRating: number;
    noWebsiteCount: number;
    noWebsitePercent: number;
    topCategories: { category: string; count: number }[];
  };
}

const COLORS = [
  "#8884d8",
  "#82ca9d",
  "#ffc658",
  "#ff7c43",
  "#a4de6c",
  "#d0ed57",
  "#83a6ed",
  "#8dd1e1",
  "#a4506c",
  "#6b486b",
];

export default function ProjectDashboard() {
  const params = useParams();
  const projectId = params.id as string;
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const res = await fetch(`/api/projects/${projectId}/stats`);
      const data = await res.json();
      setStats(data);
      setLoading(false);
    }
    load();
  }, [projectId]);

  if (loading) {
    return <div className="text-muted-foreground">Chargement des statistiques...</div>;
  }

  if (!stats) return null;

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Recherches</CardTitle>
            <Search className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalSearches}</div>
            <p className="text-xs text-muted-foreground">
              {stats.serpSearches} SERP / {stats.mapsSearches} Maps
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Resultats SERP</CardTitle>
            <Globe className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.serp.totalResults}</div>
            <p className="text-xs text-muted-foreground">
              Position moy: {stats.serp.avgPosition || "-"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Resultats Maps</CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.maps.totalResults}</div>
            <p className="text-xs text-muted-foreground">
              Note moy: {stats.maps.avgRating || "-"} <Star className="h-3 w-3 inline fill-yellow-500 text-yellow-500" />
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Sans site web</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.maps.noWebsitePercent}%</div>
            <p className="text-xs text-muted-foreground">
              {stats.maps.noWebsiteCount} business sans site
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Domains */}
        {stats.serp.topDomains.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Globe2 className="h-4 w-4" />
                Top Domaines (SERP)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={stats.serp.topDomains} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                  <XAxis type="number" stroke="#888" />
                  <YAxis
                    dataKey="domain"
                    type="category"
                    width={150}
                    stroke="#888"
                    fontSize={12}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#1a1a1a",
                      border: "1px solid #333",
                    }}
                  />
                  <Bar dataKey="count" fill="#8884d8" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {/* Top Categories */}
        {stats.maps.topCategories.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                Top Categories (Maps)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={stats.maps.topCategories}
                    dataKey="count"
                    nameKey="category"
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    label={({ name, percent }: // eslint-disable-next-line @typescript-eslint/no-explicit-any
                      any) =>
                      `${name ?? ""} (${((percent ?? 0) * 100).toFixed(0)}%)`
                    }
                    labelLine={false}
                    fontSize={11}
                  >
                    {stats.maps.topCategories.map((_, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#1a1a1a",
                      border: "1px solid #333",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}
      </div>

      {stats.totalSearches === 0 && (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <BarChart3 className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">Pas encore de donnees</h3>
            <p className="text-muted-foreground">
              Lancez des recherches pour voir les statistiques ici
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

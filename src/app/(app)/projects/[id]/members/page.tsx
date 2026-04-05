"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { toast } from "sonner";
import { Plus, Trash2, UserPlus } from "lucide-react";

interface Member {
  id: string;
  role: string;
  joined_at: string;
  profiles: {
    id: string;
    email: string;
    full_name: string;
    avatar_url: string;
  };
}

export default function MembersPage() {
  const params = useParams();
  const projectId = params.id as string;

  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<"editor" | "viewer">("editor");
  const [inviting, setInviting] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);

  async function loadMembers() {
    const res = await fetch(`/api/projects/${projectId}/members`);
    const data = await res.json();
    setMembers(data.members ?? []);
    setLoading(false);
  }

  useEffect(() => {
    loadMembers();
  }, [projectId]);

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    setInviting(true);

    const res = await fetch(`/api/projects/${projectId}/members`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: inviteEmail, role: inviteRole }),
    });

    const data = await res.json();

    if (!res.ok) {
      toast.error(data.error);
      setInviting(false);
      return;
    }

    toast.success("Membre invite !");
    setInviteEmail("");
    setDialogOpen(false);
    setInviting(false);
    loadMembers();
  }

  async function handleRemove(memberId: string) {
    const res = await fetch(
      `/api/projects/${projectId}/members?memberId=${memberId}`,
      { method: "DELETE" }
    );

    if (res.ok) {
      toast.success("Membre retire");
      loadMembers();
    } else {
      const data = await res.json();
      toast.error(data.error);
    }
  }

  if (loading) {
    return <div className="text-muted-foreground">Chargement...</div>;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">Membres du projet</h2>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger
            render={
              <Button>
                <UserPlus className="h-4 w-4 mr-2" />
                Inviter
              </Button>
            }
          />
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Inviter un membre</DialogTitle>
              <DialogDescription>
                L&apos;utilisateur doit avoir un compte ScrapeFlow
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleInvite} className="space-y-4">
              <div className="space-y-2">
                <Label>Email</Label>
                <Input
                  type="email"
                  placeholder="email@exemple.com"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Role</Label>
                <Select
                  value={inviteRole}
                  onValueChange={(v) => setInviteRole(v as "editor" | "viewer")}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="editor">Editor (peut scraper)</SelectItem>
                    <SelectItem value="viewer">Viewer (lecture seule)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <DialogFooter>
                <Button type="submit" disabled={inviting}>
                  {inviting ? "Invitation..." : "Inviter"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Membre</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Rejoint le</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {members.map((member) => (
              <TableRow key={member.id}>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback>
                        {(member.profiles.full_name || member.profiles.email)
                          .charAt(0)
                          .toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span className="font-medium">
                      {member.profiles.full_name || "Sans nom"}
                    </span>
                  </div>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {member.profiles.email}
                </TableCell>
                <TableCell>
                  <Badge
                    variant={
                      member.role === "owner"
                        ? "default"
                        : member.role === "editor"
                        ? "secondary"
                        : "outline"
                    }
                  >
                    {member.role}
                  </Badge>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {new Date(member.joined_at).toLocaleDateString("fr-FR")}
                </TableCell>
                <TableCell>
                  {member.role !== "owner" && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemove(member.id)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

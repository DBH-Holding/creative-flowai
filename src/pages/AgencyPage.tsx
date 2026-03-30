import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useAgency } from "@/hooks/useAgency";
import { useAgencyMembers } from "@/hooks/useAgencyMembers";
import { supabase } from "@/integrations/supabase/client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Navigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Building2, UserPlus, Crown, Shield, Users, User, Mail, Trash2, Settings } from "lucide-react";
import type { AgencyRole } from "@/hooks/useAgency";

const roleLabels: Record<AgencyRole, string> = {
  owner: "Dono",
  manager: "Gerente",
  member: "Membro",
  client: "Cliente",
};

const roleIcons: Record<AgencyRole, typeof Crown> = {
  owner: Crown,
  manager: Shield,
  member: Users,
  client: User,
};

const roleBadgeVariant: Record<AgencyRole, "default" | "secondary" | "outline" | "destructive"> = {
  owner: "default",
  manager: "default",
  member: "secondary",
  client: "outline",
};

export default function AgencyPage() {
  const { user, loading: authLoading } = useAuth();
  const { currentAgency, currentRole, isAgencyAdmin, hasAgency, isLoading: agencyLoading, refetch } = useAgency();
  const { members, invites, isLoading: membersLoading, inviteMember, updateMemberRole, removeMember, cancelInvite } = useAgencyMembers(currentAgency?.id);
  const queryClient = useQueryClient();

  const [createOpen, setCreateOpen] = useState(false);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [agencyName, setAgencyName] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<AgencyRole>("client");

  const createAgency = useMutation({
    mutationFn: async () => {
      const slug = agencyName
        .toLowerCase()
        .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");

      const { data, error } = await supabase
        .from("agencies")
        .insert({ name: agencyName, slug, owner_id: user!.id })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success("Agência criada com sucesso!");
      setCreateOpen(false);
      setAgencyName("");
      refetch();
    },
    onError: (err: any) => {
      if (err?.code === "23505") {
        toast.error("Já existe uma agência com este nome.");
      } else {
        toast.error("Erro ao criar agência.");
      }
    },
  });

  const handleInvite = () => {
    if (!inviteEmail.trim()) return;
    inviteMember.mutate(
      { email: inviteEmail.trim(), role: inviteRole },
      { onSuccess: () => { setInviteOpen(false); setInviteEmail(""); setInviteRole("client"); } }
    );
  };

  if (authLoading || agencyLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center pt-24">
        <div className="animate-pulse text-muted-foreground">Carregando...</div>
      </div>
    );
  }

  if (!user) return <Navigate to="/auth" replace />;

  // Sem agência - mostrar tela de criação
  if (!hasAgency) {
    return (
      <div className="min-h-screen bg-background pt-24 px-4">
        <div className="container mx-auto max-w-lg">
          <Card className="border-border bg-card">
            <CardHeader className="text-center">
              <Building2 className="h-12 w-12 mx-auto text-primary mb-4" />
              <CardTitle className="text-2xl text-foreground">Crie sua agência</CardTitle>
              <CardDescription>
                Configure sua agência para gerenciar clientes, equipe e briefings em um só lugar.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="agency-name">Nome da agência</Label>
                <Input
                  id="agency-name"
                  placeholder="Minha Agência"
                  value={agencyName}
                  onChange={(e) => setAgencyName(e.target.value)}
                />
              </div>
              <Button
                className="w-full"
                onClick={() => createAgency.mutate()}
                disabled={!agencyName.trim() || createAgency.isPending}
              >
                {createAgency.isPending ? "Criando..." : "Criar agência"}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pt-24 px-4 pb-12">
      <div className="container mx-auto max-w-5xl space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
              <Building2 className="h-8 w-8 text-primary" />
              {currentAgency?.name}
            </h1>
            <p className="text-muted-foreground mt-1">
              Seu papel: <Badge variant={roleBadgeVariant[currentRole!]}>{roleLabels[currentRole!]}</Badge>
            </p>
          </div>
          {isAgencyAdmin && (
            <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <UserPlus className="h-4 w-4" />
                  Convidar
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Convidar para a agência</DialogTitle>
                  <DialogDescription>
                    O convidado receberá um link para aceitar o convite.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>Email</Label>
                    <Input
                      placeholder="email@exemplo.com"
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Papel</Label>
                    <Select value={inviteRole} onValueChange={(v) => setInviteRole(v as AgencyRole)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="manager">Gerente</SelectItem>
                        <SelectItem value="member">Membro da equipe</SelectItem>
                        <SelectItem value="client">Cliente</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter>
                  <Button onClick={handleInvite} disabled={inviteMember.isPending}>
                    {inviteMember.isPending ? "Enviando..." : "Enviar convite"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="border-border bg-card">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <Users className="h-8 w-8 text-primary" />
                <div>
                  <p className="text-2xl font-bold text-foreground">{members.length}</p>
                  <p className="text-sm text-muted-foreground">Membros</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-border bg-card">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <User className="h-8 w-8 text-primary" />
                <div>
                  <p className="text-2xl font-bold text-foreground">
                    {members.filter((m: any) => m.role === "client").length}
                  </p>
                  <p className="text-sm text-muted-foreground">Clientes</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-border bg-card">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <Mail className="h-8 w-8 text-primary" />
                <div>
                  <p className="text-2xl font-bold text-foreground">{invites.length}</p>
                  <p className="text-sm text-muted-foreground">Convites pendentes</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Members Table */}
        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle className="text-foreground">Equipe & Clientes</CardTitle>
            <CardDescription>Gerencie os membros da sua agência</CardDescription>
          </CardHeader>
          <CardContent>
            {membersLoading ? (
              <div className="text-center text-muted-foreground py-8">Carregando...</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Papel</TableHead>
                    <TableHead>Desde</TableHead>
                    {isAgencyAdmin && <TableHead className="text-right">Ações</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {members.map((member: any) => {
                    const RoleIcon = roleIcons[member.role as AgencyRole] || User;
                    return (
                      <TableRow key={member.id}>
                        <TableCell className="font-medium text-foreground">
                          <div className="flex items-center gap-2">
                            <RoleIcon className="h-4 w-4 text-muted-foreground" />
                            {member.profiles?.display_name || "Sem nome"}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={roleBadgeVariant[member.role as AgencyRole]}>
                            {roleLabels[member.role as AgencyRole]}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {new Date(member.created_at).toLocaleDateString("pt-BR")}
                        </TableCell>
                        {isAgencyAdmin && (
                          <TableCell className="text-right">
                            {member.role !== "owner" && (
                              <div className="flex items-center justify-end gap-2">
                                <Select
                                  value={member.role}
                                  onValueChange={(v) =>
                                    updateMemberRole.mutate({ memberId: member.id, role: v as AgencyRole })
                                  }
                                >
                                  <SelectTrigger className="w-[120px] h-8">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="manager">Gerente</SelectItem>
                                    <SelectItem value="member">Membro</SelectItem>
                                    <SelectItem value="client">Cliente</SelectItem>
                                  </SelectContent>
                                </Select>
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="h-8 w-8 text-destructive hover:text-destructive"
                                  onClick={() => removeMember.mutate(member.id)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            )}
                          </TableCell>
                        )}
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Pending Invites */}
        {isAgencyAdmin && invites.length > 0 && (
          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle className="text-foreground">Convites Pendentes</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Email</TableHead>
                    <TableHead>Papel</TableHead>
                    <TableHead>Expira em</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invites.map((invite: any) => (
                    <TableRow key={invite.id}>
                      <TableCell className="font-medium text-foreground">{invite.email}</TableCell>
                      <TableCell>
                        <Badge variant={roleBadgeVariant[invite.role as AgencyRole]}>
                          {roleLabels[invite.role as AgencyRole]}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {new Date(invite.expires_at).toLocaleDateString("pt-BR")}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-destructive"
                          onClick={() => cancelInvite.mutate(invite.id)}
                        >
                          Cancelar
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

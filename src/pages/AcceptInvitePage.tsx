import { useEffect, useState } from "react";
import { useSearchParams, Navigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Building2, CheckCircle, XCircle, Loader2 } from "lucide-react";

export default function AcceptInvitePage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const { user, loading: authLoading } = useAuth();
  const [state, setState] = useState<"loading" | "login_required" | "accepting" | "success" | "error">("loading");
  const [invite, setInvite] = useState<any>(null);
  const [errorMsg, setErrorMsg] = useState("");

  // Fetch invite details
  useEffect(() => {
    if (!token) {
      setState("error");
      setErrorMsg("Token de convite inválido.");
      return;
    }

    const fetchInvite = async () => {
      const { data, error } = await supabase
        .from("agency_invites")
        .select("*, agencies(name)")
        .eq("token", token)
        .is("accepted_at", null)
        .gt("expires_at", new Date().toISOString())
        .maybeSingle();

      if (error || !data) {
        setState("error");
        setErrorMsg("Convite inválido ou expirado.");
        return;
      }

      setInvite(data);

      if (!user) {
        setState("login_required");
      } else {
        setState("accepting");
      }
    };

    fetchInvite();
  }, [token, user]);

  // Accept invite when user is logged in
  useEffect(() => {
    if (state !== "accepting" || !user || !invite) return;

    const accept = async () => {
      try {
        // Add user as member
        const { error: memberError } = await supabase
          .from("agency_members")
          .insert({
            agency_id: invite.agency_id,
            user_id: user.id,
            role: invite.role,
          });

        if (memberError) {
          if (memberError.code === "23505") {
            // Already a member
            setState("success");
            return;
          }
          throw memberError;
        }

        // Mark invite as accepted
        await supabase
          .from("agency_invites")
          .update({ accepted_at: new Date().toISOString() })
          .eq("id", invite.id);

        setState("success");
      } catch (err: any) {
        setState("error");
        setErrorMsg(err.message || "Erro ao aceitar convite.");
      }
    };

    accept();
  }, [state, user, invite]);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <Card className="w-full max-w-md border-border bg-card">
        <CardHeader className="text-center">
          <Building2 className="h-12 w-12 mx-auto text-primary mb-4" />
          <CardTitle className="text-xl text-foreground">
            {state === "success"
              ? "Bem-vindo à agência!"
              : state === "error"
              ? "Erro no convite"
              : "Convite de agência"}
          </CardTitle>
          {invite && (
            <CardDescription>
              Agência: <strong>{invite.agencies?.name}</strong>
            </CardDescription>
          )}
        </CardHeader>
        <CardContent className="text-center space-y-4">
          {state === "loading" && (
            <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
          )}

          {state === "login_required" && (
            <>
              <p className="text-muted-foreground">
                Você precisa estar logado para aceitar este convite.
              </p>
              <Button asChild className="w-full">
                <Link to={`/auth?redirect=/convite?token=${token}`}>
                  Entrar ou criar conta
                </Link>
              </Button>
            </>
          )}

          {state === "accepting" && (
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-muted-foreground">Aceitando convite...</p>
            </div>
          )}

          {state === "success" && (
            <>
              <CheckCircle className="h-16 w-16 text-primary mx-auto" />
              <p className="text-foreground">Você agora faz parte da agência!</p>
              <Button asChild className="w-full">
                <Link to="/agencia">Ir para a agência</Link>
              </Button>
            </>
          )}

          {state === "error" && (
            <>
              <XCircle className="h-16 w-16 text-destructive mx-auto" />
              <p className="text-muted-foreground">{errorMsg}</p>
              <Button asChild variant="outline" className="w-full">
                <Link to="/">Voltar ao início</Link>
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

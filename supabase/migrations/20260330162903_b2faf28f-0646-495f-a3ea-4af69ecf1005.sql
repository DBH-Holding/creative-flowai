
-- Enum para roles dentro da agência
CREATE TYPE public.agency_role AS ENUM ('owner', 'manager', 'member', 'client');

-- Tabela de agências
CREATE TABLE public.agencies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  logo_url text,
  owner_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Tabela de membros da agência (relaciona usuários com agências)
CREATE TABLE public.agency_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id uuid NOT NULL REFERENCES public.agencies(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  role public.agency_role NOT NULL DEFAULT 'client',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(agency_id, user_id)
);

-- Tabela de convites pendentes
CREATE TABLE public.agency_invites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id uuid NOT NULL REFERENCES public.agencies(id) ON DELETE CASCADE,
  email text NOT NULL,
  role public.agency_role NOT NULL DEFAULT 'client',
  invited_by uuid NOT NULL,
  token text NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(32), 'hex'),
  accepted_at timestamptz,
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '7 days'),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(agency_id, email)
);

-- Adicionar agency_id aos briefings existentes (nullable para manter compatibilidade)
ALTER TABLE public.briefings ADD COLUMN agency_id uuid REFERENCES public.agencies(id) ON DELETE SET NULL;
ALTER TABLE public.briefings ADD COLUMN client_user_id uuid;

-- Adicionar agency_id às campaigns existentes
ALTER TABLE public.campaigns ADD COLUMN agency_id uuid REFERENCES public.agencies(id) ON DELETE SET NULL;

-- Índices
CREATE INDEX idx_agency_members_agency ON public.agency_members(agency_id);
CREATE INDEX idx_agency_members_user ON public.agency_members(user_id);
CREATE INDEX idx_agency_invites_email ON public.agency_invites(email);
CREATE INDEX idx_agency_invites_token ON public.agency_invites(token);
CREATE INDEX idx_briefings_agency ON public.briefings(agency_id);
CREATE INDEX idx_campaigns_agency ON public.campaigns(agency_id);

-- RLS
ALTER TABLE public.agencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agency_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agency_invites ENABLE ROW LEVEL SECURITY;

-- Função helper para verificar se usuário pertence a uma agência
CREATE OR REPLACE FUNCTION public.is_agency_member(_user_id uuid, _agency_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.agency_members
    WHERE user_id = _user_id AND agency_id = _agency_id
  )
$$;

-- Função helper para obter role do usuário na agência
CREATE OR REPLACE FUNCTION public.get_agency_role(_user_id uuid, _agency_id uuid)
RETURNS public.agency_role
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT role FROM public.agency_members
  WHERE user_id = _user_id AND agency_id = _agency_id
  LIMIT 1
$$;

-- Função helper para verificar se é owner ou manager
CREATE OR REPLACE FUNCTION public.is_agency_admin(_user_id uuid, _agency_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.agency_members
    WHERE user_id = _user_id AND agency_id = _agency_id
    AND role IN ('owner', 'manager')
  )
$$;

-- Policies para agencies
CREATE POLICY "Members can view their agency"
  ON public.agencies FOR SELECT TO authenticated
  USING (public.is_agency_member(auth.uid(), id));

CREATE POLICY "Owner can update agency"
  ON public.agencies FOR UPDATE TO authenticated
  USING (owner_id = auth.uid());

CREATE POLICY "Authenticated users can create agencies"
  ON public.agencies FOR INSERT TO authenticated
  WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Owner can delete agency"
  ON public.agencies FOR DELETE TO authenticated
  USING (owner_id = auth.uid());

-- Policies para agency_members
CREATE POLICY "Members can view other members of their agency"
  ON public.agency_members FOR SELECT TO authenticated
  USING (public.is_agency_member(auth.uid(), agency_id));

CREATE POLICY "Admins can add members"
  ON public.agency_members FOR INSERT TO authenticated
  WITH CHECK (public.is_agency_admin(auth.uid(), agency_id));

CREATE POLICY "Admins can update members"
  ON public.agency_members FOR UPDATE TO authenticated
  USING (public.is_agency_admin(auth.uid(), agency_id));

CREATE POLICY "Admins can remove members"
  ON public.agency_members FOR DELETE TO authenticated
  USING (public.is_agency_admin(auth.uid(), agency_id));

-- Policies para agency_invites
CREATE POLICY "Admins can view invites"
  ON public.agency_invites FOR SELECT TO authenticated
  USING (public.is_agency_admin(auth.uid(), agency_id));

CREATE POLICY "Admins can create invites"
  ON public.agency_invites FOR INSERT TO authenticated
  WITH CHECK (public.is_agency_admin(auth.uid(), agency_id));

CREATE POLICY "Admins can delete invites"
  ON public.agency_invites FOR DELETE TO authenticated
  USING (public.is_agency_admin(auth.uid(), agency_id));

-- Policy para aceitar convite (anon precisa ler por token)
CREATE POLICY "Anyone can view invite by token"
  ON public.agency_invites FOR SELECT TO anon
  USING (token IS NOT NULL AND accepted_at IS NULL AND expires_at > now());

-- Atualizar policies de briefings para incluir contexto de agência
CREATE POLICY "Agency members can view agency briefings"
  ON public.briefings FOR SELECT TO authenticated
  USING (
    agency_id IS NOT NULL AND public.is_agency_member(auth.uid(), agency_id)
  );

CREATE POLICY "Agency clients can create briefings for agency"
  ON public.briefings FOR INSERT TO authenticated
  WITH CHECK (
    agency_id IS NOT NULL AND public.is_agency_member(auth.uid(), agency_id)
  );

-- Atualizar policies de campaigns para incluir contexto de agência
CREATE POLICY "Agency members can view agency campaigns"
  ON public.campaigns FOR SELECT TO authenticated
  USING (
    agency_id IS NOT NULL AND public.is_agency_member(auth.uid(), agency_id)
  );

-- Trigger para updated_at
CREATE TRIGGER update_agencies_updated_at
  BEFORE UPDATE ON public.agencies
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_agency_members_updated_at
  BEFORE UPDATE ON public.agency_members
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Criar automaticamente o owner como membro ao criar agência
CREATE OR REPLACE FUNCTION public.handle_new_agency()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.agency_members (agency_id, user_id, role)
  VALUES (NEW.id, NEW.owner_id, 'owner');
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_agency_created
  AFTER INSERT ON public.agencies
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_agency();

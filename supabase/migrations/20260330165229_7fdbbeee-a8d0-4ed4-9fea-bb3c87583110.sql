CREATE POLICY "Owner can view own agency"
  ON public.agencies
  FOR SELECT
  TO authenticated
  USING (owner_id = auth.uid());
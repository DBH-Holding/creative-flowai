CREATE OR REPLACE FUNCTION public.increment_campaigns_used(_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE subscriptions
  SET campaigns_used = campaigns_used + 1, updated_at = now()
  WHERE id = (
    SELECT id FROM subscriptions
    WHERE user_id = _user_id AND status = 'active'
    ORDER BY created_at DESC
    LIMIT 1
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.increment_feedbacks_used(_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE subscriptions
  SET feedbacks_used = feedbacks_used + 1, updated_at = now()
  WHERE id = (
    SELECT id FROM subscriptions
    WHERE user_id = _user_id AND status = 'active'
    ORDER BY created_at DESC
    LIMIT 1
  );
END;
$$;
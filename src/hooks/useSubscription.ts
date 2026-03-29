import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface SubscriptionData {
  id: string;
  status: string;
  payment_status: string;
  plan_name: string;
  plan_price: number;
  campaigns_used: number;
  campaigns_limit: number | null;
  feedbacks_used: number;
  feedbacks_limit: number | null;
  next_billing_date: string | null;
}

export function useSubscription() {
  const { user } = useAuth();
  const [sub, setSub] = useState<SubscriptionData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchSub = async () => {
    if (!user) { setLoading(false); return; }

    const { data } = await supabase
      .from("subscriptions")
      .select("*, plans(name, price)")
      .eq("user_id", user.id)
      .eq("status", "active")
      .order("created_at", { ascending: false })
      .limit(1);

    if (data && data.length > 0) {
      const s = data[0] as any;
      setSub({
        id: s.id,
        status: s.status,
        payment_status: s.payment_status,
        plan_name: s.plans?.name || "—",
        plan_price: s.plans?.price || 0,
        campaigns_used: s.campaigns_used,
        campaigns_limit: s.campaigns_limit,
        feedbacks_used: s.feedbacks_used,
        feedbacks_limit: s.feedbacks_limit,
        next_billing_date: s.next_billing_date,
      });
    } else {
      setSub(null);
    }
    setLoading(false);
  };

  useEffect(() => { fetchSub(); }, [user]);

  const canCreateCampaign = () => {
    if (!sub) return false;
    if (sub.status !== "active") return false;
    if (sub.campaigns_limit === null) return true;
    return sub.campaigns_used < sub.campaigns_limit;
  };

  const canAddFeedback = () => {
    if (!sub) return false;
    if (sub.status !== "active") return false;
    if (sub.feedbacks_limit === null) return true;
    return sub.feedbacks_used < sub.feedbacks_limit;
  };

  const remainingCampaigns = () => {
    if (!sub || sub.campaigns_limit === null) return null;
    return Math.max(0, sub.campaigns_limit - sub.campaigns_used);
  };

  const remainingFeedbacks = () => {
    if (!sub || sub.feedbacks_limit === null) return null;
    return Math.max(0, sub.feedbacks_limit - sub.feedbacks_used);
  };

  return {
    sub,
    loading,
    canCreateCampaign,
    canAddFeedback,
    remainingCampaigns,
    remainingFeedbacks,
    refresh: fetchSub,
  };
}

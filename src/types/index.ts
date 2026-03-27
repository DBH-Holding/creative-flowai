// Domain types for CreativeFlow AI

export interface Briefing {
  id: string;
  campaignName: string;
  businessSegment: string;
  objective: string;
  targetAudience: string;
  mainChannel: string;
  notes: string;
  openBriefing: string;
  createdAt: string;
}

export interface PostSuggestion {
  id: string;
  title: string;
  copy: string;
  cta: string;
  channel: string;
}

export interface AdIdea {
  headline: string;
  body: string;
  cta: string;
  format: string;
}

export interface Campaign {
  id: string;
  briefingId: string;
  summary: string;
  objective: string;
  targetAudience: string;
  tone: string;
  posts: PostSuggestion[];
  ad: AdIdea;
  createdAt: string;
}

export type ApprovalStatus = "em_analise" | "aguardando_aprovacao" | "aprovado" | "ajustes_solicitados";

export interface Feedback {
  id: string;
  author: string;
  message: string;
  createdAt: string;
}

export interface AIInsight {
  summary: string;
  issues: string[];
  actions: string[];
  newCopy: string;
  newVisualDirection: string;
}

export interface ChecklistItem {
  id: string;
  text: string;
  done: boolean;
}

export interface Plan {
  id: string;
  name: string;
  price: number;
  period: string;
  features: string[];
  highlighted?: boolean;
  cta: string;
}

export interface Subscription {
  planId: string;
  planName: string;
  status: "active" | "pending" | "cancelled";
  paymentStatus: "paid" | "pending" | "overdue";
  campaignsUsed: number;
  campaignsLimit: number | null;
  feedbacksUsed: number;
  feedbacksLimit: number | null;
  nextBillingDate: string;
}

export interface ApiEndpoint {
  method: "GET" | "POST";
  path: string;
  description: string;
  body?: string;
  response?: string;
}

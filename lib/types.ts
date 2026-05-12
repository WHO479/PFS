export type Json = string | number | boolean | null | { [key: string]: Json } | Json[];

export interface PipelineStage {
  id: string;
  name: string;
  position: number;
  color: string;
  created_at: string;
}

export interface Company {
  id: string;
  name: string;
  domain: string | null;
  industry: string | null;
  size: string | null;
  phone: string | null;
  address: string | null;
  website: string | null;
  notes: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface Contact {
  id: string;
  first_name: string;
  last_name: string;
  email: string | null;
  phone: string | null;
  job_title: string | null;
  company_id: string | null;
  status: 'active' | 'inactive' | 'lead';
  notes: string | null;
  avatar_url: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  company?: Company;
}

export interface Deal {
  id: string;
  title: string;
  value: number;
  currency: string;
  stage_id: string | null;
  contact_id: string | null;
  company_id: string | null;
  close_date: string | null;
  probability: number;
  status: 'open' | 'won' | 'lost';
  notes: string | null;
  position: number;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  stage?: PipelineStage;
  contact?: Contact;
  company?: Company;
}

export interface Activity {
  id: string;
  type: 'call' | 'email' | 'meeting' | 'note' | 'task' | 'deal_created' | 'deal_moved' | 'contact_created';
  title: string;
  description: string | null;
  contact_id: string | null;
  deal_id: string | null;
  company_id: string | null;
  due_date: string | null;
  completed: boolean;
  created_by: string | null;
  created_at: string;
  contact?: Contact;
  deal?: Deal;
}

export interface Profile {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  role: string;
  updated_at: string;
}

export interface DashboardStats {
  totalContacts: number;
  totalCompanies: number;
  openDeals: number;
  totalRevenue: number;
  wonDeals: number;
  lostDeals: number;
}

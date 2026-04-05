// ============================================================
// EstateHub — Shared TypeScript Interfaces
// ============================================================

export interface Landlord {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  created_at: string;
}

export interface Property {
  id: number;
  landlord_id: number;
  title: string;
  description: string | null;
  address: string;
  city: string;
  postcode: string;
  type: 'apartment' | 'house' | 'studio' | 'villa' | 'commercial';
  bedrooms: number;
  bathrooms: number;
  area_sqft: number | null;
  rent_pcm: number;
  status: 'available' | 'occupied' | 'maintenance';
  amenities: string[];
  created_at: string;
  updated_at: string;
}

export interface Tenant {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  id_verified: boolean;
  credit_score: number | null;
  created_at: string;
}

export interface Lease {
  id: number;
  property_id: number;
  tenant_id: number;
  start_date: string;
  end_date: string;
  rent_pcm: number;
  deposit: number;
  status: 'active' | 'expired' | 'terminated' | 'pending';
  created_at: string;
  // Joined fields
  property_title?: string;
  tenant_name?: string;
}

export interface Payment {
  id: number;
  lease_id: number;
  amount: number;
  due_date: string;
  paid_date: string | null;
  status: 'pending' | 'paid' | 'late' | 'waived';
  method: string | null;
  created_at: string;
  // Joined fields
  property_title?: string;
  tenant_name?: string;
}

export interface MaintenanceRequest {
  id: number;
  property_id: number;
  tenant_id: number | null;
  title: string;
  description: string | null;
  priority: 'low' | 'medium' | 'high' | 'emergency';
  status: 'open' | 'in_progress' | 'resolved';
  created_at: string;
  resolved_at: string | null;
  // Joined fields
  property_title?: string;
  tenant_name?: string;
}

export interface DashboardStats {
  total_properties: number;
  occupied_properties: number;
  occupancy_rate: number;
  monthly_revenue: number;
  outstanding_payments: number;
  open_maintenance: number;
  recent_payments: Payment[];
  maintenance_alerts: MaintenanceRequest[];
}

export interface ApiResponse<T> {
  data: T;
  message?: string;
}

export interface ApiError {
  error: string;
  details?: string;
}

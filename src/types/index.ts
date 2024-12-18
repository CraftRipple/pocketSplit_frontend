export interface User {
  id: number;
  username: string;
  email: string;
}

export interface Asset {
  id: number;
  name: string;
  description: string;
  subscription_cost: number;
  owner: number;
  shared_with: User[];
  created_at: string;
  updated_at: string;
}

export interface SharedAsset {
  asset: number;
  asset_name: string;
  owner_username: string;
  allocation: number;
  monthly_hours_allocated: number;
  usage_this_month: number;
}

export interface Session {
  id: number;
  asset: number;
  start_time: string;
  end_time: string | null;
  user: number;
}

export interface UsageAnalytics {
  total_sessions: number;
  total_duration: number;
  average_session_length: number;
  current_month: {
    total_hours_used: number;
    hours_remaining: number;
    cost_incurred: number;
  };
  usage_percentage: number;
  weekly_breakdown: {
    week: string;
    hours: number;
  }[];
  sessions_by_user: {
    [key: string]: number;
  };
  usage_by_day: {
    [key: string]: number;
  };
}

export interface AuthResponse {
  access: string;
  refresh: string;
}

export interface ApiError {
  message: string;
  status?: number;
} 
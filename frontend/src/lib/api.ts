export interface User {
  id: string;
  name: string;
  email: string;
  role?: string;
  image?: string;
}

export interface Farm {
  id: string;
  name: string;
  location?: string;
  size?: string;
  soil_type?: string;
  status?: "Active" | "Fallow" | "Harvesting" | "Preparation" | string;
  description?: string;
  owner_id?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Plant {
  id: string;
  name: string;
  variety?: string;
  farm_id?: string;
  planted_date?: string;
  stage?: "Seedling" | "Vegetative" | "Mature" | "Ready for Harvest" | string;
  health_status?: "Healthy" | "Attention" | "Diseased" | "Critical" | string;
  notes?: string;
  image_url?: string;
  owner_id?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Diagnosis {
  id: string;
  plant_id?: string;
  plant_name?: string;
  diagnosis: string;
  confidence?: number;
  severity?: "Low" | "Moderate" | "Severe" | "None" | string;
  symptoms?: string;
  recommendations?: string[] | string;
  image_url?: string;
  notes?: string;
  owner_id?: string;
  created_at?: string;
  updated_at?: string;
}

export interface MaturityAssessment {
  id: string;
  plant_id?: string;
  plant_name?: string;
  stage: "Seedling" | "Vegetative" | "Mature" | "Harvest Ready" | string;
  maturity_index?: number;
  leaf_count?: number;
  leaf_thickness_mm?: number;
  estimated_age_range?: string;
  estimated_harvest_date?: string;
  ready_for_harvest?: boolean;
  notes?: string;
  owner_id?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Grading {
  id: string;
  plant_id?: string;
  batch_id?: string;
  grade: "Grade A" | "Grade B" | "Grade C" | "Reject" | string;
  quality_score?: number;
  defect_rate?: number;
  weight_kg?: number;
  inspected_date?: string;
  inspector?: string;
  notes?: string;
  owner_id?: string;
  created_at?: string;
  updated_at?: string;
}

export interface SensorReading {
  id: string;
  device_id?: string;
  farm_id?: string;
  nitrogen: number;
  phosphorus: number;
  potassium: number;
  moisture?: number;
  temperature?: number;
  ph?: number;
  recorded_at?: string;
  owner_id?: string;
  created_at?: string;
  updated_at?: string;
}

export interface ProfitReport {
  id: string;
  title: string;
  period?: string;
  revenue: number;
  expenses: number;
  net_profit: number;
  crop_yield_kg?: number;
  market_price_per_kg?: number;
  notes?: string;
  owner_id?: string;
  created_at?: string;
  updated_at?: string;
}

export interface CommunityPost {
  id: string;
  title: string;
  content: string;
  author_name?: string;
  tags?: string[] | string;
  owner_id?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Comment {
  id: string;
  post_id?: string;
  plant_id?: string;
  content: string;
  author_name?: string;
  owner_id?: string;
  created_at?: string;
  updated_at?: string;
}

export interface SpeciesIdentification {
  is_aloe_vera: boolean;
  species_name: string;
  confidence: number;
  rejection_reason?: string;
  foliar_chromatic_ratio?: number;
  green_ratio?: number;
}

export interface DiseaseDetectionResult {
  disease: string;
  name: string;
  severity: "None" | "Low" | "Moderate" | "Severe" | string;
  confidence: number;
  symptoms_observed: string[];
  description: string;
  symptoms: string[];
  causes: string[];
  treatments: string[];
  prevention: string[];
  supported_categories: string[];
}

export interface HarvestMaturityResult {
  stage: "Young / Not Yet Mature" | "Developing" | "Mature / Potentially Ready for Harvest" | "Prime Commercial / Mature" | string;
  maturity_index: number;
  estimated_leaf_count: number;
  detected_leaf_regions?: number;
  estimated_leaf_thickness_mm: number;
  estimated_age_range?: string;
  estimated_age_months?: number;
  ready_for_harvest: boolean;
  harvest_guidance: string;
}

export interface VisionAnalysisResult {
  timestamp: string;
  image_dimensions: { width: number; height: number };
  species_identification: SpeciesIdentification;
  disease_detection: DiseaseDetectionResult;
  harvest_maturity: HarvestMaturityResult;
}

export interface VisionAnalysisResponse {
  success: boolean;
  scan_id: string;
  plant_id: string;
  plant_name: string;
  diagnosis_id: string;
  maturity_id: string;
  analysis: VisionAnalysisResult;
}

export interface ScanRecord {
  id: string;
  plantId?: string;
  plantName?: string;
  diagnosis: string;
  diseaseName?: string;
  severity?: string;
  confidence?: number;
  maturityStage?: string;
  estimatedAge?: string;
  readyForHarvest?: boolean;
  recommendations?: string[];
  imageUrl?: string;
  source?: string;
  speciesStatus?: string;
  createdAt: string;
  diagnosisId?: string;
  maturityId?: string;
  userId?: string;
}

export interface AdminStats {
  users: number;
  farms: number;
  plants: number;
  diagnoses: number;
  sensors: number;
  maturity: number;
  scans: number;
  reports: number;
  healthy_diagnoses: number;
  disease_rate_pct: number;
  total_revenue: number;
  total_profit: number;
  model_status: string;
}

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: string;
  created_at?: string;
  plants_count?: number;
  scans_count?: number;
}

// Token helper
export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  const local = localStorage.getItem("vera_token");
  if (local) return local;

  // Try reading from cookie
  const match = document.cookie.match(/(^|;\s*)vera_session=([^;]+)/);
  if (match) return decodeURIComponent(match[2]);
  return null;
}

export function setToken(token: string) {
  if (typeof window !== "undefined") {
    localStorage.setItem("vera_token", token);
    document.cookie = `vera_session=${encodeURIComponent(token)}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax`;
  }
}

export function clearToken() {
  if (typeof window !== "undefined") {
    localStorage.removeItem("vera_token");
    document.cookie = "vera_session=; path=/; max-age=0";
  }
}

// Request dispatcher: routes via Next.js proxy rewrite `/api/backend` or direct fallback
async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getToken();
  const headers = new Headers(options.headers || {});

  if (!headers.has("Content-Type") && !(options.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }

  if (token && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  // Ensure clean endpoint without double slashes
  const cleanEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
  const url = `/api/backend${cleanEndpoint}`;

  let response: Response;
  try {
    response = await fetch(url, { ...options, headers, credentials: "include" });
  } catch {
    const directBase = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";
    response = await fetch(`${directBase}${cleanEndpoint}`, { ...options, headers, credentials: "include" });
  }

  if (response.status === 401) {
    throw new Error("Unauthorized");
  }

  if (!response.ok) {
    let errorMsg = `HTTP Error ${response.status}`;
    try {
      const errData = await response.json();
      errorMsg = errData.detail || errData.error || errData.message || errorMsg;
    } catch {
      // keep default error
    }
    throw new Error(errorMsg);
  }

  if (response.status === 204) {
    return null as T;
  }

  return response.json();
}

function createCrudClient<T>(resourcePath: string) {
  return {
    list: async (params?: Record<string, string | number | boolean>): Promise<T[]> => {
      let query = "";
      if (params) {
        const entries = Object.entries(params).filter(([, v]) => v !== undefined && v !== "");
        if (entries.length > 0) {
          query = "?" + entries.map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`).join("&");
        }
      }
      return request<T[]>(`/${resourcePath}${query}`);
    },
    get: async (id: string): Promise<T> => {
      return request<T>(`/${resourcePath}/${id}`);
    },
    create: async (data: Partial<T>): Promise<T> => {
      return request<T>(`/${resourcePath}`, {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
    update: async (id: string, data: Partial<T>): Promise<T> => {
      return request<T>(`/${resourcePath}/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      });
    },
    patch: async (id: string, data: Partial<T>): Promise<T> => {
      return request<T>(`/${resourcePath}/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      });
    },
    delete: async (id: string): Promise<void> => {
      await request<void>(`/${resourcePath}/${id}`, {
        method: "DELETE",
      });
    },
  };
}

export const api = {
  auth: {
    login: async (creds: { email: string; password: string }): Promise<{ token: string; user: User }> => {
      // 1. Try Next.js internal auth route (sets http cookie in browser immediately)
      let nextError = "";
      try {
        const res = await fetch("/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(creds),
          credentials: "include",
        });
        const data = await res.json();
        if (res.ok && data.token) {
          setToken(data.token);
          return data;
        }
        if (data.error) nextError = data.error;
      } catch {
        // Fallback to direct backend call below
      }

      // 2. Try backend auth route
      try {
        const res = await request<{ token: string; user: User }>("/auth/login", {
          method: "POST",
          body: JSON.stringify(creds),
        });
        if (res.token) setToken(res.token);
        return res;
      } catch (err) {
        throw new Error(nextError || (err instanceof Error ? err.message : "Invalid email or password."));
      }
    },
    register: async (payload: { name: string; email: string; password: string; role?: string }): Promise<{ token: string; user: User }> => {
      // 1. Try Next.js internal register route
      let nextError = "";
      try {
        const res = await fetch("/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
          credentials: "include",
        });
        const data = await res.json();
        if (res.ok && data.token) {
          setToken(data.token);
          return data;
        }
        if (data.error) nextError = data.error;
      } catch {
        // Fallback to backend route
      }

      // 2. Try backend register route
      try {
        const res = await request<{ token: string; user: User }>("/auth/register", {
          method: "POST",
          body: JSON.stringify(payload),
        });
        if (res.token) setToken(res.token);
        return res;
      } catch (err) {
        throw new Error(nextError || (err instanceof Error ? err.message : "Registration failed."));
      }
    },
    me: async (): Promise<User> => {
      // 1. Check local session route first
      try {
        const res = await fetch("/api/auth/me", { credentials: "include" });
        if (res.ok) {
          const data = await res.json();
          if (data.user) return data.user;
        }
      } catch {
        // fall through
      }

      // 2. Check backend endpoint with token
      return await request<User>("/auth/me");
    },
    updateProfile: async (payload: { name?: string }): Promise<User> => {
      try {
        return await request<User>("/auth/profile", {
          method: "PATCH",
          body: JSON.stringify(payload),
        });
      } catch {
        const res = await fetch("/api/profile", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
          credentials: "include",
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to update profile");
        return data.user;
      }
    },
    logout: async (): Promise<void> => {
      clearToken();
      try {
        await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
      } catch {
        // ignore
      }
    },
  },
  farms: createCrudClient<Farm>("farms"),
  plants: createCrudClient<Plant>("plants"),
  diagnoses: createCrudClient<Diagnosis>("diagnoses"),
  maturity: createCrudClient<MaturityAssessment>("maturity"),
  gradings: createCrudClient<Grading>("gradings"),
  sensors: createCrudClient<SensorReading>("sensors"),
  reports: createCrudClient<ProfitReport>("reports"),
  community: {
    listPosts: async (): Promise<CommunityPost[]> => {
      return request<CommunityPost[]>("/community/posts");
    },
    getPost: async (id: string): Promise<CommunityPost> => {
      return request<CommunityPost>(`/community/posts/${id}`);
    },
    createPost: async (post: Partial<CommunityPost>): Promise<CommunityPost> => {
      return request<CommunityPost>("/community/posts", {
        method: "POST",
        body: JSON.stringify(post),
      });
    },
    updatePost: async (id: string, post: Partial<CommunityPost>): Promise<CommunityPost> => {
      return request<CommunityPost>(`/community/posts/${id}`, {
        method: "PUT",
        body: JSON.stringify(post),
      });
    },
    deletePost: async (id: string): Promise<void> => {
      await request<void>(`/community/posts/${id}`, {
        method: "DELETE",
      });
    },
  },
  comments: {
    list: async (postId?: string): Promise<Comment[]> => {
      const q = postId ? `?post_id=${encodeURIComponent(postId)}` : "";
      return request<Comment[]>(`/comments${q}`);
    },
    create: async (comment: Partial<Comment>): Promise<Comment> => {
      return request<Comment>("/comments", {
        method: "POST",
        body: JSON.stringify(comment),
      });
    },
    delete: async (id: string): Promise<void> => {
      await request<void>(`/comments/${id}`, {
        method: "DELETE",
      });
    },
  },
  sync: {
    upload: async (records: Array<{ collection: string; local_id: string; payload: Record<string, unknown> }>) => {
      return request<{ results: Array<{ local_id: string; status: string; server_id?: string }> }>("/sync/upload", {
        method: "POST",
        body: JSON.stringify(records),
      });
    },
    download: async (since?: string) => {
      const q = since ? `?since=${encodeURIComponent(since)}` : "";
      return request<{ since: string | null; data: Record<string, unknown[]> }>(`/sync/download${q}`);
    },
  },
  vision: {
    analyze: async (payload: {
      image_base64: string;
      plant_id?: string;
      plant_name?: string;
      farm_id?: string;
    }): Promise<VisionAnalysisResponse> => {
      return request<VisionAnalysisResponse>("/vision/analyze", {
        method: "POST",
        body: JSON.stringify(payload),
      });
    },
    maturity: async (payload: {
      image_base64: string;
      plant_id?: string;
      plant_name?: string;
    }): Promise<{ maturity: HarvestMaturityResult; record: MaturityAssessment }> => {
      return request<{ maturity: HarvestMaturityResult; record: MaturityAssessment }>("/vision/maturity", {
        method: "POST",
        body: JSON.stringify(payload),
      });
    },
    diseases: async (): Promise<{ count: number; diseases: Record<string, DiseaseDetectionResult> }> => {
      return request<{ count: number; diseases: Record<string, DiseaseDetectionResult> }>("/vision/diseases");
    },
    status: async (): Promise<{
      status: string;
      engine: string;
      supported_formats: string[];
      species_supported: string[];
      supported_diseases: string[];
      maturity_stages: string[];
    }> => {
      return request("/vision/status");
    },
  },
  scans: {
    list: async (): Promise<ScanRecord[]> => {
      try {
        const res = await fetch("/api/scans", { credentials: "include" });
        if (res.ok) {
          const d = await res.json();
          if (Array.isArray(d.scans)) return d.scans;
        }
      } catch {
        // fallback
      }
      return request<ScanRecord[]>("/admin/scans").catch(() => []);
    },
    delete: async (id: string): Promise<void> => {
      try {
        await fetch(`/api/scans?id=${encodeURIComponent(id)}`, { method: "DELETE", credentials: "include" });
      } catch {
        // fallback to admin endpoint
      }
      await request<void>(`/admin/scans/${id}`, { method: "DELETE" }).catch(() => {});
    },
  },
  admin: {
    getStats: async (): Promise<AdminStats> => {
      return request<AdminStats>("/admin/stats");
    },
    getUsers: async (): Promise<AdminUser[]> => {
      return request<AdminUser[]>("/admin/users");
    },
    updateRole: async (userId: string, role: "admin" | "grower"): Promise<AdminUser> => {
      return request<AdminUser>(`/admin/users/${userId}/role`, {
        method: "PATCH",
        body: JSON.stringify({ role }),
      });
    },
    deleteUser: async (userId: string): Promise<{ success: boolean; message: string }> => {
      return request<{ success: boolean; message: string }>(`/admin/users/${userId}`, {
        method: "DELETE",
      });
    },
    getScans: async (): Promise<ScanRecord[]> => {
      return request<ScanRecord[]>("/admin/scans");
    },
    deleteScan: async (scanId: string): Promise<{ success: boolean; message: string }> => {
      return request<{ success: boolean; message: string }>(`/admin/scans/${scanId}`, {
        method: "DELETE",
      });
    },
    getDiseases: async (): Promise<Record<string, DiseaseDetectionResult>> => {
      return request<Record<string, DiseaseDetectionResult>>("/admin/diseases");
    },
    updateDisease: async (diseaseKey: string, payload: Partial<DiseaseDetectionResult>): Promise<{ success: boolean; disease: any }> => {
      return request<{ success: boolean; disease: any }>(`/admin/diseases/${encodeURIComponent(diseaseKey)}`, {
        method: "PUT",
        body: JSON.stringify(payload),
      });
    },
    getPlants: async (): Promise<Plant[]> => {
      return request<Plant[]>("/admin/plants");
    },
    getAnalytics: async (): Promise<{
      total_scans: number;
      healthy_count: number;
      diseased_count: number;
      healthy_rate_pct: number;
      disease_distribution: Record<string, number>;
      maturity_distribution: Record<string, number>;
    }> => {
      return request<any>("/admin/analytics");
    },
    getActivity: async (): Promise<Array<{
      id: string;
      type: "scan" | "user";
      title: string;
      description: string;
      timestamp: string;
    }>> => {
      return request<any[]>("/admin/activity");
    },
  },
  chat: {
    send: async (message: string): Promise<{ reply: string }> => {
      return request<{ reply: string }>("/chat", {
        method: "POST",
        body: JSON.stringify({ message }),
      });
    },
  },
  health: async (): Promise<{ status: string }> => {
    return request<{ status: string }>("/health");
  },
};

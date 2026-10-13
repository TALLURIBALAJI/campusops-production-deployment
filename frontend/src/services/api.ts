import { Student, StudentCreate, StudentUpdate, HealthResponse, StudentListResponse } from '../types/student';

export class CampusApiError extends Error {
  status?: number;
  constructor(message: string, status?: number) {
    super(message);
    this.name = 'CampusApiError';
    this.status = status;
  }
}

// Read base URL from environment variable, default to empty string for proxy/relative URL
const envBaseUrl = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/+$/, '');

export function getApiBaseUrl(): string {
  return envBaseUrl;
}

export function isApiConfigured(): boolean {
  return envBaseUrl !== '' || window.location.port === '5173' || window.location.port === '8000';
}

function formatErrorMessage(data: unknown): string {
  if (!data || typeof data !== 'object') return '';
  const obj = data as Record<string, unknown>;
  const detail = obj.detail ?? obj.message ?? obj.error;

  if (typeof detail === 'string') return detail;
  if (Array.isArray(detail)) {
    return detail
      .map((item) => {
        if (item && typeof item === 'object') {
          const row = item as Record<string, unknown>;
          const msg = typeof row.msg === 'string' ? row.msg : '';
          const loc = Array.isArray(row.loc) ? row.loc.filter((x) => x !== 'body').join(' → ') : '';
          return loc ? `${loc}: ${msg}` : msg;
        }
        return String(item);
      })
      .filter(Boolean)
      .join(' · ');
  }
  return '';
}

async function request<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const base = getApiBaseUrl();
  const url = `${base}${endpoint}`;

  let response: Response;
  try {
    response = await fetch(url, {
      ...options,
      headers: {
        Accept: 'application/json',
        ...options?.headers,
      },
    });
  } catch (err) {
    throw new CampusApiError(
      'Could not reach the CampusOps API. Please ensure the backend is running and CORS allows this origin.'
    );
  }

  const text = await response.text();
  let parsed: unknown = null;
  if (text) {
    try {
      parsed = JSON.parse(text);
    } catch {
      parsed = text;
    }
  }

  if (!response.ok) {
    const errorMsg =
      (typeof parsed === 'string' ? parsed : formatErrorMessage(parsed)) ||
      `The API returned HTTP ${response.status}.`;
    throw new CampusApiError(errorMsg, response.status);
  }

  return parsed as T;
}

export const api = {
  // Fetch paginated or filtered students
  async getStudents(params?: {
    skip?: number;
    limit?: number;
    course?: string;
    search?: string;
  }): Promise<{ students: Student[]; total: number }> {
    const query = new URLSearchParams();
    if (params?.skip !== undefined) query.set('skip', String(params.skip));
    if (params?.limit !== undefined) query.set('limit', String(params.limit));
    if (params?.course) query.set('course', params.course);
    if (params?.search) query.set('search', params.search);

    const qs = query.toString() ? `?${query.toString()}` : '';
    const raw = await request<StudentListResponse | Student[]>(`/api/v1/students/${qs}`);

    // If backend returns StudentListResponse schema { total, skip, limit, students }
    if (raw && typeof raw === 'object' && 'students' in raw && Array.isArray(raw.students)) {
      return {
        students: raw.students,
        total: typeof raw.total === 'number' ? raw.total : raw.students.length,
      };
    }

    // Direct array fallback
    if (Array.isArray(raw)) {
      return {
        students: raw,
        total: raw.length,
      };
    }

    return { students: [], total: 0 };
  },

  // Get single student by ID or student_id
  async getStudent(identifier: string): Promise<Student> {
    return request<Student>(`/api/v1/students/${encodeURIComponent(identifier)}`);
  },

  // Create new student
  async createStudent(student: StudentCreate): Promise<Student> {
    return request<Student>(`/api/v1/students/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(student),
    });
  },

  // Update existing student
  async updateStudent(identifier: string, student: StudentUpdate): Promise<Student> {
    return request<Student>(`/api/v1/students/${encodeURIComponent(identifier)}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(student),
    });
  },

  // Delete student
  async deleteStudent(identifier: string): Promise<{ message: string; id: number; student_id: string }> {
    return request<{ message: string; id: number; student_id: string }>(
      `/api/v1/students/${encodeURIComponent(identifier)}`,
      {
        method: 'DELETE',
      }
    );
  },

  // Health check
  async getHealth(): Promise<HealthResponse> {
    return request<HealthResponse>('/health');
  },

  // OpenAPI schema
  async getOpenApiSchema(): Promise<Record<string, unknown>> {
    return request<Record<string, unknown>>('/openapi.json');
  },
};

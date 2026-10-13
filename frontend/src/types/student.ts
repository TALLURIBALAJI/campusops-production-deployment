export interface Student {
  id?: number;
  student_id: string;
  first_name: string;
  last_name: string;
  email: string;
  course: string;
  year_of_study: number;
  gpa?: number | null;
  enrollment_status?: 'active' | 'graduated' | 'suspended' | 'inactive' | string;
  created_at?: string;
  updated_at?: string;
  [key: string]: unknown;
}

export interface StudentCreate {
  student_id: string;
  first_name: string;
  last_name: string;
  email: string;
  course: string;
  year_of_study: number;
  gpa?: number | null;
  enrollment_status?: string;
}

export interface StudentUpdate {
  first_name?: string;
  last_name?: string;
  email?: string;
  course?: string;
  year_of_study?: number;
  gpa?: number | null;
  enrollment_status?: string;
}

export interface HealthResponse {
  status: string;
  project?: string;
  environment?: string;
  database?: 'connected' | 'disconnected' | string;
  database_message?: string;
  [key: string]: unknown;
}

export interface StudentListResponse {
  total: number;
  skip: number;
  limit: number;
  students: Student[];
}

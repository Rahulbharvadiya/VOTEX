export interface User {
  id: string;
  email: string;
  role: 'user' | 'admin';
  daily_budget_inr: number;
  created_at: string;
}

export interface TaskFile {
  id: string;
  original_name: string;
  mime_type: string;
  size_bytes: number;
  created_at?: string;
}

export interface TaskStep {
  id: number;
  seq: number;
  tool_label: string;
  status: 'started' | 'completed' | 'failed' | 'retried';
  summary: string;
  cost_inr: number;
  duration_ms: number;
  cached: boolean;
  created_at?: string;
}

export interface TaskArtifact {
  id: string;
  kind: string;
  display_name: string;
  mime_type: string;
  size_bytes: number;
  download_url?: string;
  created_at?: string;
}

export interface Task {
  id: string;
  prompt: string;
  status: 'queued' | 'running' | 'completed' | 'halted_budget' | 'failed' | 'cancelled';
  max_steps: number;
  max_cost_inr: number;
  max_seconds: number;
  steps_used: number;
  cost_inr: number;
  elapsed_seconds: number;
  verification?: Record<string, any>;
  error_message?: string;
  created_at?: string;
  started_at?: string;
  finished_at?: string;
  files: TaskFile[];
  steps: TaskStep[];
  artifacts: TaskArtifact[];
  report_markdown?: string;
}

export interface TaskListResponse {
  tasks: Task[];
  total: number;
  page: number;
  page_size: number;
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, any>;
  request_id?: string;
}

export interface StudioStep {
  step: number;
  name: string;
  status: 'completed' | 'in_progress' | 'skipped' | 'failed';
}

export interface StudioResult {
  status: string;
  job_id: string;
  source_lang: string;
  source_lang_name: string;
  target_lang: string;
  target_lang_name: string;
  source_text: string;
  translated_text: string;
  has_original_audio: boolean;
  original_audio_url?: string | null;
  has_cleaned_audio: boolean;
  cleaned_audio_url?: string | null;
  has_output_audio: boolean;
  output_audio_url?: string | null;
  steps: StudioStep[];
}

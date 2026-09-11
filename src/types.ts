export type UserRole = 'SUPER_ADMIN' | 'PM' | 'MEMBER' | 'REVIEWER';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  title: string;
  department: string;
  avatar_url: string;
}

export interface Project {
  id: string;
  code: string;
  name: string;
  description: string;
  created_at: string;
  manager_id: string;
}

export interface KanbanColumn {
  id: string;
  project_id: string;
  title: string;
  position: number;
  color?: string;
  is_done?: boolean;
}

export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

export interface Attachment {
  id: string;
  target_type: 'TASK' | 'RFI' | 'RFI_RESPONSE';
  target_id: string;
  file_name: string;
  file_url: string;
  file_size: number;
  mime_type: string;
  uploaded_by: string;
  uploaded_by_name?: string;
  created_at: string;
}

export interface Task {
  id: string;
  task_code: string;
  project_id: string;
  column_id: string;
  title: string;
  description: string;
  priority: TaskPriority;
  position: number;
  start_date?: string;
  due_date?: string;
  assignee_id?: string;
  collaborator_ids?: string[];
  tags: string[];
  created_by: string;
  created_at: string;
  updated_at: string;
  attachments?: Attachment[];
  comments_count?: number;
}

export type RFIStatus =
  | 'DRAFT'
  | 'SUBMITTED'
  | 'IN_REVIEW'
  | 'ANSWERED'
  | 'CLOSED'
  | 'CLARIFICATION_REQUIRED';

export interface RFIResponse {
  id: string;
  rfi_id: string;
  responder_id: string;
  responder_name?: string;
  responder_title?: string;
  content: string;
  official: boolean;
  created_at: string;
  attachments?: Attachment[];
}

export interface RFI {
  id: string;
  project_id: string;
  rfi_number: string;
  title: string;
  question: string;
  status: RFIStatus;
  drawing_ref?: string;
  spec_ref?: string;
  schedule_impact: boolean;
  schedule_days?: number;
  cost_impact: boolean;
  cost_amount?: number;
  due_date?: string;
  requested_by: string;
  requested_by_name?: string;
  requested_by_dept?: string;
  assigned_to: string;
  assigned_to_name?: string;
  assigned_to_dept?: string;
  official_response?: string;
  responder_id?: string;
  responder_name?: string;
  responded_at?: string;
  created_at: string;
  updated_at: string;
  attachments?: Attachment[];
  responses?: RFIResponse[];
}

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  content: string;
  type: string;
  target_id?: string;
  target_type?: 'TASK' | 'RFI';
  is_read: boolean;
  created_at: string;
}

export type AppNotification = Notification;

export interface ActivityLog {
  id: string;
  project_id: string;
  user_id: string;
  user_name: string;
  action: string;
  target_title: string;
  target_type: 'TASK' | 'RFI' | 'COLUMN';
  created_at: string;
}

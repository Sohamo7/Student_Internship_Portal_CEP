export type UserRole = 'student' | 'admin' | 'intern';

// Lifecycle of a volunteer's internship application:
// pending  -> submitted via the "Apply" tab on /login, cannot sign in yet
// approved -> NGO admin approved it, portal access (login) is unlocked
// rejected -> NGO admin declined it, sign in is blocked with an explanation
export type ApplicationStatus = 'pending' | 'approved' | 'rejected';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  created_at?: string;
  updated_at?: string;
  // Application details collected on the "New Volunteer" apply form
  phone?: string;
  college?: string;
  degree?: string;
  skills?: string;
  program_interest?: string;
  statement_of_purpose?: string;
  // Admin accounts and legacy rows may not have this set — treat missing as approved.
  application_status?: ApplicationStatus;
  reviewed_at?: string;
}

export type LeaveStatus = 'pending' | 'approved' | 'rejected';

export interface LeaveRequest {
  id: string;
  applicant_id: string;
  applicant_name: string;
  applicant_email: string;
  applicant_role: 'intern' | 'student';
  leave_type: string;
  start_date: string;
  end_date: string;
  days_count: number;
  reason: string;
  status: LeaveStatus;
  created_at: string;
  reviewed_at?: string;
  admin_comment?: string;
}

export type IssueStatus = 'open' | 'in_progress' | 'resolved';
export type IssuePriority = 'low' | 'medium' | 'high' | 'urgent';

export interface ReportedIssue {
  id: string;
  applicant_id: string;
  applicant_name: string;
  applicant_email: string;
  category: string;
  priority: IssuePriority;
  title: string;
  description: string;
  status: IssueStatus;
  created_at: string;
  admin_solution?: string;
  resolved_at?: string;
}

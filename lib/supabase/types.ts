export type UserRole = 'student' | 'admin';

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

import { CONTACT_FORM_IDS, MESSAGE_STATUSES, type ContactMessage } from './types';

/** Supabase `contact_messages` ↔ the dashboard's `ContactMessage`. */
export const MESSAGE_COLUMNS =
  'id,created_at,form,name,email,message,page,status,emailed_to,email_error';

export interface MessageRow {
  id: string;
  created_at: string;
  form: string;
  name: string;
  email: string;
  message: string;
  page: string | null;
  status: string;
  emailed_to: string | null;
  email_error: string | null;
}

/** Null for a row the dashboard doesn't understand (e.g. a form added later), so it's skipped. */
export function rowToMessage(row: MessageRow): ContactMessage | null {
  const form = CONTACT_FORM_IDS.find((f) => f === row.form);
  const status = MESSAGE_STATUSES.find((s) => s === row.status);
  if (!form || !status) return null;
  return {
    id: row.id,
    createdAt: row.created_at,
    form,
    name: row.name,
    email: row.email,
    message: row.message,
    ...(row.page && { page: row.page }),
    status,
    ...(row.emailed_to && { emailedTo: row.emailed_to }),
    ...(row.email_error && { emailError: row.email_error }),
  };
}

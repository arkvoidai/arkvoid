import { supabase } from './supabase/client';

export type NotificationType = 'first_trace' | 'high_risk' | 'compliance_drop' | 'agent_inactive' | 'policy_triggered';

export async function createNotification(
  userId: string,
  type: NotificationType,
  title: string,
  message: string,
  link: string
) {
  try {
    const { error } = await supabase.from('notifications').insert({
      user_id: userId,
      type,
      title,
      message,
      link,
      is_read: false,
    });
    
    if (error) {
      console.error('Error creating notification:', error);
    }
  } catch (err) {
    console.error('Failed to create notification:', err);
  }
}

import { getSupabase } from '../supabase';

export interface StoredChatMessageRow {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  isError?: boolean;
  analytics?: unknown;
}

const rowToStored = (row: {
  id: string;
  role: string;
  content: string;
  created_at: string;
  is_error?: boolean;
  analytics?: unknown;
}): StoredChatMessageRow => ({
  id: row.id,
  role: row.role as 'user' | 'assistant',
  content: row.content,
  timestamp: row.created_at,
  isError: row.is_error ?? false,
  analytics: row.analytics ?? undefined,
});

export const assistantChatMessagesRepository = {
  async getBySession(sessionId: string): Promise<StoredChatMessageRow[]> {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('school_xx_assistant_chat_messages')
      .select('id, role, content, created_at, is_error, analytics')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true });

    if (error) throw new Error('Failed to fetch chat history');
    return (data || []).map((row) => rowToStored(row));
  },

  async addMessage(
    sessionId: string,
    message: Omit<StoredChatMessageRow, 'timestamp'> & { timestamp?: string }
  ): Promise<StoredChatMessageRow> {
    const supabase = getSupabase();
    const id = message.id || crypto.randomUUID();

    const { data, error } = await supabase
      .from('school_xx_assistant_chat_messages')
      .insert({
        id,
        session_id: sessionId,
        role: message.role,
        content: message.content,
        is_error: message.isError ?? false,
        analytics: message.analytics ?? null,
        created_at: message.timestamp || new Date().toISOString(),
      })
      .select('id, role, content, created_at, is_error, analytics')
      .single();

    if (error) throw new Error('Failed to save chat message');
    return rowToStored(data);
  },

  async saveMessages(sessionId: string, messages: StoredChatMessageRow[]): Promise<void> {
    const supabase = getSupabase();

    const { error: deleteError } = await supabase
      .from('school_xx_assistant_chat_messages')
      .delete()
      .eq('session_id', sessionId);

    if (deleteError) throw new Error('Failed to clear chat history');

    if (messages.length === 0) return;

    const rows = messages.map((m) => ({
      id: m.id,
      session_id: sessionId,
      role: m.role,
      content: m.content,
      is_error: m.isError ?? false,
      analytics: m.analytics ?? null,
      created_at: m.timestamp,
    }));

    const { error: insertError } = await supabase
      .from('school_xx_assistant_chat_messages')
      .insert(rows);

    if (insertError) throw new Error('Failed to save chat history');
  },
};

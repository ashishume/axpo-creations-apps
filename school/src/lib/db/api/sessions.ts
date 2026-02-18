import type { Session } from '../../../types';
import { teachingFetch, teachingFetchJson } from '../../api/client';

function mapSession(r: Record<string, unknown>): Session {
  return {
    id: String(r.id),
    schoolId: String(r.school_id ?? ''),
    year: String(r.year ?? ''),
    startDate: String(r.start_date ?? ''),
    endDate: String(r.end_date ?? ''),
    salaryDueDay: r.salary_due_day != null ? Number(r.salary_due_day) : undefined,
  };
}

export const sessionsRepositoryApi = {
  async getAll(): Promise<Session[]> {
    const list = await teachingFetchJson<Record<string, unknown>[]>('/sessions');
    return Array.isArray(list) ? list.map(mapSession) : [];
  },

  async getBySchool(schoolId: string): Promise<Session[]> {
    const list = await teachingFetchJson<Record<string, unknown>[]>(`/sessions?school_id=${schoolId}`);
    return Array.isArray(list) ? list.map(mapSession) : [];
  },

  async getPaginated(page = 1, pageSize = 10, schoolId?: string): Promise<{ data: Session[]; total: number; page: number; pageSize: number; totalPages: number }> {
    const list = schoolId ? await this.getBySchool(schoolId) : await this.getAll();
    const total = list.length;
    const start = (page - 1) * pageSize;
    const data = list.slice(start, start + pageSize);
    return { data, total, page, pageSize, totalPages: Math.ceil(total / pageSize) || 1 };
  },

  async getById(id: string): Promise<Session | null> {
    try {
      const r = await teachingFetchJson<Record<string, unknown>>(`/sessions/${id}`);
      return mapSession(r);
    } catch {
      return null;
    }
  },

  async create(session: Omit<Session, 'id'>): Promise<Session> {
    const body = {
      school_id: session.schoolId,
      year: session.year,
      start_date: session.startDate,
      end_date: session.endDate,
      is_active: true,
      salary_due_day: session.salaryDueDay ?? 5,
    };
    const r = await teachingFetchJson<Record<string, unknown>>('/sessions', { method: 'POST', body: JSON.stringify(body) });
    return mapSession(r);
  },

  async update(id: string, updates: Partial<Omit<Session, 'id'>>): Promise<Session> {
    const body: Record<string, unknown> = {};
    if (updates.year !== undefined) body.year = updates.year;
    if (updates.startDate !== undefined) body.start_date = updates.startDate;
    if (updates.endDate !== undefined) body.end_date = updates.endDate;
    if (updates.salaryDueDay !== undefined) body.salary_due_day = updates.salaryDueDay;
    const r = await teachingFetchJson<Record<string, unknown>>(`/sessions/${id}`, { method: 'PATCH', body: JSON.stringify(body) });
    return mapSession(r);
  },

  async delete(id: string): Promise<void> {
    await teachingFetch(`/sessions/${id}`, { method: 'DELETE' });
  },
};

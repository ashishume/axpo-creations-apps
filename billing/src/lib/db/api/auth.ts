import { billingFetch, billingFetchJson } from "@/lib/api/client";
import type { AuthRepository, User } from "../repository";

function mapUser(r: Record<string, unknown>): User {
  return {
    id: String(r.id),
    email: String(r.email ?? ""),
    name: String(r.name ?? r.email ?? ""),
    role: (r.role as "admin" | "user") ?? "user",
    subscriptionId: r.subscription_id != null ? String(r.subscription_id) : undefined,
    createdAt: String(r.created_at ?? new Date().toISOString()),
  };
}

export const authRepositoryApi: AuthRepository = {
  async signIn(email: string, password: string): Promise<User | null> {
    const res = await billingFetch("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { user: Record<string, unknown> };
    return mapUser(data.user);
  },

  async signUp(email: string, password: string, name: string): Promise<User | null> {
    const res = await billingFetch("/auth/register", {
      method: "POST",
      body: JSON.stringify({ email, password, name, role: "user" }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: res.statusText }));
      const msg = (err as { detail?: string }).detail ?? res.statusText;
      if (msg.toLowerCase().includes("already registered") || res.status === 409) {
        throw new Error("An account with this email already exists.");
      }
      throw new Error(msg);
    }
    const data = (await res.json()) as { user: Record<string, unknown> };
    return mapUser(data.user);
  },

  async signOut(): Promise<void> {
    await billingFetch("/auth/logout", { method: "POST" });
  },

  async getCurrentUser(): Promise<User | null> {
    try {
      const user = await billingFetchJson<Record<string, unknown>>("/auth/me");
      return mapUser(user);
    } catch {
      return null;
    }
  },
};

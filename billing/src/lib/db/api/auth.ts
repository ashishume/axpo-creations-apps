import { billingFetch, billingFetchJson } from "@/lib/api/client";
import type { AuthRepository, User } from "../../repository";

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
    // Backend may not expose register; could add later. For now fail.
    return null;
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

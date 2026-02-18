import { supabase } from "../client";
import type { AuthRepository, User } from "../../repository";

// Hardcoded admin credentials for initial testing
const ADMIN_EMAIL = "admin";
const ADMIN_PASSWORD = "admin";

export const authRepository: AuthRepository = {
  async signIn(email: string, password: string): Promise<User | null> {
    // Check for hardcoded admin first
    if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
      const adminUser: User = {
        id: "admin-user",
        email: "admin@billing.local",
        name: "Administrator",
        role: "admin",
        createdAt: new Date().toISOString(),
      };
      // Store in localStorage for session persistence
      if (typeof window !== "undefined") {
        localStorage.setItem("billing-user", JSON.stringify(adminUser));
      }
      return adminUser;
    }

    // Try Supabase auth
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error || !data.user) return null;

    // Get user profile from users table
    const { data: profile } = await supabase
      .from("users")
      .select("*")
      .eq("id", data.user.id)
      .single();

    const user: User = {
      id: data.user.id,
      email: data.user.email || "",
      name: profile?.name || data.user.email || "",
      role: profile?.role || "user",
      subscriptionId: profile?.subscription_id,
      createdAt: data.user.created_at || new Date().toISOString(),
    };

    if (typeof window !== "undefined") {
      localStorage.setItem("billing-user", JSON.stringify(user));
    }

    return user;
  },

  async signUp(email: string, password: string, name: string): Promise<User | null> {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name },
      },
    });

    if (error || !data.user) return null;

    // Create user profile
    await supabase.from("users").insert({
      id: data.user.id,
      email: data.user.email,
      name,
      role: "user",
    });

    const user: User = {
      id: data.user.id,
      email: data.user.email || "",
      name,
      role: "user",
      createdAt: data.user.created_at || new Date().toISOString(),
    };

    if (typeof window !== "undefined") {
      localStorage.setItem("billing-user", JSON.stringify(user));
    }

    return user;
  },

  async signOut(): Promise<void> {
    await supabase.auth.signOut();
    if (typeof window !== "undefined") {
      localStorage.removeItem("billing-user");
    }
  },

  async getCurrentUser(): Promise<User | null> {
    // Check localStorage first
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("billing-user");
      if (stored) {
        try {
          return JSON.parse(stored);
        } catch {
          // Invalid JSON, continue to check Supabase
        }
      }
    }

    // Check Supabase session
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data: profile } = await supabase
      .from("users")
      .select("*")
      .eq("id", user.id)
      .single();

    return {
      id: user.id,
      email: user.email || "",
      name: profile?.name || user.email || "",
      role: profile?.role || "user",
      subscriptionId: profile?.subscription_id,
      createdAt: user.created_at || new Date().toISOString(),
    };
  },
};

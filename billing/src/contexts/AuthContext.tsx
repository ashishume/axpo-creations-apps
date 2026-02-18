"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { authRepository, type User } from "@/lib/db";
import { invalidateAll } from "@/lib/data-cache";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<boolean>;
  signUp: (email: string, password: string, name: string) => Promise<boolean>;
  signOut: () => Promise<void>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for existing session
    const checkAuth = async () => {
      try {
        const currentUser = await authRepository.getCurrentUser();
        setUser(currentUser);
      } catch (error) {
        console.error("Auth check failed:", error);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  const signIn = async (email: string, password: string): Promise<boolean> => {
    try {
      setLoading(true);
      const loggedInUser = await authRepository.signIn(email, password);
      if (loggedInUser) {
        setUser(loggedInUser);
        return true;
      }
      return false;
    } catch (error) {
      console.error("Sign in failed:", error);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (email: string, password: string, name: string): Promise<boolean> => {
    try {
      setLoading(true);
      const newUser = await authRepository.signUp(email, password, name);
      if (newUser) {
        setUser(newUser);
        return true;
      }
      return false;
    } catch (error) {
      console.error("Sign up failed:", error);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      setLoading(true);
      await authRepository.signOut();
      invalidateAll();
      setUser(null);
    } catch (error) {
      console.error("Sign out failed:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        signIn,
        signUp,
        signOut,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

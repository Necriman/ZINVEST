"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react";
import { getSupabase } from "./supabase";

export interface User {
  id: string;
  name: string;
  email: string;
  createdAt: string;
  isAdmin: boolean;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signUp: (name: string, email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signOut: () => void;
  getAllUsers: () => Promise<User[]>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const ADMIN_EMAIL = "admin@zinvest.com";
const SESSION_KEY = "zinvest-session";

// Simple hash for password (client-side, good enough for demo — upgrade to bcrypt on server)
async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password + "zinvest_salt_2026");
  const hash = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, "0")).join("");
}

function isSupabaseConfigured(): boolean {
  return getSupabase() !== null;
}

// ─── localStorage fallback (used when Supabase not configured) ───────────────
const LS_USERS_KEY = "zinvest-users";

interface LsUser extends User { passwordHash: string; }

function lsGetUsers(): LsUser[] {
  if (typeof window === "undefined") return [];
  try { return JSON.parse(localStorage.getItem(LS_USERS_KEY) || "[]"); } catch { return []; }
}
function lsSaveUsers(users: LsUser[]) {
  localStorage.setItem(LS_USERS_KEY, JSON.stringify(users));
}

// ─── Provider ────────────────────────────────────────────────────────────────
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    try {
      const session = localStorage.getItem(SESSION_KEY);
      if (session) setUser(JSON.parse(session));
    } catch { /* ignore */ }
    setIsLoading(false);
  }, []);

  // ── Sign Up ──────────────────────────────────────────────────────────────
  const signUp = useCallback(async (name: string, email: string, password: string) => {
    const normalizedEmail = email.toLowerCase().trim();
    const passwordHash = await hashPassword(password);
    const isAdmin = normalizedEmail === ADMIN_EMAIL;

    if (isSupabaseConfigured()) {
      // Check duplicate
      const { data: existing } = await getSupabase()!
        .from("users")
        .select("id")
        .eq("email", normalizedEmail)
        .maybeSingle();

      if (existing) return { success: false, error: "An account with this email already exists." };

      const newUser = {
        name,
        email: normalizedEmail,
        password_hash: passwordHash,
        is_admin: isAdmin,
      };

      const { data, error } = await getSupabase()!
        .from("users")
        .insert(newUser)
        .select()
        .single();

      if (error || !data) return { success: false, error: error?.message || "Sign up failed." };

      // Record signup event
      await getSupabase()!.from("signups").insert({
        user_id: data.id,
        name: data.name,
        email: data.email,
      });

      const safeUser: User = {
        id: data.id,
        name: data.name,
        email: data.email,
        createdAt: data.created_at,
        isAdmin: data.is_admin,
      };
      setUser(safeUser);
      localStorage.setItem(SESSION_KEY, JSON.stringify(safeUser));
      return { success: true };

    } else {
      // localStorage fallback
      const users = lsGetUsers();
      if (users.find(u => u.email === normalizedEmail)) {
        return { success: false, error: "An account with this email already exists." };
      }
      const newUser: LsUser = {
        id: crypto.randomUUID(),
        name,
        email: normalizedEmail,
        passwordHash,
        createdAt: new Date().toISOString(),
        isAdmin,
      };
      users.push(newUser);
      lsSaveUsers(users);

      const { passwordHash: _, ...safeUser } = newUser;
      setUser(safeUser);
      localStorage.setItem(SESSION_KEY, JSON.stringify(safeUser));
      return { success: true };
    }
  }, []);

  // ── Sign In ──────────────────────────────────────────────────────────────
  const signIn = useCallback(async (email: string, password: string) => {
    const normalizedEmail = email.toLowerCase().trim();
    const passwordHash = await hashPassword(password);

    if (isSupabaseConfigured()) {
      const { data, error } = await getSupabase()!
        .from("users")
        .select("*")
        .eq("email", normalizedEmail)
        .maybeSingle();

      if (error || !data) return { success: false, error: "No account found with this email." };
      if (data.password_hash !== passwordHash) return { success: false, error: "Incorrect password." };

      const safeUser: User = {
        id: data.id,
        name: data.name,
        email: data.email,
        createdAt: data.created_at,
        isAdmin: data.is_admin,
      };
      setUser(safeUser);
      localStorage.setItem(SESSION_KEY, JSON.stringify(safeUser));
      return { success: true };

    } else {
      const users = lsGetUsers();
      const found = users.find(u => u.email === normalizedEmail);
      if (!found) return { success: false, error: "No account found with this email." };
      if (found.passwordHash !== passwordHash) return { success: false, error: "Incorrect password." };

      const { passwordHash: _, ...safeUser } = found;
      setUser(safeUser);
      localStorage.setItem(SESSION_KEY, JSON.stringify(safeUser));
      return { success: true };
    }
  }, []);

  // ── Sign Out ─────────────────────────────────────────────────────────────
  const signOut = useCallback(() => {
    setUser(null);
    localStorage.removeItem(SESSION_KEY);
  }, []);

  // ── Get All Users (admin) ────────────────────────────────────────────────
  const getAllUsers = useCallback(async (): Promise<User[]> => {
    if (isSupabaseConfigured()) {
      const { data } = await getSupabase()!
        .from("users")
        .select("id, name, email, is_admin, created_at")
        .order("created_at", { ascending: false });

      return (data || []).map(u => ({
        id: u.id,
        name: u.name,
        email: u.email,
        createdAt: u.created_at,
        isAdmin: u.is_admin,
      }));
    } else {
      return lsGetUsers().map(({ passwordHash: _, ...u }) => u);
    }
  }, []);

  return (
    <AuthContext.Provider value={{ user, isLoading, signIn, signUp, signOut, getAllUsers }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) throw new Error("useAuth must be used within an AuthProvider");
  return context;
}

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
  signInWithGoogle: () => Promise<{ success: boolean; error?: string }>;
  signOut: () => void;
  getAllUsers: () => Promise<User[]>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const ADMIN_EMAIL = "admin@zinvest.com";
const SESSION_KEY = "zinvest-session";

function createId(): string {
  const c = globalThis.crypto;
  if (c && typeof c.randomUUID === "function") return c.randomUUID();
  if (c && typeof c.getRandomValues === "function") {
    const bytes = new Uint8Array(16);
    c.getRandomValues(bytes);
    bytes[6] = (bytes[6] & 0x0f) | 0x40;
    bytes[8] = (bytes[8] & 0x3f) | 0x80;
    const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
    return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
  }
  return `id-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

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

  // ── Google / OAuth session bridge ──────────────────────────────────────────
  // When a user returns from Google sign-in, Supabase stores a session in
  // supabase.auth. We map that session onto our own `users` table so the rest of
  // the app (admin panel, progress, leaderboards) keeps working unchanged.
  useEffect(() => {
    const supabase = getSupabase();
    if (!supabase) return;

    const handleSession = async (session: { user?: any } | null) => {
      const su = session?.user;
      if (!su) return;
      const email = String(su.email ?? "").toLowerCase().trim();
      if (!email) return;
      const meta = su.user_metadata ?? {};
      const name = meta.full_name || meta.name || email.split("@")[0] || "User";
      const isAdmin = email === ADMIN_EMAIL;

      try {
        const { data: existing } = await supabase
          .from("users")
          .select("*")
          .eq("email", email)
          .maybeSingle();

        let row = existing;
        if (!existing) {
          const { data: inserted } = await supabase
            .from("users")
            .insert({ id: su.id, name, email, password_hash: "oauth_google", is_admin: isAdmin })
            .select()
            .single();
          row = inserted;
          if (inserted) {
            await supabase.from("signups").insert({ user_id: inserted.id, name, email });
          }
        }

        const safeUser: User = {
          id: row?.id ?? su.id,
          name: row?.name ?? name,
          email: row?.email ?? email,
          createdAt: row?.created_at ?? new Date().toISOString(),
          isAdmin: row?.is_admin ?? isAdmin,
        };
        setUser(safeUser);
        localStorage.setItem(SESSION_KEY, JSON.stringify(safeUser));
      } catch {
        const safeUser: User = { id: su.id, name, email, createdAt: new Date().toISOString(), isAdmin };
        setUser(safeUser);
        localStorage.setItem(SESSION_KEY, JSON.stringify(safeUser));
      }
    };

    supabase.auth.getSession().then(({ data }) => handleSession(data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) handleSession(session);
    });
    return () => { sub.subscription.unsubscribe(); };
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
        id: createId(),
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

  // ── Sign In with Google (OAuth) ────────────────────────────────────────────
  const signInWithGoogle = useCallback(async () => {
    const supabase = getSupabase();
    if (!supabase) {
      return {
        success: false,
        error: "Google sign-in is not configured yet. Add your Supabase keys and enable the Google provider.",
      };
    }
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/dashboard` },
    });
    if (error) return { success: false, error: error.message };
    return { success: true };
  }, []);

  // ── Sign Out ─────────────────────────────────────────────────────────────
  const signOut = useCallback(() => {
    setUser(null);
    localStorage.removeItem(SESSION_KEY);
    const supabase = getSupabase();
    if (supabase) supabase.auth.signOut().catch(() => {});
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
    <AuthContext.Provider value={{ user, isLoading, signIn, signUp, signInWithGoogle, signOut, getAllUsers }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) throw new Error("useAuth must be used within an AuthProvider");
  return context;
}

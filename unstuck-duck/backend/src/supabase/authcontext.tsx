import React, { createContext, useContext, useEffect, useState } from "react";
import { clientSupabase } from "./supabase";
import { User } from "@supabase/supabase-js";

// Define your UserProfile type based on your database
export interface UserProfile {
  first_name: string;
  last_name: string | null;
  is_teacher: boolean | null;
  username: string;
  email: string | null;
  date_created: string | null;
}

// Define the signup data type
export interface SignUpData {
  username: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  isTeacher: boolean;
}

// Define the shape of our auth context
interface AuthContextType {
  // State - these can be null because they might not exist yet
  user: User | null; // null when logged out
  profile: UserProfile | null; // null when logged out or not loaded
  loading: boolean; // true while checking auth status

  // Functions - these don't return values, just promises
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (data: SignUpData) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

    const fetchProfile = async (userId: string): Promise<void> => {
    // First, get the user info
    const { data: userInfo, error: userInfoError } = await clientSupabase
        .from("User Info")
        .select(
        `
        first_name,
        last_name,
        is_teacher,
        user_id
        `
        )
        .eq("user_id", userId)
        .single();

    if (userInfoError) {
        console.error("Error fetching user info:", userInfoError);
        return;
    }

    // Then, get the user data from Users table
    const { data: userData, error: userDataError } = await clientSupabase
        .from("Users")
        .select(
        `
        username,
        email,
        date_created
        `
        )
        .eq("user_id", userId) // or .eq("id", userId) depending on your schema
        .single();

    if (userDataError) {
        console.error("Error fetching user data:", userDataError);
        return;
    }

    if (userInfo && userData) {
        setProfile({
        first_name: userInfo.first_name,
        last_name: userInfo.last_name,
        is_teacher: userInfo.is_teacher,
        username: userData.username,
        email: userData.email,
        date_created: userData.date_created,
        });
    }
    };

  useEffect(() => {
    clientSupabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id); 
      }
      setLoading(false);
    });

    const {
      data: { subscription },
    } = clientSupabase.auth.onAuthStateChange(async (event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        await fetchProfile(session.user.id); 
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string): Promise<void> => {
    const { error } = await clientSupabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
  };

  const signUp = async (data: SignUpData): Promise<void> => {
    const response = await fetch("/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error);
    }
    // After successful signup, you might want to auto-login
    await signIn(data.email, data.password);
  };

  const signOut = async (): Promise<void> => {
    await clientSupabase.auth.signOut();
    // Auth state listener will clear user/profile
  };

  return (
    <AuthContext.Provider
      value={{ user, profile, loading, signIn, signUp, signOut }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// Custom hook with proper error handling
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

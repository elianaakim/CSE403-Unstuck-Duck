import React, { createContext, useContext, useEffect, useState } from "react";
import { clientSupabase } from "./supabase";
import { User } from "@supabase/supabase-js";

// Define UserProfile
export interface UserProfile {
  first_name: string;
  last_name: string | null;
  username: string;
  email: string | null;
  created_at: string;
}

// Define the signup data type
export interface SignUpData {
  username: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

// Define the shape of auth context
interface AuthContextType {
  user: User | null; // null when logged out
  profile: UserProfile | null; // null when logged out or not loaded
  loading: boolean; // true while checking auth status

  signIn: (email: string, password: string) => Promise<void>;
  signUp: (data: SignUpData) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Get the user info
  const fetchProfile = async (userId: string): Promise<void> => {
    try {
      const { data: userInfo, error: userInfoError } = await clientSupabase
        .from("User_Info")
        .select(
          `
                first_name,
                last_name,
                user_id
                `
        )
        .eq("user_id", userId)
        .single();

      if (userInfoError) {
        // console.error("Error fetching user info:", userInfoError);
        console.error(
          "Error fetching user info:",
          JSON.stringify(userInfoError)
        );
        console.error("Code:", userInfoError.code);
        console.error("Message:", userInfoError.message);
        console.error("Details:", userInfoError.details);
        setLoading(false);
        return;
      }

      // Get the user data from Users table
      const { data: userData, error: userDataError } = await clientSupabase
        .from("Users")
        .select(
          `
                username,
                email,
                created_at
                `
        )
        .eq("user_id", userId)
        .single();

      if (userDataError) {
        console.error("Error fetching user data:", userDataError);
        setLoading(false);
        return;
      }

      if (userInfo && userData) {
        setProfile({
          first_name: userInfo.first_name,
          last_name: userInfo.last_name,
          username: userData.username,
          email: userData.email,
          created_at: userData.created_at,
        });
        setLoading(false);
      }
    } catch (error) {
      console.error("fetchProfile threw:", error);
      setLoading(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    clientSupabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        setTimeout(() => {
          fetchProfile(session.user.id);
        }, 0);
      } else {
        setLoading(false);
      }
    });

    const {
      data: { subscription },
    } = clientSupabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        setTimeout(() => {
          fetchProfile(session.user.id);
        }, 0);
      } else {
        setProfile(null);
        setLoading(false);
      }
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
    const response = await fetch("/api/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error);
    }
    // await signIn(data.email, data.password);
    signIn(data.email, data.password);
  };

  const signOut = async (): Promise<void> => {
    await clientSupabase.auth.signOut();
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

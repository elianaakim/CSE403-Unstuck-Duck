import { createClient } from "@supabase/supabase-js";
import { type Database } from "./supabaseTypes";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY!;

// Server-side client with admin privileges
export const getServiceSupabase = () =>
  createClient<Database>(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

// Client-side client with anon key (for browser usage)
export const clientSupabase = createClient<Database>(
  supabaseUrl,
  supabaseAnonKey
);

// Smart client that picks the right one based on environment
export const supabase = () =>
  typeof window === "undefined" ? getServiceSupabase() : clientSupabase;

// Helper to get a user with admin privileges
export const getUserAsAdmin = async (token: string) => {
  const { data, error } = await getServiceSupabase().auth.getUser(token);
  if (error) throw error;
  return data;
};

// Table
export const tables = {
  users: "users",
  userInfo: "user_info",
} as const;

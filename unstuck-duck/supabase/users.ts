import { getServiceSupabase, tables } from "./supabase";
// import { type Database } from "../supabaseTypes";

export interface CreateUserInput {
  username: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

export interface UserWithProfile {
  id: string; 
  username: string;
  email: string | null;
  created_at: string | null;
  first_name: string;
  last_name: string | null;
}

export async function createUserWithProfile(
  input: CreateUserInput
): Promise<UserWithProfile> {
  const supabase = getServiceSupabase();

  // Create auth user 
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email: input.email,
    password: input.password,
    options: {
      data: {
        username: input.username,
        first_name: input.firstName,
        last_name: input.lastName,
      },
    },
  });

  if (authError) throw authError;
  if (!authData.user) throw new Error("User creation failed");
  const userId = authData.user.id;

  // Insert into users table
  const { data: user, error: userError } = await supabase
    .from("Users") 
    .insert({
        user_id: userId,
      username: input.username,
      email: input.email,
      created_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (userError) throw userError;

  // Insert into user_info table
  const { error: infoError } = await supabase
    .from("User_Info") 
    .insert({
      user_id: userId, 
      first_name: input.firstName,
      last_name: input.lastName,
    });

  if (infoError) throw infoError;

  return {
    id: userId,
    username: user.username,
    email: user.email,
    created_at: user.created_at,
    first_name: input.firstName,
    last_name: input.lastName,
  };
}

export async function getUserByEmail(email: string) {
  const supabase = getServiceSupabase();

  const { data, error } = await supabase
    .from("Users")
    .select(
      `
      *,
      "User Info" (*)
    `
    )
    .eq("email", email)
    .single();

  if (error) throw error;
  return data;
}

export async function getUserProfile(userId: string) {
  const supabase = getServiceSupabase();

  const { data, error } = await supabase
    .from("User_Info")
    .select(
      `
      first_name,
      last_name,
      is_teacher,
      Users!inner (
        username,
        email,
        date_created
      )
    `
    )
    .eq("user_id", userId)
    .single();

  if (error) throw error;
  return data;
}

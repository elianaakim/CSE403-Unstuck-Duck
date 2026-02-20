import { getServiceSupabase, tables } from "./supabase";
// import { type Database } from "../supabaseTypes";

export interface CreateUserInput {
  username: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  isTeacher: boolean;
}

export interface UserWithProfile {
  id: string; 
  username: string;
  email: string | null;
  date_created: string | null;
  first_name: string;
  last_name: string | null;
  is_teacher: boolean | null;
}

export async function createUserWithProfile(
  input: CreateUserInput
): Promise<UserWithProfile> {
  const supabase = getServiceSupabase();

  // 1. Create auth user (this handles password hashing)
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

  // 2. Insert into your users table
  const { data: user, error: userError } = await supabase
    .from("Users") 
    .insert({
      username: input.username,
      email: input.email,
      date_created: new Date().toISOString(),
    })
    .select()
    .single();

  if (userError) throw userError;

  // 3. Insert into user_info table
  const { error: infoError } = await supabase
    .from("User Info") 
    .insert({
      user_id: userId, 
      first_name: input.firstName,
      last_name: input.lastName,
      is_teacher: input.isTeacher,
    });

  if (infoError) throw infoError;

  return {
    id: userId,
    username: user.username,
    email: user.email,
    date_created: user.date_created,
    first_name: input.firstName,
    last_name: input.lastName,
    is_teacher: input.isTeacher,
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
    .from("User Info")
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

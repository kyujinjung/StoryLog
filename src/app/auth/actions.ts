"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createClient, hasSupabaseEnv } from "@/lib/supabase/server";

export async function signOutAction() {
  if (!hasSupabaseEnv()) {
    redirect("/login");
  }

  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/");
}

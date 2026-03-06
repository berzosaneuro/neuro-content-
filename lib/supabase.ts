import { createClient } from "@supabase/supabase-js";

const url  = process.env.NEXT_PUBLIC_SUPABASE_URL  ?? "";
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

export const supabase = url && anon ? createClient(url, anon) : null;

/* ── helpers ── */
export async function loadCalendar(userId: string) {
  if (!supabase) return null;
  const { data } = await supabase
    .from("calendars")
    .select("data")
    .eq("user_id", userId)
    .single();
  return data?.data ?? null;
}

export async function saveCalendar(userId: string, calendarData: unknown) {
  if (!supabase) return;
  await supabase
    .from("calendars")
    .upsert({ user_id: userId, data: calendarData, updated_at: new Date().toISOString() });
}

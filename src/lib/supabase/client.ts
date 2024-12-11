import { createClient } from "@supabase/supabase-js";
import type { ColorScore } from "./types";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient<{ color_scores: ColorScore }>(
  supabaseUrl,
  supabaseAnonKey
);

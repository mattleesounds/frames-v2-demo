import { createClient } from "@supabase/supabase-js";
import type { ColorScore } from "./types";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export const supabaseAdmin = createClient<{ color_scores: ColorScore }>(
  supabaseUrl,
  supabaseServiceKey
);

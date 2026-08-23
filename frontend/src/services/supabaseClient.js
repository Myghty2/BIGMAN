import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "https://your-supabase-project.supabase.co";
const supabasePublishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || "your-publishable-key";

export const supabase = createClient(
  supabaseUrl,
  supabasePublishableKey
);

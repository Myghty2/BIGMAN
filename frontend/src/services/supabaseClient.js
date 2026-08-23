import { createClient } from "@supabase/supabase-js";

const supabaseUrl =
  import.meta.env.VITE_SUPABASE_URL ||
  "https://vxpjdlviuvpibljudurj.supabase.co";

const supabasePublishableKey =
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ4cGpkbHZpdXZwaWJsanVkdXJqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc0NTgxMTIsImV4cCI6MjEwMzAzNDExMn0.cRzNIjNTEEoXCmbhPjaWuw39BJVK5YY3TYXc390Jupw";

export const supabase = createClient(
  supabaseUrl,
  supabasePublishableKey
);

import { createBrowserClient } from "@supabase/ssr"

const supabaseUrl = "https://olsgdtmuuezsossdfmxs.supabase.co"
const supabaseAnonKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9sc2dkdG11dWV6c29zc2RmbXhzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgwNTE0NjIsImV4cCI6MjA3MzYyNzQ2Mn0.e7gphKDCtRUytDL9JvmLAj4h_9W9z8vYa2TDw2DjQRo"

export function createClient() {
  return createBrowserClient(supabaseUrl, supabaseAnonKey)
}

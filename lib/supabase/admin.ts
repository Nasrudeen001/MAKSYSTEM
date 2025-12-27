import { createClient } from "@supabase/supabase-js"

const supabaseUrl = "https://olsgdtmuuezsossdfmxs.supabase.co"
const supabaseServiceKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9sc2dkdG11dWV6c29zc2RmbXhzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODA1MTQ2MiwiZXhwIjoyMDczNjI3NDYyfQ.DfDxV3PIgtDzh0DQCTEUKQXDL9YPzQcmiWQFFfYIRf4"

export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

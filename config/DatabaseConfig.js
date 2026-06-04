import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm'

const supabaseUrl = 'https://vvvxqvkqemmyqtsujgya.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ2dnhxdmtxZW1teXF0c3VqZ3lhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk4MTc1MTUsImV4cCI6MjA5NTM5MzUxNX0.Xb-cQseJrhd7ds__GKDtdTQTfJMBn2YgHu3SbUBDSxs'

export const supabase = createClient(supabaseUrl, supabaseKey)

if (typeof window !== 'undefined') {
    window.supabase = supabase
}

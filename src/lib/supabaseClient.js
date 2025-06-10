import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://gfomrzipxozpifrykptq.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdmb21yemlweG96cGlmcnlrcHRxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk1NjMxMzEsImV4cCI6MjA2NTEzOTEzMX0.OU6ipvXjn3YMk98MDRLkzUfzoyb3Y8PS_fAGdSC5EbQ';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
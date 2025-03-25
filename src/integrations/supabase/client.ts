
import { createClient } from '@supabase/supabase-js';

// Use hardcoded values as fallbacks when env variables aren't available
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://ntmogcnenelmbggucipy.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im50bW9nY25lbmVsbWJnZ3VjaXB5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDI1Njg0ODMsImV4cCI6MjA1ODE0NDQ4M30.CbYxmzJxiOiI7aON5GTtZgAlO9-4Ycb-FaYJT4D7oWM';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    flowType: 'implicit',
    persistSession: true,
    autoRefreshToken: true
  }
});

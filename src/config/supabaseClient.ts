import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://rjlfjdpjsukdzwmxugau.supabase.co/';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJqbGZqZHBqc3VrZHp3bXh1Z2F1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk1NDI0MzYsImV4cCI6MjA3NTExODQzNn0.SnjnB9SWUP3QmSl02NzdZiJdst7_BgaMvPgvmfkLq0Y';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

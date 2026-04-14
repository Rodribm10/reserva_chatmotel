
import { createClient } from '@supabase/supabase-js';
import { Database } from './types.ts';

// ATENÇÃO: Substitua pelos dados do seu projeto Supabase.
// Você encontra esses valores no painel do seu projeto em:
// Settings -> API
const SUPABASE_URL = 'https://qdpzlxqsjbyxcajinixi.supabase.co'; // Ex: 'https://xxxxxxxx.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFkcHpseHFzamJ5eGNhamluaXhpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE2MjMyNTYsImV4cCI6MjA2NzE5OTI1Nn0.9qNMBqsE_6WmCm4Qcgbaf1xNtHdU5EV4w9kYeWT3Xfw'; // A chave anônima (public)

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY);
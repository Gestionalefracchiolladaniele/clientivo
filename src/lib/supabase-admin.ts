import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

// Bypassa RLS — usare SOLO in server actions e route handlers mai esposto al browser
export const createAdminClient = () => {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
};

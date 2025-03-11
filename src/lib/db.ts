import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

// Usar createClientComponentClient en lugar de createClient
export const supabase = createClientComponentClient(); 
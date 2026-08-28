import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://zgvxwgawiewogdwqnxiz.supabase.co/rest/v1/';
const supabaseKey = 'sb_publishable_IYcha4eP82-xpzdnT-wfXA_T-Wwp0O8';

export const supabase = createClient(supabaseUrl, supabaseKey);
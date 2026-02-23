
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://pdrtxbaklbsjqgetswlm.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBkcnR4YmFrbGJzanFnZXRzd2xtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk2OTE1NDQsImV4cCI6MjA4NTI2NzU0NH0.g5WUbd7l7JWukXLWDJ7iR5JWe9Isy_LjfhnmuVy9qkI';

async function check() {
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log("Checking profiles table RLS/Triggers...");

    // Check if we can select
    const { data: profiles, error: pError } = await supabase.from('profiles').select('*').limit(1);
    if (pError) console.error("Error selecting profiles:", pError);
    else console.log("Profiles sample:", profiles);

    // Check recent leads
    const { data: leads, error: lError } = await supabase.from('leads').select('id, organization_id').limit(1);
    if (lError) console.error("Error selecting leads:", lError);
    else console.log("Leads sample:", leads);
}

check();

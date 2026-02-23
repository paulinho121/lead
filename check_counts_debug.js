
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://pdrtxbaklbsjqgetswlm.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBkcnR4YmFrbGJzanFnZXRzd2xtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk2OTE1NDQsImV4cCI6MjA4NTI2NzU0NH0.g5WUbd7l7JWukXLWDJ7iR5JWe9Isy_LjfhnmuVy9qkI';

async function check() {
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log("Checking tables...");

    const { count: orgCount, error: oError } = await supabase.from('organizations').select('*', { count: 'exact', head: true });
    if (oError) console.error("Error checking organizations:", oError);
    else console.log("Total Organizations:", orgCount);

    const { count: profCount, error: pError } = await supabase.from('profiles').select('*', { count: 'exact', head: true });
    if (pError) console.error("Error checking profiles:", pError);
    else console.log("Total Profiles:", profCount);
}

check();

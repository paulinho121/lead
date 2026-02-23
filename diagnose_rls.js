
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://pdrtxbaklbsjqgetswlm.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBkcnR4YmFrbGJzanFnZXRzd2xtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk2OTE1NDQsImV4cCI6MjA4NTI2NzU0NH0.g5WUbd7l7JWukXLWDJ7iR5JWe9Isy_LjfhnmuVy9qkI';

async function diagnose() {
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log("--- Supabase RLS Diagnostic ---");

    // Check RLS status and policies via RPC or direct query if possible
    // Since we don't have direct access to pg_catalog via anon key usually, 
    // we'll try to infer by making queries as a "nobody".

    console.log("Testing anonymous access (should be blocked by RLS)...");
    const { data, error, count } = await supabase.from('leads').select('*', { count: 'exact', head: true });

    if (error) {
        console.log("Anonymous access blocked (Good):", error.message);
    } else {
        console.log("CRITICAL: Anonymous access ALLOWED. Total visible:", count);
    }

    console.log("\nChecking Profiles roles...");
    const { data: profiles } = await supabase.from('profiles').select('email, role');
    console.log("Profiles found:", profiles?.length || 0);
    profiles?.forEach(p => console.log(`- ${p.email}: ${p.role}`));

    console.log("\nChecking Organization counts...");
    const { count: orgCount } = await supabase.from('organizations').select('*', { count: 'exact', head: true });
    console.log("Total Organizations visible:", orgCount);
}

diagnose();

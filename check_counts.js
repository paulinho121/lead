
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing env vars');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
    const { count: assignedCount } = await supabase
        .from('leads')
        .select('*', { count: 'exact', head: true })
        .not('user_id', 'is', null);

    const { count: totalCount } = await supabase
        .from('leads')
        .select('*', { count: 'exact', head: true });

    console.log(`Leads atribuídos: ${assignedCount}`);
    console.log(`Leads totais no banco: ${totalCount}`);
}

check();


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
    const { data: stats, error } = await supabase
        .from('leads')
        .select('uf, status, contacted')
        .eq('uf', 'RJ');

    if (error) {
        console.error(error);
        return;
    }

    console.log(`Total RJ leads: ${stats.length}`);
    console.log(`Enriched RJ: ${stats.filter(l => l.status === 'enriched').length}`);
    console.log(`Enriched & Not Contacted RJ: ${stats.filter(l => l.status === 'enriched' && !l.contacted).length}`);

    const { data: allStats } = await supabase.from('leads').select('uf, status', { count: 'exact', head: false });
    const countsByUf = (allStats || []).reduce((acc, lead) => {
        acc[lead.uf] = (acc[lead.uf] || 0) + 1;
        return acc;
    }, {});
    console.log('Counts by UF:', countsByUf);
}

check();

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

console.log('Testing Supabase Connectivity...');
console.log('URL:', supabaseUrl);
console.log('Service Key starts with:', supabaseServiceKey ? supabaseServiceKey.substring(0, 10) + '...' : 'null');

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function test() {
    try {
        console.log('Attempting to fetch donations table info...');
        const { data, error } = await supabase
            .from('donations')
            .select('count', { count: 'exact', head: true });

        if (error) {
            console.error('❌ Supabase Error:', error);
            if (error.cause) console.error('🔍 Cause:', error.cause);
        } else {
            console.log('✅ Connectivity successful!');
            console.log('Total donations found:', data);
        }
    } catch (err) {
        console.error('❌ Unexpected Error:', err);
        if (err.cause) {
            console.error('🔍 Cause:', err.cause);
            console.error('🔍 Cause Name:', err.cause.name);
            console.error('🔍 Cause Code:', err.cause.code);
        }
    }
}

test();

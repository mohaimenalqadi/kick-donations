
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

async function testRpcStats() {
    console.log('Testing get_donation_stats RPC...');
    try {
        const { data, error } = await supabase.rpc('get_donation_stats', {
            time_range: '24 hours'
        });

        if (error) {
            console.error('❌ RPC Error:', error);
        } else {
            console.log('✅ Success! RPC returned:', data);
        }
    } catch (err) {
        console.error('❌ Catch Error:', err);
    }
}

testRpcStats();

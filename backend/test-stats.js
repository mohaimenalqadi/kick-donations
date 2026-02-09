
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

async function testStats() {
    console.log('Testing stats query...');
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        console.log(`Querying donations since: ${today.toISOString()}`);

        const { data: todayDonations, error } = await supabase
            .from('donations')
            .select('amount')
            .gte('created_at', today.toISOString());

        if (error) {
            console.error('❌ Supabase Error:', error);
        } else {
            console.log('✅ Success! Found:', todayDonations.length, 'donations');
            const total = todayDonations.reduce((sum, d) => sum + parseFloat(d.amount), 0);
            console.log('Total amount:', total);
        }
    } catch (err) {
        console.error('❌ Catch Error:', err);
    }
}

testStats();

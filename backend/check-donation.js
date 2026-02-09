
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

async function checkDonation() {
    const id = 'c15ee35c-560e-467c-b2f2-1b4a0c31f034';
    console.log(`Checking donation ${id}...`);

    const { data: donation, error } = await supabase
        .from('donations')
        .select('*')
        .eq('id', id)
        .single();

    if (error) {
        console.error('❌ Error:', error);
    } else {
        console.log('✅ Donation found:', donation);
    }
}

checkDonation();

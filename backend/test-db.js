
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Missing Supabase configuration!');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testConnection() {
    console.log('Testing Supabase connection...');

    // Check users table
    const { data: users, error: userError } = await supabase.from('users').select('count', { count: 'exact', head: true });
    if (userError) {
        console.error('❌ Error accessing users table:', userError);
    } else {
        console.log('✅ Users table accessible. Count:', users);
    }

    // Check donations table
    const { data: donations, error: donationError } = await supabase.from('donations').select('count', { count: 'exact', head: true });
    if (donationError) {
        console.error('❌ Error accessing donations table:', donationError);
    } else {
        console.log('✅ Donations table accessible. Count:', donations);
    }

    // Test insert (rollback or just a dummy check?)
    // Actually, just reading schema info if possible, but reading is enough to prove existence.
}

testConnection();

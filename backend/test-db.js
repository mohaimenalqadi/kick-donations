
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
    const { data: users, error: userError } = await supabase.from('users').select('id, username, role');
    if (userError) {
        console.error('❌ Error accessing users table:', userError);
    } else {
        console.log('✅ Users found:', users.map(u => ({ id: u.id, username: u.username, role: u.role })));
    }
}

testConnection();

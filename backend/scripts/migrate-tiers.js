require('dotenv').config();
const { supabase } = require('../src/config/database');

const NEW_TIERS = [
    {
        tier_key: 'tier1',
        label: 'بسيط',
        min_amount: 1,
        duration: 10000,
        color: '#10b981',
        background_url: 'https://cdn.pixabay.com/video/2021/04/12/70860-536962295_tiny.mp4'
    },
    {
        tier_key: 'tier2',
        label: 'فضي',
        min_amount: 5,
        duration: 15000,
        color: '#3b82f6',
        background_url: 'https://cdn.pixabay.com/video/2023/10/20/185792-876387995_tiny.mp4'
    },
    {
        tier_key: 'tier3',
        label: 'ذهبي',
        min_amount: 10,
        duration: 30000,
        color: '#f59e0b',
        background_url: 'https://cdn.pixabay.com/video/2021/09/01/87243-597551522_tiny.mp4'
    },
    {
        tier_key: 'tier4',
        label: 'بلاتيني',
        min_amount: 20,
        duration: 45000,
        color: '#8b5cf6',
        background_url: 'https://cdn.pixabay.com/video/2022/11/04/137651-766795861_tiny.mp4'
    },
    {
        tier_key: 'tier5',
        label: 'ملكي',
        min_amount: 30,
        duration: 60000,
        color: '#ef4444',
        background_url: 'https://cdn.pixabay.com/video/2023/10/16/185208-875150826_tiny.mp4'
    },
    {
        tier_key: 'tier6',
        label: 'أسطوري',
        min_amount: 40,
        duration: 90000,
        color: '#e879f9',
        background_url: 'https://cdn.pixabay.com/video/2023/10/16/185208-875150826_tiny.mp4'
    }
];

async function migrateTiers() {
    console.log('🚀 Starting Tiers Migration...');

    try {
        // 1. Clear existing tiers
        const { error: deleteError } = await supabase
            .from('tier_settings')
            .delete()
            .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete everything

        if (deleteError) throw deleteError;
        console.log('✅ Old tiers cleared.');

        // 2. Insert new tiers
        const { error: insertError } = await supabase
            .from('tier_settings')
            .insert(NEW_TIERS);

        if (insertError) throw insertError;
        console.log('✅ New tiers inserted successfully.');

    } catch (err) {
        console.error('❌ Migration failed:', err.message);
    }
}

migrateTiers();

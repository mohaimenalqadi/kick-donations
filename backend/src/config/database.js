'use strict';

const { createClient } = require('@supabase/supabase-js');

/**
 * Creates the Supabase client. The service-role key bypasses RLS, so this
 * client must only ever live on the server.
 * @param {{ supabaseUrl: string, supabaseServiceKey: string }} config
 */
function createDatabase(config) {
    return createClient(config.supabaseUrl, config.supabaseServiceKey, {
        auth: { autoRefreshToken: false, persistSession: false },
    });
}

module.exports = { createDatabase };

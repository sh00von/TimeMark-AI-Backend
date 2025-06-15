require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const { logger } = require('../utils/logger');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  logger.info('Missing Supabase credentials');
  throw new Error('Missing Supabase credentials');
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: true,
    detectSessionInUrl: false
  },
  global: {
    headers: {
      'x-application-name': 'ytsub'
    }
  }
});

// Set access token expiration to 30 days (in seconds)
const THIRTY_DAYS_IN_SECONDS = 30 * 24 * 60 * 60;

// Update session expiration when signing in
supabase.auth.onAuthStateChange((event, session) => {
  if (event === 'SIGNED_IN' && session) {
    session.expires_at = Math.floor(Date.now() / 1000) + THIRTY_DAYS_IN_SECONDS;
  }
});

logger.info('Supabase client initialized successfully');

module.exports = supabase; 
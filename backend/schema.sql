-- Kick Donation Platform - Database Schema
-- Run this in Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (Admins/Moderators)
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) DEFAULT 'moderator' CHECK (role IN ('admin', 'moderator')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Donations table
CREATE TABLE IF NOT EXISTS donations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    donor_name VARCHAR(100) NOT NULL,
    amount DECIMAL(10,2) NOT NULL CHECK (amount > 0 AND amount <= 10000),
    message TEXT DEFAULT '',
    tier VARCHAR(20) NOT NULL CHECK (tier IN ('basic', 'medium', 'professional', 'cinematic', 'legendary')),
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'live', 'done')),
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    displayed_at TIMESTAMPTZ
);

-- Activity logs table
CREATE TABLE IF NOT EXISTS activity_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(50) NOT NULL,
    details JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_donations_status ON donations(status);
CREATE INDEX IF NOT EXISTS idx_donations_created ON donations(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_donations_tier ON donations(tier);
CREATE INDEX IF NOT EXISTS idx_logs_user ON activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_logs_action ON activity_logs(action);

-- Row Level Security (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE donations ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

-- Policies for service role (backend uses service key)
CREATE POLICY "Service role can do everything on users" ON users
    FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Service role can do everything on donations" ON donations
    FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Service role can do everything on activity_logs" ON activity_logs
    FOR ALL USING (true) WITH CHECK (true);

-- View for recent donations (last 24 hours)
CREATE OR REPLACE VIEW recent_donations AS
SELECT 
    id,
    donor_name,
    amount,
    message,
    tier,
    status,
    created_at,
    displayed_at
FROM donations
WHERE created_at > NOW() - INTERVAL '24 hours'
ORDER BY created_at DESC;

-- Function to get donation statistics
CREATE OR REPLACE FUNCTION get_donation_stats(time_range INTERVAL DEFAULT '24 hours')
RETURNS TABLE (
    total_amount DECIMAL,
    total_count BIGINT,
    avg_amount DECIMAL,
    tier_breakdown JSONB
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COALESCE(SUM(amount), 0) as total_amount,
        COUNT(*) as total_count,
        COALESCE(AVG(amount), 0) as avg_amount,
        jsonb_object_agg(tier, tier_count) as tier_breakdown
    FROM (
        SELECT tier, COUNT(*) as tier_count
        FROM donations
        WHERE created_at > NOW() - time_range
        GROUP BY tier
    ) tier_stats,
    (
        SELECT SUM(amount), COUNT(*), AVG(amount)
        FROM donations
        WHERE created_at > NOW() - time_range
    ) totals;
END;
$$ LANGUAGE plpgsql;

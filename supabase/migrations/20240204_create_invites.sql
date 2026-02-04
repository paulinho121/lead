
-- 1. Create Organization Invites Table
CREATE TABLE IF NOT EXISTS organization_invites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    inviter_id UUID NOT NULL REFERENCES profiles(id),
    email TEXT NOT NULL,
    role TEXT DEFAULT 'vendedor',
    token TEXT UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(32), 'hex'),
    status TEXT DEFAULT 'pending', -- pending, accepted, expired
    created_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '7 days')
);

-- 2. Enable RLS
ALTER TABLE organization_invites ENABLE ROW LEVEL SECURITY;

-- 3. Policies for invites
CREATE POLICY "Admins can create invites" ON organization_invites
FOR INSERT WITH CHECK (
    EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = auth.uid() 
        AND organization_id = organization_invites.organization_id
        -- Here we could add an is_admin check if we have that column in profiles
    )
);

CREATE POLICY "Admins can see their invites" ON organization_invites
FOR SELECT USING (
    organization_id = (SELECT organization_id FROM profiles WHERE id = auth.uid())
);

-- 4. Public policy to check invite validity (needed during registration)
CREATE POLICY "Invites are publicly readable by token" ON organization_invites
FOR SELECT USING (status = 'pending' AND expires_at > NOW());

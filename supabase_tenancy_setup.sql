
-- 1. Create Organizations Table
CREATE TABLE IF NOT EXISTS organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    niche TEXT,
    description TEXT,
    tone_of_voice TEXT DEFAULT 'Profissional',
    brands TEXT,
    goal TEXT,
    website TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Add organization_id to profiles if not exists
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'organization_id') THEN
        ALTER TABLE profiles ADD COLUMN organization_id UUID REFERENCES organizations(id);
    END IF;
END $$;

-- 3. Add organization_id to leads if not exists
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'leads' AND column_name = 'organization_id') THEN
        ALTER TABLE leads ADD COLUMN organization_id UUID REFERENCES organizations(id);
    END IF;
END $$;

-- 4. Enable RLS for leads
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

-- 5. Create policy to isolate leads by organization
-- Replace THE_POLICY_NAME with a descriptive name
DROP POLICY IF EXISTS "Users can only see leads from their organization" ON leads;
CREATE POLICY "Users can only see leads from their organization" ON leads
FOR ALL USING (
    organization_id = (SELECT organization_id FROM profiles WHERE id = auth.uid())
);

-- 6. Create policy for profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can only see profiles from their organization" ON profiles;
CREATE POLICY "Users can only see profiles from their organization" ON profiles
FOR ALL USING (
    organization_id = (SELECT organization_id FROM profiles WHERE id = auth.uid()) OR id = auth.uid()
);

-- 7. Create policy for organizations
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can only see their own organization" ON organizations;
CREATE POLICY "Users can only see their own organization" ON organizations
FOR ALL USING (
    id = (SELECT organization_id FROM profiles WHERE id = auth.uid())
);

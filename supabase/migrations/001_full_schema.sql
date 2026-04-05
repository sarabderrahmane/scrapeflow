-- ============================================
-- SCRAPING TOOL - Full Database Schema
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- 1. PROFILES
-- ============================================
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT DEFAULT '',
  avatar_url TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- 2. PROJECTS
-- ============================================
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  owner_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 3. PROJECT MEMBERS
-- ============================================
CREATE TABLE project_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('owner', 'editor', 'viewer')) DEFAULT 'viewer',
  invited_at TIMESTAMPTZ DEFAULT NOW(),
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(project_id, user_id)
);

ALTER TABLE project_members ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 4. SEARCH QUERIES
-- ============================================
CREATE TABLE search_queries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  query_text TEXT NOT NULL,
  search_type TEXT NOT NULL CHECK (search_type IN ('serp', 'maps')),
  country TEXT DEFAULT 'us',
  language TEXT DEFAULT 'en',
  status TEXT NOT NULL CHECK (status IN ('pending', 'processing', 'completed', 'failed')) DEFAULT 'pending',
  error_message TEXT,
  results_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES profiles(id)
);

ALTER TABLE search_queries ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 5. SERP RESULTS
-- ============================================
CREATE TABLE serp_results (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  query_id UUID NOT NULL REFERENCES search_queries(id) ON DELETE CASCADE,
  position INTEGER,
  title TEXT,
  link TEXT,
  snippet TEXT,
  domain TEXT,
  displayed_link TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE serp_results ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 6. MAPS RESULTS
-- ============================================
CREATE TABLE maps_results (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  query_id UUID NOT NULL REFERENCES search_queries(id) ON DELETE CASCADE,
  position INTEGER,
  title TEXT,
  address TEXT,
  phone TEXT,
  rating NUMERIC(2,1),
  reviews_count INTEGER,
  website TEXT,
  category TEXT,
  place_id TEXT,
  thumbnail TEXT,
  latitude NUMERIC(10,7),
  longitude NUMERIC(10,7),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE maps_results ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 7. RLS POLICIES
-- ============================================

-- Projects: members can view
CREATE POLICY "Members can view projects"
  ON projects FOR SELECT
  USING (
    id IN (SELECT project_id FROM project_members WHERE user_id = auth.uid())
  );

-- Projects: only authenticated users can create
CREATE POLICY "Authenticated users can create projects"
  ON projects FOR INSERT
  WITH CHECK (auth.uid() = owner_id);

-- Projects: owners can update
CREATE POLICY "Owners can update projects"
  ON projects FOR UPDATE
  USING (
    id IN (SELECT project_id FROM project_members WHERE user_id = auth.uid() AND role = 'owner')
  );

-- Projects: owners can delete
CREATE POLICY "Owners can delete projects"
  ON projects FOR DELETE
  USING (
    id IN (SELECT project_id FROM project_members WHERE user_id = auth.uid() AND role = 'owner')
  );

-- Project members: members can view other members
CREATE POLICY "Members can view project members"
  ON project_members FOR SELECT
  USING (
    project_id IN (SELECT project_id FROM project_members AS pm WHERE pm.user_id = auth.uid())
  );

-- Project members: owners can insert
CREATE POLICY "Owners can add members"
  ON project_members FOR INSERT
  WITH CHECK (
    project_id IN (SELECT project_id FROM project_members AS pm WHERE pm.user_id = auth.uid() AND pm.role = 'owner')
    OR
    -- Allow self-insert when creating project (owner adds themselves)
    user_id = auth.uid()
  );

-- Project members: owners can update roles
CREATE POLICY "Owners can update members"
  ON project_members FOR UPDATE
  USING (
    project_id IN (SELECT project_id FROM project_members AS pm WHERE pm.user_id = auth.uid() AND pm.role = 'owner')
  );

-- Project members: owners can remove members
CREATE POLICY "Owners can remove members"
  ON project_members FOR DELETE
  USING (
    project_id IN (SELECT project_id FROM project_members AS pm WHERE pm.user_id = auth.uid() AND pm.role = 'owner')
  );

-- Search queries: members can view
CREATE POLICY "Members can view search queries"
  ON search_queries FOR SELECT
  USING (
    project_id IN (SELECT project_id FROM project_members WHERE user_id = auth.uid())
  );

-- Search queries: editors and owners can create
CREATE POLICY "Editors can create search queries"
  ON search_queries FOR INSERT
  WITH CHECK (
    project_id IN (SELECT project_id FROM project_members WHERE user_id = auth.uid() AND role IN ('owner', 'editor'))
  );

-- Search queries: editors can update (status)
CREATE POLICY "Editors can update search queries"
  ON search_queries FOR UPDATE
  USING (
    project_id IN (SELECT project_id FROM project_members WHERE user_id = auth.uid() AND role IN ('owner', 'editor'))
  );

-- SERP results: members can view via query -> project
CREATE POLICY "Members can view serp results"
  ON serp_results FOR SELECT
  USING (
    query_id IN (
      SELECT sq.id FROM search_queries sq
      JOIN project_members pm ON pm.project_id = sq.project_id
      WHERE pm.user_id = auth.uid()
    )
  );

-- SERP results: service role inserts (via API route), allow editors
CREATE POLICY "Editors can insert serp results"
  ON serp_results FOR INSERT
  WITH CHECK (
    query_id IN (
      SELECT sq.id FROM search_queries sq
      JOIN project_members pm ON pm.project_id = sq.project_id
      WHERE pm.user_id = auth.uid() AND pm.role IN ('owner', 'editor')
    )
  );

-- Maps results: members can view via query -> project
CREATE POLICY "Members can view maps results"
  ON maps_results FOR SELECT
  USING (
    query_id IN (
      SELECT sq.id FROM search_queries sq
      JOIN project_members pm ON pm.project_id = sq.project_id
      WHERE pm.user_id = auth.uid()
    )
  );

-- Maps results: editors can insert
CREATE POLICY "Editors can insert maps results"
  ON maps_results FOR INSERT
  WITH CHECK (
    query_id IN (
      SELECT sq.id FROM search_queries sq
      JOIN project_members pm ON pm.project_id = sq.project_id
      WHERE pm.user_id = auth.uid() AND pm.role IN ('owner', 'editor')
    )
  );

-- Profiles: members can see profiles of people in their projects
CREATE POLICY "Members can view project member profiles"
  ON profiles FOR SELECT
  USING (
    id IN (
      SELECT pm2.user_id FROM project_members pm1
      JOIN project_members pm2 ON pm1.project_id = pm2.project_id
      WHERE pm1.user_id = auth.uid()
    )
    OR id = auth.uid()
  );

-- ============================================
-- 8. INDEXES
-- ============================================
CREATE INDEX idx_project_members_user_project ON project_members(user_id, project_id);
CREATE INDEX idx_project_members_project ON project_members(project_id);
CREATE INDEX idx_search_queries_project ON search_queries(project_id);
CREATE INDEX idx_search_queries_status ON search_queries(status);
CREATE INDEX idx_serp_results_query ON serp_results(query_id);
CREATE INDEX idx_serp_results_domain ON serp_results(domain);
CREATE INDEX idx_serp_results_position ON serp_results(position);
CREATE INDEX idx_maps_results_query ON maps_results(query_id);
CREATE INDEX idx_maps_results_rating ON maps_results(rating);
CREATE INDEX idx_maps_results_website_null ON maps_results(query_id) WHERE website IS NULL OR website = '';

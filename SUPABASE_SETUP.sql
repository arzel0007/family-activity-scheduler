-- Create kids table
CREATE TABLE kids (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  age INT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create user_kids table for multi-parent support
CREATE TABLE user_kids (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  kid_id UUID NOT NULL REFERENCES kids(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'parent',
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, kid_id)
);

-- Create activities table
CREATE TABLE activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  due_date DATE,
  due_time TIME,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create activity_kids junction table for multi-kid activities
CREATE TABLE activity_kids (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  activity_id UUID NOT NULL REFERENCES activities(id) ON DELETE CASCADE,
  kid_id UUID NOT NULL REFERENCES kids(id) ON DELETE CASCADE,
  UNIQUE(activity_id, kid_id)
);

-- Enable RLS
ALTER TABLE kids ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_kids ENABLE ROW LEVEL SECURITY;
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_kids ENABLE ROW LEVEL SECURITY;

-- RLS policies for kids
CREATE POLICY "Users can view their kids" ON kids
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_kids 
      WHERE user_kids.kid_id = kids.id 
      AND user_kids.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert their own kids" ON kids
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their kids" ON kids
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM user_kids 
      WHERE user_kids.kid_id = kids.id 
      AND user_kids.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their kids" ON kids
  FOR DELETE USING (user_id = auth.uid());

-- RLS policies for user_kids
CREATE POLICY "Users can view their user_kids" ON user_kids
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can manage their user_kids" ON user_kids
  FOR ALL USING (user_id = auth.uid());

-- RLS policies for activities
CREATE POLICY "Users can view their activities" ON activities
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert activities" ON activities
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their activities" ON activities
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete their activities" ON activities
  FOR DELETE USING (user_id = auth.uid());

-- RLS policies for activity_kids
CREATE POLICY "Users can view activity_kids" ON activity_kids
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM activities 
      WHERE activities.id = activity_kids.activity_id 
      AND activities.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage activity_kids" ON activity_kids
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM activities 
      WHERE activities.id = activity_kids.activity_id 
      AND activities.user_id = auth.uid()
    )
  );

-- Create notes table
CREATE TABLE notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  activity_id UUID NOT NULL REFERENCES activities(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create tags table
CREATE TABLE tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT DEFAULT '#3B82F6',
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, name)
);

-- Create activity_tags junction table
CREATE TABLE activity_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  activity_id UUID NOT NULL REFERENCES activities(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  UNIQUE(activity_id, tag_id)
);

-- Enable RLS
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_tags ENABLE ROW LEVEL SECURITY;

-- RLS policies for notes
CREATE POLICY "Users can view notes" ON notes
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM activities 
      WHERE activities.id = notes.activity_id 
      AND activities.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage notes" ON notes
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM activities 
      WHERE activities.id = notes.activity_id 
      AND activities.user_id = auth.uid()
    )
  );

-- RLS policies for tags
CREATE POLICY "Users can view their tags" ON tags
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can manage their tags" ON tags
  FOR ALL USING (user_id = auth.uid());

-- RLS policies for activity_tags
CREATE POLICY "Users can view activity_tags" ON activity_tags
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM activities 
      WHERE activities.id = activity_tags.activity_id 
      AND activities.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage activity_tags" ON activity_tags
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM activities 
      WHERE activities.id = activity_tags.activity_id 
      AND activities.user_id = auth.uid()
    )
  );

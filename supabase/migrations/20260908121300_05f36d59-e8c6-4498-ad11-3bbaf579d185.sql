-- Profile expansion
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS branch text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS cgpa text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS target_companies text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS skill_levels jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS internships text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS certifications text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS achievements text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS resume_text text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS resume_filename text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS resume_parsed jsonb;

ALTER TABLE public.interview_sessions
  ADD COLUMN IF NOT EXISTS mock_id uuid,
  ADD COLUMN IF NOT EXISTS dimensions jsonb;

-- Unified activity log
CREATE TABLE public.activities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  kind text NOT NULL,
  topic text NOT NULL DEFAULT '',
  subtopic text NOT NULL DEFAULT '',
  title text NOT NULL DEFAULT '',
  score integer NOT NULL DEFAULT 0,
  details jsonb NOT NULL DEFAULT '{}'::jsonb,
  ref_id uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX activities_user_created_idx ON public.activities (user_id, created_at DESC);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.activities TO authenticated;
GRANT ALL ON public.activities TO service_role;
ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own activities" ON public.activities
  FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Roadmaps
CREATE TABLE public.roadmaps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  days integer NOT NULL DEFAULT 14,
  readiness integer NOT NULL DEFAULT 0,
  strengths jsonb NOT NULL DEFAULT '[]'::jsonb,
  weaknesses jsonb NOT NULL DEFAULT '[]'::jsonb,
  recommended jsonb NOT NULL DEFAULT '[]'::jsonb,
  plan jsonb NOT NULL DEFAULT '[]'::jsonb,
  summary text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX roadmaps_user_idx ON public.roadmaps (user_id, created_at DESC);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.roadmaps TO authenticated;
GRANT ALL ON public.roadmaps TO service_role;
ALTER TABLE public.roadmaps ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own roadmaps" ON public.roadmaps
  FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER roadmaps_updated_at BEFORE UPDATE ON public.roadmaps
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Companies (configurable content, public read)
CREATE TABLE public.companies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  category text NOT NULL DEFAULT 'Mass recruiter',
  description text NOT NULL DEFAULT '',
  difficulty text NOT NULL DEFAULT 'Medium',
  rounds jsonb NOT NULL DEFAULT '[]'::jsonb,
  aptitude_topics jsonb NOT NULL DEFAULT '[]'::jsonb,
  coding_topics jsonb NOT NULL DEFAULT '[]'::jsonb,
  technical_topics jsonb NOT NULL DEFAULT '[]'::jsonb,
  hr_focus jsonb NOT NULL DEFAULT '[]'::jsonb,
  tips jsonb NOT NULL DEFAULT '[]'::jsonb,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.companies TO anon, authenticated;
GRANT ALL ON public.companies TO service_role;
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Companies are readable by everyone" ON public.companies
  FOR SELECT TO anon, authenticated USING (active = true);
CREATE TRIGGER companies_updated_at BEFORE UPDATE ON public.companies
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

INSERT INTO public.companies (slug, name, category, description, difficulty, rounds, aptitude_topics, coding_topics, technical_topics, hr_focus, tips) VALUES
('tcs','TCS','Mass recruiter','Tata Consultancy Services — NQT based hiring for Ninja and Digital profiles.','Medium',
 '["Aptitude (NQT)","Coding","Technical interview","Managerial round","HR round"]',
 '["Number system","Percentages","Time & Work","Profit & Loss","Data interpretation","Logical reasoning","Verbal ability"]',
 '["Arrays","Strings","Sorting","Pattern printing","Basic DP"]',
 '["C/Java basics","OOP","DBMS & SQL","OS basics","Project deep-dive"]',
 '["Relocation","Bond / service agreement","Why TCS","Strengths & weaknesses"]',
 '["Practise the NQT format under time.","Be clear about your final-year project.","Digital profile needs stronger coding."]'),
('infosys','Infosys','Mass recruiter','Infosys — InfyTQ / Specialist Programmer / Systems Engineer hiring.','Medium',
 '["Aptitude & reasoning","Pseudo-code & puzzles","Technical + HR interview"]',
 '["Pseudo code","Puzzles","Logical reasoning","Verbal ability","Quant"]',
 '["Arrays","Strings","Recursion","Hashing","Greedy"]',
 '["OOP","DBMS","SQL","Data structures","Networking basics"]',
 '["Flexibility","Learning attitude","Why Infosys"]',
 '["Pseudo-code section is scoring — practise reading code.","Puzzles need lateral thinking practice."]'),
('wipro','Wipro','Mass recruiter','Wipro NLTH / Elite hiring for project engineers.','Easy',
 '["Aptitude","Essay writing","Coding","Technical + HR"]',
 '["Quant","Logical","Verbal","Essay writing"]',
 '["Arrays","Strings","Loops & conditions","Sorting"]',
 '["C basics","OOP","DBMS","Project"]',
 '["Willingness to relocate","Career goals"]',
 '["Essay round is graded — practise 200-word essays.","Coding round has 2 questions in 60 min."]'),
('accenture','Accenture','Mass recruiter','Accenture cognitive + technical assessment followed by communication test and interview.','Easy',
 '["Cognitive & technical assessment","Coding","Communication assessment","Interview"]',
 '["Verbal","Numerical","Abstract reasoning","Pseudo code","Networking & security MCQs"]',
 '["Arrays","Strings","Basic algorithms"]',
 '["Pseudo code","Networking basics","Cloud fundamentals","OOP"]',
 '["Communication clarity","Team fit"]',
 '["Communication assessment is spoken — practise reading aloud.","Know cloud & agile basics."]'),
('capgemini','Capgemini','Mass recruiter','Capgemini game-based aptitude, pseudo code and technical interview.','Medium',
 '["Game-based aptitude","Pseudo code & English","Technical interview","HR"]',
 '["Game-based reasoning","Pseudo code","English grammar","Quant"]',
 '["Arrays","Strings","Basic DP"]',
 '["OOP","DBMS","OS","Project"]',
 '["Why Capgemini","Relocation"]',
 '["Try game-based puzzle apps.","Pseudo code needs output tracing skill."]'),
('cognizant','Cognizant','Mass recruiter','Cognizant GenC / GenC Next hiring for programmer analyst roles.','Medium',
 '["Aptitude","Coding","Technical interview","HR"]',
 '["Quant","Logical","Verbal"]',
 '["Arrays","Strings","Searching & sorting","Hashing"]',
 '["SQL","OOP","Java/Python fundamentals","Project"]',
 '["Career plan","Flexibility"]',
 '["GenC Next needs 2 medium coding problems.","SQL queries are frequently asked."]'),
('hcl','HCLTech','Mass recruiter','HCLTech graduate engineer hiring with aptitude and technical rounds.','Easy',
 '["Aptitude","Technical MCQ","Technical interview","HR"]',
 '["Quant","Logical","Verbal"]',
 '["Arrays","Strings","Loops"]',
 '["C/C++","DBMS","OS","CN basics"]',
 '["Willingness to learn","Shift flexibility"]',
 '["Technical MCQs cover C output questions.","Prepare CN basics like OSI layers."]'),
('techmahindra','Tech Mahindra','Mass recruiter','Tech Mahindra fresher hiring with aptitude, psychometric and technical rounds.','Easy',
 '["Aptitude","Psychometric test","Technical interview","HR"]',
 '["Quant","Logical","Verbal","English essay"]',
 '["Arrays","Strings","Basic algorithms"]',
 '["OOP","DBMS","Project"]',
 '["Psychometric consistency","Communication"]',
 '["Answer psychometric questions consistently.","Verbal section is heavily weighted."]');

-- Coding submissions
CREATE TABLE public.coding_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  problem_slug text NOT NULL,
  topic text NOT NULL DEFAULT '',
  language text NOT NULL,
  code text NOT NULL,
  passed integer NOT NULL DEFAULT 0,
  total integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'pending',
  review jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX coding_submissions_user_idx ON public.coding_submissions (user_id, created_at DESC);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.coding_submissions TO authenticated;
GRANT ALL ON public.coding_submissions TO service_role;
ALTER TABLE public.coding_submissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own submissions" ON public.coding_submissions
  FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Project interview simulator
CREATE TABLE public.project_interviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  project_name text NOT NULL DEFAULT '',
  transcript jsonb NOT NULL DEFAULT '[]'::jsonb,
  score integer,
  feedback jsonb,
  completed boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz
);
CREATE INDEX project_interviews_user_idx ON public.project_interviews (user_id, created_at DESC);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.project_interviews TO authenticated;
GRANT ALL ON public.project_interviews TO service_role;
ALTER TABLE public.project_interviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own project interviews" ON public.project_interviews
  FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Log completed interview rounds as activities automatically
CREATE OR REPLACE FUNCTION public.log_session_activity()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_topic text;
BEGIN
  IF NEW.completed = true AND (OLD.completed IS DISTINCT FROM true) AND NEW.score IS NOT NULL THEN
    v_topic := CASE NEW.round
      WHEN 1 THEN 'Aptitude'
      WHEN 2 THEN 'Managerial'
      WHEN 3 THEN 'Technical'
      WHEN 4 THEN 'HR'
      ELSE 'Interview' END;
    INSERT INTO public.activities (user_id, kind, topic, subtopic, title, score, details, ref_id)
    VALUES (
      NEW.user_id,
      'interview',
      v_topic,
      '',
      NEW.round_name,
      NEW.score,
      jsonb_build_object(
        'questions', COALESCE((SELECT jsonb_agg(jsonb_build_object('topic', q->>'topic', 'marks', p->>'marks'))
                       FROM jsonb_array_elements(NEW.questions) WITH ORDINALITY AS a(q, i)
                       LEFT JOIN jsonb_array_elements(NEW.per_question) WITH ORDINALITY AS b(p, j) ON i = j), '[]'::jsonb),
        'mock_id', NEW.mock_id
      ),
      NEW.id
    );
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS interview_sessions_log_activity ON public.interview_sessions;
CREATE TRIGGER interview_sessions_log_activity
  AFTER UPDATE ON public.interview_sessions
  FOR EACH ROW EXECUTE FUNCTION public.log_session_activity();

-- Backfill activities from already-completed rounds
INSERT INTO public.activities (user_id, kind, topic, title, score, details, ref_id, created_at)
SELECT s.user_id, 'interview',
  CASE s.round WHEN 1 THEN 'Aptitude' WHEN 2 THEN 'Managerial' WHEN 3 THEN 'Technical' WHEN 4 THEN 'HR' ELSE 'Interview' END,
  s.round_name, s.score,
  jsonb_build_object('questions', COALESCE((SELECT jsonb_agg(jsonb_build_object('topic', q->>'topic', 'marks', p->>'marks'))
     FROM jsonb_array_elements(s.questions) WITH ORDINALITY AS a(q, i)
     LEFT JOIN jsonb_array_elements(s.per_question) WITH ORDINALITY AS b(p, j) ON i = j), '[]'::jsonb)),
  s.id, COALESCE(s.completed_at, s.created_at)
FROM public.interview_sessions s
WHERE s.completed = true AND s.score IS NOT NULL;
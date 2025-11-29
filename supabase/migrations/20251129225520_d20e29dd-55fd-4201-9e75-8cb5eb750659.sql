-- Create app role enum for user types
CREATE TYPE public.app_role AS ENUM ('student', 'admin');

-- Create profiles table for user information
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text NOT NULL,
  email text NOT NULL,
  student_id text UNIQUE,
  department text,
  created_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create user_roles table to manage permissions
CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create function to check user roles (security definer to bypass RLS)
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Create internships table
CREATE TABLE public.internships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name text NOT NULL,
  position_title text NOT NULL,
  description text NOT NULL,
  salary text NOT NULL,
  duration text NOT NULL,
  required_skills text[] NOT NULL,
  location text NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE public.internships ENABLE ROW LEVEL SECURITY;

-- Create applications table
CREATE TABLE public.applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  internship_id uuid REFERENCES public.internships(id) ON DELETE CASCADE NOT NULL,
  student_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  feedback text,
  applied_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE (internship_id, student_id)
);

ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;

-- Trigger to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, student_id, department)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'full_name', ''),
    new.email,
    new.raw_user_meta_data->>'student_id',
    new.raw_user_meta_data->>'department'
  );
  
  -- Assign role based on student_id
  IF new.raw_user_meta_data->>'role' = 'admin' THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (new.id, 'admin');
  ELSE
    INSERT INTO public.user_roles (user_id, role)
    VALUES (new.id, 'student');
  END IF;
  
  RETURN new;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- RLS Policies for profiles
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- RLS Policies for user_roles
CREATE POLICY "Users can view their own roles"
  ON public.user_roles FOR SELECT
  USING (auth.uid() = user_id);

-- RLS Policies for internships
CREATE POLICY "Anyone authenticated can view active internships"
  ON public.internships FOR SELECT
  USING (auth.role() = 'authenticated' AND is_active = true);

CREATE POLICY "Admins can manage internships"
  ON public.internships FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for applications
CREATE POLICY "Students can view their own applications"
  ON public.applications FOR SELECT
  USING (auth.uid() = student_id);

CREATE POLICY "Students can create their own applications"
  ON public.applications FOR INSERT
  WITH CHECK (auth.uid() = student_id AND status = 'pending');

CREATE POLICY "Admins can view all applications"
  ON public.applications FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update applications"
  ON public.applications FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'));

-- Function to update application timestamp
CREATE OR REPLACE FUNCTION public.update_application_timestamp()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_application_timestamp
  BEFORE UPDATE ON public.applications
  FOR EACH ROW
  EXECUTE FUNCTION public.update_application_timestamp();

-- Insert sample internships
INSERT INTO public.internships (company_name, position_title, description, salary, duration, required_skills, location)
VALUES
  ('TechCorp Solutions', 'Frontend Developer Intern', 'Work on cutting-edge web applications using React and TypeScript. Collaborate with experienced developers on real-world projects.', '$800-1200/month', '3-6 months', ARRAY['JavaScript', 'React', 'TypeScript', 'HTML/CSS'], 'Remote'),
  ('DataStream Analytics', 'Data Science Intern', 'Analyze large datasets and build machine learning models. Gain hands-on experience with Python and data visualization tools.', '$1000-1500/month', '4-6 months', ARRAY['Python', 'SQL', 'Machine Learning', 'Pandas'], 'Remote'),
  ('CloudNine Systems', 'DevOps Engineer Intern', 'Learn cloud infrastructure management and CI/CD pipelines. Work with AWS, Docker, and Kubernetes.', '$900-1400/month', '3-5 months', ARRAY['AWS', 'Docker', 'Linux', 'Git'], 'Remote'),
  ('MobileFirst Apps', 'Mobile Developer Intern', 'Develop cross-platform mobile applications using React Native. Build features for iOS and Android platforms.', '$850-1300/month', '3-6 months', ARRAY['React Native', 'JavaScript', 'Mobile Development', 'API Integration'], 'Remote');
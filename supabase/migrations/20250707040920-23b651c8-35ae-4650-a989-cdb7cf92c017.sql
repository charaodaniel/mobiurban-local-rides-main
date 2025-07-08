
-- Create enum types
CREATE TYPE user_role AS ENUM ('driver', 'admin', 'passenger');
CREATE TYPE message_sender AS ENUM ('driver', 'passenger');
CREATE TYPE document_type AS ENUM ('CNH', 'Car Document');
CREATE TYPE document_status AS ENUM ('pending', 'approved', 'rejected');

-- Create users table
CREATE TABLE public.users (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email VARCHAR UNIQUE NOT NULL,
  name VARCHAR NOT NULL,
  phone VARCHAR,
  role user_role NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create driver profiles table
CREATE TABLE public.driver_profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  vehicle_model VARCHAR NOT NULL,
  vehicle_plate VARCHAR NOT NULL,
  vehicle_color VARCHAR NOT NULL,
  vehicle_year INTEGER NOT NULL,
  price_per_km DECIMAL DEFAULT 2.50,
  is_online BOOLEAN DEFAULT false,
  accepts_interior BOOLEAN DEFAULT false,
  rating DECIMAL DEFAULT 5.0,
  current_lat DECIMAL,
  current_lng DECIMAL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create rides table
CREATE TABLE public.rides (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  passenger_id UUID REFERENCES public.users(id),
  driver_id UUID REFERENCES public.users(id),
  origin_address TEXT NOT NULL,
  origin_lat DECIMAL NOT NULL,
  origin_lng DECIMAL NOT NULL,
  destination_address TEXT NOT NULL,
  destination_lat DECIMAL NOT NULL,
  destination_lng DECIMAL NOT NULL,
  distance_km DECIMAL,
  estimated_duration_minutes INTEGER,
  price DECIMAL,
  status VARCHAR DEFAULT 'pending',
  is_interior BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Create ratings table
CREATE TABLE public.ratings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ride_id UUID REFERENCES public.rides(id),
  passenger_id UUID REFERENCES public.users(id),
  driver_id UUID REFERENCES public.users(id),
  rating INTEGER NOT NULL,
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.driver_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rides ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ratings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for users
CREATE POLICY "Users can view own data" ON public.users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own data" ON public.users
  FOR UPDATE USING (auth.uid() = id);

-- RLS Policies for driver_profiles
CREATE POLICY "Drivers can view own profile" ON public.driver_profiles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Passengers can view online drivers" ON public.driver_profiles
  FOR SELECT USING (is_online = true);

CREATE POLICY "Drivers can update own profile" ON public.driver_profiles
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Drivers can update their own profile" ON public.driver_profiles
  FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policies for rides
CREATE POLICY "Passengers can view own rides" ON public.rides
  FOR SELECT USING (auth.uid() = passenger_id);

CREATE POLICY "Drivers can view assigned rides" ON public.rides
  FOR SELECT USING (auth.uid() = driver_id);

CREATE POLICY "Drivers can view pending rides" ON public.rides
  FOR SELECT USING (status = 'pending');

CREATE POLICY "Passengers can create rides" ON public.rides
  FOR INSERT WITH CHECK (auth.uid() = passenger_id);

CREATE POLICY "Passengers can view their own rides" ON public.rides
  FOR SELECT USING (auth.uid() = passenger_id);

CREATE POLICY "Drivers can update rides" ON public.rides
  FOR UPDATE USING (auth.uid() = driver_id);

-- RLS Policies for ratings
CREATE POLICY "Users can view related ratings" ON public.ratings
  FOR SELECT USING (auth.uid() = passenger_id OR auth.uid() = driver_id);

CREATE POLICY "Passengers can create ratings" ON public.ratings
  FOR INSERT WITH CHECK (auth.uid() = passenger_id);

-- Enable realtime for relevant tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.driver_profiles;
ALTER PUBLICATION supabase_realtime ADD TABLE public.rides;

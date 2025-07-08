
-- Create storage bucket for profile and car photos
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'profiles',
  'profiles',
  true,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp']
);

-- Create RLS policies for the profiles bucket
CREATE POLICY "Anyone can view profile images" ON storage.objects
  FOR SELECT USING (bucket_id = 'profiles');

CREATE POLICY "Authenticated users can upload profile images" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'profiles' AND 
    auth.role() = 'authenticated'
  );

CREATE POLICY "Users can update their own profile images" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'profiles' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete their own profile images" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'profiles' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Add profile and car photo URLs to driver_profiles table
ALTER TABLE public.driver_profiles 
ADD COLUMN profile_photo_url TEXT,
ADD COLUMN car_photo_url TEXT;

-- Insert test data
-- First, insert test users
INSERT INTO public.users (id, email, name, phone, role) VALUES
('550e8400-e29b-41d4-a716-446655440001', 'joao.silva@email.com', 'João Silva', '(11) 99999-1111', 'driver'),
('550e8400-e29b-41d4-a716-446655440002', 'maria.santos@email.com', 'Maria Santos', '(11) 99999-2222', 'driver'),
('550e8400-e29b-41d4-a716-446655440003', 'carlos.oliveira@email.com', 'Carlos Oliveira', '(11) 99999-3333', 'driver'),
('550e8400-e29b-41d4-a716-446655440004', 'ana.costa@email.com', 'Ana Costa', '(11) 99999-4444', 'driver'),
('550e8400-e29b-41d4-a716-446655440005', 'pedro.lima@email.com', 'Pedro Lima', '(11) 99999-5555', 'driver');

-- Insert test driver profiles
INSERT INTO public.driver_profiles (
  user_id, 
  vehicle_model, 
  vehicle_plate, 
  vehicle_color, 
  vehicle_year, 
  price_per_km, 
  is_online, 
  rating,
  profile_photo_url,
  car_photo_url
) VALUES
(
  '550e8400-e29b-41d4-a716-446655440001',
  'Honda Civic',
  'ABC-1234',
  'Prata',
  2020,
  2.50,
  true,
  4.8,
  'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=400',
  'https://images.unsplash.com/photo-1487887235947-a955ef187fcc?w=600'
),
(
  '550e8400-e29b-41d4-a716-446655440002',
  'Toyota Corolla',
  'DEF-5678',
  'Branco',
  2019,
  2.30,
  true,
  4.9,
  'https://images.unsplash.com/photo-1488590528505-98d2b5aba04b?w=400',
  'https://images.unsplash.com/photo-1452378174528-3090a4bba7b2?w=600'
),
(
  '550e8400-e29b-41d4-a716-446655440003',
  'Volkswagen Gol',
  'GHI-9012',
  'Azul',
  2018,
  2.00,
  false,
  4.7,
  'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=400',
  'https://images.unsplash.com/photo-1487887235947-a955ef187fcc?w=600'
),
(
  '550e8400-e29b-41d4-a716-446655440004',
  'Fiat Argo',
  'JKL-3456',
  'Vermelho',
  2021,
  2.70,
  true,
  5.0,
  'https://images.unsplash.com/photo-1488590528505-98d2b5aba04b?w=400',
  'https://images.unsplash.com/photo-1452378174528-3090a4bba7b2?w=600'
),
(
  '550e8400-e29b-41d4-a716-446655440005',
  'Chevrolet Onix',
  'MNO-7890',
  'Preto',
  2022,
  2.80,
  true,
  4.6,
  'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=400',
  'https://images.unsplash.com/photo-1487887235947-a955ef187fcc?w=600'
);

-- Add RLS policy to allow drivers to insert their own profile
CREATE POLICY "Drivers can create their own profile" ON public.driver_profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

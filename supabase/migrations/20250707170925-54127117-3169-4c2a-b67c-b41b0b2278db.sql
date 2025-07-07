-- Add Stripe Connect fields to profiles table
ALTER TABLE public.profiles 
ADD COLUMN stripe_connect_account_id TEXT,
ADD COLUMN stripe_connect_onboarded BOOLEAN DEFAULT FALSE,
ADD COLUMN stripe_connect_details_submitted BOOLEAN DEFAULT FALSE;
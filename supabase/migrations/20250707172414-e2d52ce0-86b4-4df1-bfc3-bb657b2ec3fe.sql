-- Create storage bucket for listing images
INSERT INTO storage.buckets (id, name, public) VALUES ('listing-images', 'listing-images', true);

-- Create policies for listing image uploads
CREATE POLICY "Anyone can view listing images" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'listing-images');

CREATE POLICY "Salon owners can upload listing images" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'listing-images' 
  AND auth.uid() IN (
    SELECT user_id FROM profiles 
    WHERE user_type = 'salon_owner'
  )
);

CREATE POLICY "Salon owners can update their listing images" 
ON storage.objects 
FOR UPDATE 
USING (
  bucket_id = 'listing-images' 
  AND auth.uid() IN (
    SELECT user_id FROM profiles 
    WHERE user_type = 'salon_owner'
  )
);

CREATE POLICY "Salon owners can delete their listing images" 
ON storage.objects 
FOR DELETE 
USING (
  bucket_id = 'listing-images' 
  AND auth.uid() IN (
    SELECT user_id FROM profiles 
    WHERE user_type = 'salon_owner'
  )
);
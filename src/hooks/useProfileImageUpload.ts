import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { User } from '@supabase/supabase-js';

interface Profile {
  profile_image_url?: string;
}

interface UseProfileImageUploadProps {
  user: User | null;
  profile: Profile | null;
  updateProfile: (updates: Partial<Profile>) => Promise<void>;
}

export function useProfileImageUpload({ user, profile, updateProfile }: UseProfileImageUploadProps) {
  const [uploadingImage, setUploadingImage] = useState(false);

  const uploadFile = async (file: File) => {
    if (!user) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid File",
        description: "Please select an image file.",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File Too Large",
        description: "Please select an image smaller than 5MB.",
        variant: "destructive",
      });
      return;
    }

    setUploadingImage(true);

    try {
      // Delete existing profile image if it exists
      if (profile?.profile_image_url) {
        const oldPath = profile.profile_image_url.split('/').pop();
        if (oldPath) {
          await supabase.storage
            .from('profile-images')
            .remove([`${user.id}/${oldPath}`]);
        }
      }

      // Upload new image
      const fileExt = file.name.split('.').pop();
      const fileName = `profile-${Date.now()}.${fileExt}`;
      const filePath = `${user.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('profile-images')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('profile-images')
        .getPublicUrl(filePath);

      // Update profile with new image URL
      await updateProfile({ profile_image_url: publicUrl });

      toast({
        title: "Profile Picture Updated",
        description: "Your profile picture has been updated successfully.",
      });
    } catch (error: any) {
      console.error('Error uploading image:', error);
      toast({
        title: "Upload Failed",
        description: error.message || "Failed to upload profile picture",
        variant: "destructive",
      });
    } finally {
      setUploadingImage(false);
    }
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      await uploadFile(file);
    }
  };

  const handleCameraCapture = async (file: File) => {
    await uploadFile(file);
  };

  const removeProfileImage = async () => {
    if (!user || !profile?.profile_image_url) return;

    setUploadingImage(true);

    try {
      // Delete the image from storage
      const oldPath = profile.profile_image_url.split('/').pop();
      if (oldPath) {
        await supabase.storage
          .from('profile-images')
          .remove([`${user.id}/${oldPath}`]);
      }

      // Update profile to remove image URL
      await updateProfile({ profile_image_url: null });

      toast({
        title: "Profile Picture Removed",
        description: "Your profile picture has been removed successfully.",
      });
    } catch (error: any) {
      console.error('Error removing image:', error);
      toast({
        title: "Remove Failed",
        description: error.message || "Failed to remove profile picture",
        variant: "destructive",
      });
    } finally {
      setUploadingImage(false);
    }
  };

  return {
    uploadingImage,
    handleImageUpload,
    handleCameraCapture,
    removeProfileImage,
  };
}
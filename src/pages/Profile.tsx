import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Navbar } from '@/components/Navbar';
import { ArrowLeft } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { ProfileHeader } from '@/components/profile/ProfileHeader';
import { EditProfileForm } from '@/components/profile/EditProfileForm';
import { AccountStats } from '@/components/profile/AccountStats';
import { AccountActions } from '@/components/profile/AccountActions';
import { useProfileImageUpload } from '@/hooks/useProfileImageUpload';

export default function Profile() {
  const { user, profile, updateProfile, signOut } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [switchingType, setSwitchingType] = useState(false);

  const { uploadingImage, handleImageUpload } = useProfileImageUpload({
    user,
    profile,
    updateProfile,
  });

  const handleProfileUpdate = async (formData: { full_name: string; phone: string; bio: string }) => {
    setLoading(true);

    try {
      await updateProfile(formData);
      toast({
        title: "Profile Updated",
        description: "Your profile has been updated successfully.",
      });
    } catch (error: any) {
      console.error('Error updating profile:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to update profile",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAccountTypeSwitch = async () => {
    if (!profile) return;
    
    setSwitchingType(true);
    const newUserType = profile.user_type === 'salon_owner' ? 'renter' : 'salon_owner';
    
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ 
          user_type: newUserType,
          // Reset Stripe fields when switching to renter
          ...(newUserType === 'renter' && {
            stripe_connect_account_id: null,
            stripe_connect_onboarded: false,
            stripe_connect_details_submitted: false
          })
        })
        .eq('user_id', user?.id);

      if (error) throw error;

      toast({
        title: "Account Type Updated",
        description: `Successfully switched to ${newUserType === 'salon_owner' ? 'Salon Owner' : 'Beauty Professional'}`,
      });
      
      // Refresh the page to update the UI and context
      window.location.reload();
      
    } catch (error: any) {
      console.error('Error switching account type:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to switch account type",
        variant: "destructive",
      });
    } finally {
      setSwitchingType(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
  };

  if (!user || !profile) {
    navigate('/auth');
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="container mx-auto px-4 py-8">
        <Button 
          variant="ghost" 
          onClick={() => navigate('/')}
          className="mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to home
        </Button>

        <div className="max-w-2xl mx-auto">
          <h1 className="text-3xl font-bold mb-8">My Profile</h1>

          <div className="space-y-6">
            <ProfileHeader 
              profile={profile}
              onImageUpload={handleImageUpload}
              uploadingImage={uploadingImage}
            />

            <EditProfileForm 
              profile={profile}
              onSubmit={handleProfileUpdate}
              loading={loading}
            />

            <AccountStats userType={profile.user_type} />

            <AccountActions
              userType={profile.user_type}
              onAccountTypeSwitch={handleAccountTypeSwitch}
              onSignOut={handleSignOut}
              switchingType={switchingType}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
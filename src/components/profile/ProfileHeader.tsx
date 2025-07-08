import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Camera, Mail, Upload, Image } from 'lucide-react';
import { CameraCapture } from './CameraCapture';

interface Profile {
  full_name: string;
  email: string;
  profile_image_url?: string;
  user_type: 'salon_owner' | 'renter';
}

interface ProfileHeaderProps {
  profile: Profile;
  onImageUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onCameraCapture: (file: File) => void;
  uploadingImage: boolean;
}

export function ProfileHeader({ profile, onImageUpload, onCameraCapture, uploadingImage }: ProfileHeaderProps) {
  const [showCamera, setShowCamera] = useState(false);
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center gap-6">
          <div className="relative">
            <Avatar className="w-24 h-24">
              <AvatarImage src={profile.profile_image_url} />
              <AvatarFallback className="text-2xl">
                {profile.full_name.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <input
              type="file"
              id="profile-image-upload"
              accept="image/*"
              onChange={onImageUpload}
              className="hidden"
            />
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  size="sm"
                  variant="secondary"
                  className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full p-0"
                  disabled={uploadingImage}
                >
                  <Camera className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setShowCamera(true)}>
                  <Camera className="w-4 h-4 mr-2" />
                  Take Photo
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => document.getElementById('profile-image-upload')?.click()}>
                  <Upload className="w-4 h-4 mr-2" />
                  Upload Image
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            
            <CameraCapture
              isOpen={showCamera}
              onClose={() => setShowCamera(false)}
              onCapture={onCameraCapture}
            />
          </div>
          
          <div className="flex-1">
            <h2 className="text-2xl font-bold">{profile.full_name}</h2>
            <p className="text-muted-foreground flex items-center gap-1">
              <Mail className="w-4 h-4" />
              {profile.email}
            </p>
            <div className="mt-2">
              <Badge variant={profile.user_type === 'salon_owner' ? 'default' : 'secondary'}>
                {profile.user_type === 'salon_owner' ? 'Salon Owner' : 'Beauty Professional'}
              </Badge>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
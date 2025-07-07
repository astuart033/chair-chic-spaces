import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Navbar } from '@/components/Navbar';
import { ArrowLeft, DollarSign, MapPin, ImagePlus, X } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

const SPACE_TYPES = [
  { value: 'chair', label: 'Salon Chair' },
  { value: 'private_room', label: 'Private Room' },
  { value: 'booth', label: 'Booth' },
];

const AMENITIES = [
  { id: 'wifi', label: 'WiFi' },
  { id: 'parking', label: 'Parking' },
  { id: 'equipment', label: 'Equipment Provided' },
  { id: 'products', label: 'Products Included' },
  { id: 'reception', label: 'Reception Services' },
  { id: 'break_room', label: 'Break Room' },
  { id: 'storage', label: 'Storage Space' },
  { id: 'security', label: '24/7 Security' },
];

export default function CreateListing() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    space_type: '',
    price_per_day: '',
    price_per_week: '',
    address: '',
    city: '',
    state: '',
    zip_code: '',
    amenities: [] as string[],
    images: [] as string[],
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleAmenityChange = (amenityId: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      amenities: checked
        ? [...prev.amenities, amenityId]
        : prev.amenities.filter(id => id !== amenityId)
    }));
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    const uploadedUrls: string[] = [];

    try {
      for (const file of Array.from(files)) {
        // Check file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
          toast({
            title: "File too large",
            description: `${file.name} is too large. Maximum size is 5MB.`,
            variant: "destructive",
          });
          continue;
        }

        // Check file type
        if (!file.type.startsWith('image/')) {
          toast({
            title: "Invalid file type",
            description: `${file.name} is not an image file.`,
            variant: "destructive",
          });
          continue;
        }

        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
        const filePath = `${user?.id}/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('listing-images')
          .upload(filePath, file);

        if (uploadError) {
          console.error('Upload error:', uploadError);
          toast({
            title: "Upload failed",
            description: `Failed to upload ${file.name}`,
            variant: "destructive",
          });
          continue;
        }

        const { data: publicUrlData } = supabase.storage
          .from('listing-images')
          .getPublicUrl(filePath);

        uploadedUrls.push(publicUrlData.publicUrl);
      }

      setFormData(prev => ({
        ...prev,
        images: [...prev.images, ...uploadedUrls]
      }));

      if (uploadedUrls.length > 0) {
        toast({
          title: "Images uploaded",
          description: `Successfully uploaded ${uploadedUrls.length} image(s)`,
        });
      }
    } catch (error) {
      console.error('Error uploading images:', error);
      toast({
        title: "Upload error",
        description: "An error occurred while uploading images",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
      // Reset file input
      event.target.value = '';
    }
  };

  const removeImage = async (imageUrl: string, index: number) => {
    try {
      // Extract file path from URL
      const urlParts = imageUrl.split('/');
      const filePath = urlParts.slice(-2).join('/'); // user_id/filename

      // Delete from storage
      const { error } = await supabase.storage
        .from('listing-images')
        .remove([filePath]);

      if (error) {
        console.error('Error deleting image:', error);
      }

      // Remove from form data
      setFormData(prev => ({
        ...prev,
        images: prev.images.filter((_, i) => i !== index)
      }));

      toast({
        title: "Image removed",
        description: "Image has been deleted successfully",
      });
    } catch (error) {
      console.error('Error removing image:', error);
      toast({
        title: "Error",
        description: "Failed to remove image",
        variant: "destructive",
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user || !profile) {
      toast({
        title: "Error",
        description: "You must be logged in to create a listing",
        variant: "destructive",
      });
      return;
    }
    
    if (profile.user_type !== 'salon_owner') {
      toast({
        title: "Access Denied",
        description: "Only salon owners can create listings",
        variant: "destructive",
      });
      return;
    }

    // Check if salon owner has completed Stripe onboarding
    if (profile.user_type === 'salon_owner' && !profile.stripe_connect_onboarded) {
      toast({
        title: "Payment Setup Required",
        description: "Please complete your payment setup before creating listings.",
        variant: "destructive",
      });
      navigate('/salon-onboarding');
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await supabase
        .from('listings')
        .insert({
          owner_id: profile.id,
          title: formData.title,
          description: formData.description,
          space_type: formData.space_type,
          price_per_day: parseFloat(formData.price_per_day),
          price_per_week: formData.price_per_week ? parseFloat(formData.price_per_week) : null,
          address: formData.address,
          city: formData.city,
          state: formData.state,
          zip_code: formData.zip_code,
          amenities: formData.amenities,
          images: formData.images,
          available: true,
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Listing Created!",
        description: "Your listing has been created successfully and is now live.",
      });
      
      navigate('/my-listings');
    } catch (error: any) {
      console.error('Error creating listing:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to create listing",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    navigate('/auth');
    return null;
  }

  if (profile?.user_type !== 'salon_owner') {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <Card>
            <CardContent className="text-center py-12">
              <h2 className="text-2xl font-bold mb-4">Access Denied</h2>
              <p className="text-muted-foreground mb-4">
                Only salon owners can create listings.
              </p>
              <Button onClick={() => navigate('/')}>
                Back to Home
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="container mx-auto px-4 py-8">
        <Button 
          variant="ghost" 
          onClick={() => navigate('/my-listings')}
          className="mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to my listings
        </Button>

        <div className="max-w-2xl mx-auto">
          <h1 className="text-3xl font-bold mb-2">Create New Listing</h1>
          <p className="text-muted-foreground mb-8">
            List your salon space and start earning from rentals
          </p>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle>Basic Information</CardTitle>
                <CardDescription>
                  Tell renters about your space
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="title">Listing Title *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => handleInputChange('title', e.target.value)}
                    placeholder="e.g., Modern Salon Chair in Downtown Salon"
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="description">Description *</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    placeholder="Describe your space, location benefits, and what makes it special..."
                    rows={4}
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="space_type">Space Type *</Label>
                  <Select value={formData.space_type} onValueChange={(value) => handleInputChange('space_type', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select space type" />
                    </SelectTrigger>
                    <SelectContent>
                      {SPACE_TYPES.map(type => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Pricing */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="w-5 h-5" />
                  Pricing
                </CardTitle>
                <CardDescription>
                  Set your rental rates
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="price_per_day">Daily Rate ($) *</Label>
                    <Input
                      id="price_per_day"
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.price_per_day}
                      onChange={(e) => handleInputChange('price_per_day', e.target.value)}
                      placeholder="0.00"
                      required
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="price_per_week">Weekly Rate ($)</Label>
                    <Input
                      id="price_per_week"
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.price_per_week}
                      onChange={(e) => handleInputChange('price_per_week', e.target.value)}
                      placeholder="0.00 (optional)"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Location */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="w-5 h-5" />
                  Location
                </CardTitle>
                <CardDescription>
                  Where is your space located?
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="address">Street Address *</Label>
                  <Input
                    id="address"
                    value={formData.address}
                    onChange={(e) => handleInputChange('address', e.target.value)}
                    placeholder="123 Main Street"
                    required
                  />
                </div>
                
                <div className="grid md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="city">City *</Label>
                    <Input
                      id="city"
                      value={formData.city}
                      onChange={(e) => handleInputChange('city', e.target.value)}
                      placeholder="New York"
                      required
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="state">State *</Label>
                    <Input
                      id="state"
                      value={formData.state}
                      onChange={(e) => handleInputChange('state', e.target.value)}
                      placeholder="NY"
                      required
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="zip_code">ZIP Code *</Label>
                    <Input
                      id="zip_code"
                      value={formData.zip_code}
                      onChange={(e) => handleInputChange('zip_code', e.target.value)}
                      placeholder="10001"
                      required
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Amenities */}
            <Card>
              <CardHeader>
                <CardTitle>Amenities</CardTitle>
                <CardDescription>
                  What amenities do you offer?
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-4">
                  {AMENITIES.map(amenity => (
                    <div key={amenity.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={amenity.id}
                        checked={formData.amenities.includes(amenity.id)}
                        onCheckedChange={(checked) => handleAmenityChange(amenity.id, checked as boolean)}
                      />
                      <Label htmlFor={amenity.id}>{amenity.label}</Label>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Images */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ImagePlus className="w-5 h-5" />
                  Photos
                </CardTitle>
                <CardDescription>
                  Add photos to showcase your space
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Upload Area */}
                <div className="border-2 border-dashed border-muted rounded-lg p-6">
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleImageUpload}
                    disabled={uploading}
                    className="hidden"
                    id="image-upload"
                  />
                  <label htmlFor="image-upload" className="cursor-pointer">
                    <div className="text-center">
                      <ImagePlus className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                      <div className="space-y-2">
                        <p className="text-sm font-medium">
                          {uploading ? 'Uploading...' : 'Click to upload images'}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          PNG, JPG, GIF up to 5MB each. You can select multiple files.
                        </p>
                      </div>
                    </div>
                  </label>
                </div>

                {/* Image Preview Grid */}
                {formData.images.length > 0 && (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {formData.images.map((imageUrl, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={imageUrl}
                          alt={`Listing image ${index + 1}`}
                          className="w-full h-32 object-cover rounded-lg border"
                        />
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          className="absolute top-2 right-2 w-6 h-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => removeImage(imageUrl, index)}
                        >
                          <X className="w-3 h-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}

                {formData.images.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center">
                    No images uploaded yet. Add some photos to make your listing more attractive!
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Submit */}
            <div className="flex gap-4">
              <Button type="button" variant="outline" onClick={() => navigate('/my-listings')}>
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={loading}
                className="flex-1"
              >
                {loading ? 'Creating...' : 'Create Listing'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
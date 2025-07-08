import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Navbar } from '@/components/Navbar';
import { MapPin, Star, Wifi, Car, Scissors, Package, Calendar, ArrowLeft } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface Listing {
  id: string;
  title: string;
  description: string;
  space_type: string;
  price_per_day: number;
  price_per_week?: number;
  address: string;
  city: string;
  state: string;
  zip_code: string;
  amenities: string[];
  images: string[];
  profiles: {
    id: string;
    full_name: string;
    profile_image_url?: string;
    bio?: string;
  };
}

const amenityIcons: { [key: string]: any } = {
  wifi: Wifi,
  parking: Car,
  equipment: Scissors,
  products: Package,
};

export default function ListingDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const [listing, setListing] = useState<Listing | null>(null);
  const [loading, setLoading] = useState(true);

  // Demo listings for when no real data exists
  const demoListings: { [key: string]: Listing } = {
    'demo-1': {
      id: 'demo-1',
      title: 'Premium Salon Chair - Downtown',
      description: 'Beautiful salon chair in a high-end salon with all amenities included. Perfect for experienced stylists looking for a professional workspace in the heart of the city.',
      space_type: 'chair',
      price_per_day: 75,
      price_per_week: 450,
      address: '123 Main Street',
      city: 'Los Angeles',
      state: 'CA',
      zip_code: '90210',
      amenities: ['WiFi', 'Parking', 'Storage', 'Shampoo Bowl'],
      images: [],
      profiles: {
        id: 'demo-profile-1',
        full_name: 'Sarah Johnson',
        profile_image_url: undefined,
        bio: 'Professional salon owner with 15+ years experience. I love helping stylists grow their business!'
      }
    },
    'demo-2': {
      id: 'demo-2',
      title: 'Private Room with Full Setup',
      description: 'Spacious private room with professional lighting and premium equipment. Ideal for building your clientele in a luxurious setting with complete privacy.',
      space_type: 'private_room',
      price_per_day: 120,
      price_per_week: 700,
      address: '456 Ocean Drive',
      city: 'Miami',
      state: 'FL',
      zip_code: '33139',
      amenities: ['Private Entrance', 'WiFi', 'Storage', 'Reception Area'],
      images: [],
      profiles: {
        id: 'demo-profile-2',
        full_name: 'Maria Rodriguez',
        profile_image_url: undefined,
        bio: 'Boutique salon owner creating beautiful spaces for talented artists.'
      }
    },
    'demo-3': {
      id: 'demo-3',
      title: 'Modern Booth Space',
      description: 'Contemporary booth in a trendy salon. Great location with high foot traffic and modern amenities. Perfect for stylists who want to be part of a vibrant salon community.',
      space_type: 'booth',
      price_per_day: 90,
      price_per_week: 525,
      address: '789 Fashion Ave',
      city: 'New York',
      state: 'NY',
      zip_code: '10001',
      amenities: ['WiFi', 'Security System', 'Break Room', 'Storage'],
      images: [],
      profiles: {
        id: 'demo-profile-3',
        full_name: 'Alex Chen',
        profile_image_url: undefined,
        bio: 'Modern salon owner passionate about creating inspiring workspaces.'
      }
    }
  };

  useEffect(() => {
    const fetchListing = async () => {
      try {
        // Check if this is a demo listing
        if (id && id.startsWith('demo-')) {
          const demoListing = demoListings[id];
          if (demoListing) {
            setListing(demoListing);
            setLoading(false);
            return;
          }
        }

        const { data, error } = await supabase
          .from('listings')
          .select(`
            *,
            profiles!listings_owner_id_fkey (
              id,
              full_name,
              profile_image_url,
              bio
            )
          `)
          .eq('id', id)
          .single();

        if (error) throw error;
        setListing(data);
      } catch (error) {
        console.error('Error fetching listing:', error);
        toast({
          title: "Error",
          description: "Failed to load listing details",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchListing();
    }
  }, [id]);

  const handleBookNow = () => {
    if (!user) {
      navigate('/auth');
      return;
    }
    
    if (profile?.user_type === 'salon_owner') {
      toast({
        title: "Not Available",
        description: "Salon owners cannot book spaces. Switch to a renter account to book.",
        variant: "destructive",
      });
      return;
    }
    
    // Handle demo listings
    if (id && id.startsWith('demo-')) {
      toast({
        title: "Demo Listing",
        description: "This is a sample listing to show you how ShearSpace works. Real bookings will be available once salon owners start listing their spaces!",
        variant: "default",
      });
      return;
    }
    
    navigate(`/book/${id}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-muted rounded w-1/4 mb-4"></div>
            <div className="h-64 bg-muted rounded mb-6"></div>
            <div className="grid lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-4">
                <div className="h-6 bg-muted rounded"></div>
                <div className="h-4 bg-muted rounded w-3/4"></div>
                <div className="h-32 bg-muted rounded"></div>
              </div>
              <div className="h-64 bg-muted rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Listing Not Found</h1>
            <Button onClick={() => navigate('/')}>Back to Home</Button>
          </div>
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
          onClick={() => navigate('/')}
          className="mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to listings
        </Button>

        {/* Image Gallery */}
        <div className="mb-8">
          {listing.images && listing.images.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2 h-64 md:h-96">
                <img 
                  src={listing.images[0]} 
                  alt={listing.title}
                  className="w-full h-full object-cover rounded-lg"
                />
              </div>
              {listing.images.slice(1, 5).map((image, index) => (
                <div key={index} className="h-32 md:h-48">
                  <img 
                    src={image} 
                    alt={`${listing.title} ${index + 2}`}
                    className="w-full h-full object-cover rounded-lg"
                  />
                </div>
              ))}
            </div>
          ) : (
            <div className="h-64 md:h-96 bg-gradient-to-br from-primary/20 to-accent/20 rounded-lg flex items-center justify-center">
              <Scissors className="w-24 h-24 text-muted-foreground" />
            </div>
          )}
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h1 className="text-3xl font-bold mb-2">{listing.title}</h1>
                <div className="flex items-center gap-2 text-muted-foreground mb-2">
                  <MapPin className="w-4 h-4" />
                  <span>{listing.address}, {listing.city}, {listing.state} {listing.zip_code}</span>
                </div>
              </div>
              <Badge variant="secondary" className="capitalize">
                {listing.space_type.replace('_', ' ')}
              </Badge>
            </div>

            <div className="prose max-w-none mb-8">
              <h3 className="text-xl font-semibold mb-2">About this space</h3>
              <p className="text-muted-foreground whitespace-pre-wrap">{listing.description}</p>
            </div>

            {/* Amenities */}
            {listing.amenities && listing.amenities.length > 0 && (
              <div className="mb-8">
                <h3 className="text-xl font-semibold mb-4">Amenities</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {listing.amenities.map((amenity) => {
                    const IconComponent = amenityIcons[amenity] || Package;
                    return (
                      <div key={amenity} className="flex items-center gap-2">
                        <IconComponent className="w-5 h-5 text-primary" />
                        <span className="capitalize">{amenity}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Host Information */}
            <Card>
              <CardContent className="p-6">
                <h3 className="text-xl font-semibold mb-4">Meet your host</h3>
                <div className="flex items-start gap-4">
                  <Avatar className="w-16 h-16">
                    <AvatarImage src={listing.profiles.profile_image_url} />
                    <AvatarFallback>{listing.profiles.full_name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <h4 className="font-semibold text-lg">{listing.profiles.full_name}</h4>
                    {listing.profiles.bio && (
                      <p className="text-muted-foreground mt-2">{listing.profiles.bio}</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Booking Card */}
          <div className="lg:col-span-1">
            <Card className="sticky top-8">
              <CardContent className="p-6">
                <div className="mb-6">
                  <div className="text-2xl font-bold">${listing.price_per_day} <span className="text-base font-normal text-muted-foreground">per day</span></div>
                  {listing.price_per_week && (
                    <div className="text-lg text-muted-foreground">${listing.price_per_week} per week</div>
                  )}
                </div>

                <Button 
                  onClick={handleBookNow}
                  className="w-full mb-4"
                  size="lg"
                >
                  <Calendar className="w-4 h-4 mr-2" />
                  Book Now
                </Button>

                <div className="text-center text-sm text-muted-foreground">
                  {!user 
                    ? "Sign in to book this space"
                    : profile?.user_type === 'salon_owner' 
                    ? "Only renters can book spaces"
                    : "You won't be charged yet"
                  }
                </div>

                <div className="mt-6 pt-6 border-t space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Response rate:</span>
                    <span>100%</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Response time:</span>
                    <span>Within an hour</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
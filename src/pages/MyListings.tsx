import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Navbar } from '@/components/Navbar';
import { Plus, MapPin, DollarSign, Eye, Edit, Scissors } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface Listing {
  id: string;
  title: string;
  description: string;
  space_type: string;
  price_per_day: number;
  price_per_week?: number;
  city: string;
  state: string;
  amenities: string[];
  images: string[];
  available: boolean;
  created_at: string;
  _count: {
    bookings: number;
  };
}

export default function MyListings() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
    
    if (profile?.user_type !== 'salon_owner') {
      toast({
        title: "Access Denied",
        description: "Only salon owners can view listings",
        variant: "destructive",
      });
      navigate('/');
      return;
    }
  }, [user, profile, navigate]);

  useEffect(() => {
    const fetchListings = async () => {
      if (!profile) return;

      try {
        // Fetch listings
        const { data: listingsData, error: listingsError } = await supabase
          .from('listings')
          .select('*')
          .eq('owner_id', profile.id)
          .order('created_at', { ascending: false });

        if (listingsError) throw listingsError;

        // Fetch booking counts for each listing
        const listingsWithCounts = await Promise.all(
          (listingsData || []).map(async (listing) => {
            const { count } = await supabase
              .from('bookings')
              .select('*', { count: 'exact', head: true })
              .eq('listing_id', listing.id);
            
            return {
              ...listing,
              _count: { bookings: count || 0 }
            };
          })
        );

        setListings(listingsWithCounts);
      } catch (error) {
        console.error('Error fetching listings:', error);
        toast({
          title: "Error",
          description: "Failed to load listings",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchListings();
  }, [profile]);

  const toggleAvailability = async (listingId: string, available: boolean) => {
    try {
      const { error } = await supabase
        .from('listings')
        .update({ available })
        .eq('id', listingId);

      if (error) throw error;

      setListings(prev => 
        prev.map(listing => 
          listing.id === listingId 
            ? { ...listing, available }
            : listing
        )
      );

      toast({
        title: available ? "Listing Activated" : "Listing Deactivated",
        description: `Your listing is now ${available ? 'visible' : 'hidden'} to renters.`,
      });
    } catch (error) {
      console.error('Error updating listing:', error);
      toast({
        title: "Error",
        description: "Failed to update listing",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-muted rounded w-1/4 mb-8"></div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-64 bg-muted rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">My Listings</h1>
          <Button onClick={() => navigate('/create-listing')}>
            <Plus className="w-4 h-4 mr-2" />
            Add New Listing
          </Button>
        </div>

        {listings.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <Scissors className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No listings yet</h3>
              <p className="text-muted-foreground mb-4">
                Create your first listing to start renting out your salon space!
              </p>
              <Button onClick={() => navigate('/create-listing')}>
                <Plus className="w-4 h-4 mr-2" />
                Create First Listing
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {listings.map((listing) => (
              <Card key={listing.id} className="overflow-hidden">
                <div className="h-48 bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center relative">
                  {listing.images?.[0] ? (
                    <img 
                      src={listing.images[0]} 
                      alt={listing.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Scissors className="w-12 h-12 text-muted-foreground" />
                  )}
                  <div className="absolute top-2 right-2">
                    <Badge variant={listing.available ? "default" : "secondary"}>
                      {listing.available ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                </div>
                
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <CardTitle className="text-lg line-clamp-1">
                        {listing.title}
                      </CardTitle>
                      <CardDescription className="flex items-center gap-1 mt-1">
                        <MapPin className="w-3 h-3" />
                        {listing.city}, {listing.state}
                      </CardDescription>
                    </div>
                    <Badge variant="outline" className="capitalize">
                      {listing.space_type.replace('_', ' ')}
                    </Badge>
                  </div>
                </CardHeader>
                
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1">
                        <DollarSign className="w-4 h-4 text-muted-foreground" />
                        <span className="font-semibold">${listing.price_per_day}/day</span>
                      </div>
                      {listing.price_per_week && (
                        <span className="text-sm text-muted-foreground">
                          ${listing.price_per_week}/week
                        </span>
                      )}
                    </div>
                    
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">
                        {listing._count.bookings} booking{listing._count.bookings !== 1 ? 's' : ''}
                      </span>
                      <span className="text-muted-foreground">
                        {listing.amenities?.length || 0} amenities
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between pt-2 border-t">
                      <div className="flex items-center space-x-2">
                        <Switch
                          checked={listing.available}
                          onCheckedChange={(checked) => toggleAvailability(listing.id, checked)}
                        />
                        <span className="text-sm">
                          {listing.available ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                      
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => navigate(`/listing/${listing.id}`)}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            toast({
                              title: "Coming Soon",
                              description: "Edit functionality will be available soon!",
                            });
                          }}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Navbar } from '@/components/Navbar';
import { Search, MapPin, Star, Scissors, Calendar, Users } from 'lucide-react';
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
  profiles: {
    full_name: string;
  };
}

const Index = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [listings, setListings] = useState<Listing[]>([]);
  const [filteredListings, setFilteredListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [spaceTypeFilter, setSpaceTypeFilter] = useState('all');
  const [cityFilter, setCityFilter] = useState('all');

  const fetchListings = async () => {
    try {
      const { data, error } = await supabase
        .from('listings')
        .select(`
          *,
          profiles!listings_owner_id_fkey (
            full_name
          )
        `)
        .eq('available', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setListings(data || []);
      setFilteredListings(data || []);
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

  useEffect(() => {
    fetchListings();
  }, []);

  useEffect(() => {
    let filtered = listings;

    if (searchTerm) {
      filtered = filtered.filter(listing =>
        listing.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        listing.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        listing.city.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (spaceTypeFilter !== 'all') {
      filtered = filtered.filter(listing => listing.space_type === spaceTypeFilter);
    }

    if (cityFilter !== 'all') {
      filtered = filtered.filter(listing => listing.city === cityFilter);
    }

    setFilteredListings(filtered);
  }, [searchTerm, spaceTypeFilter, cityFilter, listings]);

  const uniqueCities = [...new Set(listings.map(listing => listing.city))];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary/10 to-accent/10 py-20">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-5xl font-bold mb-6">Find Your Perfect Salon Space</h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Discover premium salon chairs and private rooms available for rent by the day or week.
            Perfect for cosmetologists and barbers looking for flexible workspace solutions.
          </p>
          
          <div className="flex flex-col md:flex-row gap-4 max-w-4xl mx-auto">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
              <Input
                placeholder="Search by location or salon name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 h-12"
              />
            </div>
            
            <Select value={spaceTypeFilter} onValueChange={setSpaceTypeFilter}>
              <SelectTrigger className="w-full md:w-48 h-12">
                <SelectValue placeholder="Space Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="chair">Salon Chair</SelectItem>
                <SelectItem value="private_room">Private Room</SelectItem>
                <SelectItem value="booth">Booth</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={cityFilter} onValueChange={setCityFilter}>
              <SelectTrigger className="w-full md:w-48 h-12">
                <SelectValue placeholder="City" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Cities</SelectItem>
                {uniqueCities.map(city => (
                  <SelectItem key={city} value={city}>{city}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center mx-auto mb-4">
                <Scissors className="w-6 h-6 text-primary-foreground" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Professional Spaces</h3>
              <p className="text-muted-foreground">Premium salon chairs and private rooms in top-rated salons</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-accent rounded-lg flex items-center justify-center mx-auto mb-4">
                <Calendar className="w-6 h-6 text-accent-foreground" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Flexible Booking</h3>
              <p className="text-muted-foreground">Book by the day or week to fit your schedule</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-secondary rounded-lg flex items-center justify-center mx-auto mb-4">
                <Users className="w-6 h-6 text-secondary-foreground" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Trusted Community</h3>
              <p className="text-muted-foreground">Connect with verified salon owners and professionals</p>
            </div>
          </div>
        </div>
      </section>

      {/* Listings Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-3xl font-bold">Available Spaces</h2>
            <p className="text-muted-foreground">{filteredListings.length} spaces available</p>
          </div>

          {loading ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <div className="h-48 bg-muted rounded-t-lg"></div>
                  <CardContent className="p-6">
                    <div className="h-4 bg-muted rounded mb-2"></div>
                    <div className="h-4 bg-muted rounded w-2/3 mb-4"></div>
                    <div className="h-6 bg-muted rounded w-1/3"></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : filteredListings.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground text-lg">No spaces found matching your criteria.</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredListings.map((listing) => (
                <Card key={listing.id} className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer">
                  <div 
                    onClick={() => navigate(`/listing/${listing.id}`)}
                    className="h-48 bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center"
                  >
                    {listing.images?.[0] ? (
                      <img src={listing.images[0]} alt={listing.title} className="w-full h-full object-cover" />
                    ) : (
                      <Scissors className="w-12 h-12 text-muted-foreground" />
                    )}
                  </div>
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="text-lg font-semibold line-clamp-1">{listing.title}</h3>
                      <Badge variant="secondary" className="capitalize">{listing.space_type.replace('_', ' ')}</Badge>
                    </div>
                    <p className="text-muted-foreground text-sm mb-2 line-clamp-2">{listing.description}</p>
                    <div className="flex items-center text-sm text-muted-foreground mb-3">
                      <MapPin className="w-4 h-4 mr-1" />
                      {listing.city}, {listing.state}
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-lg font-bold">${listing.price_per_day}/day</p>
                        {listing.price_per_week && (
                          <p className="text-sm text-muted-foreground">${listing.price_per_week}/week</p>
                        )}
                      </div>
                      <Button onClick={() => navigate(`/listing/${listing.id}`)}>
                        View Details
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* CTA Section */}
      {!user && (
        <section className="py-16 bg-primary/5">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl font-bold mb-4">Ready to Get Started?</h2>
            <p className="text-xl text-muted-foreground mb-8">
              Join thousands of beauty professionals who trust ShearSpace
            </p>
            <div className="space-x-4">
              <Button onClick={() => navigate('/auth')} size="lg">
                Sign Up Now
              </Button>
              <Button variant="outline" size="lg" onClick={() => navigate('/auth')}>
                Learn More
              </Button>
            </div>
          </div>
        </section>
      )}
    </div>
  );
};

export default Index;

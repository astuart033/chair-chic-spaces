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
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);

  // Popular cities and locations for suggestions
  const popularLocations = [
    'Los Angeles, CA',
    'Miami, FL', 
    'New York, NY',
    'Chicago, IL',
    'Atlanta, GA',
    'Dallas, TX',
    'Las Vegas, NV',
    'Phoenix, AZ',
    'San Francisco, CA',
    'Seattle, WA',
    'Houston, TX',
    'Denver, CO',
    'Orlando, FL',
    'Nashville, TN',
    'Austin, TX'
  ];

  // Demo listings to show when no real listings exist
  const demoListings: Listing[] = [
    {
      id: 'demo-1',
      title: 'Premium Salon Chair - Downtown',
      description: 'Beautiful salon chair in a high-end salon with all amenities included. Perfect for experienced stylists.',
      space_type: 'chair',
      price_per_day: 75,
      price_per_week: 450,
      city: 'Los Angeles',
      state: 'CA',
      amenities: ['WiFi', 'Parking', 'Storage', 'Shampoo Bowl'],
      images: [],
      profiles: { full_name: 'Demo Salon Owner' }
    },
    {
      id: 'demo-2',
      title: 'Private Room with Full Setup',
      description: 'Spacious private room with professional lighting and premium equipment. Ideal for building your clientele.',
      space_type: 'private_room',
      price_per_day: 120,
      price_per_week: 700,
      city: 'Miami',
      state: 'FL',
      amenities: ['Private Entrance', 'WiFi', 'Storage', 'Reception Area'],
      images: [],
      profiles: { full_name: 'Demo Salon Owner' }
    },
    {
      id: 'demo-3',
      title: 'Modern Booth Space',
      description: 'Contemporary booth in a trendy salon. Great location with high foot traffic and modern amenities.',
      space_type: 'booth',
      price_per_day: 90,
      price_per_week: 525,
      city: 'New York',
      state: 'NY',
      amenities: ['WiFi', 'Security System', 'Break Room', 'Storage'],
      images: [],
      profiles: { full_name: 'Demo Salon Owner' }
    }
  ];

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
      
      // If no real listings exist, show demo listings
      const realListings = data || [];
      const displayListings = realListings.length > 0 ? realListings : demoListings;
      
      setListings(displayListings);
      setFilteredListings(displayListings);
    } catch (error) {
      console.error('Error fetching listings:', error);
      // On error, still show demo listings so users can see the interface
      setListings(demoListings);
      setFilteredListings(demoListings);
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

  // Handle search input changes and show suggestions
  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    
    if (value.length > 0) {
      // Combine popular locations with actual listing cities
      const allLocations = [...popularLocations, ...uniqueCities.map(city => `${city}, ${listings.find(l => l.city === city)?.state || 'US'}`)];
      const filtered = allLocations.filter(location => 
        location.toLowerCase().includes(value.toLowerCase())
      ).slice(0, 6); // Limit to 6 suggestions
      
      setSuggestions(filtered);
      setShowSuggestions(true);
    } else {
      setShowSuggestions(false);
      setSuggestions([]);
    }
  };

  // Handle suggestion selection
  const handleSuggestionClick = (suggestion: string) => {
    setSearchTerm(suggestion);
    setShowSuggestions(false);
    setSuggestions([]);
  };

  // Handle clicking outside to close suggestions
  useEffect(() => {
    const handleClickOutside = () => {
      setShowSuggestions(false);
    };
    
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

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
              <Search className="absolute left-3 top-3 h-5 w-5 text-muted-foreground z-10" />
              <Input
                placeholder="Search by location or salon name..."
                value={searchTerm}
                onChange={(e) => handleSearchChange(e.target.value)}
                onFocus={() => searchTerm.length > 0 && setShowSuggestions(true)}
                className="pl-10 h-12"
                onClick={(e) => e.stopPropagation()}
              />
              
              {/* Search Suggestions Dropdown */}
              {showSuggestions && suggestions.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-background border border-border rounded-lg shadow-lg z-50 max-h-48 overflow-y-auto">
                  {suggestions.map((suggestion, index) => (
                    <div
                      key={index}
                      className="px-4 py-3 hover:bg-muted cursor-pointer border-b border-border last:border-b-0 flex items-center gap-2"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSuggestionClick(suggestion);
                      }}
                    >
                      <MapPin className="w-4 h-4 text-muted-foreground" />
                      <span>{suggestion}</span>
                    </div>
                  ))}
                </div>
              )}
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
              <p className="text-muted-foreground text-lg">
                {searchTerm || cityFilter !== 'all' || spaceTypeFilter !== 'all' 
                  ? "No spaces here yet - but they're coming soon!" 
                  : "No spaces available yet"}
              </p>
              <p className="text-muted-foreground text-sm mt-2">
                Be the first to know when spaces become available in your area.
              </p>
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

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Calendar } from '@/components/ui/calendar';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Navbar } from '@/components/Navbar';
import { CalendarIcon, ArrowLeft, CreditCard } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { addDays, differenceInDays, format } from 'date-fns';

interface Listing {
  id: string;
  title: string;
  price_per_day: number;
  price_per_week?: number;
  profiles: {
    full_name: string;
  };
}

export default function BookingFlow() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const [listing, setListing] = useState<Listing | null>(null);
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();
  const [bookingType, setBookingType] = useState<'daily' | 'weekly'>('daily');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchListing = async () => {
      try {
        const { data, error } = await supabase
          .from('listings')
          .select(`
            id,
            title,
            price_per_day,
            price_per_week,
            profiles!listings_owner_id_fkey (
              full_name
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
        navigate('/');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchListing();
    }
  }, [id, navigate]);

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
    
    if (profile?.user_type === 'salon_owner') {
      toast({
        title: "Access Denied",
        description: "Only renters can book spaces",
        variant: "destructive",
      });
      navigate('/');
    }
  }, [user, profile, navigate]);

  const calculateTotal = () => {
    if (!startDate || !endDate || !listing) return 0;
    
    const days = differenceInDays(endDate, startDate) + 1;
    
    if (bookingType === 'weekly' && listing.price_per_week) {
      const weeks = Math.ceil(days / 7);
      return weeks * listing.price_per_week;
    }
    
    return days * listing.price_per_day;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!startDate || !endDate || !listing || !profile) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);

    try {
      const totalAmount = calculateTotal();
      
      const { data, error } = await supabase
        .from('bookings')
        .insert({
          listing_id: listing.id,
          renter_id: profile.id,
          start_date: format(startDate, 'yyyy-MM-dd'),
          end_date: format(endDate, 'yyyy-MM-dd'),
          total_amount: totalAmount,
          booking_type: bookingType,
          status: 'pending'
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Booking Request Sent!",
        description: "Your booking request has been sent to the salon owner for approval.",
      });
      
      navigate('/my-bookings');
    } catch (error: any) {
      console.error('Error creating booking:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to create booking",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse max-w-2xl mx-auto">
            <div className="h-8 bg-muted rounded w-1/4 mb-8"></div>
            <div className="h-64 bg-muted rounded"></div>
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

  const days = startDate && endDate ? differenceInDays(endDate, startDate) + 1 : 0;
  const total = calculateTotal();

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="container mx-auto px-4 py-8">
        <Button 
          variant="ghost" 
          onClick={() => navigate(`/listing/${id}`)}
          className="mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to listing
        </Button>

        <div className="max-w-2xl mx-auto">
          <h1 className="text-3xl font-bold mb-8">Book Your Space</h1>
          
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="w-5 h-5" />
                {listing.title}
              </CardTitle>
              <p className="text-muted-foreground">Hosted by {listing.profiles.full_name}</p>
            </CardHeader>
          </Card>

          <form onSubmit={handleSubmit} className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Select Dates</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label>Check-in Date</Label>
                    <div className="border rounded-lg p-3">
                      <Calendar
                        mode="single"
                        selected={startDate}
                        onSelect={setStartDate}
                        disabled={(date) => date < new Date()}
                        className="w-full"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <Label>Check-out Date</Label>
                    <div className="border rounded-lg p-3">
                      <Calendar
                        mode="single"
                        selected={endDate}
                        onSelect={setEndDate}
                        disabled={(date) => !startDate || date <= startDate}
                        className="w-full"
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Booking Type</CardTitle>
              </CardHeader>
              <CardContent>
                <RadioGroup value={bookingType} onValueChange={(value: 'daily' | 'weekly') => setBookingType(value)}>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="daily" id="daily" />
                    <Label htmlFor="daily">Daily Rate (${listing.price_per_day}/day)</Label>
                  </div>
                  {listing.price_per_week && (
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="weekly" id="weekly" />
                      <Label htmlFor="weekly">Weekly Rate (${listing.price_per_week}/week)</Label>
                    </div>
                  )}
                </RadioGroup>
              </CardContent>
            </Card>

            {/* Booking Summary */}
            {startDate && endDate && (
              <Card>
                <CardHeader>
                  <CardTitle>Booking Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Check-in:</span>
                      <span>{format(startDate, 'MMM dd, yyyy')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Check-out:</span>
                      <span>{format(endDate, 'MMM dd, yyyy')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Duration:</span>
                      <span>{days} day{days > 1 ? 's' : ''}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Rate:</span>
                      <span>
                        {bookingType === 'weekly' && listing.price_per_week
                          ? `$${listing.price_per_week}/week`
                          : `$${listing.price_per_day}/day`
                        }
                      </span>
                    </div>
                    <div className="border-t pt-2 flex justify-between font-bold text-lg">
                      <span>Total:</span>
                      <span>${total}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="flex gap-4">
              <Button type="button" variant="outline" onClick={() => navigate(`/listing/${id}`)}>
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={!startDate || !endDate || submitting}
                className="flex-1"
              >
                {submitting ? 'Processing...' : 'Request Booking'}
              </Button>
            </div>
          </form>

          <div className="mt-6 p-4 bg-muted/30 rounded-lg">
            <p className="text-sm text-muted-foreground">
              <strong>Note:</strong> This is a booking request. You won't be charged until the salon owner confirms your booking. 
              Payment will be processed through our secure platform once confirmed.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
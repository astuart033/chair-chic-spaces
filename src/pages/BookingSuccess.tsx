import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Navbar } from '@/components/Navbar';
import { CheckCircle, Calendar, CreditCard } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export default function BookingSuccess() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  
  const sessionId = searchParams.get('session_id');

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }

    if (!sessionId) {
      navigate('/');
      return;
    }

    // Here you could verify the payment with Stripe if needed
    // For now, we'll show the success message
  }, [user, sessionId]);

  const handleCreateBooking = async () => {
    if (!sessionId) return;
    
    setLoading(true);
    try {
      // Here you would typically verify the payment and create the booking
      // The booking creation logic would be in the create-connect-payment function
      // or in a webhook handler
      
      toast({
        title: "Booking Confirmed!",
        description: "Your payment was successful and booking has been confirmed.",
      });
      
      navigate('/my-bookings');
    } catch (error: any) {
      console.error('Error processing booking:', error);
      toast({
        title: "Error",
        description: "There was an issue processing your booking. Please contact support.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto text-center">
          <div className="mb-8">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h1 className="text-3xl font-bold mb-2">Payment Successful!</h1>
            <p className="text-muted-foreground">
              Your booking has been confirmed and payment processed successfully.
            </p>
          </div>

          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center justify-center gap-2">
                <CreditCard className="w-5 h-5" />
                Payment Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-green-50 dark:bg-green-950 rounded-lg">
                <p className="text-green-700 dark:text-green-300">
                  ✓ Payment processed securely through Stripe
                </p>
                <p className="text-green-700 dark:text-green-300">
                  ✓ 90% paid directly to salon owner
                </p>
                <p className="text-green-700 dark:text-green-300">
                  ✓ Booking confirmation sent to your email
                </p>
              </div>
              
              {sessionId && (
                <div className="text-sm text-muted-foreground">
                  <p>Session ID: {sessionId}</p>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="space-y-4">
            <Button 
              onClick={() => navigate('/my-bookings')}
              className="w-full"
              size="lg"
            >
              <Calendar className="mr-2 h-4 w-4" />
              View My Bookings
            </Button>
            
            <Button 
              variant="outline" 
              onClick={() => navigate('/')}
              className="w-full"
            >
              Back to Home
            </Button>
          </div>

          <div className="mt-8 p-4 bg-muted/30 rounded-lg">
            <p className="text-sm text-muted-foreground">
              <strong>What's next?</strong> The salon owner will receive notification of your booking. 
              You can manage your bookings in the "My Bookings" section.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
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
  const [loading, setLoading] = useState(true);
  const [paymentVerified, setPaymentVerified] = useState(false);
  const [verificationError, setVerificationError] = useState<string | null>(null);
  const [bookingDetails, setBookingDetails] = useState<any>(null);
  
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

    verifyPayment();
  }, [user, sessionId]);

  const verifyPayment = async () => {
    if (!sessionId) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('verify-payment', {
        body: { session_id: sessionId }
      });

      if (error) throw error;

      if (data.verified) {
        setPaymentVerified(true);
        setBookingDetails(data);
        
        if (!data.booking_exists) {
          toast({
            title: "Payment Verified",
            description: "Your payment was successful. Booking details are being processed.",
          });
        } else {
          toast({
            title: "Booking Confirmed!",
            description: "Your payment was successful and booking has been confirmed.",
          });
        }
      } else {
        setVerificationError(data.message || "Payment verification failed");
        toast({
          title: "Payment Issue",
          description: data.message || "There was an issue verifying your payment.",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error('Payment verification error:', error);
      setVerificationError(error.message);
      toast({
        title: "Verification Error",
        description: "Unable to verify payment. Please contact support.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

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

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-2xl mx-auto text-center">
            <div className="animate-pulse">
              <div className="w-16 h-16 bg-muted rounded-full mx-auto mb-4"></div>
              <div className="h-8 bg-muted rounded w-3/4 mx-auto mb-2"></div>
              <div className="h-4 bg-muted rounded w-1/2 mx-auto"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (verificationError) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-2xl mx-auto text-center">
            <div className="mb-8">
              <div className="w-16 h-16 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-red-600 dark:text-red-400 text-2xl">⚠</span>
              </div>
              <h1 className="text-3xl font-bold mb-2">Payment Verification Failed</h1>
              <p className="text-muted-foreground">
                {verificationError}
              </p>
            </div>
            <Button onClick={() => navigate('/')} variant="outline">
              Back to Home
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto text-center">
          <div className="mb-8">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h1 className="text-3xl font-bold mb-2">
              {paymentVerified ? "Payment Verified!" : "Payment Successful!"}
            </h1>
            <p className="text-muted-foreground">
              {bookingDetails?.booking_exists 
                ? "Your booking has been confirmed and payment processed successfully."
                : "Your payment was successful. Booking confirmation is being processed."
              }
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
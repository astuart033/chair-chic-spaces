import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Navbar } from '@/components/Navbar';
import { CheckCircle, AlertCircle, CreditCard, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function SalonOnboarding() {
  const [loading, setLoading] = useState(false);
  const [checkingStatus, setCheckingStatus] = useState(true);
  const [connectStatus, setConnectStatus] = useState({
    onboarded: false,
    details_submitted: false,
    charges_enabled: false
  });
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();

  const isSuccess = searchParams.get('success') === 'true';
  const isRefresh = searchParams.get('refresh') === 'true';

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }

    if (profile?.user_type !== 'salon_owner') {
      navigate('/');
      return;
    }

    checkConnectStatus();
  }, [user, profile]);

  useEffect(() => {
    if (isSuccess) {
      toast({
        title: "Onboarding Complete!",
        description: "Your Stripe account has been set up successfully.",
      });
      // Remove the success param from URL
      navigate('/salon-onboarding', { replace: true });
    }
  }, [isSuccess]);

  const checkConnectStatus = async () => {
    try {
      setCheckingStatus(true);
      const { data, error } = await supabase.functions.invoke('check-connect-status');
      
      if (error) throw error;
      
      setConnectStatus(data);
    } catch (error: any) {
      console.error('Error checking Connect status:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to check account status",
        variant: "destructive",
      });
    } finally {
      setCheckingStatus(false);
    }
  };

  const startOnboarding = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.functions.invoke('create-connect-account');
      
      if (error) throw error;
      
      if (data?.url) {
        window.location.href = data.url;
      }
    } catch (error: any) {
      console.error('Error starting onboarding:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to start onboarding",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (checkingStatus) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-8 flex items-center justify-center">
          <div className="flex items-center space-x-2">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span>Checking account status...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold mb-2">Payment Setup</h1>
            <p className="text-muted-foreground">
              Complete your Stripe setup to start receiving payments from bookings
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <CreditCard className="h-5 w-5" />
                <span>Stripe Connect Account</span>
              </CardTitle>
              <CardDescription>
                Set up payments to receive money from salon chair and room bookings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Status Indicators */}
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  {connectStatus.details_submitted ? (
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  ) : (
                    <AlertCircle className="h-5 w-5 text-yellow-500" />
                  )}
                  <span className={connectStatus.details_submitted ? "text-green-600" : "text-yellow-600"}>
                    Account details {connectStatus.details_submitted ? "submitted" : "pending"}
                  </span>
                </div>
                
                <div className="flex items-center space-x-3">
                  {connectStatus.onboarded ? (
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  ) : (
                    <AlertCircle className="h-5 w-5 text-yellow-500" />
                  )}
                  <span className={connectStatus.onboarded ? "text-green-600" : "text-yellow-600"}>
                    Account {connectStatus.onboarded ? "verified and ready" : "verification pending"}
                  </span>
                </div>
              </div>

              {/* Information about the process */}
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>How it works:</strong> You'll receive 90% of each booking payment directly to your bank account. 
                  ShearSpace keeps 10% as a platform fee. Payments are processed securely through Stripe.
                </AlertDescription>
              </Alert>

              {/* Action buttons */}
              <div className="space-y-3">
                {!connectStatus.onboarded ? (
                  <Button 
                    onClick={startOnboarding} 
                    disabled={loading}
                    className="w-full"
                    size="lg"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Starting setup...
                      </>
                    ) : (
                      <>
                        <CreditCard className="mr-2 h-4 w-4" />
                        {connectStatus.details_submitted ? "Continue Setup" : "Start Payment Setup"}
                      </>
                    )}
                  </Button>
                ) : (
                  <div className="space-y-3">
                    <Alert>
                      <CheckCircle className="h-4 w-4" />
                      <AlertDescription>
                        <strong>Setup Complete!</strong> Your payment account is ready to receive bookings.
                      </AlertDescription>
                    </Alert>
                    <Button 
                      onClick={() => navigate('/create-listing')}
                      className="w-full"
                      size="lg"
                    >
                      Create Your First Listing
                    </Button>
                  </div>
                )}

                <Button 
                  variant="outline" 
                  onClick={checkConnectStatus}
                  className="w-full"
                >
                  Refresh Status
                </Button>
              </div>

              {/* Help text */}
              <div className="text-sm text-muted-foreground space-y-2">
                <p><strong>What you'll need:</strong></p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Bank account for deposits</li>
                  <li>Tax identification information</li>
                  <li>Business or personal identification</li>
                  <li>Phone number for verification</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import { Scissors } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Link } from 'react-router-dom';

export default function Auth() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [userType, setUserType] = useState<'salon_owner' | 'renter'>('renter');
  const [loading, setLoading] = useState(false);
  const [resetMode, setResetMode] = useState(false);
  const [agreeToTerms, setAgreeToTerms] = useState(false);
  
  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (resetMode) {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/`,
        });
        if (error) throw error;
        toast({
          title: "Password reset email sent!",
          description: "Check your email for the password reset link.",
        });
        setResetMode(false);
      } else if (isSignUp) {
        if (!agreeToTerms) {
          toast({
            title: "Terms Required",
            description: "You must agree to the Terms of Service to create an account.",
            variant: "destructive",
          });
          setLoading(false);
          return;
        }
        const { error } = await signUp(email, password, { full_name: fullName, user_type: userType });
        if (error) throw error;
        toast({
          title: "Account created successfully!",
          description: "Please check your email to verify your account.",
        });
      } else {
        const { error } = await signIn(email, password);
        if (error) throw error;
        navigate('/');
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "An error occurred",
        variant: "destructive",
      });
    }
    
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 px-4">
      <div className="w-full max-w-md">
        <div className="flex items-center justify-center mb-8">
          <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center mr-3">
            <Scissors className="w-6 h-6 text-primary-foreground" />
          </div>
          <h1 className="text-3xl font-bold">ShearSpace</h1>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>
              {resetMode ? 'Reset Password' : (isSignUp ? 'Create Account' : 'Sign In')}
            </CardTitle>
            <CardDescription>
              {resetMode 
                ? 'Enter your email to receive a password reset link'
                : (isSignUp 
                  ? 'Join ShearSpace to start booking spaces or listing your salon'
                  : 'Welcome back to ShearSpace'
                )
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {isSignUp && !resetMode && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="fullName">Full Name</Label>
                    <Input
                      id="fullName"
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      required
                    />
                  </div>
                  
                  <div className="space-y-3">
                    <Label>I am a:</Label>
                    <RadioGroup value={userType} onValueChange={(value: 'salon_owner' | 'renter') => setUserType(value)}>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="renter" id="renter" />
                        <Label htmlFor="renter">Cosmetologist/Barber looking to rent</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="salon_owner" id="salon_owner" />
                        <Label htmlFor="salon_owner">Salon owner with spaces to rent</Label>
                      </div>
                    </RadioGroup>
                  </div>
                  
                  <div className="flex items-start space-x-2">
                    <Checkbox 
                      id="terms" 
                      checked={agreeToTerms}
                      onCheckedChange={(checked) => setAgreeToTerms(checked === true)}
                    />
                    <Label htmlFor="terms" className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                      I agree to the{' '}
                      <Link to="/terms" className="text-primary hover:underline" target="_blank">
                        Terms of Service
                      </Link>
                    </Label>
                  </div>
                </>
              )}
              
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              
              {!resetMode && (
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
              )}
              
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Loading...' : 
                 resetMode ? 'Send Reset Email' :
                 (isSignUp ? 'Create Account' : 'Sign In')}
              </Button>
            </form>
            
            <div className="mt-4 text-center space-y-2">
              {!resetMode && (
                <Button
                  variant="link"
                  onClick={() => setIsSignUp(!isSignUp)}
                  className="text-sm"
                >
                  {isSignUp 
                    ? 'Already have an account? Sign in'
                    : "Don't have an account? Sign up"
                  }
                </Button>
              )}
              
              <Button
                variant="link"
                onClick={() => {
                  setResetMode(!resetMode);
                  setIsSignUp(false);
                }}
                className="text-sm"
              >
                {resetMode ? 'Back to sign in' : 'Forgot your password?'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
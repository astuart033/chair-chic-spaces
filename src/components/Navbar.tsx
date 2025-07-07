import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useAuth } from '@/contexts/AuthContext';
import { Scissors, Menu, User, LogOut, Calendar, Home, Plus } from 'lucide-react';

export const Navbar = () => {
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link to="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <Scissors className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold">ShearPlace</span>
          </Link>

          <div className="hidden md:flex items-center space-x-6">
            <Link to="/" className="text-foreground hover:text-primary transition-colors">
              Home
            </Link>
            {user && (
              <>
                <Link to="/my-bookings" className="text-foreground hover:text-primary transition-colors">
                  My Bookings
                </Link>
                {profile?.user_type === 'salon_owner' && (
                  <>
                    {!profile.stripe_connect_onboarded ? (
                      <Link to="/salon-onboarding" className="text-yellow-600 hover:text-yellow-700 transition-colors font-medium">
                        Complete Setup
                      </Link>
                    ) : (
                      <>
                        <Link to="/my-listings" className="text-foreground hover:text-primary transition-colors">
                          My Listings
                        </Link>
                        <Link to="/create-listing" className="text-foreground hover:text-primary transition-colors">
                          Add Listing
                        </Link>
                      </>
                    )}
                  </>
                )}
              </>
            )}
          </div>

          <div className="flex items-center space-x-4">
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={profile?.profile_image_url} alt={profile?.full_name} />
                      <AvatarFallback>{profile?.full_name?.charAt(0).toUpperCase()}</AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <div className="flex items-center justify-start gap-2 p-2">
                    <div className="flex flex-col space-y-1 leading-none">
                      <p className="font-medium">{profile?.full_name}</p>
                      <p className="w-[200px] truncate text-sm text-muted-foreground">
                        {profile?.email}
                      </p>
                    </div>
                  </div>
                  <DropdownMenuItem onClick={() => navigate('/profile')}>
                    <User className="mr-2 h-4 w-4" />
                    Profile
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate('/my-bookings')}>
                    <Calendar className="mr-2 h-4 w-4" />
                    My Bookings
                  </DropdownMenuItem>
                  {profile?.user_type === 'salon_owner' && (
                    <>
                      <DropdownMenuItem onClick={() => navigate('/my-listings')}>
                        <Home className="mr-2 h-4 w-4" />
                        My Listings
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => navigate('/create-listing')}>
                        <Plus className="mr-2 h-4 w-4" />
                        Add Listing
                      </DropdownMenuItem>
                    </>
                  )}
                  <DropdownMenuItem onClick={handleSignOut}>
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button onClick={() => navigate('/auth')}>Sign In</Button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};
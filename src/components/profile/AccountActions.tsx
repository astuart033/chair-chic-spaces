import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { RefreshCw } from 'lucide-react';

interface AccountActionsProps {
  userType: 'salon_owner' | 'renter';
  onAccountTypeSwitch: () => Promise<void>;
  onSignOut: () => Promise<void>;
  switchingType: boolean;
}

export function AccountActions({ userType, onAccountTypeSwitch, onSignOut, switchingType }: AccountActionsProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Account Actions</CardTitle>
        <CardDescription>
          Manage your account settings
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex justify-between items-center py-2">
          <div>
            <p className="font-medium">Account Type</p>
            <p className="text-sm text-muted-foreground">
              {userType === 'salon_owner' ? 'Salon Owner - Create and manage listings' : 'Beauty Professional - Book salon spaces'}
            </p>
          </div>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" disabled={switchingType}>
                <RefreshCw className="w-4 h-4 mr-2" />
                {switchingType ? 'Switching...' : 'Switch Type'}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Switch Account Type</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to switch to {userType === 'salon_owner' ? 'Beauty Professional' : 'Salon Owner'}?
                  {userType === 'salon_owner' && (
                    <span className="block mt-2 text-destructive">
                      Warning: This will reset your Stripe onboarding status and you'll need to complete it again if you switch back to Salon Owner.
                    </span>
                  )}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={onAccountTypeSwitch}>
                  Switch Account Type
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
        
        <div className="flex justify-between items-center py-2 border-t">
          <div>
            <p className="font-medium">Sign Out</p>
            <p className="text-sm text-muted-foreground">
              Sign out of your account
            </p>
          </div>
          <Button variant="destructive" onClick={onSignOut}>
            Sign Out
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
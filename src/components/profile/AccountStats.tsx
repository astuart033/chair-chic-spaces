import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface AccountStatsProps {
  userType: 'salon_owner' | 'renter';
}

export function AccountStats({ userType }: AccountStatsProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Account Statistics</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid md:grid-cols-2 gap-4 text-center">
          <div className="p-4 border border-muted rounded-lg">
            <div className="text-2xl font-bold text-primary">
              {userType === 'salon_owner' ? '0' : '0'}
            </div>
            <div className="text-sm text-muted-foreground">
              {userType === 'salon_owner' ? 'Total Listings' : 'Total Bookings'}
            </div>
          </div>
          <div className="p-4 border border-muted rounded-lg">
            <div className="text-2xl font-bold text-primary">100%</div>
            <div className="text-sm text-muted-foreground">Profile Complete</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
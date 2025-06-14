import { useState, useEffect } from 'react';
import { User, saveUser, getUserById } from '@/lib/user-service';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';

interface UserDetailsProps {
  userId: string;
  onBack?: () => void;
}

export default function UserDetails({ userId, onBack }: UserDetailsProps) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [registrationFee, setRegistrationFee] = useState<number>(25);

  useEffect(() => {
    async function loadUser() {
      if (!userId) return;
      
      setLoading(true);
      try {
        const userData = await getUserById(userId);
        setUser(userData);
        if (userData?.registrationFee) {
          setRegistrationFee(userData.registrationFee);
        }
      } catch (error) {
        console.error('Error loading user:', error);
        toast.error('Failed to load user details');
      } finally {
        setLoading(false);
      }
    }
    
    loadUser();
  }, [userId]);

  const handleRegistrationStatusChange = async () => {
    if (!user) return;
    
    setSaving(true);
    try {
      // Toggle the registration status
      const newStatus = !user.isRegistered;
      
      // Update the user with new registration status and fee
      await saveUser(user.uid, {
        isRegistered: newStatus,
        registrationFee: registrationFee,
        // If marking as registered, also update registration date
        ...(newStatus ? { registrationDate: new Date().toISOString() } : {})
      });
      
      // Update local state
      setUser({
        ...user,
        isRegistered: newStatus,
        registrationFee: registrationFee,
        ...(newStatus ? { registrationDate: new Date().toISOString() } : {})
      });
      
      toast.success(`User marked as ${newStatus ? 'Registered' : 'Not Registered'}`);
    } catch (error) {
      console.error('Error updating registration status:', error);
      toast.error('Failed to update registration status');
    } finally {
      setSaving(false);
    }
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return 'Not available';
    
    try {
      // Handle different timestamp formats
      const date = typeof timestamp === 'number' 
        ? new Date(timestamp)
        : new Date(timestamp);
      
      return format(date, 'PPP');
    } catch (error) {
      return 'Invalid date';
    }
  };

  if (loading) {
    return <div className="flex justify-center p-8">Loading user details...</div>;
  }

  if (!user) {
    return <div className="flex justify-center p-8">User not found</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center">
        <Link href="/dashboard/users" className="flex items-center text-sm text-muted-foreground hover:text-primary mr-auto">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Users
        </Link>
        <h1 className="text-2xl font-bold">User Details</h1>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Basic User Information */}
        <Card>
          <CardHeader>
            <CardTitle>User Information</CardTitle>
            <p className="text-sm text-muted-foreground">Basic user details</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Name</p>
              <p>{user.displayName || user.fullName || 'Not provided'}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Email</p>
              <p>{user.email || 'Not provided'}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Phone</p>
              <p>{user.phoneNumber || 'Not provided'}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">User Type</p>
              <p className="capitalize">{user.userType || 'Not specified'}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Joined</p>
              <p>{formatDate(user.createdAt)}</p>
            </div>
          </CardContent>
        </Card>

        {/* Registration Status */}
        <Card>
          <CardHeader>
            <CardTitle>Registration Status</CardTitle>
            <p className="text-sm text-muted-foreground">
              {user.isRegistered 
                ? 'User has paid registration fee' 
                : 'User has not paid registration fee'}
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Status</p>
              <div className="mt-1">
                <Badge className={user.isRegistered ? 'bg-green-500' : 'bg-yellow-500'}>
                  {user.isRegistered ? 'Registered' : 'Not Registered'}
                </Badge>
              </div>
            </div>
            
            {user.isRegistered && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">Registration Date</p>
                <p>{formatDate(user.registrationDate)}</p>
              </div>
            )}
            
            <div>
              <p className="text-sm font-medium text-muted-foreground">Registration Fee ($)</p>
              <div className="mt-1 flex items-center">
                <span className="text-muted-foreground mr-2">$</span>
                <Input
                  type="number"
                  value={registrationFee}
                  onChange={(e) => setRegistrationFee(Number(e.target.value))}
                  className="max-w-[120px]"
                />
              </div>
            </div>
            
            <Button 
              onClick={handleRegistrationStatusChange}
              disabled={saving}
              className="mt-4"
              variant={user.isRegistered ? "destructive" : "default"}
            >
              {saving 
                ? 'Saving...' 
                : user.isRegistered 
                  ? 'Mark as Not Registered' 
                  : 'Mark as Registered'}
            </Button>
          </CardContent>
        </Card>
      </div>
      
      {/* Address Information if available */}
      {(user.addressLine1 || user.city || user.state) && (
        <Card>
          <CardHeader>
            <CardTitle>Address Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {user.addressLine1 && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">Address</p>
                <p>{user.addressLine1}</p>
                {user.addressLine2 && <p>{user.addressLine2}</p>}
              </div>
            )}
            
            <div className="grid grid-cols-3 gap-4">
              {user.city && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">City</p>
                  <p>{user.city}</p>
                </div>
              )}
              
              {user.state && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">State</p>
                  <p>{user.state}</p>
                </div>
              )}
              
              {user.zipcode && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Zipcode</p>
                  <p>{user.zipcode}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

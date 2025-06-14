'use client';

import React, { useState } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { User, saveUser, UserFormData } from '@/lib/user-service';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

interface UserFormProps {
  user: User | null;
  onClose: () => void;
  onSaved: () => void;
}

export default function UserForm({ user, onClose, onSaved }: UserFormProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const isEditing = !!user;
  
  const form = useForm<UserFormData>({
    defaultValues: {
      fullName: user?.fullName || '',
      email: user?.email || '',
      userType: user?.userType || 'user',
    },
  });

  const onSubmit = async (data: any) => {
    setLoading(true);
    setError(null);
    try {
      if (isEditing && user) {
        // Update user profile fields
        const { password, ...userData } = data;
        await saveUser(user.uid, {
          ...userData,
          uid: user.uid,
        });
        // If password is provided and userType is community_admin, update password in Firebase Auth
        if (data.userType === 'community_admin' && password && password.length >= 6) {
          // Dynamically import firebase/auth to avoid SSR issues
          const { getAuth, updatePassword } = await import('firebase/auth');
          const auth = getAuth();
          // Find the user in Firebase Auth (assumes admin is making the change)
          // This requires the current user to be logged in as the user whose password is being changed, or use Admin SDK on server
          if (auth.currentUser && auth.currentUser.uid === user.uid) {
            try {
              await updatePassword(auth.currentUser, password);
              toast.success('Password updated successfully');
            } catch (err: any) {
              setError('Failed to update password: ' + (err.message || 'Unknown error'));
              return;
            }
          } else {
            setError('Password can only be updated when logged in as this user.');
            return;
          }
        }
        toast.success('User updated successfully');
      } else {
        setError('Direct user creation is not supported. Users must register through the registration page.');
        setLoading(false);
        return;
      }
      onSaved();
    } catch (err: any) {
      console.error('Error saving user:', err);
      setError(err.message || 'Failed to save user. Please try again.');
    } finally {
      setLoading(false);
    }
  };


  return (
    <Card className="fixed inset-0 z-50 bg-background/80 flex items-center justify-center">
      <Card className="w-full max-w-md">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>{isEditing ? 'Edit User' : 'Add User'}</CardTitle>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <XMarkIcon className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="fullName"
                rules={{ required: 'Full name is required' }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full Name</FormLabel>
                    <FormControl>
                      <Input placeholder="John Doe" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="email"
                rules={{
                  required: 'Email is required',
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: 'Invalid email address',
                  },
                }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="user@example.com" 
                        type="email" 
                        {...field} 
                        disabled={isEditing} // Can't change email for existing users
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="userType"
                rules={{ required: 'User type is required' }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>User Type</FormLabel>
                    <FormControl>
                      <select 
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        {...field}
                      >
                        <option value="user">User</option>
                        <option value="admin">Admin</option>
                        <option value="community_admin">Community Admin</option>
                      </select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="pt-4">
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? 'Saving...' : isEditing ? 'Update User' : 'Add User'}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
        <CardFooter className="flex justify-center">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
        </CardFooter>
      </Card>
    </Card>
  );
}

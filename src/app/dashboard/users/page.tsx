'use client';

import React, { useEffect, useState } from 'react';
import { PlusIcon, PencilIcon, TrashIcon, UserIcon } from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getAllUsers, deleteUser, updateUserProfile, saveUser, User } from '@/lib/user-service';
import { USER_ROLES, getUserRoleDisplayName, isValidRole, UserRole } from '@/lib/user-types';
import { toast } from 'sonner';
import { AppSidebar } from "@/components/app-sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { SiteHeader } from "@/components/site-header";
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { AlertCircle } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useForm } from "react-hook-form";

interface UserFormData {
  fullName: string;
  email: string;
  userType: string;
  phoneNumber?: string;
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [timedOut, setTimedOut] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const form = useForm<UserFormData>();

  // Fetch users data with optimized performance
  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    setTimedOut(false);
    
    // Set a timeout to handle long-running requests
    const timeoutId = setTimeout(() => {
      if (loading) {
        // If we're still loading after timeout, show timeout message but keep trying
        setTimedOut(true);
      }
    }, 3000); // Reduced to 3 seconds to give faster feedback
    
    try {
      // Use our optimized getAllUsers function with caching
      const usersData = await getAllUsers();
      setUsers(usersData);
      setLoading(false);
      clearTimeout(timeoutId);
    } catch (err) {
      console.error('Error fetching users:', err);
      setError('Failed to load users. Please try again.');
      setLoading(false);
      clearTimeout(timeoutId);
    }
  };

  // Initial data load and background refresh
  useEffect(() => {
    fetchUsers();
    
    // Set up a periodic refresh in the background every 30 seconds
    const refreshInterval = setInterval(() => {
      getAllUsers().then(freshUsers => {
        setUsers(freshUsers);
      }).catch(err => {
        console.error('[Dashboard] Background refresh error:', err);
      });
    }, 30000);
    
    return () => {
      clearInterval(refreshInterval);
    };
  }, []);

  const handleEditUser = (user: User) => {
    setSelectedUser(user);
    form.reset({
      fullName: user.fullName ?? user.displayName ?? '',
      email: user.email ?? '',
      userType: user.userType ?? user.role ?? 'user',
      phoneNumber: user.phoneNumber ?? '',
    });
    setIsDialogOpen(true);
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user?')) return;
    
    setIsDeleting(true);
    try {
      await deleteUser(userId);
      toast.success('User deleted successfully');
      fetchUsers();
    } catch (error) {
      console.error('Error deleting user:', error);
      toast.error('Failed to delete user');
    } finally {
      setIsDeleting(false);
    }
  };

  const getInitials = (name: string | null | undefined) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase();
  };

  return (
    <SidebarProvider
      style={{
        "--sidebar-width": "calc(var(--spacing) * 72)",
        "--header-height": "calc(var(--spacing) * 12)",
      } as React.CSSProperties}
    >
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader />
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2">
            <div className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-semibold">Users</h1>
                  <p className="text-muted-foreground">Manage users and their access levels</p>
                </div>
                <Button 
                  className="flex items-center gap-1" 
                  onClick={() => {
                    setSelectedUser(null);
                    form.reset({
                      fullName: '',
                      email: '',
                      userType: 'user',
                      phoneNumber: '',
                    });
                    setIsDialogOpen(true);
                  }}
                >
                  <PlusIcon className="h-4 w-4" />
                  Add User
                </Button>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <Card className="col-span-2">
                  <CardHeader>
                    <CardTitle>All Users</CardTitle>
                    <CardDescription>
                      {loading ? 'Loading users...' : `Total users: ${users.length}`}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>User</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>Role</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {loading ? (
                          // Skeleton loading state
                          Array(5).fill(0).map((_, index) => (
                            <TableRow key={`skeleton-${index}`}>
                              <TableCell>
                                <div className="flex items-center gap-3">
                                  <div className="h-8 w-8 rounded-full bg-gray-200 animate-pulse"></div>
                                  <div className="space-y-2">
                                    <div className="h-4 w-24 bg-gray-200 rounded animate-pulse"></div>
                                    <div className="h-3 w-16 bg-gray-200 rounded animate-pulse"></div>
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="h-4 w-32 bg-gray-200 rounded animate-pulse"></div>
                              </TableCell>
                              <TableCell>
                                <div className="h-4 w-20 bg-gray-200 rounded animate-pulse"></div>
                              </TableCell>
                              <TableCell>
                                <div className="h-4 w-16 bg-gray-200 rounded animate-pulse"></div>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <div className="h-8 w-8 bg-gray-200 rounded animate-pulse"></div>
                                  <div className="h-8 w-8 bg-gray-200 rounded animate-pulse"></div>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))
                        ) : error ? (
                          <TableRow>
                            <TableCell colSpan={5} className="text-center py-8">
                              <div className="flex flex-col items-center justify-center gap-4">
                                <p className="text-red-500">{error}</p>
                                <Button onClick={fetchUsers}>Retry</Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ) : users.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={5} className="text-center py-8">
                              No users found. Add your first user to get started.
                            </TableCell>
                          </TableRow>
                        ) : (
                          users.map((user) => (
                            <TableRow key={user.uid}>
                              <TableCell>
                                <div className="flex items-center gap-3">
                                  <Avatar className="h-8 w-8">
                                    <AvatarFallback>{getInitials(user.fullName || user.displayName)}</AvatarFallback>
                                  </Avatar>
                                  <div>
                                    <div className="font-medium">{user.fullName || user.displayName || 'Unnamed User'}</div>
                                    <div className="text-xs text-muted-foreground">{user.phoneNumber || 'No phone'}</div>
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell>{user.email}</TableCell>
                              <TableCell>
                {(() => {
                  const role = user.userType || user.role || 'user';
                  return isValidRole(role) ? getUserRoleDisplayName(role) : 'User';
                })()}
              </TableCell>
                              <TableCell>
                                <div className="flex items-center">
                                  <div className={`mr-2 h-2 w-2 rounded-full ${user.isActive ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                                  <span>{user.isActive ? 'Active' : 'Inactive'}</span>
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <Button
                                    variant="outline"
                                    size="icon"
                                    onClick={() => handleEditUser(user)}
                                  >
                                    <PencilIcon className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="icon"
                                    onClick={() => handleDeleteUser(user.uid)}
                                    disabled={isDeleting}
                                  >
                                    <TrashIcon className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="icon"
                                    asChild
                                  >
                                    <a href={`/dashboard/users/${user.uid}`}>
                                      <UserIcon className="h-4 w-4" />
                                    </a>
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </SidebarInset>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selectedUser ? 'Edit User' : 'Add New User'}</DialogTitle>
            <DialogDescription>
              {selectedUser ? 'Update user details' : 'Create a new user account'}
            </DialogDescription>
          </DialogHeader>
          <form className="space-y-4" onSubmit={form.handleSubmit(async (data) => {
            try {
              if (selectedUser) {
                // Update existing user
                await saveUser(selectedUser.uid, {
                  fullName: data.fullName,
                  userType: data.userType,
                  phoneNumber: data.phoneNumber
                });
                toast.success('User updated successfully');
              } else {
                // Create new user - this would typically involve Firebase Auth
                // For now, we'll just create a user record in Firestore
                const newUser: Partial<User> = {
                  email: data.email,
                  fullName: data.fullName,
                  userType: data.userType,
                  phoneNumber: data.phoneNumber,
                  createdAt: new Date().toISOString(),
                  isActive: true,
                  isEmailVerified: false,
                  uid: `user-${Date.now()}` // This is a placeholder, in a real app you'd use Firebase Auth UID
                };
                await saveUser(newUser.uid!, newUser);
                toast.success('User created successfully');
              }
              setIsDialogOpen(false);
              fetchUsers();
            } catch (error) {
              console.error('Error saving user:', error);
              toast.error('Failed to save user');
            }
          })}>

            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                placeholder="John Doe"
                {...form.register('fullName')}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="john@example.com"
                disabled={!!selectedUser}
                {...form.register('email')}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phoneNumber">Phone Number</Label>
              <Input
                id="phoneNumber"
                type="tel"
                placeholder="+1234567890"
                {...form.register('phoneNumber')}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="userType">User Type</Label>
              <select
                id="userType"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                {...form.register('userType')}
              >
                {Object.values(USER_ROLES).map((role) => (
                  <option key={role} value={role}>
                    {getUserRoleDisplayName(role)}
                  </option>
                ))}
              </select>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">
                {selectedUser ? 'Update User' : 'Create User'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </SidebarProvider>
  );
}

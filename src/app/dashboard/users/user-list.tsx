'use client';

import React, { useState } from 'react';
import { PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { User, deleteUser } from '@/lib/user-service';
import { toast } from 'sonner';

interface UserListProps {
  users: User[];
  onEdit: (user: User) => void;
  onRefresh: () => void;
}

export default function UserList({ users, onEdit, onRefresh }: UserListProps) {
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const handleDeleteClick = (userId: string) => {
    setDeletingUserId(userId);
    setConfirmDelete(userId);
  };

  const handleCancelDelete = () => {
    setDeletingUserId(null);
    setConfirmDelete(null);
    setDeleteError(null);
  };

  const handleConfirmDelete = async (userId: string) => {
    try {
      setDeleteError(null);
      toast.promise(
        deleteUser(userId),
        {
          loading: 'Deleting user...',
          success: 'User deleted successfully',
          error: 'Failed to delete user. Please try again.'
        }
      );
      onRefresh();
    } catch (error) {
      console.error('Error deleting user:', error);
      // Error is handled by toast.promise
    } finally {
      setDeletingUserId(null);
      setConfirmDelete(null);
    }
  };

  if (users.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">No users found</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {deleteError && (
        <Alert variant="destructive">
          <AlertDescription>{deleteError}</AlertDescription>
        </Alert>
      )}
      
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b">
              <th className="text-left py-3 px-4 font-medium">Name</th>
              <th className="text-left py-3 px-4 font-medium">Email</th>
              <th className="text-left py-3 px-4 font-medium">Role</th>
              <th className="text-right py-3 px-4 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => {
              // Ensure user.uid exists and is a string
              const uid = user.uid?.toString() || Math.random().toString(36).substring(2, 15);
              
              return (
                <tr key={uid} className="border-b hover:bg-muted/50">
                  <td className="py-3 px-4">{user.displayName || 'N/A'}</td>
                  <td className="py-3 px-4">{user.email}</td>
                  <td className="py-3 px-4">{user.role || 'user'}</td>
                  <td className="py-3 px-4 text-right">
                    {confirmDelete === user.uid ? (
                      <div className="flex items-center justify-end space-x-2">
                        <span className="text-sm text-destructive mr-2">Confirm delete?</span>
                        <Button 
                          variant="destructive" 
                          size="sm" 
                          onClick={() => handleConfirmDelete(user.uid)}
                          disabled={deletingUserId === user.uid}
                          className="relative"
                        >
                          {deletingUserId === user.uid ? (
                            <>
                              <span className="opacity-0">Yes</span>
                              <span className="absolute inset-0 flex items-center justify-center">
                                <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                              </span>
                            </>
                          ) : 'Yes'}
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={handleCancelDelete}
                        >
                          No
                        </Button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-end space-x-2">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => onEdit(user)}
                        >
                          <PencilIcon className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => handleDeleteClick(user.uid)}
                        >
                          <TrashIcon className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

'use client';

import React, { useState, useRef } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Tournament, 
  TournamentFormData, 
  saveTournament, 
  uploadTournamentImage 
} from '@/lib/tournament-service';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';

interface TournamentFormProps {
  tournament: Tournament | null;
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
}

export default function TournamentForm({ tournament, open, onClose, onSaved }: TournamentFormProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(tournament?.imageUrl || null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      
      // Create a preview URL for the selected image
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };
  
  const isEditing = !!tournament;
  
  const form = useForm<TournamentFormData>({
    defaultValues: {
      name: tournament?.name || '',
      type: tournament?.type || '',
      location: tournament?.location || '',
      startDate: tournament?.startDate || '',
      endDate: tournament?.endDate || '',
      players: tournament?.players || 0,
      price: tournament?.price || 0,
      isFeatured: tournament?.isFeatured || false,
      isPublic: tournament?.isPublic || true,
      registeredUsers: tournament?.registeredUsers || [],
    },
  });

  // Update the image upload progress
  const updateUploadProgress = (progress: number) => {
    setUploadProgress(progress);
  };

  // Add progress indicator to the UI
  const renderUploadProgress = () => {
    if (uploadProgress > 0 && uploadProgress < 100) {
      return (
        <div className="mt-4">
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div 
              className="bg-blue-600 h-2.5 rounded-full transition-all duration-200"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
          <p className="text-sm text-gray-600 mt-1">
            Uploading... {uploadProgress}%
          </p>
        </div>
      );
    }
    return null;
  };

  const onSubmit = async (data: TournamentFormData) => {
    setLoading(true);
    setError(null);
    
    try {
      // Create transaction ID for better tracking
      const transactionId = `txn_${Date.now()}`;
      
      // Prepare tournament data
      const tournamentData: Tournament = {
        id: tournament?.id || `t_${Date.now()}`,
        ...data,
        imageUrl: tournament?.imageUrl || '',
        updatedAt: Date.now(),
      };
      
      // Start saving process
      toast.loading('Saving tournament...');
      
      // Handle image upload in parallel if needed
      let imageUrl = tournament?.imageUrl || '';
      if (imageFile) {
        const tournamentId = tournament?.id || tournamentData.id;
        // Use the progress callback to update the UI
        imageUrl = await uploadTournamentImage(imageFile, tournamentId, (progress) => {
          setUploadProgress(progress);
        });
        tournamentData.imageUrl = imageUrl;
      }
      
      // Save tournament data with retry logic
      let retryCount = 0;
      const maxRetries = 2;
      let success = false;
      
      while (!success && retryCount <= maxRetries) {
        try {
          await saveTournament(tournamentData);
          success = true;
          toast.dismiss();
          toast.success(`Tournament ${isEditing ? 'updated' : 'created'} successfully`);
          onSaved();
        } catch (err: any) {
          retryCount++;
          if (retryCount <= maxRetries) {
            console.warn(`Attempt ${retryCount} failed, retrying...`);
            await new Promise(resolve => setTimeout(resolve, 1000)); // Wait before retry
          } else {
            throw err;
          }
        }
      }
    } catch (err: any) {
      console.error('Error saving tournament:', err);
      setError(err.message || 'Failed to save tournament. Please try again.');
      toast.error('Failed to save tournament. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogTitle className="sr-only">{isEditing ? 'Edit Tournament' : 'Create Tournament'}</DialogTitle>
        <CardHeader className="p-0 pb-4">
          <CardTitle>{isEditing ? 'Edit Tournament' : 'Create Tournament'}</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                rules={{ required: 'Name is required' }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Summer Cup 2025" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="type"
                rules={{ required: 'Type is required' }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Type</FormLabel>
                    <FormControl>
                      <Input placeholder="Football, Basketball, etc." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="location"
                rules={{ required: 'Location is required' }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Location</FormLabel>
                    <FormControl>
                      <Input placeholder="Stadium XYZ" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="startDate"
                  rules={{ required: 'Start date is required' }}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Start Date</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="endDate"
                  rules={{ required: 'End date is required' }}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>End Date</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormItem>
                <FormLabel>Tournament Image</FormLabel>
                <FormControl>
                  <div className="space-y-2">
                    <Input 
                      type="file" 
                      accept="image/*" 
                      onChange={handleImageChange}
                      ref={fileInputRef}
                      className="cursor-pointer"
                    />
                    {imagePreview && (
                      <div className="relative w-full h-40 mt-2 rounded-md overflow-hidden">
                        <img 
                          src={imagePreview} 
                          alt="Tournament preview" 
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                  </div>
                </FormControl>
                <FormDescription>
                  {isEditing && !imageFile ? 'Leave empty to keep current image' : 'Upload an image for the tournament'}
                </FormDescription>
              </FormItem>
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="isFeatured"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                      <div className="space-y-0.5">
                        <FormLabel>Featured</FormLabel>
                        <FormDescription>
                          Show on featured section
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="isPublic"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                      <div className="space-y-0.5">
                        <FormLabel>Public</FormLabel>
                        <FormDescription>
                          Visible to all users
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="pt-4 flex justify-end space-x-2">
                <Button variant="outline" type="button" onClick={onClose} disabled={loading}>
                  Cancel
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? 'Saving...' : isEditing ? 'Update Tournament' : 'Create Tournament'}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </DialogContent>
    </Dialog>
  );
}

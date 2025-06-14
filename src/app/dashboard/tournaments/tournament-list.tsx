'use client';

import React, { useState, useEffect } from 'react';
import { PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent } from '@/components/ui/card';
import { Tournament, deleteTournament, updateTournamentFeatured, updateTournamentPublic } from '@/lib/tournament-service';
import { doc, updateDoc, getFirestore } from 'firebase/firestore';
import { toast } from 'sonner';

interface TournamentListProps {
  tournaments: Tournament[];
  onEdit: (tournament: Tournament) => void;
  onRefresh: () => void;
}

export default function TournamentList({ tournaments, onEdit, onRefresh }: TournamentListProps) {
  const [deletingTournamentId, setDeletingTournamentId] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredTournaments, setFilteredTournaments] = useState<Tournament[]>(tournaments);
  const [tournamentsList, setTournaments] = useState<Tournament[]>(tournaments);
  const [showFeaturedOnly, setShowFeaturedOnly] = useState(false);
  const [showPublicOnly, setShowPublicOnly] = useState(false);

  useEffect(() => {
    let filtered = [...tournaments];
    
    // Apply search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(tournament => 
        tournament.name.toLowerCase().includes(term) || 
        tournament.type.toLowerCase().includes(term)
      );
    }
    
    // Apply featured filter
    if (showFeaturedOnly) {
      filtered = filtered.filter(tournament => tournament.isFeatured);
    }
    
    // Apply public filter
    if (showPublicOnly) {
      filtered = filtered.filter(tournament => tournament.isPublic);
    }
    
    setFilteredTournaments(filtered);
  }, [tournaments, searchTerm, showFeaturedOnly, showPublicOnly]);

  const handleDeleteClick = (tournamentId: string) => {
    setDeletingTournamentId(tournamentId);
    setConfirmDelete(tournamentId);
  };

  const handleCancelDelete = () => {
    setDeletingTournamentId(null);
    setConfirmDelete(null);
    setDeleteError(null);
  };

  const handleConfirmDelete = async (tournamentId: string) => {
    try {
      setDeleteError(null);
      toast.promise(
        deleteTournament(tournamentId),
        {
          loading: 'Deleting tournament...',
          success: 'Tournament deleted successfully',
          error: 'Failed to delete tournament. Please try again.'
        }
      );
      onRefresh();
    } catch (error) {
      console.error('Error deleting tournament:', error);
      // Error is handled by toast.promise
    } finally {
      setDeletingTournamentId(null);
      setConfirmDelete(null);
    }
  };

  const handleToggleFeatured = async (tournamentId: string, isFeatured: boolean) => {
    try {
      await updateTournamentFeatured(tournamentId, isFeatured);
      toast.success(`Tournament ${isFeatured ? 'featured' : 'unfeatured'} successfully`);
      onRefresh();
    } catch (error) {
      console.error('Error updating tournament featured status:', error);
      toast.error('Failed to update tournament status');
    }
  };

  const handleTogglePublic = async (tournamentId: string, isPublic: boolean) => {
    try {
      await updateTournamentPublic(tournamentId, isPublic);
      toast.success(`Tournament ${isPublic ? 'published' : 'unpublished'} successfully`);
      onRefresh();
    } catch (error) {
      console.error('Error updating tournament public status:', error);
      toast.error('Failed to update tournament status');
    }
  };

  if (tournaments.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">No tournaments found</p>
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
      
      <div className="flex flex-col sm:flex-row gap-4 items-center">
        <div className="relative w-full sm:w-64">
          <Input
            placeholder="Search tournaments..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full"
          />
        </div>
        
        <div className="flex items-center space-x-2 ml-auto">
          <div className="flex items-center space-x-2">
            <Switch
              id="featured-filter"
              checked={showFeaturedOnly}
              onCheckedChange={setShowFeaturedOnly}
            />
            <label htmlFor="featured-filter" className="text-sm font-medium">
              Featured only
            </label>
          </div>
          
          <div className="flex items-center space-x-2">
            <Switch
              id="public-filter"
              checked={showPublicOnly}
              onCheckedChange={setShowPublicOnly}
            />
            <label htmlFor="public-filter" className="text-sm font-medium">
              Public only
            </label>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredTournaments.map((tournament, index) => (
          <Card key={`${tournament.id}-${index}`} className="overflow-hidden">
            <div className="relative h-48 w-full">
              {tournament.imageUrl ? (
                <img 
                  src={tournament.imageUrl} 
                  alt={tournament.name} 
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="h-full w-full bg-muted flex items-center justify-center">
                  <p className="text-muted-foreground">No image</p>
                </div>
              )}
            </div>
            
            <CardContent className="p-4">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h3 className="font-semibold text-lg">{tournament.name}</h3>
                  <p className="text-sm text-muted-foreground">{tournament.type}</p>
                </div>
                
                <div className="flex space-x-1">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => onEdit(tournament)}
                  >
                    <PencilIcon className="h-4 w-4" />
                  </Button>
                  
                  {confirmDelete === tournament.id ? (
                    <div className="flex items-center space-x-1">
                      <Button 
                        variant="destructive" 
                        size="sm" 
                        onClick={() => handleConfirmDelete(tournament.id)}
                        disabled={deletingTournamentId === tournament.id}
                        className="relative"
                      >
                        {deletingTournamentId === tournament.id ? (
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
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => handleDeleteClick(tournament.id)}
                    >
                      <TrashIcon className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
              
              <div className="text-sm">
                <p className="mb-1"><span className="font-medium">Location:</span> {tournament.location}</p>
                <p className="mb-1"><span className="font-medium">Dates:</span> {new Date(tournament.startDate).toLocaleDateString()} - {new Date(tournament.endDate).toLocaleDateString()}</p>
              </div>
              
              <div className="flex justify-between mt-4">
                <div className="flex items-center space-x-2">
                  <div className="flex items-center gap-2">
                    <div 
                      onClick={() => {
                        try {
                          // Update UI state immediately
                          const newTournaments = tournamentsList.map(t => {
                            if (t.id === tournament.id) {
                              return { ...t, isFeatured: !t.isFeatured };
                            }
                            return t;
                          });
                          setTournaments(newTournaments);
                          
                          // Update database in background
                          const db = getFirestore();
                          const tournamentRef = doc(db, 'tournaments', tournament.id);
                          updateDoc(tournamentRef, {
                            isFeatured: !tournament.isFeatured,
                            updatedAt: Date.now()
                          }).then(() => {
                            toast.success(`Tournament ${!tournament.isFeatured ? 'featured' : 'unfeatured'} successfully`);
                            onRefresh(); // Refresh the list after successful update
                          }).catch((error: Error) => {
                            console.error('Error updating featured status:', error);
                            toast.error('Failed to update featured status');
                            // Revert UI on error
                            setTournaments(tournamentsList);
                          });
                        } catch (error: unknown) {
                          console.error('Error in featured toggle:', error);
                          toast.error('An error occurred');
                        }
                      }}
                      className="relative inline-flex h-[24px] w-[44px] shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary data-[state=unchecked]:bg-input" 
                      data-state={tournament.isFeatured ? 'checked' : 'unchecked'}
                    >
                      <span 
                        data-state={tournament.isFeatured ? 'checked' : 'unchecked'} 
                        className="pointer-events-none block h-5 w-5 rounded-full bg-background shadow-lg ring-0 transition-transform duration-200 ease-in-out data-[state=checked]:translate-x-5 data-[state=unchecked]:translate-x-0" 
                        style={{ transform: tournament.isFeatured ? 'translateX(calc(100% - 2px))' : 'translateX(2px)' }}
                      ></span>
                    </div>
                    <label className="text-sm">
                      Featured
                    </label>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <div className="flex items-center gap-2">
                    <div 
                      onClick={() => {
                        try {
                          // Update UI state immediately
                          const newTournaments = tournamentsList.map(t => {
                            if (t.id === tournament.id) {
                              return { ...t, isPublic: !t.isPublic };
                            }
                            return t;
                          });
                          setTournaments(newTournaments);
                          
                          // Update database in background
                          const db = getFirestore();
                          const tournamentRef = doc(db, 'tournaments', tournament.id);
                          updateDoc(tournamentRef, {
                            isPublic: !tournament.isPublic,
                            updatedAt: Date.now()
                          }).then(() => {
                            toast.success(`Tournament ${!tournament.isPublic ? 'made public' : 'made private'} successfully`);
                            onRefresh(); // Refresh the list after successful update
                          }).catch((error: Error) => {
                            console.error('Error updating public status:', error);
                            toast.error('Failed to update public status');
                            // Revert UI on error
                            setTournaments(tournamentsList);
                          });
                        } catch (error: unknown) {
                          console.error('Error in public toggle:', error);
                          toast.error('An error occurred');
                        }
                      }}
                      className="relative inline-flex h-[24px] w-[44px] shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary data-[state=unchecked]:bg-input" 
                      data-state={tournament.isPublic ? 'checked' : 'unchecked'}
                    >
                      <span 
                        data-state={tournament.isPublic ? 'checked' : 'unchecked'} 
                        className="pointer-events-none block h-5 w-5 rounded-full bg-background shadow-lg ring-0 transition-transform duration-200 ease-in-out data-[state=checked]:translate-x-5 data-[state=unchecked]:translate-x-0" 
                        style={{ transform: tournament.isPublic ? 'translateX(calc(100% - 2px))' : 'translateX(2px)' }}
                      ></span>
                    </div>
                    <label className="text-sm">
                      Public
                    </label>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

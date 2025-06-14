'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { PlusIcon } from '@heroicons/react/24/outline';
import TournamentList from './tournament-list';
import TournamentForm from './tournament-form';
import { Tournament, getAllTournaments } from '@/lib/tournament-service';
import { Skeleton } from '@/components/ui/skeleton';

export default function TournamentsPage() {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [selectedTournament, setSelectedTournament] = useState<Tournament | null>(null);

  const fetchTournaments = async () => {
    setLoading(true);
    try {
      const data = await getAllTournaments();
      setTournaments(data);
    } catch (error) {
      console.error('Error fetching tournaments:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTournaments();
  }, []);

  const handleAddClick = () => {
    setSelectedTournament(null);
    setShowForm(true);
  };

  const handleEditClick = (tournament: Tournament) => {
    setSelectedTournament(tournament);
    setShowForm(true);
  };

  const handleFormClose = () => {
    setShowForm(false);
    setSelectedTournament(null);
  };

  const handleTournamentSaved = () => {
    setShowForm(false);
    setSelectedTournament(null);
    fetchTournaments();
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Tournaments</h1>
        <Button onClick={handleAddClick}>
          <PlusIcon className="h-4 w-4 mr-2" />
          Add Tournament
        </Button>
      </div>

      {loading ? (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, index) => (
              <div key={index} className="rounded-lg overflow-hidden border">
                <Skeleton className="h-48 w-full" />
                <div className="p-4 space-y-3">
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                  <div className="flex justify-between pt-2">
                    <Skeleton className="h-6 w-20" />
                    <Skeleton className="h-6 w-20" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <TournamentList 
          tournaments={tournaments} 
          onEdit={handleEditClick} 
          onRefresh={fetchTournaments} 
        />
      )}

      {showForm && (
        <TournamentForm
          tournament={selectedTournament}
          open={showForm}
          onClose={handleFormClose}
          onSaved={handleTournamentSaved}
        />
      )}
    </div>
  );
}

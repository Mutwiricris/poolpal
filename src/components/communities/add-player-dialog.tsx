"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog"
import { MultiSelect } from "@/components/ui/multi-select"
import { IconUserPlus } from "@tabler/icons-react"
import { getPlayerUsers } from "@/lib/user-service"
import { addCommunityMember } from "@/lib/community-service"
import { toast } from "sonner"

interface AddPlayerDialogProps {
  communityId: string
  onPlayersAdded: () => void
}

export function AddPlayerDialog({ communityId, onPlayersAdded }: AddPlayerDialogProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [loadingPlayers, setLoadingPlayers] = useState(false)
  const [playerOptions, setPlayerOptions] = useState<{ label: string; value: string }[]>([])
  const [selectedPlayers, setSelectedPlayers] = useState<{ label: string; value: string }[]>([])
  const playersCache = useRef<{ label: string; value: string }[]>([])

  // Pre-fetch players when component mounts to speed up later access
  useEffect(() => {
    // Fetch players once on initial mount
    if (playersCache.current.length === 0) {
      fetchPlayers()
    }
  }, [])

  // When dialog opens, use cached data or fetch if needed
  useEffect(() => {
    if (open) {
      if (playersCache.current.length > 0) {
        // Use cached data if available
        setPlayerOptions(playersCache.current)
      } else if (!loadingPlayers && playerOptions.length === 0) {
        // Fetch only if not already loading and no options available
        fetchPlayers()
      }
    }
  }, [open, loadingPlayers, playerOptions.length])

  async function fetchPlayers() {
    setLoadingPlayers(true)
    try {
      const players = await getPlayerUsers()
      const options = players.map(player => ({
        label: player.displayName || player.fullName || player.email || 'Unknown Player',
        value: player.uid
      })).filter(opt => opt.value)
      
      setPlayerOptions(options)
      playersCache.current = options
    } catch (error) {
      console.error("Error fetching players:", error)
      toast.error("Failed to load players")
    } finally {
      setLoadingPlayers(false)
    }
  }

  async function handleAddPlayers() {
    if (selectedPlayers.length === 0) {
      toast.error("Please select at least one player")
      return
    }

    setLoading(true)

    try {
      // Add each selected player to the community
      for (const player of selectedPlayers) {
        await addCommunityMember(communityId, player.value, "player")
      }

      toast.success(`Successfully added ${selectedPlayers.length} player(s) to the community`)
      setSelectedPlayers([])
      setOpen(false)
      onPlayersAdded()
    } catch (error) {
      console.error("Error adding players:", error)
      toast.error("Failed to add players to community")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="flex items-center gap-2">
          <IconUserPlus className="h-4 w-4" />
          Add Players
        </Button>
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add Players to Community</DialogTitle>
          <DialogDescription>
            Select players to add to this community. Only users with the "player" role can be added.
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <h3 className="text-sm font-medium">Select Players</h3>
            
            {loadingPlayers ? (
              <div className="flex items-center space-x-2 py-2">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
                <p className="text-sm text-muted-foreground">Loading players...</p>
              </div>
            ) : playerOptions.length === 0 ? (
              <div className="text-sm text-muted-foreground">
                No eligible players found. Please add users with the "player" role first.
              </div>
            ) : (
              <MultiSelect
                options={playerOptions}
                placeholder="Select players to add"
                value={selectedPlayers}
                onChange={setSelectedPlayers}
              />
            )}
          </div>
        </div>
        
        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={() => {
              setSelectedPlayers([])
              setOpen(false)
            }}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleAddPlayers} 
            disabled={loading || selectedPlayers.length === 0}
          >
            {loading ? "Adding..." : "Add Players"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

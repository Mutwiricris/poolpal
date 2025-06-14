"use client"

import { useState } from "react"
import { markUserAsRegistered, getUserById, User } from "@/lib/user-service"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "@/components/ui/use-toast"
import { IconCurrencyDollar } from "@tabler/icons-react"

interface UserRegistrationFormProps {
  userId: string
  onRegistrationComplete: (user: User) => void
}

export function UserRegistrationForm({ userId, onRegistrationComplete }: UserRegistrationFormProps) {
  const [registrationFee, setRegistrationFee] = useState<number>(25)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      setLoading(true)
      
      // Validate registration fee
      if (registrationFee <= 0) {
        toast({
          title: "Invalid fee",
          description: "Registration fee must be greater than 0",
          variant: "destructive",
        })
        return
      }
      
      // Mark user as registered with the fee
      await markUserAsRegistered(userId, registrationFee)
      
      // Get updated user data
      const updatedUser = await getUserById(userId)
      
      if (updatedUser) {
        onRegistrationComplete(updatedUser)
        
        toast({
          title: "Registration successful",
          description: "User has been marked as registered",
        })
      }
    } catch (error) {
      console.error("Error registering user:", error)
      
      toast({
        title: "Registration failed",
        description: "There was an error marking the user as registered",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <h3 className="text-sm font-medium text-muted-foreground mb-2">Status</h3>
        <div>
          <span className="px-2 py-1 rounded-full text-xs bg-yellow-100 text-yellow-800">
            Not Registered
          </span>
        </div>
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="registrationFee">Registration Fee ($)</Label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            <IconCurrencyDollar className="h-4 w-4 text-muted-foreground" />
          </div>
          <Input
            id="registrationFee"
            type="number"
            min="0"
            step="0.01"
            value={registrationFee}
            onChange={(e) => setRegistrationFee(parseFloat(e.target.value))}
            className="pl-9"
            required
          />
        </div>
      </div>
      
      <Button type="submit" disabled={loading}>
        {loading ? "Processing..." : "Mark as Registered"}
      </Button>
    </form>
  )
}

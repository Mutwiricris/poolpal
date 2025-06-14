"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { MultiSelect } from "@/components/ui/multi-select"
import { IconArrowLeft, IconBuildingCommunity, IconTrophy, IconUsers, IconPlus, IconTrash } from "@tabler/icons-react"
import { getCommunityById, updateCommunity, getCommunityMembers, addCommunityAdmin, removeCommunityAdmin, removeCommunityMember } from "@/lib/community-service"
import { getUserById, getUsersByRole, User } from "@/lib/user-service"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { AddPlayerDialog } from "@/components/communities/add-player-dialog"

interface CommunityMember {
  id: string;
  userId: string;
  role: string;
  joinedAt: number;
  user?: User;
}

export default function CommunityDetailsClient({ communityId }: { communityId: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [community, setCommunity] = useState<any>(null)
  const [members, setMembers] = useState<CommunityMember[]>([])
  const [admins, setAdmins] = useState<User[]>([])
  const [adminOptions, setAdminOptions] = useState<{ label: string; value: string }[]>([])
  const [selectedAdminIds, setSelectedAdminIds] = useState<{ label: string; value: string }[]>([])
  const [isUpdatingAdmins, setIsUpdatingAdmins] = useState(false)
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  // Function to refresh only the members list
  const refreshMembers = async () => {
    try {
      // Get community members
      const membersData = await getCommunityMembers(communityId)
      
      // Fetch user details for each member
      const membersWithUserDetails = await Promise.all(
        membersData.map(async (member: any) => {
          const user = await getUserById(member.userId)
          return { ...member, user }
        })
      )
      setMembers(membersWithUserDetails)
      
      // Also refresh community to update member count
      const communityData = await getCommunityById(communityId)
      if (communityData) {
        setCommunity(communityData)
      }
    } catch (error) {
      console.error("Error refreshing members:", error)
      toast.error("Failed to refresh members")
    }
  }
  
  useEffect(() => {
    async function fetchCommunityData() {
      try {
        // Get community details
        const communityData = await getCommunityById(communityId)
        if (!communityData) {
          toast.error("Community not found")
          router.push("/dashboard/communities")
          return
        }
        setCommunity(communityData)

        // Get community members
        const membersData = await getCommunityMembers(communityId)
        
        // Fetch user details for each member
        const membersWithUserDetails = await Promise.all(
          membersData.map(async (member: any) => {
            const user = await getUserById(member.userId)
            return { ...member, user }
          })
        )
        setMembers(membersWithUserDetails)

        // Get admin details
        const adminDetails = await Promise.all(
          (Array.isArray(communityData.adminIds) ? communityData.adminIds : []).map(async (adminId: string) => {
            return await getUserById(adminId)
          })
        )
        setAdmins(adminDetails.filter((admin): admin is User => admin !== null))

        // Set selected admin IDs for the multi-select
        setSelectedAdminIds(
          adminDetails
            .filter((admin): admin is User => admin !== null)
            .map(admin => ({
              label: admin.displayName || admin.email || 'Unknown User',
              value: admin.uid
            }))
        )

        // Fetch potential admins for the multi-select
        const communityAdmins = await getUsersByRole("community_admin")
        const regularAdmins = await getUsersByRole("admin")
        const allAdmins = [...communityAdmins, ...regularAdmins]
        const uniqueAdmins = allAdmins.filter((admin, index, self) => 
          index === self.findIndex((a) => a.uid === admin.uid)
        )
        
        const options = uniqueAdmins.map(admin => ({
          label: admin.displayName || admin.email || 'Unknown User',
          value: admin.uid
        }))
        
        setAdminOptions(options)
        
        setLoading(false)
      } catch (error) {
        console.error("Error fetching community data:", error)
        toast.error("Failed to load community data")
        setLoading(false)
      }
    }
    
    fetchCommunityData()
  }, [communityId, router, refreshTrigger]) // Add refreshTrigger to dependencies

  const handleUpdateAdmins = async () => {
    if (selectedAdminIds.length > 2) {
      toast({
        title: "Error",
        description: "A community can have at most 2 admins.",
        variant: "destructive",
      })
      return
    }

    if (selectedAdminIds.length === 0) {
      toast({
        title: "Error",
        description: "A community must have at least 1 admin.",
        variant: "destructive",
      })
      return
    }

    setIsUpdatingAdmins(true)

    try {
      // Get current admin IDs from community
      const currentAdminIds = community.adminIds || []
      
      // Get new admin IDs from selected options
      const newAdminIds = selectedAdminIds.map(option => option.value)
      
      // Find admins to add (present in new but not in current)
      const adminsToAdd = newAdminIds.filter(id => !currentAdminIds.includes(id))
      
      // Find admins to remove (present in current but not in new)
      const adminsToRemove = currentAdminIds.filter(id => !newAdminIds.includes(id))
      
      // Add new admins
      for (const adminId of adminsToAdd) {
        await addCommunityAdmin(communityId, adminId)
      }
      
      // Remove old admins
      for (const adminId of adminsToRemove) {
        await removeCommunityAdmin(communityId, adminId)
      }
      
      // Update community in state
      setCommunity({
        ...community,
        adminIds: newAdminIds
      })
      
      // Refresh admin list
      const adminDetails = await Promise.all(
        newAdminIds.map(async (adminId: string) => {
          return await getUserById(adminId)
        })
      )
      setAdmins(adminDetails.filter((admin): admin is User => admin !== null))
      
      toast({
        title: "Success",
        description: "Community admins updated successfully."
      })
    } catch (error) {
      console.error("Error updating admins:", error)
      toast({
        title: "Error",
        description: "Failed to update admins. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsUpdatingAdmins(false)
    }
  }
  
  const handleRemoveMember = async (userId: string) => {
    try {
      await removeCommunityMember(communityId, userId)
      
      // Update members list
      setMembers(prevMembers => prevMembers.filter(member => member.userId !== userId))
      
      // Update community member count
      setCommunity({
        ...community,
        memberCount: community.memberCount > 0 ? community.memberCount - 1 : 0
      })
      
      toast({
        title: "Success",
        description: "Member removed successfully."
      })
    } catch (error) {
      console.error("Error removing member:", error)
      toast({
        title: "Error",
        description: "Failed to remove member. Please try again.",
        variant: "destructive",
      })
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-32" />
          </div>
          <Skeleton className="h-9 w-20" />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-6">
            <Skeleton className="h-[400px] w-full" />
          </div>
          <Skeleton className="h-[300px] w-full" />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <Link href="/dashboard/communities" className="inline-flex items-center text-sm text-muted-foreground hover:text-primary">
              <IconArrowLeft className="mr-1 h-4 w-4" />
              Back to Communities
            </Link>
          </div>
          <h2 className="text-2xl font-bold tracking-tight">{community.name}</h2>
          <p className="text-sm text-muted-foreground">{community.location}</p>
        </div>
        
        <Link href={`/dashboard/communities/${communityId}/edit`} passHref>
          <Button>
            Edit Community
          </Button>
        </Link>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <Tabs defaultValue="overview">
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="members">Members</TabsTrigger>
              <TabsTrigger value="admins">Admins</TabsTrigger>
            </TabsList>
            
            <TabsContent value="overview" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>About</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <h3 className="font-medium">Description</h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        {community.description || "No description provided."}
                      </p>
                    </div>
                    
                    <div>
                      <h3 className="font-medium">Location</h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        {community.location || "No location specified."}
                      </p>
                    </div>
                    
                    <div>
                      <h3 className="font-medium">Created</h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        {community.createdAt ? new Date(community.createdAt).toLocaleDateString() : "Unknown"}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Recent Activity</CardTitle>
                  <CardDescription>
                    Latest actions in this community
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-6">
                    <IconBuildingCommunity className="mx-auto h-8 w-8 text-muted-foreground" />
                    <p className="mt-2 text-sm text-muted-foreground">No recent activity</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="members" className="space-y-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <div>
                    <CardTitle>Community Members</CardTitle>
                    <CardDescription>
                      Manage members in this community
                    </CardDescription>
                  </div>
                  <AddPlayerDialog 
                    communityId={communityId}
                    onPlayersAdded={() => {
                      // Trigger a refresh when players are added
                      setRefreshTrigger(prev => prev + 1)
                    }}
                  />
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {members.length === 0 ? (
                      <div className="text-center py-6">
                        <IconUsers className="mx-auto h-8 w-8 text-muted-foreground" />
                        <p className="mt-2 text-sm text-muted-foreground">No members yet</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {members.map((member) => (
                          <div key={member.id} className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <Avatar>
                                <AvatarFallback>
                                  {member.user?.displayName?.charAt(0) || member.user?.email?.charAt(0) || '?'}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="font-medium">{member.user?.displayName || member.user?.email || 'Unknown User'}</p>
                                <p className="text-xs text-muted-foreground">
                                  Joined {member.joinedAt ? new Date(member.joinedAt).toLocaleDateString() : 'Unknown'}
                                </p>
                              </div>
                            </div>
                            
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <IconTrash className="h-4 w-4 text-muted-foreground" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Remove Member</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to remove this member from the community? This action cannot be undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => handleRemoveMember(member.userId)}>
                                    Remove
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        ))}
                      </div>
                    )}
                    
                    <div className="flex justify-end">
                      <Button className="flex items-center">
                        <IconPlus className="mr-1 h-4 w-4" />
                        Add Member
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="admins" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Community Admins</CardTitle>
                  <CardDescription>
                    Manage who can administer this community
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div className="space-y-4">
                      {admins.length === 0 ? (
                        <div className="text-center py-6">
                          <IconUsers className="mx-auto h-8 w-8 text-muted-foreground" />
                          <p className="mt-2 text-sm text-muted-foreground">No admins assigned</p>
                        </div>
                      ) : (
                        admins.map((admin) => (
                          <div key={admin.uid} className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <Avatar>
                                <AvatarFallback>
                                  {admin.displayName?.charAt(0) || admin.email?.charAt(0) || '?'}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="font-medium">{admin.displayName || admin.email || 'Unknown Admin'}</p>
                                <p className="text-xs text-muted-foreground">
                                  Role: {admin.role || 'Admin'}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                    
                    <div className="space-y-2">
                      <h3 className="text-sm font-medium">Update Admins</h3>
                      <div className="flex items-end gap-2">
                        <div className="flex-1">
                          <MultiSelect
                            options={adminOptions}
                            placeholder="Select up to 2 admins"
                            value={selectedAdminIds}
                            onChange={setSelectedAdminIds}
                            maxValues={2}
                          />
                        </div>
                        <Button 
                          onClick={handleUpdateAdmins} 
                          disabled={isUpdatingAdmins}
                        >
                          {isUpdatingAdmins ? "Updating..." : "Update"}
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Select up to 2 users with community admin privileges.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
        
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Community Stats</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm">Members</span>
                  <span className="font-medium">{community.memberCount}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Trophies</span>
                  <span className="font-medium">{community.trophyCount}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Admins</span>
                  <span className="font-medium">{Array.isArray(community.adminIds) ? community.adminIds.length : 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Created</span>
                  <span className="font-medium">{new Date(community.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

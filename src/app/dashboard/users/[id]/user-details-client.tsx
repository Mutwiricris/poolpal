"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  getUserById, 
  User, 
  getPlayerCommunities, 
  getCommunityLeaders, 
  getCommunityPlayers,
  saveUser
} from "@/lib/user-service";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { IconArrowLeft, IconUsers, IconTrophy, IconBuilding } from "@tabler/icons-react";
import Link from "next/link";
import { UserRegistrationForm } from "@/components/user-registration-form";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Community as BaseCommunityType } from "@/lib/community-service";
import { useToast } from "@/components/ui/toast-provider";
import { Skeleton } from "@/components/ui/skeleton";

// Extended community interface to include additional properties for the UI
interface Community extends BaseCommunityType {
  id: string;
  name: string;
  memberRole?: string;
  userId: string;
  memberCount?: number;
  trophyCount?: number;
  location?: string;
}

interface UserDetailsClientProps {
  userId: string;
}

export default function UserDetailsClient({ userId }: UserDetailsClientProps) {
  const router = useRouter();
  const { toast, success, error: toastError } = useToast();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [communities, setCommunities] = useState<Community[]>([]);
  const [relatedDataLoading, setRelatedDataLoading] = useState(false);
  const [communityLeaders, setCommunityLeaders] = useState<Record<string, User[]>>({});
  const [communityPlayers, setCommunityPlayers] = useState<Record<string, User[]>>({});
  const [registrationFee, setRegistrationFee] = useState<number>(0);
  const [savingRegistration, setSavingRegistration] = useState(false);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        setLoading(true);
        
        // Get the user data first - this is already optimized with caching
        const userData = await getUserById(userId);
        setUser(userData);
        
        // If user exists, fetch related data in parallel
        if (userData) {
          setRelatedDataLoading(true);
          const userType = userData.userType || userData.role;
          
          // Use Promise.all to fetch related data in parallel instead of sequentially
          if (userType === 'player') {
            // For players, fetch their communities
            const playerCommunities = await getPlayerCommunities(userId);
            setCommunities(playerCommunities);
          } else if (userType === 'community_admin' && userData.communityId) {
            // For community admins, fetch leaders and players of their community in parallel
            const [leaderUsers, playerUsers] = await Promise.all([
              getCommunityLeaders(userData.communityId),
              getCommunityPlayers(userData.communityId)
            ]);
            setCommunityLeaders({
              [userData.communityId]: leaderUsers
            });
            setCommunityPlayers({
              [userData.communityId]: playerUsers
            });
          }
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
        toast("Failed to load user details", {
          description: "There was a problem loading the user information",
          style: { backgroundColor: "#FFCDD2" },
        });
      } finally {
        setLoading(false);
        setRelatedDataLoading(false);
      }
    };

    fetchUser();
  }, [userId]);

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center gap-4">
          <Button asChild variant="outline" size="icon" disabled>
            <div>
              <IconArrowLeft className="h-4 w-4" />
            </div>
          </Button>
          <Skeleton className="h-9 w-40" />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-32 mb-2" />
              <Skeleton className="h-4 w-24" />
            </CardHeader>
            <CardContent className="space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i}>
                  <Skeleton className="h-4 w-16 mb-2" />
                  <Skeleton className="h-5 w-40" />
                </div>
              ))}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-32 mb-2" />
              <Skeleton className="h-4 w-48" />
            </CardHeader>
            <CardContent className="space-y-4">
              <Skeleton className="h-24 w-full" />
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="p-6">
        <div className="flex flex-col items-center justify-center h-64 gap-4">
          <p className="text-muted-foreground">User not found</p>
          <Button asChild variant="outline">
            <Link href="/dashboard/users">Back to Users</Link>
          </Button>
        </div>
      </div>
    );
  }

  // Helper function to render user type badge
  const renderUserTypeBadge = (userType: string) => {
    const type = userType.toLowerCase();
    let bgColor = "bg-gray-100 text-gray-800";
    
    if (type === "player") {
      bgColor = "bg-blue-100 text-blue-800";
    } else if (type === "community_admin") {
      bgColor = "bg-purple-100 text-purple-800";
    } else if (type === "fan") {
      bgColor = "bg-green-100 text-green-800";
    }
    
    return (
      <span className={`px-2 py-1 rounded-full text-xs ${bgColor}`}>
        {type === "community_admin" ? "Community Admin" : type.charAt(0).toUpperCase() + type.slice(1)}
      </span>
    );
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button asChild variant="outline" size="icon">
          <Link href="/dashboard/users">
            <IconArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <h1 className="text-3xl font-bold">User Details</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="h-fit">
          <CardHeader>
            <CardTitle>User Details</CardTitle>
            <CardDescription>Basic information about this user</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="text-sm font-medium text-muted-foreground">Full Name</div>
              <div className="mt-1">{user.fullName || user.displayName || "Not provided"}</div>
            </div>
            <div>
              <div className="text-sm font-medium text-muted-foreground">Email</div>
              <div className="mt-1">{user.email || "Not provided"}</div>
            </div>
            <div>
              <div className="text-sm font-medium text-muted-foreground">Phone</div>
              <div className="mt-1">{user.phoneNumber || "Not provided"}</div>
            </div>
            <div>
              <div className="text-sm font-medium text-muted-foreground">User Type</div>
              <div className="mt-1">{renderUserTypeBadge(user.userType || user.role || "user")}</div>
            </div>
            <div>
              <div className="text-sm font-medium text-muted-foreground">Account Created</div>
              <div className="mt-1">
                {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : "Unknown"}
              </div>
            </div>

            <div className="pt-2">
              <Separator className="my-4" />
              <Link href={`/dashboard/users/edit/${user.uid}`}>
                <Button className="w-full" variant="outline">Edit User</Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Registration Status</CardTitle>
            <CardDescription>
              {user.isRegistered 
                ? "User has paid registration fee" 
                : "User has not paid registration fee"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">Status</h3>
              <div className="mt-1">
                <Badge className={user.isRegistered ? "bg-green-500 hover:bg-green-600" : "bg-yellow-500 hover:bg-yellow-600"}>
                  {user.isRegistered ? "Registered" : "Not Registered"}
                </Badge>
              </div>
            </div>
            
            {user.isRegistered && user.registrationDate && (
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Registration Date</h3>
                <p>{new Date(user.registrationDate).toLocaleDateString()}</p>
              </div>
            )}
            
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">Registration Fee ($)</h3>
              <div className="mt-1 flex items-center gap-2">
                <span>$</span>
                <input 
                  type="number" 
                  value={registrationFee} 
                  onChange={(e) => setRegistrationFee(Number(e.target.value))}
                  className="w-20 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors"
                />
              </div>
            </div>
            
            <div className="pt-2">
              <Separator className="my-4" />
              <Button 
                className="w-full" 
                variant={user.isRegistered ? "destructive" : "default"}
                onClick={async () => {
                  try {
                    setSavingRegistration(true);
                    const newStatus = !user.isRegistered;
                    
                    // Update user registration status
                    await saveUser(user.uid, {
                      isRegistered: newStatus,
                      registrationFee: registrationFee,
                      ...(newStatus ? { registrationDate: new Date().toISOString() } : {})
                    });
                    
                    // Update local state
                    setUser({
                      ...user,
                      isRegistered: newStatus,
                      registrationFee: registrationFee,
                      ...(newStatus ? { registrationDate: new Date().toISOString() } : {})
                    });
                    
                    success(`User marked as ${newStatus ? 'Registered' : 'Not Registered'}`);
                  } catch (error) {
                    console.error('Error updating registration status:', error);
                    toastError('Failed to update registration status');
                  } finally {
                    setSavingRegistration(false);
                  }
                }}
                disabled={savingRegistration}
              >
                {savingRegistration 
                  ? 'Saving...' 
                  : user.isRegistered 
                    ? 'Mark as Not Registered' 
                    : 'Mark as Registered'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Related data section based on user type */}
      {(user.userType === "player" || user.role === "player") && (
        <div className="mt-8">
          <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
            <IconBuilding className="h-5 w-5" />
            Player Communities
          </h2>
          {relatedDataLoading ? (
            <p className="text-muted-foreground">Loading communities...</p>
          ) : communities.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {communities.map((community: Community, index: number) => (
                <Card key={`${community.id}-${index}`}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">{community.name}</CardTitle>
                    <CardDescription>Role: {community.memberRole}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1">
                        <IconUsers className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">{community.memberCount || 0} members</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <IconTrophy className="h-4 w-4 text-amber-500" />
                        <span className="text-sm text-muted-foreground">{community.trophyCount || 0} trophies</span>
                      </div>
                    </div>
                    <Separator className="my-2" />
                    <div className="mt-2">
                      <Badge variant="outline">{community.memberRole || "Member"}</Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground">This player is not a member of any communities.</p>
          )}
        </div>
      )}

      {(user.userType === "community_admin" || user.role === "community_admin") && (
        <div className="space-y-8 mt-8">
          {/* Community Leaders Section */}
          <div>
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
              <IconUsers className="h-5 w-5" />
              Community Leaders
            </h2>
            {relatedDataLoading ? (
              <p className="text-muted-foreground">Loading community leaders...</p>
            ) : Object.values(communityLeaders).flat().length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Object.values(communityLeaders).flat().map((leader: User, index: number) => (
                  <Card key={`${leader.uid}-${index}`}>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg">{leader.fullName || leader.displayName}</CardTitle>
                      <CardDescription>{leader.email}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-col gap-2">
                        {leader.phoneNumber && (
                          <div className="text-sm">
                            <span className="text-muted-foreground">Phone: </span>
                            {leader.phoneNumber}
                          </div>
                        )}
                        <div className="mt-1">
                          {renderUserTypeBadge(leader.userType || leader.role || "user")}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground">No community leaders found.</p>
            )}
          </div>

          {/* Community Players Section */}
          <div>
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
              <IconUsers className="h-5 w-5" />
              Community Players
            </h2>
            {relatedDataLoading ? (
              <p className="text-muted-foreground">Loading community players...</p>
            ) : Object.values(communityPlayers).flat().length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Object.values(communityPlayers).flat().map((player: User, index: number) => (
                  <Card key={`${player.uid}-${index}`}>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg">{player.fullName || player.displayName}</CardTitle>
                      <CardDescription>{player.email}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-col gap-2">
                        {player.phoneNumber && (
                          <div className="text-sm">
                            <span className="text-muted-foreground">Phone: </span>
                            {player.phoneNumber}
                          </div>
                        )}
                        <div className="mt-1">
                          {renderUserTypeBadge(player.userType || player.role || "user")}
                        </div>
                        {player.isRegistered && (
                          <div className="mt-1">
                            <span className="px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">
                              Registered
                            </span>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground">No players found in this community.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

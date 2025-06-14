"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { IconBuildingCommunity, IconPlus, IconTrophy, IconUsers } from "@tabler/icons-react"
import { getAllCommunities, Community } from "@/lib/community-service"
import { getUserById } from "@/lib/user-service"
import { Skeleton } from "@/components/ui/skeleton"

export default function CommunitiesPage() {
  const [communities, setCommunities] = useState<Community[]>([])
  const [loading, setLoading] = useState(true)
  const [adminNames, setAdminNames] = useState<Record<string, string>>({})

  useEffect(() => {
    async function fetchCommunities() {
      try {
        const communitiesData = await getAllCommunities()
        setCommunities(communitiesData)
        
        // Fetch admin names for all communities
        const adminIds = communitiesData
          .filter(community => community.adminIds && Array.isArray(community.adminIds))
          .flatMap(community => community.adminIds)
        const uniqueAdminIds = [...new Set(adminIds.filter(id => id !== undefined && id !== null))]
        
        const adminNamesMap: Record<string, string> = {}
        await Promise.all(
          uniqueAdminIds.map(async (adminId) => {
            const admin = await getUserById(adminId)
            if (admin) {
              adminNamesMap[adminId] = admin.displayName || 'Unknown Admin'
            }
          })
        )
        
        setAdminNames(adminNamesMap)
        setLoading(false)
      } catch (error) {
        console.error("Error fetching communities:", error)
        setLoading(false)
      }
    }

    fetchCommunities()
  }, [])

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Communities</h1>
          <p className="text-muted-foreground">Manage pool communities and their members</p>
        </div>
        <Button asChild>
          <Link href="/dashboard/communities/new">
            <IconPlus className="mr-2 h-4 w-4" />
            Create New Community
          </Link>
        </Button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="overflow-hidden">
              <CardHeader className="pb-2">
                <Skeleton className="h-6 w-3/4 mb-2" />
                <Skeleton className="h-4 w-1/2" />
              </CardHeader>
              <CardContent>
                <div className="flex justify-between mb-4">
                  <Skeleton className="h-4 w-1/3" />
                  <Skeleton className="h-4 w-1/3" />
                </div>
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-2/3" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : communities.length === 0 ? (
        <div className="text-center py-12">
          <IconBuildingCommunity className="mx-auto h-12 w-12 text-muted-foreground" />
          <h2 className="mt-4 text-lg font-medium">No communities found</h2>
          <p className="mt-2 text-muted-foreground">
            Get started by creating a new community
          </p>
          <Button className="mt-4" asChild>
            <Link href="/dashboard/communities/new">
              <IconPlus className="mr-2 h-4 w-4" />
              Create New Community
            </Link>
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {communities.map((community, index) => (
            <Card key={`${community.id}-${index}`} className="overflow-hidden">
              <CardHeader>
                <CardTitle>{community.name}</CardTitle>
                <CardDescription>{community.location}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <div className="flex items-center">
                      <IconTrophy className="mr-1 h-4 w-4 text-amber-500" />
                      <span>{community.trophyCount} Trophies</span>
                    </div>
                    <div className="flex items-center">
                      <IconUsers className="mr-1 h-4 w-4 text-blue-500" />
                      <span>{community.memberCount} Members</span>
                    </div>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    <strong>Admins:</strong>{" "}
                    {community.adminIds ? 
                      community.adminIds.map(adminId => adminNames[adminId] || 'Loading...').join(', ') : 
                      'No admins assigned'}
                  </div>
                  <p className="text-sm line-clamp-2">{community.description}</p>
                </div>
              </CardContent>
              <CardFooter>
                <Button variant="outline" asChild className="w-full">
                  <Link href={`/dashboard/communities/${community.id}`}>
                    View Details
                  </Link>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

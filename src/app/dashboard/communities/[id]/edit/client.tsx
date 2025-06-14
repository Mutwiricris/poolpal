"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { MultiSelect } from "@/components/ui/multi-select"
import { IconArrowLeft, IconBuildingCommunity } from "@tabler/icons-react"
import { getCommunityById, updateCommunity } from "@/lib/community-service"
import { getUsersByRole, getAllUsers, getUserById } from "@/lib/user-service"
import { toast } from "sonner"
import { Skeleton } from "@/components/ui/skeleton"

const formSchema = z.object({
  name: z.string().min(3, {
    message: "Community name must be at least 3 characters.",
  }),
  location: z.string().min(2, {
    message: "Location must be at least 2 characters.",
  }),
  description: z.string().min(10, {
    message: "Description must be at least 10 characters.",
  }),
  adminIds: z.array(z.string()).min(1, {
    message: "Select at least 1 admin.",
  }).max(2, {
    message: "You can select a maximum of 2 admins.",
  }),
})

export default function EditCommunityClient({ communityId }: { communityId: string }) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [isFetching, setIsFetching] = useState(true)
  const [adminOptions, setAdminOptions] = useState<{ label: string; value: string }[]>([])
  const [community, setCommunity] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      location: "",
      description: "",
      adminIds: [],
    },
  })

  // Fetch the community and populate the form
  useEffect(() => {
    async function fetchCommunityData() {
      setIsFetching(true)
      try {
        const communityData = await getCommunityById(communityId)
        if (!communityData) {
          setError("Community not found")
          return
        }
        
        setCommunity(communityData)
        
        // Set form default values
        form.reset({
          name: communityData.name,
          location: communityData.location,
          description: communityData.description,
          adminIds: communityData.adminIds,
        })
        
        // Fetch admin details to display in the MultiSelect
        if (communityData.adminIds && communityData.adminIds.length > 0) {
          const adminDetails = await Promise.all(
            communityData.adminIds.map(async (adminId: string) => {
              const admin = await getUserById(adminId)
              return admin
            })
          )
          
          const selectedAdmins = adminDetails
            .filter(admin => admin !== null)
            .map(admin => ({
              label: admin.displayName || admin.email || 'Unknown User',
              value: admin.uid
            }))
          
          // We need to set this after fetching admin options or it won't display correctly
          await fetchAdmins()
          
          // Now we need to update the form with the selected admins as values
          form.setValue('adminIds', communityData.adminIds)
        } else {
          await fetchAdmins()
        }
      } catch (error) {
        console.error("Error fetching community:", error)
        setError("Failed to load community data")
      } finally {
        setIsFetching(false)
      }
    }

    fetchCommunityData()
  }, [communityId, form])

  async function fetchAdmins() {
    try {
      // Fetch users with community_admin role
      let communityAdmins = await getUsersByRole("community_admin")
      // Also include users with admin role
      let regularAdmins = await getUsersByRole("admin")
      // Combine and deduplicate
      let allAdmins = [...communityAdmins, ...regularAdmins]
      let uniqueAdmins = allAdmins.filter((admin, index, self) => 
        admin && admin.uid && index === self.findIndex((a) => a && a.uid === admin.uid)
      )
      
      // If no admins found, fallback to all users
      if (uniqueAdmins.length === 0) {
        const allUsers = await getAllUsers()
        uniqueAdmins = allUsers.filter(u => u && u.uid)
      }
      
      // Format for multi-select
      const options = uniqueAdmins.map(admin => ({
        label: admin.displayName || admin.fullName || admin.email || 'Unknown User',
        value: admin.uid
      })).filter(opt => opt.value)
      
      setAdminOptions(options)
    } catch (error) {
      console.error("Error fetching admins:", error)
      toast.error("Failed to load community admins")
    }
  }

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true)
    try {
      await updateCommunity(communityId, values)
      toast.success("Community updated successfully")
      router.push(`/dashboard/communities/${communityId}`)
    } catch (error) {
      console.error("Error updating community:", error)
      toast.error("Failed to update community")
    } finally {
      setIsLoading(false)
    }
  }

  if (error) {
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
          </div>
        </div>
        
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle className="text-destructive">{error}</CardTitle>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link href="/dashboard/communities">Return to Communities</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (isFetching) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <Skeleton className="h-8 w-48" />
          </div>
        </div>
        
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <Skeleton className="h-8 w-3/4 mb-2" />
            <Skeleton className="h-4 w-1/2" />
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <Link href={`/dashboard/communities/${communityId}`} className="inline-flex items-center text-sm text-muted-foreground hover:text-primary">
              <IconArrowLeft className="mr-1 h-4 w-4" />
              Back to Community
            </Link>
          </div>
          <h2 className="text-2xl font-bold tracking-tight">Edit Community</h2>
        </div>
      </div>

      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <div className="flex items-center gap-2">
            <IconBuildingCommunity className="h-6 w-6" />
            <CardTitle>Edit {community?.name || 'Community'}</CardTitle>
          </div>
          <CardDescription>
            Update community details and admins
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Community Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter community name" {...field} />
                    </FormControl>
                    <FormDescription>
                      The name of your pool community
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="location"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Location</FormLabel>
                    <FormControl>
                      <Input placeholder="City, Country" {...field} />
                    </FormControl>
                    <FormDescription>
                      Where this community is based
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Describe the community..." 
                        className="min-h-[100px]" 
                        {...field} 
                      />
                    </FormControl>
                    <FormDescription>
                      Provide details about this community
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="adminIds"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Community Admins</FormLabel>
                    
                    {/* Debug output for development */}
                    {process.env.NODE_ENV === 'development' && (
                      <div className="mb-2">
                        <pre style={{fontSize: 10}}>adminOptions: {JSON.stringify(adminOptions)}</pre>
                        <pre style={{fontSize: 10}}>field.value: {JSON.stringify(field.value)}</pre>
                      </div>
                    )}
                    
                    <FormControl>
                      <MultiSelect
                        options={adminOptions}
                        placeholder="Select up to 2 admins"
                        value={
                          Array.isArray(field.value)
                            ? field.value.map(value => {
                                const option = adminOptions.find(opt => opt.value === value);
                                return option ? option : { label: value, value };
                              })
                            : []
                        }
                        onChange={values => field.onChange(values.map(v => v.value))}
                        maxValues={2}
                      />
                    </FormControl>
                    
                    {adminOptions.length === 0 && (
                      <div className="text-destructive text-xs mt-2">No eligible admins found. Please add users first.</div>
                    )}
                    <FormDescription>
                      Select up to 2 users with community admin privileges
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end space-x-2">
                <Button 
                  variant="outline" 
                  type="button" 
                  onClick={() => router.push(`/dashboard/communities/${communityId}`)}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={isLoading}
                >
                  {isLoading ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  )
}

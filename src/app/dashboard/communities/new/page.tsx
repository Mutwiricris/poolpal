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
import { createCommunity } from "@/lib/community-service"
import { getUsersByRole, getAllUsers, User } from "@/lib/user-service"
import { toast } from "@/components/ui/use-toast"

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

export default function NewCommunityPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [adminOptions, setAdminOptions] = useState<{ label: string; value: string }[]>([])

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      location: "",
      description: "",
      adminIds: [],
    },
  })

  useEffect(() => {
    async function fetchAdmins() {
      try {
        // Fetch users with community_admin role
        let communityAdmins = await getUsersByRole("community_admin");
        // Also include users with admin role as they can also be community admins
        let regularAdmins = await getUsersByRole("admin");
        // Combine and deduplicate
        let allAdmins = [...communityAdmins, ...regularAdmins];
        let uniqueAdmins = allAdmins.filter((admin, index, self) => 
          admin && admin.uid && index === self.findIndex((a) => a && a.uid === admin.uid)
        );
        // If no admins found, fallback to all users
        if (uniqueAdmins.length === 0) {
          const allUsers = await getAllUsers();
          uniqueAdmins = allUsers.filter(u => u && u.uid);
        }
        // Format for multi-select
        const options = uniqueAdmins.map(admin => ({
          label: admin.displayName || admin.fullName || admin.email || 'Unknown User',
          value: admin.uid
        })).filter(opt => opt.value);
        setAdminOptions(options);
      } catch (error) {
        console.error("Error fetching admins:", error);
        toast({
          title: "Error",
          description: "Failed to load community admins. Please try again.",
          variant: "destructive",
        });
      }
    }
    fetchAdmins();
  }, []);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true)
    try {
      const communityId = await createCommunity(values)
      toast({
        title: "Success",
        description: "Community created successfully.",
      })
      router.push(`/dashboard/communities/${communityId}`)
    } catch (error) {
      console.error("Error creating community:", error)
      toast({
        title: "Error",
        description: "Failed to create community. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <Button variant="outline" asChild>
          <Link href="/dashboard/communities">
            <IconArrowLeft className="mr-2 h-4 w-4" />
            Back to Communities
          </Link>
        </Button>
      </div>

      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <div className="flex items-center gap-2">
            <IconBuildingCommunity className="h-6 w-6" />
            <CardTitle>Create New Community</CardTitle>
          </div>
          <CardDescription>
            Create a new pool community and assign admins to manage it.
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
                      The name of your pool community.
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
                      Where this community is based.
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
                      Provide details about this community.
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
      
      {/* Debug logs for troubleshooting */}
      {process.env.NODE_ENV === 'development' && (
        <div className="mb-2">
          <pre style={{fontSize:10}}>adminOptions: {JSON.stringify(adminOptions)}</pre>
          <pre style={{fontSize:10}}>field.value: {JSON.stringify(field.value)}</pre>
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
        Select up to 2 users with community admin privileges.
      </FormDescription>
      <FormMessage />
    </FormItem>
  )}
/>

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Creating..." : "Create Community"}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  )
}

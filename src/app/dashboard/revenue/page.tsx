"use client"

import { useState, useEffect } from "react"
import { getDatabase, ref, onValue, query, orderByChild } from "firebase/database"
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { 
  Table, 
  TableBody, 
  TableCaption, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table"
import { IconSearch } from "@tabler/icons-react"

interface User {
  id: string
  email: string
  name: string
  isRegistered: boolean
  registrationFee: number
  registrationDate: string
}

export default function RevenuePage() {
  const [users, setUsers] = useState<User[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [totalRevenue, setTotalRevenue] = useState(0)

  useEffect(() => {
    const db = getDatabase()
    const usersRef = ref(db, "users")
    
    const unsubscribe = onValue(usersRef, (snapshot) => {
      const data = snapshot.val()
      if (data) {
        const usersArray = Object.entries(data).map(([id, userData]: [string, any]) => ({
          id,
          email: userData.email || "",
          name: userData.name || "",
          isRegistered: userData.isRegistered || false,
          registrationFee: userData.registrationFee || 0,
          registrationDate: userData.registrationDate || "",
        }))
        
        setUsers(usersArray)
        
        // Calculate total revenue from registered users
        const total = usersArray.reduce((sum, user) => {
          return sum + (user.isRegistered ? user.registrationFee : 0)
        }, 0)
        
        setTotalRevenue(total)
      }
    })
    
    return () => unsubscribe()
  }, [])

  const filteredUsers = users.filter(user => {
    const searchLower = searchQuery.toLowerCase()
    return (
      user.email.toLowerCase().includes(searchLower) ||
      user.name.toLowerCase().includes(searchLower)
    )
  })

  const registeredUsers = filteredUsers.filter(user => user.isRegistered)
  const pendingUsers = filteredUsers.filter(user => !user.isRegistered)

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Revenue Dashboard</h1>
        <div className="relative w-64">
          <IconSearch className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search users..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Total Revenue</CardTitle>
            <CardDescription>From user registrations</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">${totalRevenue.toFixed(2)}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Registered Users</CardTitle>
            <CardDescription>Users who have paid</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{registeredUsers.length}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Pending Registrations</CardTitle>
            <CardDescription>Users who haven't paid</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{pendingUsers.length}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Registration Revenue</CardTitle>
          <CardDescription>Details of user registration payments</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableCaption>List of registered users and their payments</TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Registration Date</TableHead>
                <TableHead className="text-right">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.map((user) => (
                <TableRow key={`${user.id}-${user.email}`}>
                  <TableCell>{user.name}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded-full text-xs ${user.isRegistered ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                      {user.isRegistered ? 'Registered' : 'Pending'}
                    </span>
                  </TableCell>
                  <TableCell>{user.isRegistered ? user.registrationDate : '-'}</TableCell>
                  <TableCell className="text-right">${user.isRegistered ? user.registrationFee.toFixed(2) : '0.00'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}

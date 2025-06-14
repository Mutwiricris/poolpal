"use client"

import { useState, useEffect } from "react"
import { getDatabase, ref, onValue } from "firebase/database"
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card"
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
import { IconArrowRight } from "@tabler/icons-react"
import Link from "next/link"

interface User {
  id: string
  email: string
  name: string
  isRegistered: boolean
  registrationFee: number
}

export default function FinancialDashboard() {
  const [users, setUsers] = useState<User[]>([])
  const [totalRevenue, setTotalRevenue] = useState(0)
  const [recentRegistrations, setRecentRegistrations] = useState<User[]>([])

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

        // Get recent registrations
        const registered = usersArray
          .filter(user => user.isRegistered)
          .sort((a: any, b: any) => {
            return new Date(b.registrationDate).getTime() - new Date(a.registrationDate).getTime()
          })
          .slice(0, 5)
        
        setRecentRegistrations(registered)
      }
    })
    
    return () => unsubscribe()
  }, [])

  const registeredUsers = users.filter(user => user.isRegistered)
  const pendingUsers = users.filter(user => !user.isRegistered)

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Financial Dashboard</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Total Revenue</CardTitle>
            <CardDescription>From user registrations</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">${totalRevenue.toFixed(2)}</div>
            <Link href="/dashboard/revenue">
              <Button variant="link" className="p-0 h-auto mt-2">
                View details <IconArrowRight className="ml-1 h-4 w-4" />
              </Button>
            </Link>
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Recent Registrations</CardTitle>
            <CardDescription>Latest user registrations</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentRegistrations.map((user) => (
                  <TableRow key={`${user.id}-${user.email}`}>
                    <TableCell>{user.name}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell className="text-right">${user.registrationFee.toFixed(2)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <div className="mt-4">
              <Link href="/dashboard/revenue">
                <Button variant="outline" size="sm" className="w-full">
                  View All Registrations
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Financial Navigation</CardTitle>
            <CardDescription>Quick access to financial pages</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-2">
            <Link href="/dashboard/revenue">
              <Button variant="outline" className="w-full justify-start">
                Revenue
              </Button>
            </Link>
            <Link href="/dashboard/expenses">
              <Button variant="outline" className="w-full justify-start">
                Expenses
              </Button>
            </Link>
            <Link href="/dashboard/reconciliation">
              <Button variant="outline" className="w-full justify-start">
                Reconciliation
              </Button>
            </Link>
            <Link href="/dashboard/income">
              <Button variant="outline" className="w-full justify-start">
                Income
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

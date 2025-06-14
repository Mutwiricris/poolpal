"use client"

import { useState, useEffect } from "react"
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts'
import { 
  getUserRegistrationData, 
  getTournamentData, 
  getRevenueData,
  getProductCategoryBreakdown,
  getTournamentRegistrations,
  getKpiMetrics,
  getOrderStatusBreakdown,
  MonthlyDataPoint,
  CategoryBreakdown,
  KpiMetric
} from '@/lib/insights-service'

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658']

export default function InsightsPage() {
  const [timeframe, setTimeframe] = useState("ytd")
  const [loading, setLoading] = useState(true)
  
  // State for data
  const [revenueData, setRevenueData] = useState<any[]>([])
  const [totalRevenue, setTotalRevenue] = useState(0)
  const [totalExpenses, setTotalExpenses] = useState(0)
  const [userRegistrationData, setUserRegistrationData] = useState<any[]>([])
  const [tournamentData, setTournamentData] = useState<any[]>([])
  const [productCategories, setProductCategories] = useState<CategoryBreakdown[]>([])
  const [tournamentRegistrations, setTournamentRegistrations] = useState<CategoryBreakdown[]>([])
  const [kpiMetrics, setKpiMetrics] = useState<KpiMetric[]>([])
  const [orderStatuses, setOrderStatuses] = useState<CategoryBreakdown[]>([])

  // Fetch data based on timeframe
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      try {
        // Fetch all data
        const userData = await getUserRegistrationData()
        setUserRegistrationData(userData.map(item => ({ ...item, users: item.value })))
        
        const tournData = await getTournamentData()
        setTournamentData(tournData.map(item => ({ ...item, tournaments: item.value })))
        
        const { monthlyData, totalRevenue: revenue } = await getRevenueData()
        // Estimate expenses as 70% of revenue for now
        const expenses = Math.round(revenue * 0.7)
        setTotalRevenue(revenue)
        setTotalExpenses(expenses)
        
        setRevenueData(monthlyData.map(item => ({ 
          ...item, 
          revenue: item.value,
          // For now, estimate expenses as 70% of revenue
          expenses: Math.round(item.value * 0.7)
        })))
        
        const categories = await getProductCategoryBreakdown()
        setProductCategories(categories)
        
        const { tournamentBreakdown } = await getTournamentRegistrations()
        setTournamentRegistrations(tournamentBreakdown)
        
        const metrics = await getKpiMetrics()
        setKpiMetrics(metrics)
        
        const statuses = await getOrderStatusBreakdown()
        setOrderStatuses(statuses)
      } catch (error) {
        console.error("Error fetching insights data:", error)
      } finally {
        setLoading(false)
      }
    }
    
    fetchData()
  }, [timeframe])

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Insights</h1>
        <Select value={timeframe} onValueChange={setTimeframe}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select Timeframe" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ytd">Year to Date</SelectItem>
            <SelectItem value="last6">Last 6 Months</SelectItem>
            <SelectItem value="last3">Last 3 Months</SelectItem>
            <SelectItem value="last1">Last Month</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-6">
        {loading ? (
          Array(4).fill(0).map((_, index) => (
            <Card key={index}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Loading...</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-6 w-16 bg-muted rounded animate-pulse"></div>
                <div className="h-4 w-24 bg-muted rounded animate-pulse mt-2"></div>
              </CardContent>
            </Card>
          ))
        ) : orderStatuses.length === 0 ? (
          <Card className="col-span-4">
            <CardContent className="pt-6">
              <div className="text-center text-muted-foreground">No order status data available</div>
            </CardContent>
          </Card>
        ) : (
          orderStatuses.map((status, index) => (
            <Card key={index}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">{status.name}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{status.value}</div>
                {status.change !== undefined && (
                  <p className={`text-xs ${status.change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {status.change >= 0 ? '+' : ''}{status.change}% from last month
                  </p>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Total Revenue</CardTitle>
            <CardDescription>Year to date</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center items-center h-12">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
              </div>
            ) : (
              <>
                <div className="text-3xl font-bold">
                  ${totalRevenue.toFixed(2)}
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  {kpiMetrics.find(m => m.name === 'Total Revenue')?.change || 0}% from previous period
                </p>
              </>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Total Expenses</CardTitle>
            <CardDescription>Year to date</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center items-center h-12">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
              </div>
            ) : (
              <>
                <div className="text-3xl font-bold">
                  ${totalExpenses.toFixed(2)}
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  +8% from previous period
                </p>
              </>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Net Income</CardTitle>
            <CardDescription>Year to date</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center items-center h-12">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
              </div>
            ) : (
              <>
                <div className="text-3xl font-bold">
                  ${(totalRevenue - totalExpenses).toFixed(2)}
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  +23% from previous period
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="financial" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="financial">Financial</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="tournaments">Tournaments</TabsTrigger>
          <TabsTrigger value="expenses">Expenses</TabsTrigger>
        </TabsList>
        
        <TabsContent value="financial" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Revenue vs Expenses</CardTitle>
              <CardDescription>Monthly breakdown of financial performance</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[400px]">
                {loading ? (
                  <div className="flex justify-center items-center h-full">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                  </div>
                ) : revenueData.length === 0 ? (
                  <div className="flex justify-center items-center h-full text-muted-foreground">
                    No revenue data available
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                      data={revenueData}
                      margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                    >
                      <defs>
                        <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="#8884d8" stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id="colorExpenses" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#82ca9d" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="#82ca9d" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip formatter={(value) => `$${value}`} />
                      <Legend />
                      <Area 
                        type="monotone" 
                        dataKey="revenue" 
                        stroke="#8884d8" 
                        fillOpacity={1} 
                        fill="url(#colorRevenue)" 
                        name="Revenue"
                      />
                      <Area 
                        type="monotone" 
                        dataKey="expenses" 
                        stroke="#82ca9d" 
                        fillOpacity={1} 
                        fill="url(#colorExpenses)" 
                        name="Expenses"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="users" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>User Registrations</CardTitle>
              <CardDescription>Monthly new user registrations</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[400px]">
                {loading ? (
                  <div className="flex justify-center items-center h-full">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                  </div>
                ) : userRegistrationData.length === 0 ? (
                  <div className="flex justify-center items-center h-full text-muted-foreground">
                    No user registration data available
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={userRegistrationData}
                      margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar 
                        dataKey="users" 
                        fill="#8884d8" 
                        name="New Users"
                      />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="tournaments" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Tournament Activity</CardTitle>
              <CardDescription>Monthly tournament counts</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[400px]">
                {loading ? (
                  <div className="flex justify-center items-center h-full">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                  </div>
                ) : tournamentData.length === 0 ? (
                  <div className="flex justify-center items-center h-full text-muted-foreground">
                    No tournament data available
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={tournamentData}
                      margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line 
                        type="monotone" 
                        dataKey="tournaments" 
                        stroke="#8884d8" 
                        name="Tournaments"
                        strokeWidth={2}
                        dot={{ r: 6 }}
                        activeDot={{ r: 8 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="expenses" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Product Category Breakdown</CardTitle>
              <CardDescription>Distribution of products by category</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[400px]">
                {loading ? (
                  <div className="flex justify-center items-center h-full">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                  </div>
                ) : productCategories.length === 0 ? (
                  <div className="flex justify-center items-center h-full text-muted-foreground">
                    No product category data available
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={productCategories}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        outerRadius={150}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {productCategories.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => `${value} products`} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Key Performance Metrics</CardTitle>
            <CardDescription>Year to date performance</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center items-center h-[200px]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
              </div>
            ) : (
              <div className="space-y-4">
                {kpiMetrics.map((metric, index) => (
                  <div className="space-y-2" key={index}>
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium">{metric.name}</p>
                      <p className={`text-sm font-medium ${metric.changeType === 'positive' ? 'text-green-600' : metric.changeType === 'negative' ? 'text-amber-600' : 'text-blue-600'}`}>
                        {metric.changeType === 'positive' ? '+' : ''}{metric.change}%
                      </p>
                    </div>
                    <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                      <div 
                        className={`h-full ${metric.changeType === 'positive' ? 'bg-green-600' : metric.changeType === 'negative' ? 'bg-amber-600' : 'bg-blue-600'}`} 
                        style={{ width: `${Math.abs(metric.change)}%` }} 
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Tournament Registrations</CardTitle>
            <CardDescription>Most popular tournaments by registration count</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              {loading ? (
                <div className="flex justify-center items-center h-full">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                </div>
              ) : tournamentRegistrations.length === 0 ? (
                <div className="flex justify-center items-center h-full text-muted-foreground">
                  No tournament registration data available
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={tournamentRegistrations.slice(0, 5)} // Show top 5 tournaments
                    layout="vertical"
                    margin={{ top: 10, right: 30, left: 80, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis 
                      type="category" 
                      dataKey="name" 
                      tick={{ fontSize: 12 }}
                      width={80}
                    />
                    <Tooltip formatter={(value) => `${value} registrations`} />
                    <Legend />
                    <Bar 
                      dataKey="value" 
                      name="Registrations" 
                      fill="#8884d8"
                    />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

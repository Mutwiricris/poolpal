"use client"

import { useState } from "react"
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { IconCheck, IconX } from "@tabler/icons-react"

interface Transaction {
  id: string
  date: string
  description: string
  amount: number
  category: string
  reconciled: boolean
  type: 'income' | 'expense'
}

export default function ReconciliationPage() {
  const [month, setMonth] = useState("may")
  const [transactions, setTransactions] = useState<Transaction[]>([
    { 
      id: "1", 
      date: "2025-05-01", 
      description: "User Registration - John Doe", 
      amount: 25.00, 
      category: "Registration", 
      reconciled: true,
      type: 'income'
    },
    { 
      id: "2", 
      date: "2025-05-02", 
      description: "User Registration - Jane Smith", 
      amount: 25.00, 
      category: "Registration", 
      reconciled: true,
      type: 'income'
    },
    { 
      id: "3", 
      date: "2025-05-05", 
      description: "Pool Maintenance", 
      amount: 150.00, 
      category: "Maintenance", 
      reconciled: false,
      type: 'expense'
    },
    { 
      id: "4", 
      date: "2025-05-10", 
      description: "Tournament Prize Money", 
      amount: 500.00, 
      category: "Prizes", 
      reconciled: true,
      type: 'expense'
    },
    { 
      id: "5", 
      date: "2025-05-15", 
      description: "User Registration - Bob Johnson", 
      amount: 25.00, 
      category: "Registration", 
      reconciled: false,
      type: 'income'
    },
    { 
      id: "6", 
      date: "2025-05-20", 
      description: "Equipment Purchase", 
      amount: 200.00, 
      category: "Equipment", 
      reconciled: false,
      type: 'expense'
    },
  ])

  const toggleReconciled = (id: string) => {
    setTransactions(
      transactions.map(transaction => 
        transaction.id === id 
          ? { ...transaction, reconciled: !transaction.reconciled } 
          : transaction
      )
    )
  }

  const totalIncome = transactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0)

  const totalExpenses = transactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0)

  const reconciledIncome = transactions
    .filter(t => t.type === 'income' && t.reconciled)
    .reduce((sum, t) => sum + t.amount, 0)

  const reconciledExpenses = transactions
    .filter(t => t.type === 'expense' && t.reconciled)
    .reduce((sum, t) => sum + t.amount, 0)

  const unreconciledTransactions = transactions.filter(t => !t.reconciled)

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Reconciliation</h1>
        <div className="flex items-center gap-4">
          <Select value={month} onValueChange={setMonth}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select Month" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="may">May 2025</SelectItem>
              <SelectItem value="april">April 2025</SelectItem>
              <SelectItem value="march">March 2025</SelectItem>
            </SelectContent>
          </Select>
          <Button>Export Report</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Total Income</CardTitle>
            <CardDescription>May 2025</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalIncome.toFixed(2)}</div>
            <p className="text-sm text-muted-foreground mt-1">
              Reconciled: ${reconciledIncome.toFixed(2)}
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Total Expenses</CardTitle>
            <CardDescription>May 2025</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalExpenses.toFixed(2)}</div>
            <p className="text-sm text-muted-foreground mt-1">
              Reconciled: ${reconciledExpenses.toFixed(2)}
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Net Income</CardTitle>
            <CardDescription>May 2025</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${(totalIncome - totalExpenses).toFixed(2)}</div>
            <p className="text-sm text-muted-foreground mt-1">
              Reconciled: ${(reconciledIncome - reconciledExpenses).toFixed(2)}
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Unreconciled</CardTitle>
            <CardDescription>Pending transactions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{unreconciledTransactions.length}</div>
            <p className="text-sm text-muted-foreground mt-1">
              Value: ${unreconciledTransactions.reduce((sum, t) => sum + t.amount, 0).toFixed(2)}
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="all" className="w-full">
        <TabsList>
          <TabsTrigger value="all">All Transactions</TabsTrigger>
          <TabsTrigger value="unreconciled">Unreconciled</TabsTrigger>
          <TabsTrigger value="income">Income</TabsTrigger>
          <TabsTrigger value="expenses">Expenses</TabsTrigger>
        </TabsList>
        
        <TabsContent value="all" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>All Transactions</CardTitle>
              <CardDescription>Review and reconcile all financial transactions</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead>Reconciled</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions.map((transaction) => (
                    <TableRow key={transaction.id}>
                      <TableCell>{new Date(transaction.date).toLocaleDateString()}</TableCell>
                      <TableCell className="font-medium">{transaction.description}</TableCell>
                      <TableCell>{transaction.category}</TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          transaction.type === 'income' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {transaction.type === 'income' ? 'Income' : 'Expense'}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        ${transaction.amount.toFixed(2)}
                      </TableCell>
                      <TableCell>
                        <Button 
                          variant={transaction.reconciled ? "outline" : "ghost"} 
                          size="sm"
                          onClick={() => toggleReconciled(transaction.id)}
                          className={transaction.reconciled ? "bg-green-50" : ""}
                        >
                          {transaction.reconciled ? (
                            <IconCheck className="h-4 w-4 text-green-600" />
                          ) : (
                            <IconX className="h-4 w-4 text-red-600" />
                          )}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="unreconciled" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Unreconciled Transactions</CardTitle>
              <CardDescription>Transactions that need to be reconciled</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead>Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {unreconciledTransactions.map((transaction) => (
                    <TableRow key={transaction.id}>
                      <TableCell>{new Date(transaction.date).toLocaleDateString()}</TableCell>
                      <TableCell className="font-medium">{transaction.description}</TableCell>
                      <TableCell>{transaction.category}</TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          transaction.type === 'income' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {transaction.type === 'income' ? 'Income' : 'Expense'}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        ${transaction.amount.toFixed(2)}
                      </TableCell>
                      <TableCell>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => toggleReconciled(transaction.id)}
                        >
                          Mark as Reconciled
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="income" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Income Transactions</CardTitle>
              <CardDescription>All income transactions</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead>Reconciled</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions.filter(t => t.type === 'income').map((transaction) => (
                    <TableRow key={transaction.id}>
                      <TableCell>{new Date(transaction.date).toLocaleDateString()}</TableCell>
                      <TableCell className="font-medium">{transaction.description}</TableCell>
                      <TableCell>{transaction.category}</TableCell>
                      <TableCell className="text-right">
                        ${transaction.amount.toFixed(2)}
                      </TableCell>
                      <TableCell>
                        <Button 
                          variant={transaction.reconciled ? "outline" : "ghost"} 
                          size="sm"
                          onClick={() => toggleReconciled(transaction.id)}
                          className={transaction.reconciled ? "bg-green-50" : ""}
                        >
                          {transaction.reconciled ? (
                            <IconCheck className="h-4 w-4 text-green-600" />
                          ) : (
                            <IconX className="h-4 w-4 text-red-600" />
                          )}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="expenses" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Expense Transactions</CardTitle>
              <CardDescription>All expense transactions</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead>Reconciled</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions.filter(t => t.type === 'expense').map((transaction) => (
                    <TableRow key={transaction.id}>
                      <TableCell>{new Date(transaction.date).toLocaleDateString()}</TableCell>
                      <TableCell className="font-medium">{transaction.description}</TableCell>
                      <TableCell>{transaction.category}</TableCell>
                      <TableCell className="text-right">
                        ${transaction.amount.toFixed(2)}
                      </TableCell>
                      <TableCell>
                        <Button 
                          variant={transaction.reconciled ? "outline" : "ghost"} 
                          size="sm"
                          onClick={() => toggleReconciled(transaction.id)}
                          className={transaction.reconciled ? "bg-green-50" : ""}
                        >
                          {transaction.reconciled ? (
                            <IconCheck className="h-4 w-4 text-green-600" />
                          ) : (
                            <IconX className="h-4 w-4 text-red-600" />
                          )}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

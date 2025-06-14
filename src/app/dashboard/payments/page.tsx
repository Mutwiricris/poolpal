"use client";

import { useState, useEffect } from "react";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { IconSearch, IconPlus, IconFileText } from "@tabler/icons-react";
import { Payment, PaymentStatus, getAllPayments } from "@/lib/payment-service";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import Link from "next/link";

export default function PaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [filteredPayments, setFilteredPayments] = useState<Payment[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchPayments = async () => {
      try {
        setIsLoading(true);
        const allPayments = await getAllPayments();
        setPayments(allPayments);
        setFilteredPayments(allPayments);
      } catch (error) {
        console.error("Error fetching payments:", error);
        toast.error("Could not load payments. Please try again later.");
        // Set empty arrays to prevent infinite loading
        setPayments([]);
        setFilteredPayments([]);
        toast.error("Failed to load payments");
      } finally {
        setIsLoading(false);
      }
    };

    fetchPayments();
  }, []);

  useEffect(() => {
    // Apply filters
    let result = [...payments];
    
    // Apply status filter
    if (statusFilter !== "all") {
      result = result.filter(payment => payment.status === statusFilter);
    }
    
    // Apply search filter
    if (searchTerm) {
      const lowercaseSearchTerm = searchTerm.toLowerCase();
      result = result.filter(
        payment =>
          payment.referenceCode.toLowerCase().includes(lowercaseSearchTerm) ||
          payment.orderId.toLowerCase().includes(lowercaseSearchTerm) ||
          payment.userId.toLowerCase().includes(lowercaseSearchTerm)
      );
    }
    
    setFilteredPayments(result);
  }, [searchTerm, statusFilter, payments]);

  const getStatusBadgeColor = (status: PaymentStatus) => {
    switch (status) {
      case PaymentStatus.COMPLETED:
        return "bg-green-100 text-green-800";
      case PaymentStatus.PENDING:
        return "bg-yellow-100 text-yellow-800";
      case PaymentStatus.PROCESSING:
        return "bg-blue-100 text-blue-800";
      case PaymentStatus.FAILED:
        return "bg-red-100 text-red-800";
      case PaymentStatus.REFUNDED:
        return "bg-purple-100 text-purple-800";
      case PaymentStatus.CANCELLED:
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  return (
    <div className="space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Payments</h2>
        <Button onClick={() => router.push("/dashboard/payments/new")}>
          <IconPlus className="mr-2 h-4 w-4" />
          New Payment
        </Button>
      </div>
      
      <div className="flex items-center space-x-2">
        <div className="relative flex-1">
          <IconSearch className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search by reference code or order ID..."
            className="w-full pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <select
          className="w-[180px] px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="all">All Statuses</option>
          <option value={PaymentStatus.PENDING}>Pending</option>
          <option value={PaymentStatus.PROCESSING}>Processing</option>
          <option value={PaymentStatus.COMPLETED}>Completed</option>
          <option value={PaymentStatus.FAILED}>Failed</option>
          <option value={PaymentStatus.REFUNDED}>Refunded</option>
          <option value={PaymentStatus.CANCELLED}>Cancelled</option>
        </select>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Payments</CardTitle>
          <CardDescription>
            Manage and track all payment transactions.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : filteredPayments.length === 0 ? (
            <div className="text-center py-8 space-y-2">
              <IconSearch className="h-10 w-10 text-muted-foreground mx-auto" />
              <p className="text-muted-foreground font-medium">No payments found</p>
              <p className="text-sm text-muted-foreground">
                {payments.length > 0 && searchTerm ? 
                  "Try adjusting your search or filter criteria" : 
                  "No payment records exist in the system yet"}
              </p>
              {payments.length === 0 && (
                <Button 
                  variant="outline" 
                  className="mt-2" 
                  onClick={() => router.push("/dashboard/payments/new")}
                >
                  <IconPlus className="mr-2 h-4 w-4" />
                  Create your first payment
                </Button>
              )}
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Reference Code</TableHead>
                    <TableHead>Order ID</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPayments.map((payment, index) => (
                    <TableRow key={`${payment.id}-${index}`}>
                      <TableCell className="font-medium">
                        {payment.referenceCode}
                      </TableCell>
                      <TableCell>
                        <Link 
                          href={`/dashboard/orders/${payment.orderId}`}
                          className="text-blue-600 hover:underline"
                        >
                          {payment.orderId}
                        </Link>
                      </TableCell>
                      <TableCell>{formatCurrency(payment.amount)}</TableCell>
                      <TableCell>
                        <Badge className={getStatusBadgeColor(payment.status)}>
                          {payment.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{formatDate(payment.createdAt)}</TableCell>
                      <TableCell>
                        <Button 
                          variant="outline"
                          size="sm"
                          onClick={() => router.push(`/dashboard/payments/${payment.id}`)}
                        >
                          <IconFileText className="h-4 w-4 mr-1" />
                          View
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

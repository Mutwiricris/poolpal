'use client';

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle,
  CardFooter
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  IconArrowLeft, 
  IconCreditCard, 
  IconUser, 
  IconShoppingCart,
  IconReceipt,
  IconAlertCircle,
  IconCheck
} from "@tabler/icons-react";
import { toast } from "sonner";
import Link from "next/link";
import { Payment, PaymentStatus, getPaymentById, updatePaymentStatus } from "@/lib/payment-service";
import { Order, getOrderById } from "@/lib/order-service";

export default function PaymentDetailClient({ paymentId }: { paymentId: string }) {
  const [payment, setPayment] = useState<Payment | null>(null);
  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [newStatus, setNewStatus] = useState<PaymentStatus | "">("");
  const router = useRouter();

  useEffect(() => {
    const fetchPayment = async () => {
      try {
        setIsLoading(true);
        const paymentData = await getPaymentById(paymentId);
        
        if (paymentData) {
          setPayment(paymentData);
          
          // Fetch associated order
          if (paymentData.orderId) {
            try {
              const orderData = await getOrderById(paymentData.orderId);
              if (orderData) {
                setOrder(orderData);
              }
            } catch (orderError) {
              console.error("Error fetching order:", orderError);
              // Don't redirect, just show payment without order
            }
          }
        } else {
          toast.error("Payment not found");
          setTimeout(() => router.push("/dashboard/payments"), 1500);
        }
      } catch (error) {
        console.error("Error fetching payment:", error);
        toast.error("Failed to load payment details");
        setTimeout(() => router.push("/dashboard/payments"), 1500);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPayment();
  }, [paymentId, router]);

  const handleUpdateStatus = async () => {
    if (!payment || !newStatus) return;
    
    try {
      setIsUpdating(true);
      await updatePaymentStatus(payment.id, newStatus as PaymentStatus);
      
      // Update local state
      setPayment({
        ...payment,
        status: newStatus as PaymentStatus,
        updatedAt: Date.now(),
        ...(newStatus === PaymentStatus.COMPLETED ? { completedAt: Date.now() } : {})
      });
      
      toast.success(`Payment status updated to ${newStatus}`);
      setNewStatus("");
    } catch (error: any) {
      toast.error(error.message || "Failed to update payment status");
    } finally {
      setIsUpdating(false);
    }
  };

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

  const formatDate = (timestamp?: number) => {
    if (!timestamp) return "N/A";
    return new Date(timestamp).toLocaleString();
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  // Get valid status transitions for current payment
  const getValidStatusTransitions = (currentStatus: PaymentStatus): PaymentStatus[] => {
    switch (currentStatus) {
      case PaymentStatus.PENDING:
        return [PaymentStatus.PROCESSING, PaymentStatus.COMPLETED, PaymentStatus.FAILED, PaymentStatus.CANCELLED];
      case PaymentStatus.PROCESSING:
        return [PaymentStatus.COMPLETED, PaymentStatus.FAILED];
      case PaymentStatus.COMPLETED:
        return [PaymentStatus.REFUNDED];
      case PaymentStatus.FAILED:
        return [PaymentStatus.PENDING, PaymentStatus.PROCESSING];
      case PaymentStatus.CANCELLED:
        return [PaymentStatus.PENDING];
      case PaymentStatus.REFUNDED:
        return [];
      default:
        return [];
    }
  };

  const validTransitions = payment ? getValidStatusTransitions(payment.status) : [];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!payment) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <IconAlertCircle className="h-12 w-12 text-red-500" />
        <h2 className="text-2xl font-bold">Payment Not Found</h2>
        <p className="text-muted-foreground">The payment you're looking for doesn't exist or has been removed.</p>
        <Button onClick={() => router.push("/dashboard/payments")}>
          <IconArrowLeft className="mr-2 h-4 w-4" />
          Back to Payments
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button 
          variant="outline" 
          size="icon" 
          onClick={() => router.back()}
          className="h-9 w-9"
        >
          <IconArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-3xl font-bold tracking-tight">Payment Details</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Payment Information */}
        <Card className="md:col-span-2">
          <CardHeader>
            <div className="flex justify-between items-center">
              <div className="flex flex-col">
                <CardTitle className="flex items-center">
                  <IconCreditCard className="mr-2 h-5 w-5" />
                  Payment #{payment.receiptNumber}
                </CardTitle>
                <CardDescription>
                  Created on {formatDate(payment.createdAt)}
                </CardDescription>
              </div>
              <Badge className={getStatusBadgeColor(payment.status)}>
                {payment.status}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Payment Method</p>
                <p className="text-lg">{payment.paymentMethod}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Amount</p>
                <p className="text-lg font-semibold">{formatCurrency(payment.amount)}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Receipt Number</p>
                <p className="text-lg">{payment.receiptNumber}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Order ID</p>
                <p className="text-lg">{payment.orderId || "N/A"}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Created Date</p>
                <p className="text-lg">{formatDate(payment.createdAt)}</p>
              </div>
              {payment.completedAt && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Completed Date</p>
                  <p className="text-lg">{formatDate(payment.completedAt)}</p>
                </div>
              )}
              {payment.updatedAt && payment.updatedAt !== payment.createdAt && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Last Updated</p>
                  <p className="text-lg">{formatDate(payment.updatedAt)}</p>
                </div>
              )}
            </div>

            {payment.notes && (
              <>
                <Separator />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Notes</p>
                  <p className="mt-1">{payment.notes}</p>
                </div>
              </>
            )}
          </CardContent>
          <CardFooter className="flex justify-between">
            <div className="flex items-center space-x-2">
              <Select
                value={newStatus}
                onValueChange={(value: string) => setNewStatus(value as PaymentStatus | "")}
                disabled={validTransitions.length === 0 || isUpdating}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Update status" />
                </SelectTrigger>
                <SelectContent>
                  {validTransitions.map((status) => (
                    <SelectItem key={status} value={status}>
                      {status}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button 
                onClick={handleUpdateStatus} 
                disabled={!newStatus || isUpdating}
              >
                {isUpdating ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                ) : (
                  <>
                    <IconCheck className="mr-2 h-4 w-4" />
                    Update Status
                  </>
                )}
              </Button>
            </div>
          </CardFooter>
        </Card>

        {/* Order Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <IconShoppingCart className="mr-2 h-5 w-5" />
              Order Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {order ? (
              <>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Order Number</p>
                  <p className="text-lg font-semibold">{order.orderNumber}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Order Status</p>
                  <Badge>{order.status}</Badge>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Order Total</p>
                  <p className="text-lg font-semibold">{formatCurrency(order.total)}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Items</p>
                  <p className="text-lg">{order.items.length} items</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Created Date</p>
                  <p className="text-lg">{formatDate(Number(order.createdAt))}</p>
                </div>
                <Button 
                  variant="outline" 
                  className="w-full mt-2"
                  onClick={() => router.push(`/dashboard/orders/${order.id}`)}
                >
                  <IconShoppingCart className="mr-2 h-4 w-4" />
                  View Order Details
                </Button>
              </>
            ) : (
              <div className="text-center py-4 text-muted-foreground">
                Order information not available
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle,
  CardFooter
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
  IconCheck,
  IconAlertCircle
} from "@tabler/icons-react";
import { toast } from "sonner";
import { Payment, PaymentMethod, PaymentStatus, savePayment } from "@/lib/payment-service";
import { Order, OrderStatus, getAllOrders, getOrderById, updateOrderPayment } from "@/lib/order-service";

export default function NewPaymentPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoadingOrders, setIsLoadingOrders] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const router = useRouter();
  
  const [formData, setFormData] = useState({
    orderId: "",
    amount: "",
    paymentMethod: PaymentMethod.CREDIT_CARD as string,
    notes: "",
  });

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setIsLoadingOrders(true);
        // Only fetch unpaid orders
        const allOrders = await getAllOrders();
        if (!allOrders || allOrders.length === 0) {
          toast.info("No orders found in the system");
          setOrders([]);
          return;
        }
        
        const unpaidOrders = allOrders.filter(order => !order.isPaid);
        if (unpaidOrders.length === 0) {
          toast.info("No unpaid orders found. All orders have been paid.");
        }
        setOrders(unpaidOrders);
      } catch (error) {
        console.error("Error fetching orders:", error);
        toast.error("Failed to load orders");
      } finally {
        setIsLoadingOrders(false);
      }
    };

    fetchOrders();
  }, []);

  useEffect(() => {
    const fetchOrderDetails = async () => {
      if (!formData.orderId) {
        setSelectedOrder(null);
        return;
      }

      try {
        const order = await getOrderById(formData.orderId);
        if (order) {
          setSelectedOrder(order);
          // Set the amount to the order total by default
          setFormData(prev => ({
            ...prev,
            amount: order.total.toString()
          }));
        }
      } catch (error) {
        console.error("Error fetching order details:", error);
        toast.error("Failed to load order details");
      }
    };

    fetchOrderDetails();
  }, [formData.orderId]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.orderId || !formData.amount || !formData.paymentMethod) {
      toast.error("Please fill in all required fields");
      return;
    }

    if (!selectedOrder) {
      toast.error("Please select a valid order");
      return;
    }

    if (selectedOrder.isPaid) {
      toast.error("This order has already been paid");
      return;
    }

    const amount = parseFloat(formData.amount);
    if (isNaN(amount) || amount <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    try {
      setIsSubmitting(true);

      // Generate a reference code for the payment
      const referenceCode = `PAY-${Date.now()}-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`;

      // Create the payment
      const paymentData: Payment = {
        id: `payment_${Date.now()}`,
        orderId: formData.orderId,
        userId: selectedOrder.userId,
        amount,
        referenceCode,
        paymentMethod: formData.paymentMethod,
        status: PaymentStatus.COMPLETED, // Assuming admin-created payments are completed
        createdAt: Date.now(),
        notes: formData.notes,
      };

      const paymentId = await savePayment(paymentData);
      
      // Update the order with payment information
      await updateOrderPayment(
        formData.orderId,
        paymentId,
        referenceCode
      );

      toast.success("Payment created successfully");
      router.push(`/dashboard/payments/${paymentId}`);
    } catch (error: any) {
      console.error("Error creating payment:", error);
      toast.error(error.message || "Failed to create payment");
    } finally {
      setIsSubmitting(false);
    }
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
        <div className="flex items-center space-x-2">
          <Button 
            variant="outline" 
            size="icon" 
            onClick={() => router.back()}
          >
            <IconArrowLeft className="h-4 w-4" />
          </Button>
          <h2 className="text-3xl font-bold tracking-tight">New Payment</h2>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Payment Details</CardTitle>
              <CardDescription>
                Enter the payment information for an unpaid order.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="orderId">Select Order</Label>
                <select
                  id="orderId"
                  name="orderId"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  value={formData.orderId}
                  onChange={(e) => handleSelectChange("orderId", e.target.value)}
                  disabled={isSubmitting || isLoadingOrders || orders.length === 0}
                >
                  <option value="">Select an order</option>
                  {orders.map((order) => (
                    <option key={order.id} value={order.id}>
                      {order.orderNumber} - {formatCurrency(order.total)}
                    </option>
                  ))}
                </select>
                {isLoadingOrders && (
                  <p className="text-sm text-muted-foreground">Loading orders...</p>
                )}
                {!isLoadingOrders && orders.length === 0 && (
                  <p className="text-sm text-muted-foreground">No unpaid orders available</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="amount">Amount</Label>
                <Input
                  id="amount"
                  name="amount"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="Enter payment amount"
                  value={formData.amount}
                  onChange={handleInputChange}
                  disabled={isSubmitting || !selectedOrder}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="paymentMethod">Payment Method</Label>
                <select
                  id="paymentMethod"
                  name="paymentMethod"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  value={formData.paymentMethod}
                  onChange={(e) => handleSelectChange("paymentMethod", e.target.value)}
                  disabled={isSubmitting}
                >
                  <option key="m-pesa" value="M-Pesa">M-Pesa</option>
                  <option key={PaymentMethod.CREDIT_CARD} value={PaymentMethod.CREDIT_CARD}>Credit Card</option>
                  <option key={PaymentMethod.PAYPAL} value={PaymentMethod.PAYPAL}>PayPal</option>
                  <option key={PaymentMethod.BANK_TRANSFER} value={PaymentMethod.BANK_TRANSFER}>Bank Transfer</option>
                  <option key={PaymentMethod.CASH} value={PaymentMethod.CASH}>Cash</option>
                  <option key={PaymentMethod.OTHER} value={PaymentMethod.OTHER}>Other</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notes (Optional)</Label>
                <Textarea
                  id="notes"
                  name="notes"
                  placeholder="Add any additional information about this payment"
                  value={formData.notes}
                  onChange={handleInputChange}
                  disabled={isSubmitting}
                  rows={3}
                />
              </div>
            </CardContent>
            <CardFooter>
              <Button 
                type="submit" 
                className="w-full" 
                disabled={isSubmitting || !formData.orderId || !formData.amount}
              >
                {isSubmitting ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                ) : (
                  <>
                    <IconCheck className="mr-2 h-4 w-4" />
                    Create Payment
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>

          {/* Order Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Order Summary</CardTitle>
            </CardHeader>
            <CardContent>
              {selectedOrder ? (
                <div className="space-y-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Order Number</p>
                    <p className="text-lg font-semibold">{selectedOrder.orderNumber}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Status</p>
                    <p className="text-lg">{selectedOrder.status}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total</p>
                    <p className="text-lg font-semibold">{formatCurrency(selectedOrder.total)}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Items</p>
                    <p className="text-lg">{selectedOrder.items.length} items</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">User ID</p>
                    <p className="text-lg">{selectedOrder.userId}</p>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-6 text-center">
                  <IconAlertCircle className="h-10 w-10 text-muted-foreground mb-2" />
                  <p className="text-muted-foreground">Select an order to see details</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </form>
    </div>
  );
}

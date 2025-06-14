'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { getOrderById, Order, OrderItem, OrderStatus, updateOrderStatus } from '@/lib/order-service';
import { Payment, PaymentStatus, getPaymentById } from '@/lib/payment-service';
import { ArrowLeftIcon, CreditCardIcon } from '@heroicons/react/24/outline';

export default function OrderDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const [order, setOrder] = useState<Order | null>(null);
  const [payment, setPayment] = useState<Payment | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  
  // Get the order ID from params
  const orderId = params.id as string;

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        setLoading(true);
        const orderData = await getOrderById(orderId);
        
        if (!orderData) {
          setError('Order not found. It may have been deleted or the ID is incorrect.');
          setOrder(null);
          return;
        }
        
        setOrder(orderData);
        setError(null);
        
        // If order has payment info, fetch the payment details
        if (orderData.paymentId) {
          try {
            const paymentData = await getPaymentById(orderData.paymentId);
            if (paymentData) {
              setPayment(paymentData);
            }
          } catch (paymentErr) {
            console.error('Error fetching payment details:', paymentErr);
            // Don't set error as the order was loaded successfully
          }
        }
      } catch (err) {
        console.error('Error fetching order:', err);
        setError('Failed to load order details. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    if (orderId) {
      fetchOrder();
    }
  }, [orderId]);

  const handleStatusChange = async (newStatus: OrderStatus) => {
    if (!order) return;
    
    try {
      setUpdatingStatus(true);
      await updateOrderStatus(order.id, newStatus);
      setOrder({
        ...order,
        status: newStatus
      });
    } catch (err: any) {
      console.error('Error updating order status:', err);
      alert(err.message || 'Failed to update order status. Please try again.');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'processing':
        return 'bg-blue-100 text-blue-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };
  
  const getPaymentStatusColor = (status: PaymentStatus) => {
    switch (status) {
      case PaymentStatus.COMPLETED:
        return 'bg-green-100 text-green-800';
      case PaymentStatus.PENDING:
        return 'bg-yellow-100 text-yellow-800';
      case PaymentStatus.PROCESSING:
        return 'bg-blue-100 text-blue-800';
      case PaymentStatus.FAILED:
        return 'bg-red-100 text-red-800';
      case PaymentStatus.REFUNDED:
        return 'bg-purple-100 text-purple-800';
      case PaymentStatus.CANCELLED:
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (timestamp: number | string) => {
    if (!timestamp) return 'N/A';
    const date = new Date(typeof timestamp === 'string' ? timestamp : Number(timestamp));
    return date.toLocaleString();
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <p className="text-red-500 mb-4">{error || 'Order not found'}</p>
        <Button onClick={() => router.back()}>Go Back</Button>
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
          <ArrowLeftIcon className="h-4 w-4" />
        </Button>
        <h1 className="text-3xl font-bold tracking-tight">Order Details</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Order #{order.orderNumber}</CardTitle>
            <CardDescription>
              Created on {formatDate(order.createdAt)}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium">Items</h3>
                <Separator className="my-2" />
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead>Quantity</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {order.items.map((item: OrderItem) => (
                      <TableRow key={item.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            {item.imageUrl && (
                              <img 
                                src={item.imageUrl} 
                                alt={item.name} 
                                className="h-10 w-10 rounded object-cover"
                              />
                            )}
                            <div>
                              <p className="font-medium">{item.name}</p>
                              {item.category && (
                                <p className="text-sm text-muted-foreground">{item.category}</p>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>{formatCurrency(item.price)}</TableCell>
                        <TableCell>{item.quantity}</TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(item.price * item.quantity)}
                        </TableCell>
                      </TableRow>
                    ))}
                    <TableRow>
                      <TableCell colSpan={3} className="text-right font-medium">
                        Total
                      </TableCell>
                      <TableCell className="text-right font-bold">
                        {formatCurrency(order.total)}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>

              {order.notes && (
                <div>
                  <h3 className="text-lg font-medium">Notes</h3>
                  <Separator className="my-2" />
                  <p className="text-muted-foreground">{order.notes}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Order Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between mb-4">
                <Badge className={getStatusColor(order.status)}>
                  {order.status}
                </Badge>
                <div className="flex gap-2">
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={() => handleStatusChange(OrderStatus.PROCESSING)}
                    disabled={updatingStatus || order.status === OrderStatus.PROCESSING}
                  >
                    Processing
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={() => handleStatusChange(OrderStatus.COMPLETED)}
                    disabled={updatingStatus || order.status === OrderStatus.COMPLETED}
                  >
                    Complete
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Customer Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Customer ID</h3>
                <p>{order.userId}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Shipping Address</h3>
                <p>{order.shippingAddress}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Payment Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-muted-foreground">Payment Status</h3>
                {order.isPaid ? (
                  <Badge className="bg-green-100 text-green-800">Paid</Badge>
                ) : (
                  <Badge className="bg-yellow-100 text-yellow-800">Unpaid</Badge>
                )}
              </div>
              
              {payment ? (
                <>
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Reference Code</h3>
                    <p>{payment.referenceCode}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Payment Method</h3>
                    <p>{payment.paymentMethod}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Payment Status</h3>
                    <Badge className={getPaymentStatusColor(payment.status)}>
                      {payment.status}
                    </Badge>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Payment Date</h3>
                    <p>{formatDate(payment.createdAt)}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Amount</h3>
                    <p className="font-bold">{formatCurrency(payment.amount)}</p>
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Payment Method</h3>
                    <p>{order.paymentMethod}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Receipt Number</h3>
                    <p>{order.receiptNumber}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Total Amount</h3>
                    <p className="font-bold">{formatCurrency(order.total)}</p>
                  </div>
                </>
              )}
            </CardContent>
            <CardFooter>
              {payment ? (
                <Button 
                  variant="outline" 
                  className="w-full" 
                  onClick={() => router.push(`/dashboard/payments/${payment.id}`)}
                >
                  <CreditCardIcon className="h-4 w-4 mr-2" />
                  View Payment Details
                </Button>
              ) : order.isPaid ? (
                <div className="text-sm text-muted-foreground w-full text-center">
                  Payment information not available
                </div>
              ) : (
                <Button 
                  className="w-full" 
                  onClick={() => router.push(`/dashboard/payments/new?orderId=${order.id}`)}
                >
                  <CreditCardIcon className="h-4 w-4 mr-2" />
                  Record Payment
                </Button>
              )}
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}

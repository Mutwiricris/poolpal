import { collection, doc, getDoc, getDocs, setDoc, updateDoc, deleteDoc, query, where, orderBy } from 'firebase/firestore';
import { firestore } from './firebase';
import { toast } from 'sonner';
import { generateReferenceCode, PaymentStatus } from './payment-service';

// Interface for order item (product in an order)
export interface OrderItem {
  id: string;
  imageUrl: string;
  name: string;
  price: number;
  quantity: number;
  category?: string;
}

// Order status options
export enum OrderStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  REFUNDED = 'refunded',
  SHIPPED = 'shipped',
  DELIVERED = 'delivered'
}

// Interface for order
export interface Order {
  id: string;
  createdAt: string | number;
  items: OrderItem[];
  notes?: string;
  orderNumber: string;
  paymentMethod: string;
  receiptNumber: string;
  shippingAddress: string;
  status: OrderStatus;
  total: number;
  userId: string;
  isPaid: boolean;
  paymentId?: string;
  paymentReferenceCode?: string;
  updatedAt?: number;
}

// Interface for order form data
export interface OrderFormData {
  items: OrderItem[];
  notes?: string;
  paymentMethod: string;
  shippingAddress: string;
}

// Create or update an order
export async function saveOrder(orderData: Order): Promise<string> {
  try {
    const orderId = orderData.id || `order_${Date.now()}`;
    const orderRef = doc(firestore, 'orders', orderId);
    
    const timestamp = Date.now();
    const updatedOrder = {
      ...orderData,
      id: orderId,
      createdAt: orderData.createdAt || timestamp,
      updatedAt: timestamp
    };
    
    await setDoc(orderRef, updatedOrder);
    return orderId;
  } catch (error) {
    console.error('Error saving order:', error);
    throw error;
  }
}

// Get a single order by ID
export async function getOrderById(id: string): Promise<Order | null> {
  try {
    const orderRef = doc(firestore, 'orders', id);
    const snapshot = await getDoc(orderRef);
    
    if (snapshot.exists()) {
      return snapshot.data() as Order;
    }
    
    return null;
  } catch (error) {
    console.error('Error getting order:', error);
    throw error;
  }
}

// Get all orders
export async function getAllOrders(): Promise<Order[]> {
  try {
    const ordersRef = collection(firestore, 'orders');
    const snapshot = await getDocs(ordersRef);
    
    if (!snapshot.empty) {
      return snapshot.docs.map(doc => doc.data() as Order);
    }
    
    return [];
  } catch (error) {
    console.error('Error getting all orders:', error);
    throw error;
  }
}

// Get orders by user ID
export async function getOrdersByUserId(userId: string): Promise<Order[]> {
  try {
    const ordersRef = collection(firestore, 'orders');
    const userOrdersQuery = query(ordersRef, where('userId', '==', userId));
    const snapshot = await getDocs(userOrdersQuery);
    
    if (!snapshot.empty) {
      return snapshot.docs.map(doc => doc.data() as Order);
    }
    
    return [];
  } catch (error) {
    console.error('Error getting user orders:', error);
    throw error;
  }
}

// Update order status with validation
export async function updateOrderStatus(id: string, status: OrderStatus): Promise<void> {
  try {
    // Get current order to validate status transition
    const order = await getOrderById(id);
    if (!order) {
      throw new Error('Order not found');
    }
    
    // Validate status transition
    if (!isValidOrderStatusTransition(order.status, status)) {
      throw new Error(`Invalid status transition from ${order.status} to ${status}`);
    }
    
    // Special validation for payment-dependent statuses
    if ((status === OrderStatus.PROCESSING || status === OrderStatus.SHIPPED || 
         status === OrderStatus.DELIVERED || status === OrderStatus.COMPLETED) && 
        !order.isPaid) {
      throw new Error(`Cannot set order to ${status} when payment is not completed`);
    }
    
    const orderRef = doc(firestore, 'orders', id);
    await updateDoc(orderRef, { 
      status,
      updatedAt: Date.now()
    });
    
    toast.success(`Order status updated to ${status}`);
  } catch (error: any) {
    console.error('Error updating order status:', error);
    toast.error(`Failed to update order status: ${error.message}`);
    throw error;
  }
}

// Helper function to validate order status transitions
function isValidOrderStatusTransition(currentStatus: OrderStatus, newStatus: OrderStatus): boolean {
  // Define valid status transitions
  const validTransitions: Record<OrderStatus, OrderStatus[]> = {
    [OrderStatus.PENDING]: [
      OrderStatus.PROCESSING, 
      OrderStatus.CANCELLED
    ],
    [OrderStatus.PROCESSING]: [
      OrderStatus.SHIPPED, 
      OrderStatus.COMPLETED,
      OrderStatus.CANCELLED
    ],
    [OrderStatus.SHIPPED]: [
      OrderStatus.DELIVERED,
      OrderStatus.RETURNED
    ],
    [OrderStatus.DELIVERED]: [
      OrderStatus.COMPLETED,
      OrderStatus.RETURNED
    ],
    [OrderStatus.COMPLETED]: [
      OrderStatus.REFUNDED
    ],
    [OrderStatus.CANCELLED]: [],
    [OrderStatus.REFUNDED]: []
  };
  
  return validTransitions[currentStatus]?.includes(newStatus) || false;
}

// Delete an order
export async function deleteOrder(id: string): Promise<void> {
  try {
    const orderRef = doc(firestore, 'orders', id);
    await deleteDoc(orderRef);
  } catch (error) {
    console.error('Error deleting order:', error);
    throw error;
  }
}

// Get recent orders
export async function getRecentOrders(limit: number = 10): Promise<Order[]> {
  try {
    const ordersRef = collection(firestore, 'orders');
    const recentOrdersQuery = query(ordersRef, orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(recentOrdersQuery);
    
    if (!snapshot.empty) {
      return snapshot.docs.slice(0, limit).map(doc => doc.data() as Order);
    }
    
    return [];
  } catch (error) {
    console.error('Error getting recent orders:', error);
    throw error;
  }
}

// Calculate order total from items
export function calculateOrderTotal(items: OrderItem[]): number {
  return items.reduce((total, item) => total + (item.price * item.quantity), 0);
}

// Generate order number
export function generateOrderNumber(): string {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 1000);
  return `ORD-${timestamp}-${random}`;
}

// Update order payment information
export async function updateOrderPayment(
  orderId: string, 
  paymentId: string, 
  paymentReferenceCode: string
): Promise<void> {
  try {
    const orderRef = doc(firestore, 'orders', orderId);
    await updateDoc(orderRef, { 
      isPaid: true,
      paymentId,
      paymentReferenceCode,
      status: OrderStatus.PROCESSING,
      updatedAt: Date.now()
    });
    
    toast.success('Payment recorded successfully');
  } catch (error: any) {
    console.error('Error updating order payment:', error);
    toast.error(`Failed to update order payment: ${error.message}`);
    throw error;
  }
}

// Create a new order with payment
export async function createOrderWithPayment(
  orderData: Omit<Order, 'id' | 'orderNumber' | 'createdAt' | 'status' | 'isPaid'>,
  paymentMethod: string,
  paymentReferenceCode?: string
): Promise<{ orderId: string; paymentId: string }> {
  try {
    // Generate order number and reference code
    const orderNumber = generateOrderNumber();
    const referenceCode = paymentReferenceCode || generateReferenceCode();
    
    // Create order first
    const orderId = await saveOrder({
      ...orderData,
      id: `order_${Date.now()}`,
      orderNumber,
      createdAt: Date.now(),
      status: OrderStatus.PENDING,
      isPaid: false,
      paymentReferenceCode: referenceCode
    });
    
    // Create payment record in a separate collection
    const paymentId = `payment_${Date.now()}`;
    const paymentRef = doc(firestore, 'payments', paymentId);
    
    await setDoc(paymentRef, {
      id: paymentId,
      orderId,
      userId: orderData.userId,
      amount: orderData.total,
      referenceCode,
      paymentMethod,
      status: PaymentStatus.PENDING,
      createdAt: Date.now()
    });
    
    return { orderId, paymentId };
  } catch (error: any) {
    console.error('Error creating order with payment:', error);
    toast.error(`Failed to create order: ${error.message}`);
    throw error;
  }
}

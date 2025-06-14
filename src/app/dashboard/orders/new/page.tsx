'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
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
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { ArrowLeftIcon, PlusIcon, TrashIcon } from '@heroicons/react/24/outline';
import { saveOrder, OrderItem, OrderFormData, calculateOrderTotal, generateOrderNumber, OrderStatus } from '@/lib/order-service';
import { getAllProducts, Product } from '@/lib/product-service';
import { PaymentMethod } from '@/lib/payment-service';

export default function NewOrderPage() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<OrderItem[]>([]);
  const [selectedProductId, setSelectedProductId] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [formData, setFormData] = useState<OrderFormData>({
    items: [],
    paymentMethod: 'M-Pesa',
    shippingAddress: '',
    notes: ''
  });

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const productsData = await getAllProducts();
        setProducts(productsData);
        setError(null);
      } catch (err) {
        console.error('Error fetching products:', err);
        setError('Failed to load products. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  const handleAddProduct = (productId: string) => {
    // Log all products and the product ID we're looking for to help debug
    console.log('All products:', products);
    console.log('Looking for product ID:', productId);
    
    // Check if productId contains a price (indicating it's not an ID but a display string)
    if (productId.includes('$')) {
      console.error('Invalid product ID format:', productId);
      return;
    }
    
    // Use loose equality to handle potential type differences (string vs number)
    const product = products.find(p => String(p.id) === String(productId));
    if (!product) {
      console.error('Product not found:', productId);
      return;
    }

    console.log('Adding product:', product);

    const existingItem = selectedProducts.find(item => item.id === productId);
    
    if (existingItem) {
      // Update quantity if product already exists in the order
      const updatedProducts = selectedProducts.map(item => 
        item.id === productId 
          ? { ...item, quantity: item.quantity + 1 } 
          : item
      );
      console.log('Updated products:', updatedProducts);
      setSelectedProducts(updatedProducts);
    } else {
      // Add new product to the order
      const newItem: OrderItem = {
        id: product.id,
        name: product.name,
        price: product.price,
        quantity: 1,
        imageUrl: product.imageUrl || '',
        category: product.category
      };
      
      const newSelectedProducts = [...selectedProducts, newItem];
      console.log('New selected products:', newSelectedProducts);
      setSelectedProducts(newSelectedProducts);
    }
  };

  const handleRemoveProduct = (productId: string) => {
    setSelectedProducts(selectedProducts.filter(item => item.id !== productId));
  };

  const handleQuantityChange = (productId: string, quantity: number) => {
    if (quantity < 1) return;
    
    setSelectedProducts(selectedProducts.map(item => 
      item.id === productId 
        ? { ...item, quantity } 
        : item
    ));
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (selectedProducts.length === 0) {
      alert('Please add at least one product to the order.');
      return;
    }

    if (!formData.shippingAddress) {
      alert('Please enter a shipping address.');
      return;
    }

    try {
      setSubmitting(true);
      
      const total = calculateOrderTotal(selectedProducts);
      const orderNumber = generateOrderNumber();
      
      const orderData = {
        id: '',
        createdAt: Date.now(),
        items: selectedProducts,
        orderNumber,
        paymentMethod: formData.paymentMethod,
        receiptNumber: `RCPT-${Date.now().toString().slice(-6)}`,
        shippingAddress: formData.shippingAddress,
        status: OrderStatus.PENDING,
        total,
        userId: 'user_' + Date.now(),
        notes: formData.notes,
        isPaid: false
      };
      
      await saveOrder(orderData);
      
      router.push('/dashboard/orders');
    } catch (err) {
      console.error('Error creating order:', err);
      alert('Failed to create order. Please try again.');
      setSubmitting(false);
    }
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

  const total = calculateOrderTotal(selectedProducts);

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
        <h1 className="text-3xl font-bold tracking-tight">Create New Order</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Order Items</CardTitle>
              <CardDescription>Add products to this order</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="flex gap-2 items-end">
                  <div className="flex-1">
                    <Label htmlFor="product">Product</Label>
                    <select
                      id="product"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                      value={selectedProductId}
                      onChange={(e) => {
                        console.log('Selected product ID:', e.target.value);
                        setSelectedProductId(e.target.value);
                      }}
                    >
                      <option value="">Select a product</option>
                      {products.map((product, index) => {
                        console.log('Product in dropdown:', product.id, product.name);
                        return (
                          <option key={`product-${product.id || index}`} value={product.id}>
                            {product.name} - {formatCurrency(product.price)}
                          </option>
                        );
                      })}
                    </select>
                  </div>
                  <Button 
                    type="button"
                    variant="outline" 
                    className="flex items-center"
                    onClick={() => {
                      if (selectedProductId) {
                        handleAddProduct(selectedProductId);
                        setSelectedProductId("");
                      }
                    }}
                  >
                    <PlusIcon className="h-4 w-4 mr-1" />
                    Add
                  </Button>
                </div>

                {selectedProducts.length === 0 ? (
                  <div className="text-center py-8 border rounded-md">
                    <p className="text-muted-foreground">No products added yet</p>
                    <p className="text-sm text-muted-foreground">Select products from the dropdown above</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Product</TableHead>
                        <TableHead className="text-right">Price</TableHead>
                        <TableHead className="text-center">Quantity</TableHead>
                        <TableHead className="text-right">Total</TableHead>
                        <TableHead></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedProducts.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell>{item.name}</TableCell>
                          <TableCell className="text-right">{formatCurrency(item.price)}</TableCell>
                          <TableCell className="text-center">
                            <div className="flex items-center justify-center space-x-2">
                              <Button
                                type="button"
                                variant="outline"
                                size="icon"
                                className="h-6 w-6"
                                onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                                disabled={item.quantity <= 1}
                              >
                                -
                              </Button>
                              <span className="w-8 text-center">{item.quantity}</span>
                              <Button
                                type="button"
                                variant="outline"
                                size="icon"
                                className="h-6 w-6"
                                onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                              >
                                +
                              </Button>
                            </div>
                          </TableCell>
                          <TableCell className="text-right">{formatCurrency(item.price * item.quantity)}</TableCell>
                          <TableCell>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => handleRemoveProduct(item.id)}
                              className="h-6 w-6 text-red-500 hover:text-red-700"
                            >
                              <TrashIcon className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                      <TableRow>
                        <TableCell colSpan={3} className="text-right font-bold">
                          Total
                        </TableCell>
                        <TableCell className="text-right font-bold">
                          {formatCurrency(total)}
                        </TableCell>
                        <TableCell></TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                )}
              </div>
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Order Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="paymentMethod">Payment Method</Label>
                  <select
                    id="paymentMethod"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                    value={formData.paymentMethod}
                    onChange={(e) => setFormData({...formData, paymentMethod: e.target.value})}
                  >
                    <option key="m-pesa" value="M-Pesa">M-Pesa</option>
                    <option key={PaymentMethod.CREDIT_CARD} value={PaymentMethod.CREDIT_CARD}>Credit Card</option>
                    <option key={PaymentMethod.CASH} value={PaymentMethod.CASH}>Cash</option>
                    <option key={PaymentMethod.BANK_TRANSFER} value={PaymentMethod.BANK_TRANSFER}>Bank Transfer</option>
                    <option key={PaymentMethod.PAYPAL} value={PaymentMethod.PAYPAL}>PayPal</option>
                    <option key={PaymentMethod.OTHER} value={PaymentMethod.OTHER}>Other</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="shippingAddress">Shipping Address</Label>
                  <Textarea
                    id="shippingAddress"
                    name="shippingAddress"
                    value={formData.shippingAddress}
                    onChange={handleInputChange}
                    placeholder="Enter shipping address"
                    rows={3}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    name="notes"
                    value={formData.notes || ''}
                    onChange={handleInputChange}
                    placeholder="Any special instructions or notes"
                    rows={3}
                  />
                </div>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button 
                  variant="outline" 
                  type="button"
                  onClick={() => router.back()}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={submitting || selectedProducts.length === 0}
                >
                  {submitting ? 'Creating...' : 'Create Order'}
                </Button>
              </CardFooter>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Items</span>
                  <span>{selectedProducts.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total Quantity</span>
                  <span>{selectedProducts.reduce((sum, item) => sum + item.quantity, 0)}</span>
                </div>
                <Separator />
                <div className="flex justify-between font-bold">
                  <span>Total Amount</span>
                  <span>{formatCurrency(total)}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </form>
    </div>
  );
}

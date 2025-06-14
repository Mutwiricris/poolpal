'use client';

import React, { useState, useEffect } from 'react';
import { PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Product, 
  deleteProduct, 
  updateProductPopular, 
  updateProductNewArrival, 
  updateProductFeatured 
} from '@/lib/product-service';
import { toast } from 'sonner';

interface ProductListProps {
  products: Product[];
  onEdit: (product: Product) => void;
  onRefresh: () => void;
}

export default function ProductList({ products, onEdit, onRefresh }: ProductListProps) {
  const [deletingProductId, setDeletingProductId] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredProducts, setFilteredProducts] = useState<Product[]>(products);
  const [showPopularOnly, setShowPopularOnly] = useState(false);
  const [showNewArrivalsOnly, setShowNewArrivalsOnly] = useState(false);
  const [showFeaturedOnly, setShowFeaturedOnly] = useState(false);

  useEffect(() => {
    let filtered = [...products];
    
    // Apply search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(product => 
        product.name.toLowerCase().includes(term) || 
        product.description.toLowerCase().includes(term)
      );
    }
    
    // Apply popular filter
    if (showPopularOnly) {
      filtered = filtered.filter(product => product.isPopular);
    }
    
    // Apply new arrivals filter
    if (showNewArrivalsOnly) {
      filtered = filtered.filter(product => product.isNewArrival);
    }
    
    // Apply featured filter
    if (showFeaturedOnly) {
      filtered = filtered.filter(product => product.isFeatured);
    }
    
    setFilteredProducts(filtered);
  }, [products, searchTerm, showPopularOnly, showNewArrivalsOnly, showFeaturedOnly]);

  const handleDeleteClick = (productId: string) => {
    setDeletingProductId(productId);
    setConfirmDelete(productId);
  };

  const handleCancelDelete = () => {
    setDeletingProductId(null);
    setConfirmDelete(null);
    setDeleteError(null);
  };

  const handleConfirmDelete = async (productId: string) => {
    try {
      setDeleteError(null);
      toast.promise(
        deleteProduct(productId),
        {
          loading: 'Deleting product...',
          success: 'Product deleted successfully',
          error: 'Failed to delete product. Please try again.'
        }
      );
      onRefresh();
    } catch (error) {
      console.error('Error deleting product:', error);
      // Error is handled by toast.promise
    } finally {
      setDeletingProductId(null);
      setConfirmDelete(null);
    }
  };

  const handleTogglePopular = async (productId: string, isPopular: boolean) => {
    try {
      await updateProductPopular(productId, isPopular);
      toast.success(`Product ${isPopular ? 'marked as popular' : 'removed from popular'}`);
      onRefresh();
    } catch (error) {
      console.error('Error updating product popular status:', error);
      toast.error('Failed to update product status');
    }
  };

  const handleToggleNewArrival = async (productId: string, isNewArrival: boolean) => {
    try {
      await updateProductNewArrival(productId, isNewArrival);
      toast.success(`Product ${isNewArrival ? 'marked as new arrival' : 'removed from new arrivals'}`);
      onRefresh();
    } catch (error) {
      console.error('Error updating product new arrival status:', error);
      toast.error('Failed to update product status');
    }
  };

  const handleToggleFeatured = async (productId: string, isFeatured: boolean) => {
    try {
      await updateProductFeatured(productId, isFeatured);
      toast.success(`Product ${isFeatured ? 'featured' : 'unfeatured'} successfully`);
      onRefresh();
    } catch (error) {
      console.error('Error updating product featured status:', error);
      toast.error('Failed to update product status');
    }
  };

  if (products.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">No products found</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {deleteError && (
        <Alert variant="destructive">
          <AlertDescription>{deleteError}</AlertDescription>
        </Alert>
      )}
      
      <div className="flex flex-col sm:flex-row gap-4 items-center">
        <div className="relative w-full sm:w-64">
          <Input
            placeholder="Search products..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full"
          />
        </div>
        
        <div className="flex flex-wrap items-center gap-4 ml-auto">
          <div className="flex items-center space-x-2">
            <Switch
              id="popular-filter"
              checked={showPopularOnly}
              onCheckedChange={setShowPopularOnly}
            />
            <label htmlFor="popular-filter" className="text-sm font-medium">
              Popular
            </label>
          </div>
          
          <div className="flex items-center space-x-2">
            <Switch
              id="new-arrivals-filter"
              checked={showNewArrivalsOnly}
              onCheckedChange={setShowNewArrivalsOnly}
            />
            <label htmlFor="new-arrivals-filter" className="text-sm font-medium">
              New Arrivals
            </label>
          </div>
          
          <div className="flex items-center space-x-2">
            <Switch
              id="featured-filter"
              checked={showFeaturedOnly}
              onCheckedChange={setShowFeaturedOnly}
            />
            <label htmlFor="featured-filter" className="text-sm font-medium">
              Featured
            </label>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredProducts.map((product, index) => (
          <Card key={`${product.id}-${index}`} className="overflow-hidden">
            <div className="relative h-48 w-full">
              {product.imageUrl ? (
                <img 
                  src={product.imageUrl} 
                  alt={product.name} 
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="h-full w-full bg-muted flex items-center justify-center">
                  <p className="text-muted-foreground">No image</p>
                </div>
              )}
            </div>
            
            <CardContent className="p-4">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h3 className="font-semibold text-lg">{product.name}</h3>
                  <p className="text-lg font-medium text-primary">${product.price.toFixed(2)}</p>
                </div>
                
                <div className="flex space-x-1">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => onEdit(product)}
                  >
                    <PencilIcon className="h-4 w-4" />
                  </Button>
                  
                  {confirmDelete === product.id ? (
                    <div className="flex items-center space-x-1">
                      <Button 
                        variant="destructive" 
                        size="sm" 
                        onClick={() => handleConfirmDelete(product.id)}
                        disabled={deletingProductId === product.id}
                        className="relative"
                      >
                        {deletingProductId === product.id ? (
                          <>
                            <span className="opacity-0">Yes</span>
                            <span className="absolute inset-0 flex items-center justify-center">
                              <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                            </span>
                          </>
                        ) : 'Yes'}
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={handleCancelDelete}
                      >
                        No
                      </Button>
                    </div>
                  ) : (
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => handleDeleteClick(product.id)}
                    >
                      <TrashIcon className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
              
              <div className="text-sm">
                <p className="line-clamp-2 text-muted-foreground">{product.description}</p>
              </div>
              
              <div className="grid grid-cols-3 gap-2 mt-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    id={`popular-${product.id}`}
                    checked={product.isPopular}
                    onCheckedChange={(checked) => handleTogglePopular(product.id, checked)}
                  />
                  <label htmlFor={`popular-${product.id}`} className="text-xs">
                    Popular
                  </label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Switch
                    id={`new-arrival-${product.id}`}
                    checked={product.isNewArrival}
                    onCheckedChange={(checked) => handleToggleNewArrival(product.id, checked)}
                  />
                  <label htmlFor={`new-arrival-${product.id}`} className="text-xs">
                    New
                  </label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Switch
                    id={`featured-${product.id}`}
                    checked={product.isFeatured}
                    onCheckedChange={(checked) => handleToggleFeatured(product.id, checked)}
                  />
                  <label htmlFor={`featured-${product.id}`} className="text-xs">
                    Featured
                  </label>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

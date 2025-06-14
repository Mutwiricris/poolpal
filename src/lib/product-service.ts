import { collection, doc, getDoc, getDocs, setDoc, updateDoc, deleteDoc, query, where, orderBy } from 'firebase/firestore';
import { ref as storageRef, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { firestore, storage } from './firebase';

export interface Product {
  id: string;
  name: string;
  price: number;
  description: string;
  category: string;
  imageUrl: string;
  isPopular: boolean;
  isNewArrival: boolean;
  isFeatured: boolean;
  totalPurchases?: number;
  createdAt?: number;
  updatedAt?: number;
}

export interface ProductFormData {
  name: string;
  price: number;
  description: string;
  category: string;
  isPopular: boolean;
  isNewArrival: boolean;
  isFeatured: boolean;
  totalPurchases?: number;
}

// Upload product image to Firebase Storage
export async function uploadProductImage(file: File, productId: string): Promise<string> {
  try {
    const imageRef = storageRef(storage, `products/${productId}/${file.name}`);
    await uploadBytes(imageRef, file);
    const downloadURL = await getDownloadURL(imageRef);
    return downloadURL;
  } catch (error) {
    console.error('Error uploading product image:', error);
    throw error;
  }
}

// Delete product image from Firebase Storage
export async function deleteProductImage(imageUrl: string): Promise<void> {
  try {
    // Extract the path from the URL
    const imageRef = storageRef(storage, imageUrl);
    await deleteObject(imageRef);
  } catch (error) {
    console.error('Error deleting product image:', error);
    throw error;
  }
}

// Create or update a product
export async function saveProduct(productData: Product): Promise<string> {
  try {
    const productId = productData.id || `p_${Date.now()}`;
    const productRef = doc(firestore, 'products', productId);
    
    const timestamp = Date.now();
    const updatedProduct = {
      ...productData,
      id: productId,
      updatedAt: timestamp,
      createdAt: productData.createdAt || timestamp
    };
    
    await setDoc(productRef, updatedProduct);
    return productId;
  } catch (error) {
    console.error('Error saving product:', error);
    throw error;
  }
}

// Get a single product by ID
export async function getProductById(id: string): Promise<Product | null> {
  try {
    const productRef = doc(firestore, 'products', id);
    const snapshot = await getDoc(productRef);
    
    if (snapshot.exists()) {
      return snapshot.data() as Product;
    }
    
    return null;
  } catch (error) {
    console.error('Error getting product:', error);
    throw error;
  }
}

// Get all products
export async function getAllProducts(): Promise<Product[]> {
  try {
    const productsRef = collection(firestore, 'products');
    const snapshot = await getDocs(productsRef);
    
    if (!snapshot.empty) {
      return snapshot.docs.map(doc => {
        // Include the document ID as the product ID
        return { ...doc.data(), id: doc.id } as Product;
      });
    }
    
    return [];
  } catch (error) {
    console.error('Error getting all products:', error);
    throw error;
  }
}

// Delete a product
export async function deleteProduct(id: string): Promise<void> {
  try {
    const productRef = doc(firestore, 'products', id);
    await deleteDoc(productRef);
  } catch (error) {
    console.error('Error deleting product:', error);
    throw error;
  }
}

// Update product popular status
export async function updateProductPopular(id: string, isPopular: boolean): Promise<void> {
  try {
    const productRef = doc(firestore, 'products', id);
    await updateDoc(productRef, { 
      isPopular,
      updatedAt: Date.now()
    });
  } catch (error) {
    console.error('Error updating product popular status:', error);
    throw error;
  }
}

// Update product new arrival status
export async function updateProductNewArrival(id: string, isNewArrival: boolean): Promise<void> {
  try {
    const productRef = doc(firestore, 'products', id);
    await updateDoc(productRef, { 
      isNewArrival,
      updatedAt: Date.now()
    });
  } catch (error) {
    console.error('Error updating product new arrival status:', error);
    throw error;
  }
}

// Update product featured status
export async function updateProductFeatured(id: string, isFeatured: boolean): Promise<void> {
  try {
    const productRef = doc(firestore, 'products', id);
    await updateDoc(productRef, { 
      isFeatured,
      updatedAt: Date.now()
    });
  } catch (error) {
    console.error('Error updating product featured status:', error);
    throw error;
  }
}

// Get popular products
export async function getPopularProducts(): Promise<Product[]> {
  try {
    const productsRef = collection(firestore, 'products');
    const popularQuery = query(productsRef, where('isPopular', '==', true));
    const snapshot = await getDocs(popularQuery);
    
    if (!snapshot.empty) {
      return snapshot.docs.map(doc => doc.data() as Product);
    }
    
    return [];
  } catch (error) {
    console.error('Error getting popular products:', error);
    throw error;
  }
}

// Get new arrival products
export async function getNewArrivalProducts(): Promise<Product[]> {
  try {
    const productsRef = collection(firestore, 'products');
    const newArrivalQuery = query(productsRef, where('isNewArrival', '==', true));
    const snapshot = await getDocs(newArrivalQuery);
    
    if (!snapshot.empty) {
      return snapshot.docs.map(doc => doc.data() as Product);
    }
    
    return [];
  } catch (error) {
    console.error('Error getting new arrival products:', error);
    throw error;
  }
}

// Get featured products
export async function getFeaturedProducts(): Promise<Product[]> {
  try {
    const productsRef = collection(firestore, 'products');
    const featuredQuery = query(productsRef, where('isFeatured', '==', true));
    const snapshot = await getDocs(featuredQuery);
    
    if (!snapshot.empty) {
      return snapshot.docs.map(doc => doc.data() as Product);
    }
    
    return [];
  } catch (error) {
    console.error('Error getting featured products:', error);
    throw error;
  }
}

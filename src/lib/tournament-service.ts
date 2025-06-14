import { collection, doc, getDoc, getDocs, setDoc, updateDoc, deleteDoc, query, where, orderBy, Timestamp, addDoc, getFirestore } from 'firebase/firestore';
import { ref as storageRef, uploadBytes, getDownloadURL, deleteObject, UploadResult } from 'firebase/storage';
import { firestore, storage } from './firebase';

// Add type for upload progress
interface UploadProgress {
  total: number;
  current: number;
  percentage: number;
}

// Add type for image optimization
interface OptimizedImage {
  width: number;
  height: number;
  data: string;
}

export interface Tournament {
  id: string;
  name: string;
  type: string;
  location: string;
  startDate: string;
  endDate: string;
  players: number;
  price: number;
  imageUrl?: string;
  isFeatured: boolean;
  isPublic: boolean;
  registeredUsers?: string[];
  updatedAt?: number | string;
}

export interface TournamentFormData {
  name: string;
  type: string;
  location: string;
  startDate: string;
  endDate: string;
  players: number;
  price: number;
  isFeatured: boolean;
  isPublic: boolean;
  registeredUsers?: string[];
}

// Upload tournament image to Firebase Storage with optimization
export async function uploadTournamentImage(file: File, tournamentId: string, progressCallback?: (progress: number) => void): Promise<string> {
  try {
    // Generate unique filename
    const fileName = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${file.name.split('.').pop()}`;
    
    // Check file size before optimization
    const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
    if (file.size > MAX_FILE_SIZE) {
      // Skip full optimization for large files to improve performance
      const optimizedFile = await quickOptimizeImage(file);
      return uploadOptimizedImage(optimizedFile, tournamentId, fileName, progressCallback);
    }
    
    // For smaller files, do full optimization
    const optimizedFile = await optimizeImage(file);
    
    const imageRef = storageRef(storage, `tournaments/${tournamentId}/${fileName}`);
    
    // Upload with progress tracking
    const uploadTask = uploadBytes(imageRef, optimizedFile);
    
    // Wait for upload to complete
    await uploadTask;
    
    // Get download URL
    const downloadURL = await getDownloadURL(imageRef);
    
    // Cache the download URL in the background
    cacheImageURL(tournamentId, fileName, downloadURL).catch(err => {
      console.warn('Failed to cache image URL, but upload succeeded:', err);
    });
    
    return downloadURL;
  } catch (error: any) {
    console.error('Error uploading tournament image:', error);
    throw error;
  }
}

// Helper function for uploading optimized image
async function uploadOptimizedImage(optimizedFile: File, tournamentId: string, fileName: string, progressCallback?: (progress: number) => void): Promise<string> {
  const imageRef = storageRef(storage, `tournaments/${tournamentId}/${fileName}`);
  
  try {
    // If we have a progress callback, use it
    if (progressCallback) {
      // Start with initial progress
      progressCallback(1);
    }
    
    // Upload the file
    const uploadResult = await uploadBytes(imageRef, optimizedFile);
    
    // Update progress to 75% after upload completes
    if (progressCallback) {
      progressCallback(75);
    }
    
    // Get download URL
    const downloadURL = await getDownloadURL(imageRef);
    
    // Update progress to 100% when everything is done
    if (progressCallback) {
      progressCallback(100);
    }
    
    return downloadURL;
  } catch (error) {
    console.error('Error in uploadOptimizedImage:', error);
    throw error;
  }
}

// Quick optimization for large images - less intensive processing
async function quickOptimizeImage(file: File): Promise<File> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = async (event) => {
      const img = new Image();
      img.onload = async () => {
        // Create canvas for basic resizing only
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        // Scale down large images with less quality optimization
        const maxSize = 1200; // Smaller max size than full optimization
        let width = img.width;
        let height = img.height;
        
        if (width > maxSize || height > maxSize) {
          if (width > height) {
            height = (height * maxSize) / width;
            width = maxSize;
          } else {
            width = (width * maxSize) / height;
            height = maxSize;
          }
        }
        
        canvas.width = width;
        canvas.height = height;
        
        // Draw image with basic optimization
        ctx?.drawImage(img, 0, 0, width, height);
        
        // Use jpeg for faster processing
        const jpegData = canvas.toDataURL('image/jpeg', 0.7);
        
        // Convert to blob
        const response = await fetch(jpegData);
        const blob = await response.blob();
        
        // Create new file
        const optimizedFile = new File([blob], file.name, {
          type: 'image/jpeg',
          lastModified: Date.now()
        });
        
        resolve(optimizedFile);
      };
      img.onerror = reject;
      img.src = event.target?.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// Full image optimization function
async function optimizeImage(file: File): Promise<File> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = async (event) => {
      const img = new Image();
      img.onload = async () => {
        // Create canvas for optimization
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        // Scale down large images
        const maxSize = 1920;
        let width = img.width;
        let height = img.height;
        
        if (width > maxSize || height > maxSize) {
          if (width > height) {
            height = (height * maxSize) / width;
            width = maxSize;
          } else {
            width = (width * maxSize) / height;
            height = maxSize;
          }
        }
        
        canvas.width = width;
        canvas.height = height;
        
        // Draw image with optimization
        ctx?.drawImage(img, 0, 0, width, height);
        
        // Convert to webp for better compression
        const webpData = canvas.toDataURL('image/webp', 0.8);
        
        // Convert back to blob
        const response = await fetch(webpData);
        const blob = await response.blob();
        
        // Create new file
        const optimizedFile = new File([blob], file.name, {
          type: 'image/webp',
          lastModified: Date.now()
        });
        
        resolve(optimizedFile);
      };
      img.onerror = reject;
      img.src = event.target?.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// Image URL caching
async function cacheImageURL(tournamentId: string, fileName: string, url: string): Promise<void> {
  try {
    const cacheRef = doc(firestore, 'cache', 'tournamentImages', tournamentId, fileName);
    await setDoc(cacheRef, {
      url,
      timestamp: Date.now(),
      expires: Date.now() + (24 * 60 * 60 * 1000) // Cache for 24 hours
    });
  } catch (error) {
    console.error('Error caching image URL:', error);
  }
}

// Delete tournament image from Firebase Storage
export async function deleteTournamentImage(imageUrl: string): Promise<void> {
  try {
    // Extract the path from the URL
    const imageRef = storageRef(storage, imageUrl);
    await deleteObject(imageRef);
  } catch (error) {
    console.error('Error deleting tournament image:', error);
    throw error;
  }
}

// Create or update a tournament
export async function saveTournament(tournamentData: Tournament): Promise<string> {
  try {
    const tournamentId = tournamentData.id || `t_${Date.now()}`;
    const tournamentRef = doc(firestore, 'tournaments', tournamentId);
    
    const timestamp = Date.now();
    const updatedTournament = {
      ...tournamentData,
      id: tournamentId,
      updatedAt: timestamp
    };
    
    await setDoc(tournamentRef, updatedTournament);
    return tournamentId;
  } catch (error) {
    console.error('Error saving tournament:', error);
    throw error;
  }
}

// Get a single tournament by ID
export async function getTournamentById(id: string): Promise<Tournament | null> {
  try {
    const tournamentRef = doc(firestore, 'tournaments', id);
    const snapshot = await getDoc(tournamentRef);
    
    if (snapshot.exists()) {
      return snapshot.data() as Tournament;
    }
    
    return null;
  } catch (error) {
    console.error('Error getting tournament:', error);
    throw error;
  }
}

// Get all tournaments
export async function getAllTournaments(): Promise<Tournament[]> {
  try {
    const tournamentsRef = collection(firestore, 'tournaments');
    const snapshot = await getDocs(tournamentsRef);
    
    if (!snapshot.empty) {
      return snapshot.docs.map(doc => doc.data() as Tournament);
    }
    
    return [];
  } catch (error) {
    console.error('Error getting all tournaments:', error);
    throw error;
  }
}

// Delete a tournament
export async function deleteTournament(id: string): Promise<void> {
  try {
    const tournamentRef = doc(firestore, 'tournaments', id);
    await deleteDoc(tournamentRef);
  } catch (error) {
    console.error('Error deleting tournament:', error);
    throw error;
  }
}

// Update tournament featured status
export async function updateTournamentFeatured(id: string, isFeatured: boolean): Promise<void> {
  try {
    // Get a fresh Firestore reference to avoid initialization issues
    const db = getFirestore();
    const tournamentRef = doc(db, 'tournaments', id);
    
    await updateDoc(tournamentRef, {
      isFeatured,
      updatedAt: Date.now()
    });
  } catch (error) {
    console.error('Error updating tournament featured status:', error);
    throw error;
  }
}

// Update tournament public status
export async function updateTournamentPublic(id: string, isPublic: boolean): Promise<void> {
  try {
    // Get a fresh Firestore reference to avoid initialization issues
    const db = getFirestore();
    const tournamentRef = doc(db, 'tournaments', id);
    
    await updateDoc(tournamentRef, {
      isPublic,
      updatedAt: Date.now()
    });
  } catch (error) {
    console.error('Error updating tournament public status:', error);
    throw error;
  }
}

// Get featured tournaments
export async function getFeaturedTournaments(): Promise<Tournament[]> {
  try {
    const tournamentsRef = collection(firestore, 'tournaments');
    const featuredQuery = query(tournamentsRef, where('isFeatured', '==', true));
    const snapshot = await getDocs(featuredQuery);
    
    if (!snapshot.empty) {
      return snapshot.docs.map(doc => doc.data() as Tournament);
    }
    
    return [];
  } catch (error) {
    console.error('Error getting featured tournaments:', error);
    throw error;
  }
}

// Search tournaments by name or type
export async function searchTournaments(searchTerm: string): Promise<Tournament[]> {
  try {
    // Note: Firestore doesn't support native text search, so we'll fetch all and filter
    // For a production app, consider using Algolia or Firebase Extensions for search
    const allTournaments = await getAllTournaments();
    const lowercaseSearchTerm = searchTerm.toLowerCase();
    
    return allTournaments.filter(tournament => {
      return (
        tournament.name.toLowerCase().includes(lowercaseSearchTerm) ||
        tournament.type.toLowerCase().includes(lowercaseSearchTerm)
      );
    });
  } catch (error) {
    console.error('Error searching tournaments:', error);
    throw error;
  }
}

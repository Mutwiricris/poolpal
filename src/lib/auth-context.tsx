'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { 
  User, 
  UserCredential,
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  GoogleAuthProvider,
  GithubAuthProvider,
  signInWithPopup,
  AuthProvider as FirebaseAuthProvider
} from 'firebase/auth';
import { doc, getDoc, setDoc, Timestamp } from 'firebase/firestore';
import { auth, firestore } from './firebase';
import { toast } from 'sonner';

type UserData = {
  uid: string;
  email: string | null;
  displayName?: string | null;
  role?: string;
  createdAt?: number;
  provider?: string;
};

interface AuthContextType {
  currentUser: User | null;
  userData: UserData | null;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<UserCredential | null>;
  register: (email: string, password: string, name: string) => Promise<UserCredential | null>;
  loginWithGoogle: () => Promise<UserCredential | null>;
  loginWithGithub: () => Promise<UserCredential | null>;
  logout: () => Promise<void>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    console.log('Setting up auth state listener');
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      console.log('Auth state changed:', user ? `User ${user.uid} logged in` : 'No user');
      setCurrentUser(user);
      
      if (user) {
        try {
          console.log('Fetching user data from Firestore');
          // Fetch user data from Firestore
          const userRef = doc(firestore, 'users', user.uid);
          const snapshot = await getDoc(userRef);
          
          if (snapshot.exists()) {
            console.log('User data found in Firestore');
            const data = snapshot.data();
            // Convert Firestore timestamp to number
            const createdAt = data.createdAt instanceof Timestamp ? 
              data.createdAt.toMillis() : data.createdAt || Date.now();
              
            const userData = {
              ...data,
              uid: user.uid,
              createdAt
            } as UserData;
            
            console.log('User data:', userData);
            setUserData(userData);
          } else {
            console.log('User not found in Firestore, creating basic record');
            // If user exists in Auth but not in DB, create basic record
            const basicUserData = {
              uid: user.uid,
              email: user.email,
              displayName: user.displayName || user.email?.split('@')[0] || 'User',
              role: 'user', // Add default role
              userType: 'user', // Add userType for compatibility
              createdAt: Date.now()
            };
            await setDoc(userRef, basicUserData);
            console.log('Basic user record created:', basicUserData);
            setUserData(basicUserData);
          }
        } catch (err) {
          console.error("Error fetching user data:", err);
        }
      } else {
        console.log('No user, setting userData to null');
        setUserData(null);
      }
      
      console.log('Setting loading to false');
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = async (email: string, password: string) => {
    setLoading(true);
    setError(null);
    try {
      // Sign in with Firebase Authentication
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      
      // Get the ID token
      const idToken = await userCredential.user.getIdToken();
      
      // Store the token in a cookie
      document.cookie = `auth-token=${idToken}; path=/; max-age=${60 * 60 * 24 * 14}; SameSite=Strict`;
      
      toast.success('Logged in successfully');
      return userCredential; // Return the credential for the caller
    } catch (err: any) {
      const errorMessage = formatAuthError(err.code || err.message);
      setError(errorMessage);
      toast.error(errorMessage);
      setLoading(false); // Ensure loading is set to false on error
      return null; // Return null instead of throwing
    } finally {
      // The finally block will still run, but we've already handled loading state in catch
    }
  };

  const handleSocialLogin = async (provider: FirebaseAuthProvider) => {
    setLoading(true);
    setError(null);
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      
      // Get the ID token
      const idToken = await user.getIdToken();
      
      // Store the token in a cookie
      document.cookie = `auth-token=${idToken}; path=/; max-age=${60 * 60 * 24 * 14}; SameSite=Strict`;
      
      // Check if user already exists in Firestore
      const userRef = doc(firestore, 'users', user.uid);
      const snapshot = await getDoc(userRef);
      
      if (!snapshot.exists()) {
        // Create new user record in Firestore
        const userData: UserData = {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName || user.email?.split('@')[0] || 'User',
          role: 'user',
          createdAt: Date.now(),
          provider: provider.providerId
        };
        
        await setDoc(userRef, userData);
        toast.success('Account created successfully');
      } else {
        toast.success('Logged in successfully');
      }
      
      return result;
    } catch (err: any) {
      const errorMessage = formatAuthError(err.code || err.message);
      setError(errorMessage);
      toast.error(errorMessage);
      setLoading(false); // Ensure loading is set to false on error
      return null;
    } finally {
      // The finally block will still run, but we've already handled loading state in catch
    }
  };

  const loginWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    return handleSocialLogin(provider);
  };

  const loginWithGithub = async () => {
    const provider = new GithubAuthProvider();
    return handleSocialLogin(provider);
  };

  const register = async (email: string, password: string, name: string) => {
    setLoading(true);
    setError(null);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      // Get the ID token
      const idToken = await user.getIdToken();
      
      // Store the token in a cookie
      document.cookie = `auth-token=${idToken}; path=/; max-age=${60 * 60 * 24 * 14}; SameSite=Strict`;
      
      // Store additional user data in Realtime Database
      const userData: UserData = {
        uid: user.uid,
        email: user.email,
        displayName: name,
        role: 'user',
        createdAt: Date.now(),
        provider: 'password'
      };
      
      await setDoc(doc(firestore, 'users', user.uid), userData);
      toast.success('Account created successfully');
      
      return userCredential;
    } catch (err: any) {
      const errorMessage = formatAuthError(err.code || err.message);
      setError(errorMessage);
      toast.error(errorMessage);
      setLoading(false); // Ensure loading is set to false on error
      return null;
    } finally {
      // The finally block will still run, but we've already handled loading state in catch
    }
  };

  const logout = async () => {
    setError(null);
    try {
      // Sign out from Firebase Authentication
      await signOut(auth);
      
      // Clear the auth token cookie
      document.cookie = 'auth-token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
      
      toast.success('Logged out successfully');
    } catch (err: any) {
      const errorMessage = formatAuthError(err.code || err.message);
      setError(errorMessage);
      toast.error(errorMessage);
      throw err;
    }
  };

  const clearError = () => {
    setError(null);
  };

  // Format Firebase auth error codes into user-friendly messages
  const formatAuthError = (errorCode: string): string => {
    switch (errorCode) {
      case 'auth/invalid-email':
        return 'Invalid email address format.';
      case 'auth/user-disabled':
        return 'This account has been disabled.';
      case 'auth/user-not-found':
        return 'No account found with this email.';
      case 'auth/wrong-password':
        return 'Incorrect password.';
      case 'auth/email-already-in-use':
        return 'Email already in use. Try logging in instead.';
      case 'auth/weak-password':
        return 'Password is too weak. Use at least 6 characters.';
      case 'auth/network-request-failed':
        return 'Network error. Check your connection and try again.';
      case 'auth/too-many-requests':
        return 'Too many failed attempts. Try again later.';
      case 'auth/configuration-not-found':
        return 'Authentication configuration error. Email/Password authentication may not be enabled in the Firebase console.';
      case 'auth/internal-error':
        return 'An internal authentication error occurred. Please try again later.';
      default:
        return `Authentication error: ${errorCode}`;
    }
  };

  const value = {
    currentUser,
    userData,
    loading,
    error,
    login,
    register,
    loginWithGoogle,
    loginWithGithub,
    logout,
    clearError
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

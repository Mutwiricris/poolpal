import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { doc, getDoc, getDocs, setDoc, updateDoc, collection, deleteDoc, query, where, orderBy, limit, getFirestore } from 'firebase/firestore';
import { getDatabase, ref, get, update, set, remove } from 'firebase/database';
import app from './firebase';

const firestore = getFirestore(app);
const database = getDatabase(app);

export interface User {
  uid: string;
  email?: string;
  emailVerified?: boolean;
  displayName?: string | null;
  fullName?: string;
  photoURL?: string;
  phoneNumber?: string;
  role?: string;
  userType?: string; // 'user', 'community_admin', 'player', 'fan'
  isActive?: boolean;
  isEmailVerified?: boolean;
  createdAt?: any;
  updatedAt?: number;
  communityId?: string;
  communities?: string[];
  favorites?: string[];
  lastLoginAt?: string;
  paymentStatus?: boolean;
  playerPaymentId?: string;
  playerPaymentStatus?: string;
  registeredAt?: string;
  registrationDate?: string;
  registrationFee?: number;
  birthdate?: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  state?: string;
  zipcode?: string;
  country?: string;
  provider?: string;
  isRegistered?: boolean;
}

export interface UserFormData {
  fullName: string;
  email: string;
  userType: string;
  phoneNumber?: string;
}

// Save user to Firestore with proper caching integration
export async function saveUser(uid: string, userData: Partial<User>): Promise<void> {
  try {
    // Ensure we have a valid UID
    if (!uid) {
      console.error('[UserService] Cannot save user without UID');
      throw new Error('Cannot save user without UID');
    }

    // Reference to the user document in Firestore
    const userRef = doc(firestore, 'users', uid);
    
    // Prepare data with timestamps - ensure uid is included
    const dataToSave: Partial<User> = {
      ...userData,
      uid: uid, // Explicitly set this to ensure it's a string
      updatedAt: Date.now(),
      // Set createdAt only if it doesn't already exist (new user)
      createdAt: userData.createdAt || Date.now()
    };
    
    // Update the user document in Firestore with merge option
    await setDoc(userRef, dataToSave, { merge: true });
    
    // If this user was in the cache, update the cached version
    if (userCache[uid]) {
      const updatedUser: User = {
        ...userCache[uid].user,
        ...userData,
        uid: uid, // Ensure uid is a string
        updatedAt: Date.now()
      };
      
      userCache[uid] = {
        user: updatedUser,
        timestamp: Date.now()
      };
    }
    
    // Invalidate all users cache to ensure fresh data on next load
    allUsersCache.timestamp = 0;
  } catch (error) {
    console.error('[UserService] Error saving user:', error);
    throw error;
  }
}

// In-memory cache for users to avoid repeated database calls
const userCache: Record<string, { user: User | null, timestamp: number }> = {};

// Cache expiration time in milliseconds (5 minutes)
const CACHE_EXPIRATION = 5 * 60 * 1000;

// Get a user by UID with caching and using Firestore directly
export async function getUserById(uid: string): Promise<User | null> {
  try {
    if (!uid) {
      console.error('[UserService] Cannot get user without UID');
      return null;
    }

    const now = Date.now();
    // Return cached data if still valid
    if (userCache[uid]) {
      if ((now - userCache[uid].timestamp) < USER_CACHE_EXPIRATION) {
        return userCache[uid].user;
      }
    }

    // No valid cache, fetch from Firestore
    const userRef = doc(firestore, 'users', uid);
    const docSnap = await getDoc(userRef);

    if (docSnap.exists()) {
      const userData = { ...docSnap.data(), uid } as User;
      // Cache the user
      userCache[uid] = {
        user: userData,
        timestamp: now
      };
      return userData;
    } else {
      // Cache negative result to avoid repeated lookups for missing users
      userCache[uid] = {
        user: null,
        timestamp: now
      };
      return null;
    }
  } catch (error) {
    console.error('[UserService] Error getting user by ID:', error);
    // Return cached data if available, even if expired
    if (userCache[uid]) {
      return userCache[uid].user;
    }
    return null;
  }
}

// Cache for all users with 2-minute expiration
const allUsersCache: { users: User[], timestamp: number } = { users: [], timestamp: 0 };
const USER_CACHE_EXPIRATION = 2 * 60 * 1000; // 2 minutes
const ALL_USERS_CACHE_EXPIRATION = 5 * 60 * 1000; // 5 minutes - longer cache for all users to improve dashboard performance

// Get all users with caching and using Firestore directly with pagination
export async function getAllUsers(limitCount: number = 50): Promise<User[]> {
  try {
    const now = Date.now();
    // Return cached data if still valid - even on error, we'll return stale cache if available
    if (allUsersCache.users.length > 0) {
      // If cache is still fresh, return it immediately
      if ((now - allUsersCache.timestamp) < ALL_USERS_CACHE_EXPIRATION) {
        return allUsersCache.users;
      }
      // If cache is stale but we have data, start async refresh but return cache immediately
      // This ensures UI is responsive while data updates in background
      refreshUsersCache(limitCount).catch(err => console.error('[UserService] Background cache refresh error:', err));
      return allUsersCache.users;
    }
    
    // No cache available, must wait for data
    return await refreshUsersCache(limitCount);
  } catch (error) {
    console.error('[UserService] Error getting all users:', error);
    // Return empty cache as last resort
    return allUsersCache.users.length > 0 ? allUsersCache.users : [];
  }
}

// Helper function to refresh users cache using Firestore with optimized query
async function refreshUsersCache(limitCount: number = 50): Promise<User[]> {
  try {
    // Use Firestore with limit for better performance
    const usersCol = collection(firestore, 'users');
    
    // Some users might not have createdAt field, so use a simple query with limit
    const usersQuery = query(
      usersCol,
      limit(limitCount) // Limit results to improve loading time
    );
    
    const firestoreSnapshot = await getDocs(usersQuery);
    const users: User[] = [];
    
    firestoreSnapshot.forEach(docSnap => {
      users.push({ ...docSnap.data(), uid: docSnap.id } as User);
    });
    
    // Update cache with Firestore results
    allUsersCache.users = users;
    allUsersCache.timestamp = Date.now();
    
    return users;
  } catch (error) {
    console.error('[UserService] Error refreshing users cache:', error);
    throw error;
  }
}

// Delete a user from Firestore
export async function deleteUser(uid: string): Promise<void> {
  try {
    // Delete user from Firestore
    const userRef = doc(firestore, 'users', uid);
    await deleteDoc(userRef);
    
    // Clear the user from cache
    delete userCache[uid];
    // Invalidate all users cache
    allUsersCache.timestamp = 0;
    
    console.log('[UserService] User deleted successfully:', uid);
  } catch (error) {
    console.error('[UserService] Error deleting user:', error);
    throw error;
  }
}

// Get users by userType
export async function getUsersByRole(role: string): Promise<User[]> {
  try {
    const usersCol = collection(firestore, 'users');
    const q = query(usersCol, where('userType', '==', role));
    const snapshot = await getDocs(q);
    const users: User[] = [];
    snapshot.forEach(docSnap => {
      users.push({ ...docSnap.data(), uid: docSnap.id } as User);
    });
    // For backward compatibility, also check 'role' field if needed:
    if (users.length === 0) {
      const qLegacy = query(usersCol, where('role', '==', role));
      const legacySnap = await getDocs(qLegacy);
      legacySnap.forEach(docSnap => {
        users.push({ ...docSnap.data(), uid: docSnap.id } as User);
      });
    }
    return users;
  } catch (error) {
    console.error('[UserService] Error getting users by role/userType:', error);
    throw error;
  }
}

// Get all players (users with userType 'player')
export async function getPlayerUsers(): Promise<User[]> {
  try {
    return await getUsersByRole('player');
  } catch (error) {
    console.error('[UserService] Error getting player users:', error);
    throw error;
  }
}

// Update user profile in Firestore
export async function updateUserProfile(uid: string, profileData: Partial<User>): Promise<void> {
  try {
    // Use Firestore for user updates
    const userRef = doc(firestore, 'users', uid);
    
    // Only update the fields that are provided
    await updateDoc(userRef, profileData);
  } catch (error) {
    console.error('[UserService] Error updating user profile:', error);
    throw error;
  }
}

// Additional helper functions for optimized Firestore operations

// Update user role
export async function updateUserRole(uid: string, role: string): Promise<void> {
  try {
    const userRef = ref(database, `users/${uid}`);
    
    // Update both role and userType for compatibility
    return await update(userRef, {
      role,
      userType: role
    });
  } catch (error) {
    console.error('Error updating user role:', error);
    throw error;
  }
}

// Mark user as registered with payment
export async function markUserAsRegistered(uid: string, registrationFee: number): Promise<void> {
  try {
    const userRef = ref(database, `users/${uid}`);
    const registrationData = {
      isRegistered: true,
      registrationFee,
      registrationDate: new Date().toISOString()
    };
    await update(userRef, registrationData);
  } catch (error) {
    console.error('Error marking user as registered:', error);
    throw error;
  }
}

// Get all registered users
export async function getRegisteredUsers(): Promise<User[]> {
  try {
    const usersRef = ref(database, 'users');
    const snapshot = await get(usersRef);
    
    if (snapshot.exists()) {
      const usersData = snapshot.val();
      const registeredUsers: User[] = [];
      
      // Filter users by isRegistered flag
      Object.keys(usersData).forEach(key => {
        const userData = usersData[key];
        if (userData.isRegistered === true) {
          registeredUsers.push({
            ...userData,
            uid: key
          });
        }
      });
      
      return registeredUsers;
    }
    
    return [];
  } catch (error) {
    console.error('Error getting registered users:', error);
    throw error;
  }
}

// Get total registration revenue
export async function getTotalRegistrationRevenue(): Promise<number> {
  try {
    const registeredUsers = await getRegisteredUsers();
    return registeredUsers.reduce((total, user) => {
      return total + (user.registrationFee || 0);
    }, 0);
  } catch (error) {
    console.error('Error calculating total registration revenue:', error);
    throw error;
  }
}

// Get all communities a player belongs to
export async function getPlayerCommunities(playerId: string): Promise<any[]> {
  try {
    // First get all communities
    const communitiesRef = ref(database, 'communities');
    const communitiesSnapshot = await get(communitiesRef);
    
    if (!communitiesSnapshot.exists()) {
      return [];
    }
    
    const communities = communitiesSnapshot.val();
    // For each community, check if the player is a member
    const playerCommunities = [];
    
    for (const communityId in communities) {
      const community = communities[communityId];
      const membersRef = ref(database, `communities/${communityId}/members`);
      const membersSnapshot = await get(membersRef);
      
      if (membersSnapshot.exists()) {
        const members = membersSnapshot.val();
        // Check if player is a member
        for (const memberId in members) {
          const member = members[memberId];
          if (member.userId === playerId) {
            // Player is a member of this community
            playerCommunities.push({
              ...community,
              id: communityId,
              memberRole: member.role
            });
            break; // Found the player in this community, no need to check other members
          }
        }
      }
    }
    
    return playerCommunities;
  } catch (error) {
    console.error('Error getting player communities:', error);
    throw error;
  }
}

// Get community leaders (admins) for a specific community using Firestore
export async function getCommunityLeaders(communityId: string): Promise<User[]> {
  try {
    // Get community from Firestore
    const communityDoc = doc(firestore, 'communities', communityId);
    const communitySnapshot = await getDoc(communityDoc);
    
    if (!communitySnapshot.exists()) {
      console.warn(`Community ${communityId} not found`);
      return [];
    }
    
    const community = communitySnapshot.data();
    const adminIds = community.adminIds || [];
    
    if (adminIds.length === 0) {
      return [];
    }
    
    // Get all admin users in a single batch using our optimized getUserById function
    const adminsPromises = adminIds.map((id: string) => getUserById(id));
    const adminsData = await Promise.all(adminsPromises);
    
    // Filter out any null values
    return adminsData.filter(admin => admin !== null) as User[];
  } catch (error) {
    console.error('[UserService] Error getting community leaders:', error);
    // Return empty array instead of throwing error for better UX
    return [];
  }
}

// Get players for a specific community using Firestore
export async function getCommunityPlayers(communityId: string): Promise<User[]> {
  try {
    // Get community from Firestore
    const communityDoc = doc(firestore, 'communities', communityId);
    const communitySnapshot = await getDoc(communityDoc);
    
    if (!communitySnapshot.exists()) {
      console.warn(`Community ${communityId} not found`);
      return [];
    }
    
    const community = communitySnapshot.data();
    const members = community.members || {};
    
    // Filter for player members
    const playerUserIds = Object.keys(members).filter(userId => 
      members[userId] === 'player'
    );
    
    if (playerUserIds.length === 0) {
      return [];
    }
    
    // Get all player users in parallel
    const playerPromises = playerUserIds.map(userId => getUserById(userId));
    const playerResults = await Promise.all(playerPromises);
    
    // Filter out null results (users that might have been deleted)
    return playerResults.filter((user): user is User => user !== null);
  } catch (error) {
    console.error(`Error getting players for community ${communityId}:`, error);
    return [];
  }
}

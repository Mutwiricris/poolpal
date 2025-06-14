import { collection, doc, getDoc, getDocs, setDoc, updateDoc, deleteDoc, query, where, orderBy, Timestamp, addDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { getDatabase, ref, get, set, update, remove, child, push } from 'firebase/database';
import { firestore, database } from './firebase';
import { getUserById } from './user-service';

export interface Community {
  id: string;
  name: string;
  location: string;
  description: string;
  adminIds: string[];
  createdAt: number;
  isActive: boolean;
  trophyCount: number;
  memberCount: number;
}

export interface CommunityFormData {
  name: string;
  location: string;
  description: string;
  adminIds: string[];
}

// Create a new community
export async function createCommunity(communityData: CommunityFormData): Promise<string> {
  try {
    const communitiesRef = collection(firestore, 'communities');
    
    // Create a new document with auto-generated ID
    const docRef = doc(communitiesRef);
    
    const newCommunity: Community = {
      id: docRef.id,
      ...communityData,
      createdAt: Date.now(),
      isActive: true,
      trophyCount: 0,
      memberCount: 0
    };
    
    await setDoc(docRef, newCommunity);
    return docRef.id;
  } catch (error) {
    console.error('Error creating community:', error);
    throw error;
  }
}

// Get a single community by ID
export async function getCommunityById(id: string): Promise<Community | null> {
  try {
    const communityRef = doc(firestore, 'communities', id);
    const snapshot = await getDoc(communityRef);
    
    if (snapshot.exists()) {
      return snapshot.data() as Community;
    }
    
    return null;
  } catch (error) {
    console.error('Error getting community:', error);
    throw error;
  }
}

// Get all communities
export async function getAllCommunities(): Promise<Community[]> {
  try {
    const communitiesRef = collection(firestore, 'communities');
    const snapshot = await getDocs(communitiesRef);
    
    if (!snapshot.empty) {
      return snapshot.docs.map(doc => doc.data() as Community);
    }
    
    return [];
  } catch (error) {
    console.error('Error getting all communities:', error);
    throw error;
  }
}

// Update a community
export async function updateCommunity(id: string, communityData: Partial<Community>): Promise<void> {
  try {
    const communityRef = doc(firestore, 'communities', id);
    await updateDoc(communityRef, communityData);
  } catch (error) {
    console.error('Error updating community:', error);
    throw error;
  }
}

// Delete a community
export async function deleteCommunity(id: string): Promise<void> {
  try {
    const communityRef = doc(firestore, 'communities', id);
    await deleteDoc(communityRef);
  } catch (error) {
    console.error('Error deleting community:', error);
    throw error;
  }
}

// Add a member to a community
export async function addCommunityMember(communityId: string, userId: string, userRole: string = 'player'): Promise<void> {
  try {
    // Verify that the user exists and is a player
    const user = await getUserById(userId);
    if (!user) {
      throw new Error('User not found');
    }
    
    // Validate that only players can be added to communities
    if (userRole === 'player' && user.userType !== 'player') {
      throw new Error('Only users with userType "player" can be added to communities');
    }

    // Add the member to the Firestore collection
    const memberRef = doc(firestore, `communities/${communityId}/members`, userId);
    await setDoc(memberRef, {
      userId,
      role: userRole,
      joinedAt: Date.now()
    });
    
    // Update member count
    const communityRef = doc(firestore, 'communities', communityId);
    const communityDoc = await getDoc(communityRef);
    
    if (communityDoc.exists()) {
      const communityData = communityDoc.data();
      await updateDoc(communityRef, {
        memberCount: (communityData.memberCount || 0) + 1
      });
    }
    
    console.log(`[CommunityService] Added user ${userId} as ${userRole} to community ${communityId}`);
  } catch (error) {
    console.error('Error adding community member:', error);
    throw error;
  }
}

// Remove a member from a community
export async function removeCommunityMember(communityId: string, userId: string): Promise<void> {
  try {
    // Remove from members subcollection
    const memberRef = doc(firestore, `communities/${communityId}/members`, userId);
    await deleteDoc(memberRef);
    
    // Update member count
    const communityRef = doc(firestore, 'communities', communityId);
    const community = await getCommunityById(communityId);
    if (community && community.memberCount > 0) {
      await updateDoc(communityRef, {
        memberCount: community.memberCount - 1
      });
    }
  } catch (error) {
    console.error('Error removing community member:', error);
    throw error;
  }
}

// Get all members of a community
export async function getCommunityMembers(communityId: string): Promise<any[]> {
  try {
    const membersRef = collection(firestore, `communities/${communityId}/members`);
    const snapshot = await getDocs(membersRef);
    
    if (!snapshot.empty) {
      return snapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id
      }));
    }
    
    return [];
  } catch (error) {
    console.error('Error getting community members:', error);
    throw error;
  }
}

// Add an admin to a community (max 2)
export async function addCommunityAdmin(communityId: string, userId: string): Promise<void> {
  try {
    const communityRef = doc(firestore, 'communities', communityId);
    const community = await getCommunityById(communityId);
    const adminIds = Array.isArray(community?.adminIds) ? community.adminIds : [];
    if (community && adminIds.length < 2) {
      await updateDoc(communityRef, {
        adminIds: arrayUnion(userId)
      });
    } else {
      throw new Error('Maximum number of admins (2) already reached');
    }
  } catch (error) {
    console.error('Error adding community admin:', error);
    throw error;
  }
}

// Remove an admin from a community
export async function removeCommunityAdmin(communityId: string, userId: string): Promise<void> {
  try {
    const communityRef = doc(firestore, 'communities', communityId);
    await updateDoc(communityRef, {
      adminIds: arrayRemove(userId)
    });
  } catch (error) {
    console.error('Error removing community admin:', error);
    throw error;
  }
}

// Increment trophy count for a community
export async function incrementCommunityTrophies(communityId: string, count: number = 1): Promise<void> {
  try {
    const communityRef = doc(firestore, 'communities', communityId);
    const community = await getCommunityById(communityId);
    
    if (community) {
      await updateDoc(communityRef, {
        trophyCount: community.trophyCount + count
      });
    }
  } catch (error) {
    console.error('Error incrementing community trophies:', error);
    throw error;
  }
}

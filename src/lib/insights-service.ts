import { collection, getDocs, query, where, orderBy, Timestamp } from 'firebase/firestore';
import { firestore } from './firebase';
import { User } from './user-service';
import { Tournament } from './tournament-service';
import { Product } from './product-service';
import { Order } from './order-service';

// Interface for monthly data points
export interface MonthlyDataPoint {
  name: string;
  value: number;
  month: number;
  year: number;
}

// Interface for category breakdown
export interface CategoryBreakdown {
  name: string;
  value: number;
}

// Interface for KPI metrics
export interface KpiMetric {
  name: string;
  value: number;
  change: number;
  changeType: 'positive' | 'negative' | 'neutral';
}

// Get all users with registration dates
export async function getUserRegistrationData(): Promise<MonthlyDataPoint[]> {
  try {
    const usersRef = collection(firestore, 'users');
    const snapshot = await getDocs(usersRef);
    
    if (snapshot.empty) {
      return [];
    }
    
    const users = snapshot.docs.map(doc => doc.data() as User);
    
    // Group users by month of registration
    const monthlyData: Record<string, MonthlyDataPoint> = {};
    
    users.forEach(user => {
      if (!user.createdAt) return;
      
      const date = new Date(typeof user.createdAt === 'number' ? user.createdAt : parseInt(user.createdAt as string));
      const month = date.getMonth();
      const year = date.getFullYear();
      const key = `${year}-${month}`;
      const monthName = new Date(year, month).toLocaleString('default', { month: 'short' });
      
      if (monthlyData[key]) {
        monthlyData[key].value += 1;
      } else {
        monthlyData[key] = {
          name: monthName,
          value: 1,
          month,
          year
        };
      }
    });
    
    // Convert to array and sort by date
    return Object.values(monthlyData).sort((a, b) => {
      if (a.year !== b.year) return a.year - b.year;
      return a.month - b.month;
    });
  } catch (error) {
    console.error('Error getting user registration data:', error);
    return [];
  }
}

// Get tournament data by month
export async function getTournamentData(): Promise<MonthlyDataPoint[]> {
  try {
    const tournamentsRef = collection(firestore, 'tournaments');
    const snapshot = await getDocs(tournamentsRef);
    
    if (snapshot.empty) {
      return [];
    }
    
    const tournaments = snapshot.docs.map(doc => doc.data() as Tournament);
    
    // Group tournaments by month of start date
    const monthlyData: Record<string, MonthlyDataPoint> = {};
    
    tournaments.forEach(tournament => {
      if (!tournament.startDate) return;
      
      const date = new Date(tournament.startDate);
      const month = date.getMonth();
      const year = date.getFullYear();
      const key = `${year}-${month}`;
      const monthName = new Date(year, month).toLocaleString('default', { month: 'short' });
      
      if (monthlyData[key]) {
        monthlyData[key].value += 1;
      } else {
        monthlyData[key] = {
          name: monthName,
          value: 1,
          month,
          year
        };
      }
    });
    
    // Convert to array and sort by date
    return Object.values(monthlyData).sort((a, b) => {
      if (a.year !== b.year) return a.year - b.year;
      return a.month - b.month;
    });
  } catch (error) {
    console.error('Error getting tournament data:', error);
    return [];
  }
}

// Get revenue data by month from orders
export async function getRevenueData(): Promise<{ 
  monthlyData: MonthlyDataPoint[], 
  totalRevenue: number 
}> {
  try {
    const ordersRef = collection(firestore, 'orders');
    const snapshot = await getDocs(ordersRef);
    
    if (snapshot.empty) {
      return { monthlyData: [], totalRevenue: 0 };
    }
    
    const orders = snapshot.docs.map(doc => doc.data() as Order);
    
    // Group orders by month
    const monthlyData: Record<string, MonthlyDataPoint> = {};
    let totalRevenue = 0;
    
    orders.forEach(order => {
      if (!order.createdAt) return;
      
      const date = new Date(typeof order.createdAt === 'number' ? order.createdAt : parseInt(order.createdAt as string));
      const month = date.getMonth();
      const year = date.getFullYear();
      const key = `${year}-${month}`;
      const monthName = new Date(year, month).toLocaleString('default', { month: 'short' });
      
      totalRevenue += order.total;
      
      if (monthlyData[key]) {
        monthlyData[key].value += order.total;
      } else {
        monthlyData[key] = {
          name: monthName,
          value: order.total,
          month,
          year
        };
      }
    });
    
    // Convert to array and sort by date
    const sortedData = Object.values(monthlyData).sort((a, b) => {
      if (a.year !== b.year) return a.year - b.year;
      return a.month - b.month;
    });
    
    return { 
      monthlyData: sortedData,
      totalRevenue
    };
  } catch (error) {
    console.error('Error getting revenue data:', error);
    return { monthlyData: [], totalRevenue: 0 };
  }
}

// Get product category breakdown
export async function getProductCategoryBreakdown(): Promise<CategoryBreakdown[]> {
  try {
    const productsRef = collection(firestore, 'products');
    const snapshot = await getDocs(productsRef);
    
    if (snapshot.empty) {
      return [];
    }
    
    const products = snapshot.docs.map(doc => doc.data() as Product);
    
    // Group products by category
    const categoryData: Record<string, number> = {};
    
    products.forEach(product => {
      if (!product.category) return;
      
      if (categoryData[product.category]) {
        categoryData[product.category] += 1;
      } else {
        categoryData[product.category] = 1;
      }
    });
    
    // Convert to array
    return Object.entries(categoryData).map(([name, value]) => ({
      name,
      value
    }));
  } catch (error) {
    console.error('Error getting product category breakdown:', error);
    return [];
  }
}

// Get tournament registration data
export async function getTournamentRegistrations(): Promise<{ 
  totalRegistrations: number,
  tournamentBreakdown: CategoryBreakdown[] 
}> {
  try {
    const tournamentsRef = collection(firestore, 'tournaments');
    const snapshot = await getDocs(tournamentsRef);
    
    if (snapshot.empty) {
      return { totalRegistrations: 0, tournamentBreakdown: [] };
    }
    
    const tournaments = snapshot.docs.map(doc => doc.data() as Tournament);
    
    let totalRegistrations = 0;
    const tournamentBreakdown: CategoryBreakdown[] = [];
    
    tournaments.forEach(tournament => {
      const registrations = tournament.registeredUsers?.length || 0;
      totalRegistrations += registrations;
      
      tournamentBreakdown.push({
        name: tournament.name,
        value: registrations
      });
    });
    
    // Sort by most registrations
    tournamentBreakdown.sort((a, b) => b.value - a.value);
    
    return {
      totalRegistrations,
      tournamentBreakdown
    };
  } catch (error) {
    console.error('Error getting tournament registrations:', error);
    return { totalRegistrations: 0, tournamentBreakdown: [] };
  }
}

// Get KPI metrics
export async function getKpiMetrics(): Promise<KpiMetric[]> {
  try {
    // Get data for calculations
    const { totalRevenue } = await getRevenueData();
    const { totalRegistrations } = await getTournamentRegistrations();
    
    const usersRef = collection(firestore, 'users');
    const userSnapshot = await getDocs(usersRef);
    const totalUsers = userSnapshot.size;
    
    const productsRef = collection(firestore, 'products');
    const productSnapshot = await getDocs(productsRef);
    const totalProducts = productSnapshot.size;
    
    // For change calculation, we'd normally compare to previous period
    // Here we're using placeholder values since we don't have historical data
    return [
      {
        name: 'Total Users',
        value: totalUsers,
        change: 15,
        changeType: 'positive'
      },
      {
        name: 'Total Revenue',
        value: totalRevenue,
        change: 12,
        changeType: 'positive'
      },
      {
        name: 'Tournament Registrations',
        value: totalRegistrations,
        change: 8,
        changeType: 'positive'
      },
      {
        name: 'Product Catalog',
        value: totalProducts,
        change: 5,
        changeType: 'positive'
      }
    ];
  } catch (error) {
    console.error('Error getting KPI metrics:', error);
    return [];
  }
}

// Get order status breakdown
export async function getOrderStatusBreakdown(): Promise<CategoryBreakdown[]> {
  try {
    const ordersRef = collection(firestore, 'orders');
    const snapshot = await getDocs(ordersRef);
    
    if (snapshot.empty) {
      return [];
    }
    
    const orders = snapshot.docs.map(doc => doc.data() as Order);
    
    // Group orders by status
    const statusData: Record<string, number> = {};
    
    orders.forEach(order => {
      if (!order.status) return;
      
      if (statusData[order.status]) {
        statusData[order.status] += 1;
      } else {
        statusData[order.status] = 1;
      }
    });
    
    // Convert to array
    return Object.entries(statusData).map(([name, value]) => ({
      name,
      value
    }));
  } catch (error) {
    console.error('Error getting order status breakdown:', error);
    return [];
  }
}

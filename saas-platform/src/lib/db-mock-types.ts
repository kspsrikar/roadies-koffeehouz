export interface MenuItem {
  id: string;
  name: string;
  price: number;
  category: 'coffee' | 'drinks' | 'pizza' | 'pasta' | 'sides' | 'dessert';
  description: string;
  popular?: boolean;
  inStock?: boolean;
  image?: string;
}

export interface OrderItem {
  menuItem: MenuItem;
  quantity: number;
}

export type OrderStatus = 'new' | 'accepted' | 'preparing' | 'ready' | 'served' | 'completed' | 'cancelled';

export interface Order {
  id: string;
  branchId: string;
  tableId?: string;
  tableNumber: string;
  items: OrderItem[];
  totalAmount: number;
  status: OrderStatus;
  paymentMethod: 'cash' | 'upi' | 'card' | 'split';
  paymentStatus: 'pending' | 'paid';
  createdAt: string;
}

export interface Table {
  id: string;
  branchId: string;
  tableNumber: string;
  status: 'available' | 'occupied' | 'reserved' | 'billing';
  capacity: number;
  posX: number;
  posY: number;
  floorSection: string;
}

export interface Customer {
  id: string;
  branchId: string;
  name: string;
  phone: string;
  email: string;
  loyaltyPoints: number;
}

export interface Reservation {
  id: string;
  branchId: string;
  customerName: string;
  phone: string;
  tableNumber: string;
  reservationTime: string;
  guestsCount: number;
  status: 'confirmed' | 'seated' | 'cancelled';
}

export interface StaffAttendance {
  id: string;
  branchId: string;
  staffName: string;
  role: string;
  clockIn: string;
  clockOut?: string;
  status: 'present' | 'late' | 'absent';
}

export interface Expense {
  id: string;
  branchId: string;
  category: 'inventory' | 'salaries' | 'rent' | 'utilities' | 'other';
  amount: number;
  description: string;
  createdAt: string;
}

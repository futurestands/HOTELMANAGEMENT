export type UserRole =
  | 'platform_admin'
  | 'owner'
  | 'administrator'
  | 'manager'
  | 'receptionist'
  | 'cashier'
  | 'storekeeper'
  | 'restaurant_staff'
  | 'hr';

export interface Hotel {
  id: string;
  name: string;
  legal_name?: string;
  currency: string;
  timezone: string;
  is_active: boolean;
  created_at: string;
}

export interface Profile {
  id: string;
  full_name?: string;
  phone?: string;
  created_at: string;
}

export interface HotelMembership {
  id: string;
  hotel_id: string;
  user_id: string;
  role: UserRole;
  is_active: boolean;
  created_at: string;
  hotel?: Hotel;
}

export interface RoomType {
  id: string;
  hotel_id: string;
  name: string;
  description?: string;
  base_rate: number;
  minimum_rate: number;
  is_active: boolean;
}

export interface Room {
  id: string;
  hotel_id: string;
  room_type_id?: string;
  room_number: string;
  floor?: string;
  status: 'available' | 'reserved' | 'occupied' | 'cleaning' | 'maintenance' | 'out_of_service';
  housekeeping_status?: 'clean' | 'dirty' | 'inspecting';
}

export interface Guest {
  id: string;
  hotel_id: string;
  full_name: string;
  email?: string;
  phone?: string;
  id_number?: string;
  created_at: string;
}

export interface Reservation {
  id: string;
  hotel_id: string;
  guest_id: string;
  room_id: string;
  check_in_date: string;
  check_out_date: string;
  adults: number;
  children: number;
  agreed_rate: number;
  status: 'confirmed' | 'checked_in' | 'checked_out' | 'cancelled';
  created_at: string;
  guest?: Guest;
  room?: Room;
}

export interface Payment {
  id: string;
  hotel_id: string;
  reservation_id?: string;
  amount: number;
  payment_method: 'cash' | 'mobile_money' | 'card' | 'bank';
  reference_number: string;
  created_at: string;
}

export interface StockItem {
  id: string;
  hotel_id: string;
  name: string;
  category: string;
  unit: string;
  quantity_in_stock: number;
  reorder_threshold: number;
  unit_cost: number;
}

// Role permission mapping helper
export function getModulesForRole(role: UserRole): string[] {
  switch (role) {
    case 'platform_admin':
    case 'owner':
    case 'administrator':
      return ['Reservations', 'Rooms', 'Cashier', 'Inventory', 'Restaurant', 'HR', 'Reports', 'Settings'];
    case 'manager':
      return ['Reservations', 'Rooms', 'Cashier', 'Inventory', 'Restaurant', 'HR', 'Reports'];
    case 'receptionist':
      return ['Reservations', 'Rooms', 'Cashier'];
    case 'cashier':
      return ['Cashier', 'Reservations'];
    case 'storekeeper':
      return ['Inventory'];
    case 'restaurant_staff':
      return ['Restaurant'];
    case 'hr':
      return ['HR'];
    default:
      return ['Reservations', 'Rooms'];
  }
}

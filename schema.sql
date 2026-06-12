-- Roadies Koffee Houz Enterprise Restaurant SaaS Database Schema
-- Run this in the Supabase SQL Editor

-- -------------------------------------------------------------
-- 1. Master Tables & Indexes
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS branches (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  address TEXT,
  phone TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Profiles (Linked to Auth/Staff Profiles)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY,
  branch_id UUID REFERENCES branches(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'waiter', -- 'admin' | 'manager' | 'waiter' | 'chef' | 'cashier'
  email TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- -------------------------------------------------------------
-- 2. CRM & Loyalty Tables
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS customers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  branch_id UUID REFERENCES branches(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  loyalty_points INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  CONSTRAINT unique_customer_phone_per_branch UNIQUE (branch_id, phone)
);

-- -------------------------------------------------------------
-- 3. Visual Table & Floor Plan
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS tables (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  branch_id UUID REFERENCES branches(id) ON DELETE CASCADE,
  table_number TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'available', -- 'available' | 'occupied' | 'reserved' | 'billing'
  capacity INTEGER NOT NULL DEFAULT 4,
  assigned_waiter_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  pos_x INTEGER NOT NULL DEFAULT 0,
  pos_y INTEGER NOT NULL DEFAULT 0,
  floor_section TEXT DEFAULT 'Main Dining',
  merged_with UUID REFERENCES tables(id) ON DELETE SET NULL,
  CONSTRAINT unique_table_num_per_branch UNIQUE (branch_id, table_number)
);

-- -------------------------------------------------------------
-- 4. Reservations Layout
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS reservations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  branch_id UUID REFERENCES branches(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
  table_id UUID REFERENCES tables(id) ON DELETE SET NULL,
  reservation_time TIMESTAMP WITH TIME ZONE NOT NULL,
  guests_count INTEGER NOT NULL CHECK (guests_count > 0),
  status TEXT NOT NULL DEFAULT 'confirmed', -- 'confirmed' | 'seated' | 'cancelled'
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- -------------------------------------------------------------
-- 5. Menu & Recipe Automation
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS menu_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  branch_id UUID REFERENCES branches(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  price NUMERIC(10, 2) NOT NULL,
  category TEXT NOT NULL,
  description TEXT,
  in_stock BOOLEAN DEFAULT true,
  image_url TEXT,
  popular BOOLEAN DEFAULT false,
  ai_recommended BOOLEAN DEFAULT false,
  upsell_item_id TEXT REFERENCES menu_items(id) ON DELETE SET NULL
);

-- Raw Materials (Stock inventory tracking)
CREATE TABLE IF NOT EXISTS raw_materials (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  branch_id UUID REFERENCES branches(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  stock_quantity NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
  unit TEXT NOT NULL, -- 'kg', 'liters', 'units'
  min_alert_threshold NUMERIC(10, 2) NOT NULL DEFAULT 5.00,
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  CONSTRAINT unique_material_name_per_branch UNIQUE (branch_id, name)
);

-- Recipes linking menu items to materials
CREATE TABLE IF NOT EXISTS recipes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  branch_id UUID REFERENCES branches(id) ON DELETE CASCADE,
  menu_item_id TEXT REFERENCES menu_items(id) ON DELETE CASCADE,
  material_id UUID REFERENCES raw_materials(id) ON DELETE CASCADE,
  quantity_required NUMERIC(10, 2) NOT NULL, -- Deductible stock quantity
  CONSTRAINT unique_recipe_link_per_branch UNIQUE (menu_item_id, material_id)
);

-- -------------------------------------------------------------
-- 6. Orders & POS Pipeline
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  branch_id UUID REFERENCES branches(id) ON DELETE CASCADE,
  table_id UUID REFERENCES tables(id) ON DELETE SET NULL,
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'new', -- 'new' | 'accepted' | 'preparing' | 'ready' | 'served' | 'completed' | 'cancelled'
  total_amount NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
  gst_amount NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
  discount_amount NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
  promo_code TEXT,
  payment_method TEXT DEFAULT 'cash', -- 'cash' | 'card' | 'upi' | 'split'
  payment_status TEXT NOT NULL DEFAULT 'pending', -- 'pending' | 'paid'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  completed_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE IF NOT EXISTS order_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id TEXT REFERENCES orders(id) ON DELETE CASCADE,
  menu_item_id TEXT REFERENCES menu_items(id) ON DELETE SET NULL,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  unit_price NUMERIC(10, 2) NOT NULL,
  notes TEXT
);

-- -------------------------------------------------------------
-- 7. Operational Logging (Attendance & Expenses)
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS attendance (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  branch_id UUID REFERENCES branches(id) ON DELETE CASCADE,
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  clock_in TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  clock_out TIMESTAMP WITH TIME ZONE,
  status TEXT NOT NULL DEFAULT 'present' -- 'present' | 'late' | 'absent'
);

CREATE TABLE IF NOT EXISTS expenses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  branch_id UUID REFERENCES branches(id) ON DELETE CASCADE,
  category TEXT NOT NULL, -- 'inventory' | 'salaries' | 'rent' | 'utilities' | 'other'
  amount NUMERIC(10, 2) NOT NULL,
  description TEXT,
  logged_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- -------------------------------------------------------------
-- 8. Auditing & Notification logs
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS activity_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  branch_id UUID REFERENCES branches(id) ON DELETE CASCADE,
  profile_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  action_type TEXT NOT NULL, -- 'order_placed', 'stock_deducted', 'table_merged', etc.
  description TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  branch_id UUID REFERENCES branches(id) ON DELETE CASCADE,
  target_role TEXT NOT NULL, -- 'waiter' | 'chef' | 'manager' | 'admin'
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- -------------------------------------------------------------
-- 9. Security Policies
-- -------------------------------------------------------------
ALTER TABLE branches ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE tables ENABLE ROW LEVEL SECURITY;
ALTER TABLE reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE raw_materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public CRUD" ON branches FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public CRUD" ON profiles FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public CRUD" ON customers FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public CRUD" ON tables FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public CRUD" ON reservations FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public CRUD" ON menu_items FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public CRUD" ON raw_materials FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public CRUD" ON recipes FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public CRUD" ON orders FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public CRUD" ON order_items FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public CRUD" ON attendance FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public CRUD" ON expenses FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public CRUD" ON activity_logs FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public CRUD" ON notifications FOR ALL USING (true) WITH CHECK (true);

-- -------------------------------------------------------------
-- 10. Realtime Broadcasting Configuration
-- -------------------------------------------------------------
DROP PUBLICATION IF EXISTS supabase_realtime;
CREATE PUBLICATION supabase_realtime;
ALTER PUBLICATION supabase_realtime ADD TABLE 
  tables, menu_items, orders, order_items, 
  raw_materials, recipes, attendance, 
  expenses, notifications, reservations;

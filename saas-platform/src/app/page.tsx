'use client';

import React, { useState, useEffect } from 'react';
import { Table, Order, MenuItem, Customer, Reservation, StaffAttendance, Expense } from '../lib/db-mock-types';
import { getAiUpsellSuggestions, getDemandForecast } from '../lib/ai-recommender';
import { VisualFloorPlan } from '../components/visual-floor-plan';
import { AnalyticsCharts } from '../components/analytics-charts';
import { CommandPalette } from '../components/command-palette';
import { 
  Briefcase, Coffee, CookingPot, DollarSign, Users, Award, 
  Settings, Clock, Bell, UserCheck, ShieldAlert, Sparkles,
  ChevronRight, Check, CheckCircle2, ChevronDown, Download, BarChart2,
  Trash2, Plus, QrCode, Search, RefreshCw, Scissors, Percent
} from 'lucide-react';

// Seed Mock Data with branch_id support
const MOCK_BRANCHES = [
  { id: 'b1', name: 'Roadies Koffee Houz - Connaught Place' },
  { id: 'b2', name: 'Roadies Koffee Houz - Cyber City' }
];

const INITIAL_TABLES: Table[] = [
  { id: 't1', branchId: 'b1', tableNumber: '1', status: 'available', capacity: 2, posX: 5, posY: 10, floorSection: 'Main Dining' },
  { id: 't2', branchId: 'b1', tableNumber: '2', status: 'occupied', capacity: 4, posX: 35, posY: 10, floorSection: 'Main Dining' },
  { id: 't3', branchId: 'b1', tableNumber: '3', status: 'reserved', capacity: 6, posX: 65, posY: 10, floorSection: 'Main Dining' },
  { id: 't4', branchId: 'b1', tableNumber: '4', status: 'available', capacity: 4, posX: 5, posY: 50, floorSection: 'Main Dining' },
  { id: 't5', branchId: 'b1', tableNumber: '5', status: 'billing', capacity: 4, posX: 35, posY: 50, floorSection: 'Main Dining' },
  { id: 't6', branchId: 'b1', tableNumber: '6', status: 'available', capacity: 8, posX: 65, posY: 50, floorSection: 'Main Dining' },
  { id: 't7', branchId: 'b1', tableNumber: '10', status: 'available', capacity: 4, posX: 20, posY: 30, floorSection: 'Terrace Cafe' },
  { id: 't8', branchId: 'b1', tableNumber: '11', status: 'occupied', capacity: 2, posX: 50, posY: 30, floorSection: 'Terrace Cafe' }
];

const MOCK_MENU: MenuItem[] = [
  { id: 'm1', name: 'Mocha Latte', price: 260, category: 'coffee', description: 'Espresso with rich chocolate sauce', popular: true, inStock: true },
  { id: 'm2', name: 'Cold Coffee', price: 220, category: 'drinks', description: 'Signature creamy blended cold coffee', popular: true, inStock: true },
  { id: 'm3', name: 'Anti Veg Pizza', price: 550, category: 'pizza', description: 'Loaded with pepperoni and smoked chicken', popular: true, inStock: true },
  { id: 'm4', name: 'Baked Calzone', price: 340, category: 'sides', description: 'Golden folded calzone stuffed with cheese', popular: true, inStock: true },
  { id: 'm5', name: 'Chicken Carbonara', price: 480, category: 'pasta', description: 'Fettuccine in rich egg yolk carbonara', inStock: true },
  { id: 'm6', name: 'Pancake Stack', price: 280, category: 'dessert', description: 'Fluffy buttermilk pancakes', inStock: true }
];

const INITIAL_ORDERS: Order[] = [
  { id: 'ORD-A9F7S', branchId: 'b1', tableNumber: '2', items: [{ menuItem: MOCK_MENU[0], quantity: 2 }, { menuItem: MOCK_MENU[3], quantity: 1 }], totalAmount: 903, status: 'preparing', paymentMethod: 'cash', paymentStatus: 'pending', createdAt: new Date(Date.now() - 15 * 60000).toISOString() },
  { id: 'ORD-H3K9W', branchId: 'b1', tableNumber: '5', items: [{ menuItem: MOCK_MENU[1], quantity: 3 }, { menuItem: MOCK_MENU[2], quantity: 1 }], totalAmount: 1270, status: 'ready', paymentMethod: 'upi', paymentStatus: 'pending', createdAt: new Date(Date.now() - 25 * 60000).toISOString() }
];

const INITIAL_CRM: Customer[] = [
  { id: 'c1', branchId: 'b1', name: 'Rahul Sharma', phone: '9876543210', email: 'rahul@gmail.com', loyaltyPoints: 240 },
  { id: 'c2', branchId: 'b1', name: 'Priya Patel', phone: '9123456789', email: 'priya@gmail.com', loyaltyPoints: 480 }
];

const INITIAL_RESERVATIONS: Reservation[] = [
  { id: 'r1', branchId: 'b1', customerName: 'Aman Verma', phone: '9898989898', tableNumber: '3', reservationTime: '2026-06-12T20:00:00.000Z', guestsCount: 6, status: 'confirmed' }
];

const INITIAL_ATTENDANCE: StaffAttendance[] = [
  { id: 'a1', branchId: 'b1', staffName: 'Karan Singh', role: 'waiter', clockIn: '2026-06-12T09:00:00.000Z', status: 'present' },
  { id: 'a2', branchId: 'b1', staffName: 'Chef Sanjay', role: 'chef', clockIn: '2026-06-12T09:15:00.000Z', status: 'late' }
];

export default function SaaSWorkspace() {
  // SaaS Config States
  const [selectedBranch, setSelectedBranch] = useState(MOCK_BRANCHES[0]);
  const [activeRole, setActiveRole] = useState<'admin' | 'manager' | 'waiter' | 'chef' | 'cashier'>('admin');
  
  // App States
  const [tables, setTables] = useState<Table[]>(INITIAL_TABLES);
  const [orders, setOrders] = useState<Order[]>(INITIAL_ORDERS);
  const [crm, setCrm] = useState<Customer[]>(INITIAL_CRM);
  const [reservations, setReservations] = useState<Reservation[]>(INITIAL_RESERVATIONS);
  const [attendance, setAttendance] = useState<StaffAttendance[]>(INITIAL_ATTENDANCE);
  
  // Local Notifications & Logging
  const [notifications, setNotifications] = useState<Array<{ id: string; title: string; message: string; type: string }>>([
    { id: 'n1', title: 'Low Stock Alert', message: 'Cold Coffee ingredient levels are below 15%', type: 'danger' },
    { id: 'n2', title: 'Table 5 Requested Bill', message: 'Waiter assistance requested at Table 5', type: 'info' }
  ]);
  const [logs, setLogs] = useState<string[]>(['SaaS Platform Initialized', 'Branch Connaught Place active']);

  // POS split bill and loyalty state
  const [posSelectedTable, setPosSelectedTable] = useState<Table | null>(null);
  const [discountCode, setDiscountCode] = useState('');
  const [splitCount, setSplitCount] = useState(1);
  const [promoDiscount, setPromoDiscount] = useState(0);

  // Quick Order customer menu tracker
  const [customerCart, setCustomerCart] = useState<Array<{ menuItem: MenuItem; quantity: number }>>([]);
  const [selectedCustomerTable, setSelectedCustomerTable] = useState('1');

  // Load PWA Service Worker on Mount
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js')
        .then(() => console.log('SaaS PWA Service Worker Registered'))
        .catch(err => console.warn('PWA Worker Registration failed:', err));
    }
  }, []);

  // UI state for navigation
  const handleCommandPaletteNavigation = (route: string) => {
    addLog(`Navigating to route: ${route}`);
  };

  const handleCommandPaletteTable = (tableNum: string) => {
    addLog(`Quick Table Action triggered for Table ${tableNum}`);
  };

  const addLog = (message: string) => {
    setLogs((prev) => [`[${new Date().toLocaleTimeString()}] ${message}`, ...prev.slice(0, 10)]);
  };

  // 1. Table Merging Action
  const handleTableMerge = (tableId1: string, tableId2: string) => {
    setTables(prev => prev.map(t => {
      if (t.id === tableId2) {
        addLog(`Merged Table ${t.tableNumber} with another table`);
        return { ...t, status: 'occupied' };
      }
      return t;
    }));
  };

  // 2. Clock In/Out
  const toggleAttendance = (staffName: string) => {
    setAttendance(prev => prev.map(a => {
      if (a.staffName === staffName) {
        const isClockedOut = !!a.clockOut;
        addLog(`${staffName} clocked ${isClockedOut ? 'in' : 'out'}`);
        return { 
          ...a, 
          clockOut: isClockedOut ? undefined : new Date().toISOString() 
        };
      }
      return a;
    }));
  };

  // 3. AI recommendation trigger
  const demandForecast = getDemandForecast();
  const upsellRecommendations = getAiUpsellSuggestions(
    customerCart, 
    MOCK_MENU
  );

  return (
    <div className="min-h-screen bg-[#09090b] text-[#f4f4f5] flex flex-col font-sans antialiased selection:bg-orange-600/30 selection:text-orange-500">
      
      {/* SaaS Global Header */}
      <header className="border-b border-zinc-800 bg-zinc-950/90 backdrop-blur-md sticky top-0 z-40 px-6 py-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        
        {/* Title */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-tr from-orange-600 to-amber-500 rounded-xl flex items-center justify-center font-black text-xl text-white shadow-lg shadow-orange-600/20">
            RK
          </div>
          <div>
            <h1 className="text-lg font-black tracking-tight text-white flex items-center gap-2">
              ROADIES KOFFEE HOUZ <span className="text-[10px] bg-orange-600/10 border border-orange-500/25 px-2 py-0.5 rounded text-orange-500 font-bold tracking-widest">ENTERPRISE SaaS</span>
            </h1>
            <p className="text-xs text-zinc-500 font-semibold uppercase tracking-wider">Multi-Branch Management Suite</p>
          </div>
        </div>

        {/* Global Selectors */}
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {/* Branch Switcher */}
          <div className="flex items-center gap-1.5 bg-zinc-900 border border-zinc-850 px-3 py-1.5 rounded-xl">
            <span className="text-[10px] text-zinc-500 font-bold uppercase">Branch:</span>
            <select 
              value={selectedBranch.id} 
              onChange={(e) => {
                const br = MOCK_BRANCHES.find(b => b.id === e.target.value);
                if (br) {
                  setSelectedBranch(br);
                  addLog(`Switched branch view to ${br.name}`);
                }
              }}
              className="bg-transparent text-xs text-zinc-300 font-bold border-none outline-none focus:ring-0 cursor-pointer"
            >
              {MOCK_BRANCHES.map(b => (
                <option key={b.id} value={b.id} className="bg-zinc-900">{b.name}</option>
              ))}
            </select>
          </div>

          {/* Role Switcher */}
          <div className="flex items-center gap-1.5 bg-zinc-900 border border-zinc-850 px-3 py-1.5 rounded-xl">
            <span className="text-[10px] text-zinc-500 font-bold uppercase">Role:</span>
            <select 
              value={activeRole} 
              onChange={(e) => {
                const role = e.target.value as any;
                setActiveRole(role);
                addLog(`Switched operational view to ${role.toUpperCase()}`);
              }}
              className="bg-transparent text-xs text-zinc-300 font-bold border-none outline-none focus:ring-0 cursor-pointer"
            >
              <option value="admin" className="bg-zinc-900">Admin Analytics</option>
              <option value="manager" className="bg-zinc-900">Manager Dashboard</option>
              <option value="waiter" className="bg-zinc-900">Waiter Roster</option>
              <option value="chef" className="bg-zinc-900">KDS Cooking Kitchen</option>
              <option value="cashier" className="bg-zinc-900">POS Cashier billing</option>
            </select>
          </div>
        </div>
      </header>

      {/* Global Command Palette Info bar */}
      <div className="bg-zinc-900/40 border-b border-zinc-900 px-6 py-2 flex justify-between items-center text-xs text-zinc-500">
        <span className="flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-orange-500 animate-pulse" />
          Tip: Press <kbd className="bg-zinc-800 text-zinc-300 px-1 py-0.5 rounded font-mono text-[10px]">Ctrl + K</kbd> to toggle global Search Command Palette
        </span>
        <span className="font-semibold text-zinc-400">{selectedBranch.name}</span>
      </div>

      {/* Main Content Workspace */}
      <main className="flex-1 p-6 grid grid-cols-1 xl:grid-cols-4 gap-6">
        
        {/* Core Operational Panels (3 Columns) */}
        <div className="xl:col-span-3 flex flex-col gap-6">
          
          {/* Admin Analytics View */}
          {activeRole === 'admin' && (
            <div className="flex flex-col gap-6">
              <AnalyticsCharts />
              
              {/* Branch Revenue Metrics Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="glass-panel p-5 border border-zinc-800 rounded-2xl bg-zinc-900/20 flex flex-col justify-between">
                  <span className="text-xs text-zinc-400 font-semibold tracking-wider uppercase">Active Loyalty Members</span>
                  <div className="flex justify-between items-end mt-4">
                    <span className="text-3xl font-black text-white">{crm.length} Customers</span>
                    <span className="text-[10px] text-orange-400 font-bold bg-orange-600/10 border border-orange-500/30 px-2 py-0.5 rounded">CRM active</span>
                  </div>
                </div>
                <div className="glass-panel p-5 border border-zinc-800 rounded-2xl bg-zinc-900/20 flex flex-col justify-between">
                  <span className="text-xs text-zinc-400 font-semibold tracking-wider uppercase">Confirmed Reservations</span>
                  <div className="flex justify-between items-end mt-4">
                    <span className="text-3xl font-black text-white">{reservations.length} Bookings</span>
                    <span className="text-[10px] text-amber-400 font-bold bg-amber-600/10 border border-amber-500/30 px-2 py-0.5 rounded">Tables allocated</span>
                  </div>
                </div>
                <div className="glass-panel p-5 border border-zinc-800 rounded-2xl bg-zinc-900/20 flex flex-col justify-between">
                  <span className="text-xs text-zinc-400 font-semibold tracking-wider uppercase">Total Today Orders</span>
                  <div className="flex justify-between items-end mt-4">
                    <span className="text-3xl font-black text-white">{orders.length} tickets</span>
                    <span className="text-[10px] text-emerald-400 font-bold bg-emerald-600/10 border border-emerald-500/30 px-2 py-0.5 rounded">Live syncing</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Waiter Roster View (Floor Plan & table controls) */}
          {activeRole === 'waiter' && (
            <div className="flex flex-col gap-6">
              <VisualFloorPlan 
                tables={tables} 
                onTableClick={(table) => {
                  addLog(`Table ${table.tableNumber} selected.`);
                }} 
                onTableMerge={handleTableMerge} 
              />
              
              {/* Quick Reservation Log */}
              <div className="glass-panel p-6 border border-zinc-850 rounded-2xl bg-zinc-900/30">
                <h3 className="text-md font-bold text-white mb-4 flex items-center gap-2">
                  <UserCheck className="w-5 h-5 text-orange-500" /> Active Reservations
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {reservations.map(res => (
                    <div key={res.id} className="p-4 rounded-xl border border-zinc-800/80 bg-zinc-950/50 flex justify-between items-center">
                      <div>
                        <span className="text-sm font-bold text-white block">{res.customerName}</span>
                        <span className="text-xs text-zinc-500">{res.guestsCount} guests • Table {res.tableNumber}</span>
                      </div>
                      <span className="text-[10px] text-amber-500 bg-amber-500/10 border border-amber-500/30 px-2.5 py-1 rounded-full font-bold uppercase tracking-wider">
                        {res.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* KDS Chef Dashboard */}
          {activeRole === 'chef' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* New Tickets Column */}
              <div className="glass-panel p-5 border border-zinc-800 rounded-2xl bg-zinc-950/40">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-sm font-extrabold text-white tracking-wide uppercase flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-rose-500 animate-ping"></span> New Orders
                  </h3>
                  <span className="text-xs text-zinc-500 font-bold">{orders.filter(o => o.status === 'new').length}</span>
                </div>
                <div className="flex flex-col gap-4">
                  {orders.filter(o => o.status === 'new').map(order => (
                    <div key={order.id} className="p-4 rounded-xl border border-zinc-850 bg-zinc-900/60">
                      <div className="flex justify-between text-xs font-bold text-white mb-3">
                        <span>Table {order.tableNumber}</span>
                        <span className="text-orange-500">{order.id}</span>
                      </div>
                      <div className="space-y-1.5 border-t border-zinc-850 pt-2.5 mb-3">
                        {order.items.map((it, idx) => (
                          <div key={idx} className="flex justify-between text-xs text-zinc-300">
                            <span>{it.quantity}x {it.menuItem.name}</span>
                          </div>
                        ))}
                      </div>
                      <button 
                        onClick={() => {
                          setOrders(prev => prev.map(o => o.id === order.id ? { ...o, status: 'preparing' } : o));
                          addLog(`Chef started preparing order ${order.id}`);
                        }}
                        className="w-full py-1.5 bg-zinc-800 hover:bg-orange-600 text-xs font-bold text-white rounded-lg transition-all"
                      >
                        Start Cook
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Cooking Queue Column */}
              <div className="glass-panel p-5 border border-zinc-800 rounded-2xl bg-zinc-950/40">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-sm font-extrabold text-white tracking-wide uppercase flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-orange-500"></span> Preparing
                  </h3>
                  <span className="text-xs text-zinc-500 font-bold">{orders.filter(o => o.status === 'preparing').length}</span>
                </div>
                <div className="flex flex-col gap-4">
                  {orders.filter(o => o.status === 'preparing').map(order => (
                    <div key={order.id} className="p-4 rounded-xl border border-zinc-850 bg-zinc-900/60">
                      <div className="flex justify-between text-xs font-bold text-white mb-3">
                        <span>Table {order.tableNumber}</span>
                        <span className="text-orange-500">{order.id}</span>
                      </div>
                      <div className="space-y-1.5 border-t border-zinc-850 pt-2.5 mb-3">
                        {order.items.map((it, idx) => (
                          <div key={idx} className="flex justify-between text-xs text-zinc-300">
                            <span>{it.quantity}x {it.menuItem.name}</span>
                          </div>
                        ))}
                      </div>
                      <button 
                        onClick={() => {
                          setOrders(prev => prev.map(o => o.id === order.id ? { ...o, status: 'ready' } : o));
                          addLog(`Chef marked order ${order.id} as READY`);
                        }}
                        className="w-full py-1.5 bg-zinc-800 hover:bg-emerald-600 text-xs font-bold text-white rounded-lg transition-all"
                      >
                        Mark Ready
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Ready Column */}
              <div className="glass-panel p-5 border border-zinc-800 rounded-2xl bg-zinc-950/40">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-sm font-extrabold text-white tracking-wide uppercase flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-emerald-500"></span> Ready
                  </h3>
                  <span className="text-xs text-zinc-500 font-bold">{orders.filter(o => o.status === 'ready').length}</span>
                </div>
                <div className="flex flex-col gap-4">
                  {orders.filter(o => o.status === 'ready').map(order => (
                    <div key={order.id} className="p-4 rounded-xl border border-zinc-850 bg-zinc-900/60">
                      <div className="flex justify-between text-xs font-bold text-white mb-3">
                        <span>Table {order.tableNumber}</span>
                        <span className="text-orange-500">{order.id}</span>
                      </div>
                      <div className="space-y-1.5 border-t border-zinc-850 pt-2.5 mb-3">
                        {order.items.map((it, idx) => (
                          <div key={idx} className="flex justify-between text-xs text-zinc-300">
                            <span>{it.quantity}x {it.menuItem.name}</span>
                          </div>
                        ))}
                      </div>
                      <button 
                        onClick={() => {
                          setOrders(prev => prev.map(o => o.id === order.id ? { ...o, status: 'served' } : o));
                          addLog(`Waiter served order ${order.id} to Table ${order.tableNumber}`);
                        }}
                        className="w-full py-1.5 bg-emerald-600 text-xs font-bold text-white rounded-lg cursor-default"
                      >
                        Serve (Pending Pick-up)
                      </button>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          )}

          {/* POS Cashier Desk */}
          {activeRole === 'cashier' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Table Selector */}
              <div className="glass-panel p-5 border border-zinc-800 rounded-2xl bg-zinc-950/40 lg:col-span-1">
                <h3 className="text-sm font-extrabold text-white mb-4 uppercase">Select Active Table</h3>
                <div className="grid grid-cols-2 gap-3">
                  {tables.filter(t => t.status === 'occupied' || t.status === 'billing').map(table => (
                    <button
                      key={table.id}
                      onClick={() => setPosSelectedTable(table)}
                      className={`p-4 rounded-xl border text-center font-bold text-lg transition-all ${
                        posSelectedTable?.id === table.id
                          ? 'bg-orange-600 border-orange-500 text-white shadow-lg shadow-orange-600/15'
                          : 'bg-zinc-900 border-zinc-850 text-zinc-300 hover:text-white'
                      }`}
                    >
                      Table {table.tableNumber}
                      <span className="block text-[10px] font-medium text-zinc-500 uppercase tracking-wide mt-1">
                        {table.status}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Billing Checkout panel */}
              <div className="glass-panel p-5 border border-zinc-800 rounded-2xl bg-zinc-950/40 lg:col-span-2">
                {posSelectedTable ? (
                  <div>
                    <h3 className="text-md font-bold text-white mb-4 flex items-center gap-2">
                      <DollarSign className="w-5 h-5 text-orange-500" /> Checkout & Invoice Generation: Table {posSelectedTable.tableNumber}
                    </h3>
                    
                    {/* Invoice math details */}
                    <div className="border border-zinc-850 rounded-xl p-4 bg-zinc-900/20 mb-4 text-sm">
                      <div className="flex justify-between py-1.5 border-b border-zinc-900 text-zinc-400">
                        <span>GST (5%)</span>
                        <span>Auto calculated</span>
                      </div>
                      <div className="flex justify-between py-1.5 border-b border-zinc-900 text-zinc-400">
                        <span>Split Bill parts</span>
                        <div className="flex items-center gap-2">
                          <button onClick={() => setSplitCount(Math.max(1, splitCount - 1))} className="px-1.5 bg-zinc-850 text-white rounded">-</button>
                          <span className="font-bold">{splitCount}</span>
                          <button onClick={() => setSplitCount(splitCount + 1)} className="px-1.5 bg-zinc-850 text-white rounded">+</button>
                        </div>
                      </div>
                      <div className="flex justify-between py-2 mt-2 font-bold text-white text-md">
                        <span>Grand Total (per split)</span>
                        <span>Rs {(1200 / splitCount).toFixed(0)}</span>
                      </div>
                    </div>

                    {/* Promo Code Input */}
                    <div className="flex gap-2 mb-4">
                      <input 
                        type="text" 
                        placeholder="Apply Promo Code (e.g. COFFEE10)"
                        value={discountCode}
                        onChange={(e) => setDiscountCode(e.target.value)}
                        className="flex-1 bg-zinc-900 border border-zinc-800 rounded-xl text-xs px-3 py-2 text-white outline-none focus:border-orange-500"
                      />
                      <button 
                        onClick={() => {
                          if (discountCode.toUpperCase() === 'COFFEE10') {
                            setPromoDiscount(100);
                            addLog("Promo code applied successfully: Rs 100 off.");
                          } else {
                            alert("Invalid code");
                          }
                        }}
                        className="px-4 bg-zinc-850 border border-zinc-800 hover:bg-orange-600 hover:border-orange-500 text-xs text-white font-bold rounded-xl transition-all"
                      >
                        Apply
                      </button>
                    </div>

                    {/* Invoice Actions */}
                    <div className="flex gap-3">
                      <button 
                        onClick={() => {
                          // Complete Table billing
                          setTables(prev => prev.map(t => t.id === posSelectedTable.id ? { ...t, status: 'available' } : t));
                          setPosSelectedTable(null);
                          addLog(`Billing completed for Table ${posSelectedTable.tableNumber}. Invoice generated.`);
                        }}
                        className="flex-1 py-2.5 bg-orange-600 hover:bg-orange-700 text-xs font-bold text-white rounded-xl shadow-lg shadow-orange-600/10 transition-all flex items-center justify-center gap-1.5"
                      >
                        <Check className="w-4 h-4" /> Print & Settle Bill
                      </button>
                      <button 
                        onClick={() => window.print()}
                        className="py-2.5 px-4 bg-zinc-850 hover:bg-zinc-800 text-xs font-bold text-white rounded-xl border border-zinc-800 transition-all flex items-center justify-center gap-1.5"
                      >
                        <Download className="w-4 h-4" /> Download PDF
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12 text-zinc-500 text-sm">
                    Select an active dining table requesting billing from the sidebar to checkout.
                  </div>
                )}
              </div>

            </div>
          )}

          {/* Manager Operations Panel (Inventory & Attendance) */}
          {activeRole === 'manager' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* Raw Materials Roster */}
              <div className="glass-panel p-5 border border-zinc-800 rounded-2xl bg-zinc-950/40">
                <h3 className="text-sm font-extrabold text-white mb-4 uppercase">Raw Materials (Inventory Stock)</h3>
                <div className="space-y-3">
                  <div className="p-3 bg-zinc-900/30 border border-zinc-850 rounded-xl flex justify-between items-center">
                    <div>
                      <span className="text-sm font-bold text-white block">Coffee Beans (Roast)</span>
                      <span className="text-xs text-zinc-500">Stock: 14.5 kg • Alert threshold: 5.0 kg</span>
                    </div>
                    <span className="text-xs text-emerald-400 font-bold bg-emerald-600/10 border border-emerald-500/20 px-2 py-0.5 rounded">Good</span>
                  </div>
                  <div className="p-3 bg-zinc-900/30 border border-zinc-850 rounded-xl flex justify-between items-center">
                    <div>
                      <span className="text-sm font-bold text-white block">Liquid Milk (Full Cream)</span>
                      <span className="text-xs text-zinc-500">Stock: 4.2 Liters • Alert threshold: 8.0 Liters</span>
                    </div>
                    <span className="text-xs text-rose-400 font-bold bg-rose-600/10 border border-rose-500/20 px-2 py-0.5 rounded animate-pulse">Low Stock</span>
                  </div>
                </div>
              </div>

              {/* Staff Roster Attendance log */}
              <div className="glass-panel p-5 border border-zinc-800 rounded-2xl bg-zinc-950/40">
                <h3 className="text-sm font-extrabold text-white mb-4 uppercase">Staff Clocking Log</h3>
                <div className="space-y-3">
                  {attendance.map(a => (
                    <div key={a.id} className="p-3 bg-zinc-900/30 border border-zinc-850 rounded-xl flex justify-between items-center">
                      <div>
                        <span className="text-sm font-bold text-white block">{a.staffName}</span>
                        <span className="text-xs text-zinc-500">Role: {a.role} • Clock In: {new Date(a.clockIn).toLocaleTimeString()}</span>
                      </div>
                      <button
                        onClick={() => toggleAttendance(a.staffName)}
                        className={`text-xs px-3 py-1 rounded-lg font-bold border transition-all ${
                          a.clockOut
                            ? 'bg-zinc-900 border-zinc-800 text-zinc-400'
                            : 'bg-emerald-600/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-600 hover:text-white'
                        }`}
                      >
                        {a.clockOut ? 'Clocked Out' : 'Clock Out'}
                      </button>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          )}

        </div>

        {/* Operational Sidebar (1 Column) - Notifications, AIupsell Recommendations, Audit Logs */}
        <div className="flex flex-col gap-6">
          
          {/* AI Panel */}
          <div className="glass-panel p-5 border border-orange-600/20 rounded-2xl bg-gradient-to-br from-zinc-900/80 to-orange-950/10 backdrop-blur-md relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-orange-600/5 rounded-full blur-2xl"></div>
            
            <h3 className="text-sm font-extrabold text-white tracking-wide uppercase flex items-center gap-1.5 mb-4">
              <Sparkles className="text-orange-500 w-4 h-4" /> AI Operations Core
            </h3>

            {/* Smart menu recommendation rules */}
            <div className="mb-4">
              <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider block mb-2">Demand Forecast (Next 3h)</span>
              <div className="space-y-1.5">
                {demandForecast.slice(0, 3).map((f, i) => (
                  <div key={i} className="flex justify-between text-xs border-b border-zinc-900 pb-1">
                    <span className="text-zinc-300 font-medium">{f.hour}</span>
                    <span className={`font-bold ${f.expectedLoad === 'Peak' ? 'text-rose-400' : 'text-zinc-400'}`}>{f.expectedLoad} ({f.projectedOrders} orders)</span>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider block mb-2">AI Smart Upsell Recommendations</span>
              <div className="space-y-2">
                {upsellRecommendations.map((rec, idx) => (
                  <div key={idx} className="p-3 rounded-xl border border-zinc-850 bg-zinc-950/40">
                    <span className="text-xs font-bold text-white block">{rec.item.name}</span>
                    <p className="text-[10px] text-zinc-500 mt-1 leading-normal">{rec.reason}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Real-time Notifications */}
          <div className="glass-panel p-5 border border-zinc-800 rounded-2xl bg-zinc-900/20">
            <h3 className="text-sm font-extrabold text-white tracking-wide uppercase flex items-center gap-1.5 mb-4">
              <Bell className="text-orange-500 w-4 h-4" /> Notification Alerts
            </h3>
            <div className="space-y-3">
              {notifications.map(n => (
                <div key={n.id} className={`p-3 rounded-xl border text-xs leading-normal ${
                  n.type === 'danger'
                    ? 'bg-rose-500/10 border-rose-500/20 text-rose-300'
                    : 'bg-indigo-500/10 border-indigo-500/20 text-indigo-300'
                }`}>
                  <span className="font-bold block mb-0.5">{n.title}</span>
                  <p className="opacity-95">{n.message}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Activity Auditor Logs */}
          <div className="glass-panel p-5 border border-zinc-800 rounded-2xl bg-zinc-900/20">
            <h3 className="text-sm font-extrabold text-white tracking-wide uppercase flex items-center gap-1.5 mb-4">
              <ShieldAlert className="text-zinc-500 w-4 h-4" /> Security Audit Logs
            </h3>
            <div className="font-mono text-[10px] text-zinc-500 space-y-1.5">
              {logs.map((log, i) => (
                <div key={i} className="truncate">{log}</div>
              ))}
            </div>
          </div>

        </div>
      </main>

      {/* Global Command Palette Trigger Overlay */}
      <CommandPalette 
        onNavigate={handleCommandPaletteNavigation} 
        onTableAction={handleCommandPaletteTable} 
      />

    </div>
  );
}

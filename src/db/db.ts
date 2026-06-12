import { supabase, isSupabaseConfigured } from './supabase';

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

export type OrderStatus = 'pending' | 'preparing' | 'ready' | 'served' | 'cancelled';

export interface Order {
  id: string;
  tableNumber: string;
  items: OrderItem[];
  totalAmount: number;
  status: OrderStatus;
  paymentMethod: 'cash' | 'upi' | 'card' | 'swiggy' | 'zomato' | 'counter' | 'online';
  paymentStatus: 'pending' | 'paid';
  createdAt: string;
  prepStartedAt?: string;
  readyAt?: string;
  servedAt?: string;
}

export interface SharedCartItem {
  menuItemId: string;
  quantity: number;
  addedBy: string; // guest name
}

export interface TableAlert {
  id: string;
  tableNumber: string;
  type: 'call_waiter' | 'request_bill';
  createdAt: string;
  status: 'active' | 'dismissed';
}

const DEFAULT_MENU_ITEMS: MenuItem[] = [
  {
    id: 'm1',
    name: 'Mocha Latte',
    price: 260,
    category: 'coffee',
    description: 'Espresso with rich chocolate sauce and steamed milk, topped with whipped cream.',
    popular: true,
    inStock: true,
    image: 'https://images.unsplash.com/photo-1541167760496-1628856ab772?w=500&auto=format&fit=crop&q=60'
  },
  {
    id: 'm2',
    name: 'Cold Coffee',
    price: 220,
    category: 'drinks',
    description: 'Our signature creamy blended cold coffee served chilled.',
    popular: true,
    inStock: true,
    image: 'https://images.unsplash.com/photo-1517701604599-bb29b565090c?w=500&auto=format&fit=crop&q=60'
  },
  {
    id: 'm3',
    name: 'Anti Veg Pizza',
    price: 550,
    category: 'pizza',
    description: 'Loaded with pepperoni, smoked chicken, bacon bits, and mozzarella.',
    popular: true,
    inStock: true,
    image: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=500&auto=format&fit=crop&q=60'
  },
  {
    id: 'm4',
    name: 'Pancake Stack',
    price: 280,
    category: 'dessert',
    description: 'Fluffy buttermilk pancakes served with maple syrup and whipped butter.',
    popular: true,
    inStock: true,
    image: 'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=500&auto=format&fit=crop&q=60'
  },
  {
    id: 'm5',
    name: 'Roasted Hazelnut Cappuccino',
    price: 240,
    category: 'coffee',
    description: 'A classic cappuccino infused with smooth, aromatic roasted hazelnut syrup.',
    popular: true,
    inStock: true,
    image: 'https://images.unsplash.com/photo-1570968915860-54d5c301fc9f?w=500&auto=format&fit=crop&q=60'
  },
  {
    id: 'm6',
    name: 'Onion Rings',
    price: 180,
    category: 'sides',
    description: 'Crispy, golden-fried beer-battered onion rings served with a tangy dip.',
    popular: true,
    inStock: true,
    image: 'https://images.unsplash.com/photo-1639024471283-2bc7b3c6a267?w=500&auto=format&fit=crop&q=60'
  },
  {
    id: 'm7',
    name: 'Chicken Pasta Carbonara',
    price: 480,
    category: 'pasta',
    description: 'Fettuccine tossed in a rich, creamy egg yolks and parmesan sauce with grilled chicken and bacon.',
    popular: true,
    inStock: true,
    image: 'https://images.unsplash.com/photo-1612874742237-6526221588e3?w=500&auto=format&fit=crop&q=60'
  },
  {
    id: 'm8',
    name: 'Freedom Potato Krispers',
    price: 190,
    category: 'sides',
    description: 'Crispy skin-on potato wedges seasoned with a secret spicy Roadies seasoning.',
    inStock: true,
    image: 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=500&auto=format&fit=crop&q=60'
  },
  {
    id: 'm9',
    name: 'Hummus Falafel Feta',
    price: 320,
    category: 'sides',
    description: 'Creamy hummus served with crispy falafel bullets, feta cheese, and warm pita bread.',
    inStock: true,
    image: 'https://images.unsplash.com/photo-1577906096429-f73dc89b5744?w=500&auto=format&fit=crop&q=60'
  },
];

// Initialize Broadcast Channel
const channel = new BroadcastChannel('roadies_koffeehouz_db');

// Menu helpers
export const getMenuItems = (): MenuItem[] => {
  try {
    const data = localStorage.getItem('roadies_menu');
    if (!data) {
      localStorage.setItem('roadies_menu', JSON.stringify(DEFAULT_MENU_ITEMS));
      return DEFAULT_MENU_ITEMS;
    }
    const parsed = JSON.parse(data);
    return Array.isArray(parsed) ? parsed : DEFAULT_MENU_ITEMS;
  } catch {
    return DEFAULT_MENU_ITEMS;
  }
};

export const saveMenuItems = (menu: MenuItem[]) => {
  localStorage.setItem('roadies_menu', JSON.stringify(menu));
  syncAll();
};

export const updateMenuItem = (item: MenuItem) => {
  const menu = getMenuItems();
  const index = menu.findIndex(i => i.id === item.id);
  if (index !== -1) {
    menu[index] = item;
  } else {
    menu.push(item);
  }
  saveMenuItems(menu);
};

export const deleteMenuItem = (id: string) => {
  const menu = getMenuItems();
  const updated = menu.filter(i => i.id !== id);
  saveMenuItems(updated);
};

// Orders helpers
export const getOrders = (): Order[] => {
  try {
    const data = localStorage.getItem('roadies_orders');
    if (!data) return [];
    const parsed = JSON.parse(data);
    if (!Array.isArray(parsed)) return [];
    return parsed.map((order: any) => ({
      ...order,
      paymentMethod: order.paymentMethod || 'counter',
      paymentStatus: order.paymentStatus || 'pending',
      status: order.status || 'pending'
    }));
  } catch {
    return [];
  }
};

export const saveOrders = (orders: Order[]) => {
  localStorage.setItem('roadies_orders', JSON.stringify(orders));
  syncAll();
};

export const createOrder = (
  tableNumber: string, 
  items: OrderItem[], 
  paymentMethod: 'counter' | 'online' = 'counter',
  paymentStatus: 'pending' | 'paid' = 'pending'
): Order => {
  const orders = getOrders();
  const subtotal = items.reduce((acc, item) => acc + item.menuItem.price * item.quantity, 0);
  const totalAmount = Math.round(subtotal * 1.05);
  const newOrder: Order = {
    id: 'ORD-' + Math.random().toString(36).substr(2, 9).toUpperCase(),
    tableNumber,
    items,
    totalAmount,
    status: 'pending',
    paymentMethod,
    paymentStatus,
    createdAt: new Date().toISOString(),
  };
  orders.push(newOrder);
  saveOrders(orders);
  return newOrder;
};

export const updateOrderStatus = (orderId: string, status: OrderStatus): boolean => {
  const orders = getOrders();
  const index = orders.findIndex((o) => o.id === orderId);
  if (index !== -1) {
    orders[index].status = status;
    const nowStr = new Date().toISOString();
    if (status === 'preparing') {
      orders[index].prepStartedAt = nowStr;
    } else if (status === 'ready') {
      orders[index].readyAt = nowStr;
    } else if (status === 'served') {
      orders[index].servedAt = nowStr;
    }
    saveOrders(orders);
    return true;
  }
  return false;
};

export const updateOrderPaymentStatus = (orderId: string, paymentStatus: 'pending' | 'paid', paymentMethod?: Order['paymentMethod']): boolean => {
  const orders = getOrders();
  const index = orders.findIndex((o) => o.id === orderId);
  if (index !== -1) {
    orders[index].paymentStatus = paymentStatus;
    if (paymentMethod) {
      orders[index].paymentMethod = paymentMethod;
    }
    saveOrders(orders);
    return true;
  }
  return false;
};

// Alerts (Call Waiter / Request Bill) helpers
export const getTableAlerts = (): TableAlert[] => {
  try {
    const data = localStorage.getItem('roadies_alerts');
    if (!data) return [];
    const parsed = JSON.parse(data);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

export const saveTableAlerts = (alerts: TableAlert[]) => {
  localStorage.setItem('roadies_alerts', JSON.stringify(alerts));
  syncAll();
};

export const createTableAlert = (tableNumber: string, type: 'call_waiter' | 'request_bill'): TableAlert => {
  const alerts = getTableAlerts();
  const newAlert: TableAlert = {
    id: 'ALT-' + Math.random().toString(36).substr(2, 9).toUpperCase(),
    tableNumber,
    type,
    createdAt: new Date().toISOString(),
    status: 'active'
  };
  alerts.push(newAlert);
  saveTableAlerts(alerts);
  return newAlert;
};

export const dismissTableAlert = (alertId: string) => {
  const alerts = getTableAlerts();
  const updated = alerts.filter(a => a.id !== alertId);
  saveTableAlerts(updated);
};

// Shared Carts helpers
export const getCarts = (): Record<string, SharedCartItem[]> => {
  try {
    const data = localStorage.getItem('roadies_carts');
    if (!data) return {};
    return JSON.parse(data) || {};
  } catch {
    return {};
  }
};

export const saveCarts = (carts: Record<string, SharedCartItem[]>) => {
  localStorage.setItem('roadies_carts', JSON.stringify(carts));
  syncAll();
};

export const getSharedCart = (tableNumber: string): SharedCartItem[] => {
  const carts = getCarts();
  return carts[tableNumber] || [];
};

export const updateSharedCart = (tableNumber: string, items: SharedCartItem[]) => {
  const carts = getCarts();
  carts[tableNumber] = items;
  saveCarts(carts);
};

export const clearSharedCart = (tableNumber: string) => {
  const carts = getCarts();
  delete carts[tableNumber];
  saveCarts(carts);
};

// Unified Synchronize function
const syncAll = () => {
  const payload = {
    orders: getOrders(),
    alerts: getTableAlerts(),
    menu: getMenuItems(),
    carts: getCarts()
  };

  channel.postMessage({
    type: 'sync',
    ...payload
  });

  fetch('/api/db', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  }).catch(err => console.warn('Cross-device sync server offline', err));

  // If Supabase is configured, push update in background (Optimistic Sync)
  if (isSupabaseConfigured && supabase) {
    const menuUploads = payload.menu.map(item => ({
      id: item.id,
      name: item.name,
      price: item.price,
      category: item.category,
      description: item.description,
      popular: !!item.popular,
      in_stock: item.inStock !== false,
      image: item.image || null
    }));
    supabase.from('menu_items').upsert(menuUploads)
      .then(({ error }) => { if (error) console.error("Supabase menu sync error:", error); });

    const ordersUploads = payload.orders.map(order => ({
      id: order.id,
      table_number: order.tableNumber,
      items: order.items,
      total_amount: order.totalAmount,
      status: order.status,
      payment_method: order.paymentMethod,
      payment_status: order.paymentStatus,
      created_at: order.createdAt
    }));
    supabase.from('orders').upsert(ordersUploads)
      .then(({ error }) => { if (error) console.error("Supabase orders sync error:", error); });

    const alertsUploads = payload.alerts.map(alert => ({
      id: alert.id.includes('ALT') ? undefined : alert.id,
      table_number: alert.tableNumber,
      type: alert.type,
      status: alert.status,
      created_at: alert.createdAt
    })).filter(a => a.id !== undefined);
    
    if (alertsUploads.length > 0) {
      supabase.from('table_alerts').upsert(alertsUploads)
        .then(({ error }) => { if (error) console.error("Supabase alerts sync error:", error); });
    }
  }
};

export const subscribeToDatabase = (
  callback: (data: { orders: Order[]; alerts: TableAlert[]; menu: MenuItem[]; carts: Record<string, SharedCartItem[]> }) => void
) => {
  // If Supabase is active, handle live subscriptions via WebSockets
  if (isSupabaseConfigured && supabase) {
    const loadFromSupabase = async () => {
      try {
        const { data: menuData } = await supabase.from('menu_items').select('*');
        const { data: ordersData } = await supabase.from('orders').select('*');
        const { data: alertsData } = await supabase.from('table_alerts').select('*');

        if (menuData) {
          const mapped = menuData.map((m: any) => ({
            id: m.id,
            name: m.name,
            price: Number(m.price),
            category: m.category,
            popular: m.popular,
            inStock: m.in_stock,
            description: m.description,
            image: m.image
          }));
          localStorage.setItem('roadies_menu', JSON.stringify(mapped));
        }

        if (ordersData) {
          const mapped = ordersData.map((o: any) => ({
            id: o.id,
            tableNumber: o.table_number,
            items: o.items,
            totalAmount: Number(o.total_amount),
            status: o.status,
            paymentMethod: o.payment_method,
            paymentStatus: o.payment_status,
            createdAt: o.created_at
          }));
          localStorage.setItem('roadies_orders', JSON.stringify(mapped));
        }

        if (alertsData) {
          const mapped = alertsData.map((a: any) => ({
            id: a.id,
            tableNumber: a.table_number,
            type: a.type,
            status: a.status,
            createdAt: a.created_at
          }));
          localStorage.setItem('roadies_alerts', JSON.stringify(mapped));
        }

        callback({
          orders: getOrders(),
          alerts: getTableAlerts(),
          menu: getMenuItems(),
          carts: getCarts()
        });
      } catch (err) {
        console.error("Supabase load error", err);
      }
    };

    loadFromSupabase();

    // Set up real-time postgres changes subscriptions
    const menuChannel = supabase.channel('realtime:menu_items')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'menu_items' }, () => { loadFromSupabase(); })
      .subscribe();
      
    const ordersChannel = supabase.channel('realtime:orders')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => { loadFromSupabase(); })
      .subscribe();

    const alertsChannel = supabase.channel('realtime:table_alerts')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'table_alerts' }, () => { loadFromSupabase(); })
      .subscribe();

    return () => {
      supabase.removeChannel(menuChannel);
      supabase.removeChannel(ordersChannel);
      supabase.removeChannel(alertsChannel);
    };
  }

  // Fallback to local server polling and broadcast channels
  const handleMessage = (event: MessageEvent) => {
    if (event.data && event.data.type === 'sync') {
      const syncedOrders = Array.isArray(event.data.orders) 
        ? event.data.orders.map((order: any) => ({
            ...order,
            paymentMethod: order.paymentMethod || 'counter',
            paymentStatus: order.paymentStatus || 'pending',
            status: order.status || 'pending'
          }))
        : [];
      if (event.data.carts) {
        localStorage.setItem('roadies_carts', JSON.stringify(event.data.carts));
      }
      callback({
        orders: syncedOrders,
        alerts: event.data.alerts || [],
        menu: event.data.menu || [],
        carts: event.data.carts || {}
      });
    }
  };
  channel.addEventListener('message', handleMessage);
  
  // Cross-device sync polling
  let lastDataStr = '';
  const pollServer = async () => {
    try {
      const res = await fetch('/api/db');
      if (res.ok) {
        const data = await res.json();
        const dataStr = JSON.stringify(data);
        if (dataStr !== lastDataStr) {
          lastDataStr = dataStr;
          
          if (Array.isArray(data.orders)) localStorage.setItem('roadies_orders', JSON.stringify(data.orders));
          if (Array.isArray(data.alerts)) localStorage.setItem('roadies_alerts', JSON.stringify(data.alerts));
          if (Array.isArray(data.menu)) localStorage.setItem('roadies_menu', JSON.stringify(data.menu));
          if (data.carts) localStorage.setItem('roadies_carts', JSON.stringify(data.carts));
          
          const syncedOrders = Array.isArray(data.orders) 
            ? data.orders.map((order: any) => ({
                ...order,
                paymentMethod: order.paymentMethod || 'counter',
                paymentStatus: order.paymentStatus || 'pending',
                status: order.status || 'pending'
              }))
            : [];
          
          callback({
            orders: syncedOrders,
            alerts: data.alerts || [],
            menu: data.menu || [],
            carts: data.carts || {}
          });
        }
      }
    } catch {
      // Ignored when server is unreachable
    }
  };

  pollServer();
  const interval = setInterval(pollServer, 1500);

  return () => {
    channel.removeEventListener('message', handleMessage);
    clearInterval(interval);
  };
};

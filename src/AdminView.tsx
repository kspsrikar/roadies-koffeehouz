import React, { useState, useEffect } from 'react';
import { 
  getMenuItems, 
  updateMenuItem, 
  deleteMenuItem, 
  getOrders, 
  subscribeToDatabase 
} from './db/db';
import type { 
  MenuItem, 
  Order 
} from './db/db';
import { 
  BarChart3, 
  TrendingUp, 
  DollarSign, 
  Plus, 
  Edit2, 
  Trash2, 
  Layers, 
  UtensilsCrossed,
  Calendar,
  ShoppingBag,
  Clock,
  AlertTriangle
} from 'lucide-react';

export const AdminView: React.FC = () => {
  const [menu, setMenu] = useState<MenuItem[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [adminTab, setAdminTab] = useState<'menu' | 'sales'>('menu');
  const [timeRange, setTimeRange] = useState<'today' | 'week' | 'month' | 'year' | 'all'>('today');

  // Security Auth state (Pincode: 4321)
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => sessionStorage.getItem('roadies_admin_auth') === 'true');
  const [pincode, setPincode] = useState('');
  const [pinError, setPinError] = useState('');

  const handlePinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pincode === '4321') {
      sessionStorage.setItem('roadies_admin_auth', 'true');
      setIsAuthenticated(true);
      setPinError('');
    } else {
      setPinError('Access Denied: Invalid Pincode');
      setPincode('');
    }
  };

  // Form states
  const [isEditing, setIsEditing] = useState(false);
  const [itemId, setItemId] = useState('');
  const [itemName, setItemName] = useState('');
  const [itemPrice, setItemPrice] = useState(0);
  const [itemCategory, setItemCategory] = useState<'coffee' | 'drinks' | 'pizza' | 'pasta' | 'sides' | 'dessert'>('coffee');
  const [itemDescription, setItemDescription] = useState('');
  const [itemPopular, setItemPopular] = useState(false);
  const [itemInStock, setItemInStock] = useState(true);
  const [itemImage, setItemImage] = useState('');

  useEffect(() => {
    setMenu(getMenuItems());
    setOrders(getOrders());

    const unsubscribe = subscribeToDatabase((data) => {
      setOrders(data.orders);
      setMenu(data.menu);
    });
    return () => unsubscribe();
  }, []);

  // Guard page for non-authenticated visits
  if (!isAuthenticated) {
    return (
      <div style={{
        minHeight: '100vh',
        backgroundColor: 'var(--bg-darkest)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px'
      }}>
        <div className="glass-panel" style={{
          maxWidth: '360px',
          width: '100%',
          borderRadius: 'var(--radius-lg)',
          padding: '36px 30px',
          border: '1px solid var(--border-color)',
          textAlign: 'center',
          boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
          animation: 'fadeIn 0.3s ease'
        }}>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: '6px' }} className="gradient-text">
            OWNER ACCESS ONLY
          </h2>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '24px' }}>
            Enter your admin pincode to manage menu & view reports.
          </p>

          <form onSubmit={handlePinSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <input
              type="password"
              maxLength={4}
              required
              value={pincode}
              onChange={(e) => setPincode(e.target.value.replace(/\D/g, ''))}
              placeholder="••••"
              style={{
                width: '100%',
                backgroundColor: 'var(--bg-card)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-md)',
                padding: '14px',
                color: 'white',
                fontSize: '1.8rem',
                textAlign: 'center',
                letterSpacing: '12px'
              }}
              autoFocus
            />

            {pinError && (
              <p style={{ fontSize: '0.75rem', color: 'var(--danger)', margin: 0, fontWeight: 600 }}>
                {pinError}
              </p>
            )}

            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: '100%', padding: '12px', borderRadius: 'var(--radius-md)', fontSize: '0.9rem', fontWeight: 700 }}
            >
              Verify Pincode
            </button>
          </form>
        </div>
      </div>
    );
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 1024 * 1024) {
        alert("Please upload an image smaller than 1MB.");
        e.target.value = '';
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setItemImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const resetForm = () => {
    setIsEditing(false);
    setItemId('');
    setItemName('');
    setItemPrice(0);
    setItemCategory('coffee');
    setItemDescription('');
    setItemPopular(false);
    setItemInStock(true);
    setItemImage('');
    // Clear the file input element physically if it exists
    const fileInput = document.getElementById('menu-item-image') as HTMLInputElement;
    if (fileInput) fileInput.value = '';
  };

  const handleEditItemClick = (item: MenuItem) => {
    setIsEditing(true);
    setItemId(item.id);
    setItemName(item.name);
    setItemPrice(item.price);
    setItemCategory(item.category);
    setItemDescription(item.description);
    setItemPopular(!!item.popular);
    setItemInStock(item.inStock !== false);
    setItemImage(item.image || '');
  };

  const handleSaveItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemName.trim() || !itemDescription.trim() || itemPrice <= 0) {
      alert("Please fill all details correctly.");
      return;
    }
    const targetId = itemId || 'm-' + Math.random().toString(36).substr(2, 9).toUpperCase();
    
    const item: MenuItem = {
      id: targetId,
      name: itemName,
      price: Number(itemPrice),
      category: itemCategory,
      description: itemDescription,
      popular: itemPopular,
      inStock: itemInStock,
      image: itemImage || undefined
    };

    updateMenuItem(item);
    setMenu(getMenuItems());
    resetForm();
  };

  const handleDeleteClick = (id: string) => {
    if (confirm("Are you sure you want to delete this menu item?")) {
      deleteMenuItem(id);
      setMenu(getMenuItems());
    }
  };

  const toggleStockStatus = (item: MenuItem) => {
    const updated = { ...item, inStock: !item.inStock };
    updateMenuItem(updated);
    setMenu(getMenuItems());
  };

  // Filter orders by time period (Day, Week, Month, Year, All)
  const filterOrdersByTime = (orderList: Order[], range: typeof timeRange) => {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    
    // Start of current week (assuming Monday start)
    const currentDay = now.getDay();
    const distanceToMonday = currentDay === 0 ? 6 : currentDay - 1;
    const weekStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - distanceToMonday).getTime();
    
    // Start of current month
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
    
    // Start of current year
    const yearStart = new Date(now.getFullYear(), 0, 1).getTime();

    return orderList.filter(order => {
      const orderTime = new Date(order.createdAt).getTime();
      switch (range) {
        case 'today':
          return orderTime >= todayStart;
        case 'week':
          return orderTime >= weekStart;
        case 'month':
          return orderTime >= monthStart;
        case 'year':
          return orderTime >= yearStart;
        case 'all':
        default:
          return true;
      }
    });
  };

  const periodOrders = filterOrdersByTime(orders, timeRange);
  const completedOrders = periodOrders.filter(o => o.status !== 'cancelled');
  const totalRevenue = completedOrders.reduce((sum, o) => sum + o.totalAmount, 0);
  const averageOrderValue = completedOrders.length > 0 ? Math.round(totalRevenue / completedOrders.length) : 0;

  // Calculate Turnaround and Bottleneck metrics
  const getKitchenAnalytics = () => {
    let totalPrepTime = 0;
    let prepCount = 0;
    let totalServeDelay = 0;
    let serveCount = 0;

    // Track prep times by category and item
    const itemPrepTimes: { [itemId: string]: { name: string; category: string; totalTime: number; count: number } } = {};
    const categoryPrepTimes: { [category: string]: { totalTime: number; count: number } } = {};

    periodOrders.forEach(order => {
      if (order.prepStartedAt && order.readyAt) {
        const prepTime = new Date(order.readyAt).getTime() - new Date(order.prepStartedAt).getTime();
        totalPrepTime += prepTime;
        prepCount++;

        // Attribute prep time to individual items
        order.items.forEach(orderItem => {
          const item = orderItem.menuItem;
          if (!itemPrepTimes[item.id]) {
            itemPrepTimes[item.id] = { name: item.name, category: item.category, totalTime: 0, count: 0 };
          }
          itemPrepTimes[item.id].totalTime += prepTime;
          itemPrepTimes[item.id].count += orderItem.quantity;

          if (!categoryPrepTimes[item.category]) {
            categoryPrepTimes[item.category] = { totalTime: 0, count: 0 };
          }
          categoryPrepTimes[item.category].totalTime += prepTime;
          categoryPrepTimes[item.category].count += orderItem.quantity;
        });
      }

      if (order.readyAt && order.servedAt) {
        const serveDelay = new Date(order.servedAt).getTime() - new Date(order.readyAt).getTime();
        totalServeDelay += serveDelay;
        serveCount++;
      }
    });

    const avgPrepDuration = prepCount > 0 ? totalPrepTime / prepCount : 0; // in ms
    const avgServeDelay = serveCount > 0 ? totalServeDelay / serveCount : 0; // in ms

    // Find bottlenecks: average prep time > 12 minutes (12 * 60 * 1000 ms)
    const bottlenecks: Array<{ type: 'item' | 'category'; name: string; avgMinutes: number }> = [];
    
    Object.values(itemPrepTimes).forEach(item => {
      const avgMs = item.count > 0 ? item.totalTime / item.count : 0;
      const avgMin = avgMs / (60 * 1000);
      if (avgMin > 12) {
        bottlenecks.push({ type: 'item', name: item.name, avgMinutes: avgMin });
      }
    });

    Object.entries(categoryPrepTimes).forEach(([catName, data]) => {
      const avgMs = data.count > 0 ? data.totalTime / data.count : 0;
      const avgMin = avgMs / (60 * 1000);
      if (avgMin > 12) {
        bottlenecks.push({ type: 'category', name: catName, avgMinutes: avgMin });
      }
    });

    return {
      avgPrepDuration,
      avgServeDelay,
      bottlenecks,
      itemPrepTimes,
      categoryPrepTimes
    };
  };

  const kitchenAnalytics = getKitchenAnalytics();

  // Aggregate item sales counts and revenue
  const getItemSalesSummary = () => {
    const summary: { [key: string]: { name: string; category: string; price: number; quantity: number; revenue: number } } = {};
    
    // Initialize summary map with active menu items
    menu.forEach(item => {
      summary[item.id] = {
        name: item.name,
        category: item.category,
        price: item.price,
        quantity: 0,
        revenue: 0
      };
    });

    // Populate counts from completed orders inside this period
    completedOrders.forEach(order => {
      order.items.forEach(orderItem => {
        const itemId = orderItem.menuItem.id;
        if (summary[itemId]) {
          summary[itemId].quantity += orderItem.quantity;
          summary[itemId].revenue += orderItem.menuItem.price * orderItem.quantity;
        } else {
          summary[itemId] = {
            name: orderItem.menuItem.name,
            category: orderItem.menuItem.category,
            price: orderItem.menuItem.price,
            quantity: orderItem.quantity,
            revenue: orderItem.menuItem.price * orderItem.quantity
          };
        }
      });
    });

    return Object.values(summary).sort((a, b) => b.quantity - a.quantity);
  };
  


  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', backgroundColor: 'var(--bg-darkest)' }}>
      {/* Admin Header */}
      <header className="glass-panel" style={{ 
        position: 'sticky', 
        top: 0, 
        zIndex: 50, 
        padding: '16px 20px', 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center' 
      }}>
        <div>
          <h1 style={{ fontSize: '1.4rem', margin: 0, fontWeight: 800 }} className="gradient-text">
            CAFE ADMIN PORTAL
          </h1>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Roadies Koffeehouz Analytics & Menu Manager</p>
        </div>
      </header>

      {/* Main Admin Section */}
      <main className="container" style={{ flex: 1, padding: '24px 20px', display: 'flex', flexDirection: 'column', gap: '24px', paddingBottom: '100px' }}>
        
        {/* Controls: Tab Selector & Time Range Selector */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', borderBottom: '1px solid var(--border-color)', paddingBottom: '16px' }}>
          
          {/* Tab Navigation */}
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={() => setAdminTab('menu')}
              style={{
                padding: '10px 20px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: adminTab === 'menu' ? 'var(--primary)' : 'var(--bg-card)',
                color: adminTab === 'menu' ? 'var(--bg-darkest)' : 'var(--text-primary)',
                fontWeight: 700,
                fontSize: '0.9rem',
                cursor: 'pointer',
                border: 'none',
                transition: 'all 0.2s ease'
              }}
            >
              🍔 Menu Manager
            </button>
            <button
              onClick={() => setAdminTab('sales')}
              style={{
                padding: '10px 20px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: adminTab === 'sales' ? 'var(--primary)' : 'var(--bg-card)',
                color: adminTab === 'sales' ? 'var(--bg-darkest)' : 'var(--text-primary)',
                fontWeight: 700,
                fontSize: '0.9rem',
                cursor: 'pointer',
                border: 'none',
                transition: 'all 0.2s ease'
              }}
            >
              📈 Sales & Items Sold
            </button>
          </div>

          {/* Time Interval Selector (Today, Week, Month, Year, All) */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: 'var(--bg-card)', padding: '4px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
            {(['today', 'week', 'month', 'year', 'all'] as const).map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                style={{
                  padding: '6px 12px',
                  borderRadius: '4px',
                  backgroundColor: timeRange === range ? 'var(--primary-light)' : 'transparent',
                  color: timeRange === range ? 'var(--primary)' : 'var(--text-secondary)',
                  fontWeight: 600,
                  fontSize: '0.8rem',
                  textTransform: 'capitalize',
                  cursor: 'pointer',
                  border: 'none',
                  transition: 'all 0.2s ease'
                }}
              >
                {range === 'all' ? 'All Time' : range}
              </button>
            ))}
          </div>

        </div>

        {/* Bottleneck Warning Banner */}
        {kitchenAnalytics.bottlenecks.length > 0 && (
          <div className="glass-panel" style={{
            borderRadius: 'var(--radius-lg)',
            padding: '16px 20px',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            backgroundColor: 'rgba(239, 68, 68, 0.08)',
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            animation: 'fadeIn 0.3s ease'
          }}>
            <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.2)', color: 'var(--danger)', padding: '10px', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <AlertTriangle size={24} />
            </div>
            <div>
              <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: '#ef4444' }}>
                ⚠️ KITCHEN BOTTLENECK DETECTED!
              </h4>
              <p style={{ margin: '4px 0 0 0', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                The following categories/items exceed the 12-minute preparation threshold: {' '}
                {kitchenAnalytics.bottlenecks.map((b, i) => (
                  <strong key={i} style={{ color: 'var(--text-primary)' }}>
                    {b.name} ({Math.round(b.avgMinutes)}m){i < kitchenAnalytics.bottlenecks.length - 1 ? ', ' : ''}
                  </strong>
                ))}
              </p>
            </div>
          </div>
        )}

        {/* Row 1: Analytics widgets (dynamic based on selected time interval) */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px' }}>
          
          <div className="glass-panel" style={{ borderRadius: 'var(--radius-lg)', padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ backgroundColor: 'var(--primary-light)', color: 'var(--primary)', padding: '12px', borderRadius: 'var(--radius-md)' }}>
              <DollarSign size={24} />
            </div>
            <div>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Revenue ({timeRange})</span>
              <h2 style={{ fontSize: '1.6rem', fontWeight: 800, margin: 0 }}>₹{totalRevenue}</h2>
            </div>
          </div>

          <div className="glass-panel" style={{ borderRadius: 'var(--radius-lg)', padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)', color: 'var(--success)', padding: '12px', borderRadius: 'var(--radius-md)' }}>
              <TrendingUp size={24} />
            </div>
            <div>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Avg Order ({timeRange})</span>
              <h2 style={{ fontSize: '1.6rem', fontWeight: 800, margin: 0 }}>₹{averageOrderValue}</h2>
            </div>
          </div>

          <div className="glass-panel" style={{ borderRadius: 'var(--radius-lg)', padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ backgroundColor: 'rgba(59, 130, 246, 0.1)', color: 'var(--info)', padding: '12px', borderRadius: 'var(--radius-md)' }}>
              <BarChart3 size={24} />
            </div>
            <div>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Orders Sold ({timeRange})</span>
              <h2 style={{ fontSize: '1.6rem', fontWeight: 800, margin: 0 }}>{periodOrders.length}</h2>
            </div>
          </div>

          {/* Average Prep Time Widget */}
          <div className="glass-panel" style={{ borderRadius: 'var(--radius-lg)', padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ backgroundColor: 'rgba(168, 85, 247, 0.1)', color: 'rgb(168, 85, 247)', padding: '12px', borderRadius: 'var(--radius-md)' }}>
              <Clock size={24} />
            </div>
            <div>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Avg Prep Duration</span>
              <h2 style={{ fontSize: '1.6rem', fontWeight: 800, margin: 0 }}>
                {kitchenAnalytics.avgPrepDuration > 0 
                  ? `${Math.floor(kitchenAnalytics.avgPrepDuration / 1000 / 60)}m ${Math.round((kitchenAnalytics.avgPrepDuration / 1000) % 60)}s` 
                  : '0m'}
              </h2>
            </div>
          </div>

          {/* Average Serve Delay Widget */}
          <div className="glass-panel" style={{ borderRadius: 'var(--radius-lg)', padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ backgroundColor: 'rgba(236, 72, 153, 0.1)', color: 'rgb(236, 72, 153)', padding: '12px', borderRadius: 'var(--radius-md)' }}>
              <Clock size={24} />
            </div>
            <div>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Avg Serve Delay</span>
              <h2 style={{ fontSize: '1.6rem', fontWeight: 800, margin: 0 }}>
                {kitchenAnalytics.avgServeDelay > 0 
                  ? `${Math.floor(kitchenAnalytics.avgServeDelay / 1000 / 60)}m ${Math.round((kitchenAnalytics.avgServeDelay / 1000) % 60)}s` 
                  : '0m'}
              </h2>
            </div>
          </div>

          <div className="glass-panel" style={{ borderRadius: 'var(--radius-lg)', padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ backgroundColor: 'rgba(245, 158, 11, 0.1)', color: 'var(--primary)', padding: '12px', borderRadius: 'var(--radius-md)' }}>
              <Layers size={24} />
            </div>
            <div>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Active Menu Items</span>
              <h2 style={{ fontSize: '1.6rem', fontWeight: 800, margin: 0 }}>{menu.length}</h2>
            </div>
          </div>

        </div>

        {/* Tab Content rendering */}
        {adminTab === 'menu' ? (
          /* TAB 1: MENU MANAGER VIEW */
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '24px', alignItems: 'flex-start' }}>
            
            {/* Menu Table/List */}
            <div className="glass-panel" style={{ borderRadius: 'var(--radius-lg)', padding: '24px' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <UtensilsCrossed size={18} /> Menu Items Directory
              </h3>

              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}>
                      <th style={{ padding: '12px' }}>Name</th>
                      <th style={{ padding: '12px' }}>Category</th>
                      <th style={{ padding: '12px' }}>Price</th>
                      <th style={{ padding: '12px' }}>Popular?</th>
                      <th style={{ padding: '12px' }}>In Stock?</th>
                      <th style={{ padding: '12px', textAlign: 'center' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {menu.map((item) => (
                      <tr key={item.id} style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-primary)' }}>
                        <td style={{ padding: '12px', fontWeight: 600 }}>{item.name}</td>
                        <td style={{ padding: '12px', textTransform: 'capitalize' }}>{item.category}</td>
                        <td style={{ padding: '12px', color: 'var(--primary)', fontWeight: 700 }}>₹{item.price}</td>
                        <td style={{ padding: '12px' }}>
                          {item.popular ? (
                            <span style={{ fontSize: '0.7rem', color: 'var(--primary)', fontWeight: 700, backgroundColor: 'rgba(245,158,11,0.1)', padding: '2px 8px', borderRadius: 'var(--radius-full)' }}>YES</span>
                          ) : 'No'}
                        </td>
                        <td style={{ padding: '12px' }}>
                          <button 
                            onClick={() => toggleStockStatus(item)}
                            style={{ 
                              fontSize: '0.75rem', 
                              fontWeight: 600,
                              padding: '4px 10px', 
                              borderRadius: 'var(--radius-full)',
                              cursor: 'pointer',
                              backgroundColor: item.inStock !== false ? 'var(--success-light)' : 'var(--danger-light)',
                              color: item.inStock !== false ? 'var(--success)' : 'var(--danger)',
                              border: `1px solid ${item.inStock !== false ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)'}`
                            }}
                          >
                            {item.inStock !== false ? 'In Stock' : 'Out of Stock'}
                          </button>
                        </td>
                        <td style={{ padding: '12px', textAlign: 'center' }}>
                          <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                            <button 
                              onClick={() => handleEditItemClick(item)}
                              style={{ color: 'var(--primary)', padding: '6px', cursor: 'pointer' }}
                              title="Edit"
                            >
                              <Edit2 size={16} />
                            </button>
                            <button 
                              onClick={() => handleDeleteClick(item.id)}
                              style={{ color: 'var(--danger)', padding: '6px', cursor: 'pointer' }}
                              title="Delete"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Add / Edit Form Panel */}
            <div className="glass-panel" style={{ borderRadius: 'var(--radius-lg)', padding: '24px' }}>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Plus size={18} /> {isEditing ? 'Edit Menu Item' : 'Add New Menu Item'}
              </h3>

              <form onSubmit={handleSaveItem} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '6px', fontWeight: 600 }}>
                    ITEM NAME
                  </label>
                  <input 
                    type="text" 
                    required 
                    value={itemName}
                    onChange={(e) => setItemName(e.target.value)}
                    placeholder="e.g. Mocha Frappe"
                    style={{ width: '100%', backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '10px', color: 'white', fontSize: '0.9rem' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '6px', fontWeight: 600 }}>
                    PRICE (₹)
                  </label>
                  <input 
                    type="number" 
                    required 
                    value={itemPrice || ''}
                    onChange={(e) => setItemPrice(Number(e.target.value))}
                    placeholder="e.g. 280"
                    style={{ width: '100%', backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '10px', color: 'white', fontSize: '0.9rem' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '6px', fontWeight: 600 }}>
                    CATEGORY
                  </label>
                  <select
                    value={itemCategory}
                    onChange={(e) => setItemCategory(e.target.value as any)}
                    style={{ width: '100%', backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '10px', color: 'white', fontSize: '0.9rem' }}
                  >
                    <option value="coffee">Coffee</option>
                    <option value="drinks">Drinks</option>
                    <option value="pizza">Pizza</option>
                    <option value="pasta">Pasta</option>
                    <option value="sides">Sides</option>
                    <option value="dessert">Dessert</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '6px', fontWeight: 600 }}>
                    FOOD ITEM PHOTO
                  </label>
                  <input 
                    id="menu-item-image"
                    type="file" 
                    accept="image/*"
                    onChange={handleImageChange}
                    style={{ width: '100%', backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '8px', color: 'white', fontSize: '0.85rem' }}
                  />
                  {itemImage && (
                    <div style={{ marginTop: '8px', position: 'relative', width: '100%', height: '80px', borderRadius: '4px', overflow: 'hidden' }}>
                      <img src={itemImage} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      <button 
                        type="button" 
                        onClick={() => {
                          setItemImage('');
                          const fileInput = document.getElementById('menu-item-image') as HTMLInputElement;
                          if (fileInput) fileInput.value = '';
                        }}
                        style={{ position: 'absolute', top: '4px', right: '4px', backgroundColor: 'rgba(0,0,0,0.6)', color: 'white', border: 'none', borderRadius: '50%', width: '20px', height: '20px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.65rem' }}
                      >
                        ✕
                      </button>
                    </div>
                  )}
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '6px', fontWeight: 600 }}>
                    DESCRIPTION
                  </label>
                  <textarea 
                    required 
                    value={itemDescription}
                    onChange={(e) => setItemDescription(e.target.value)}
                    placeholder="Describe the flavors..."
                    rows={3}
                    style={{ width: '100%', backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '10px', color: 'white', fontSize: '0.9rem', fontFamily: 'inherit', resize: 'none' }}
                  />
                </div>

                <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.85rem' }}>
                    <input 
                      type="checkbox" 
                      checked={itemPopular}
                      onChange={(e) => setItemPopular(e.target.checked)}
                      style={{ cursor: 'pointer' }}
                    /> Popular Highlight
                  </label>

                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.85rem' }}>
                    <input 
                      type="checkbox" 
                      checked={itemInStock}
                      onChange={(e) => setItemInStock(e.target.checked)}
                      style={{ cursor: 'pointer' }}
                    /> In Stock
                  </label>
                </div>

                <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                  {isEditing && (
                    <button 
                      type="button" 
                      onClick={resetForm}
                      className="btn btn-secondary" 
                      style={{ flex: 1, padding: '10px' }}
                    >
                      Cancel
                    </button>
                  )}
                  <button 
                    type="submit" 
                    className="btn btn-primary" 
                    style={{ flex: 2, padding: '10px' }}
                  >
                    {isEditing ? 'Save Changes' : 'Create Item'}
                  </button>
                </div>
              </form>
            </div>

          </div>
        ) : (
          /* TAB 2: SALES HISTORY & ITEM SALES REPORT */
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            
            {/* Payment Method Breakdown Bar */}
            <div className="glass-panel" style={{ borderRadius: 'var(--radius-lg)', padding: '20px' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                💳 Revenue by Payment Method ({timeRange})
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px' }}>
                <div style={{ backgroundColor: 'rgba(255,255,255,0.02)', padding: '12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', textAlign: 'center' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>💵 Cash</span>
                  <p style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--success)', margin: '4px 0 0 0' }}>
                    ₹{completedOrders.filter(o => o.paymentMethod === 'cash').reduce((sum, o) => sum + o.totalAmount, 0)}
                  </p>
                </div>
                <div style={{ backgroundColor: 'rgba(255,255,255,0.02)', padding: '12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', textAlign: 'center' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>📲 Paytm UPI</span>
                  <p style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--info)', margin: '4px 0 0 0' }}>
                    ₹{completedOrders.filter(o => o.paymentMethod === 'upi' || o.paymentMethod === 'online').reduce((sum, o) => sum + o.totalAmount, 0)}
                  </p>
                </div>
                <div style={{ backgroundColor: 'rgba(255,255,255,0.02)', padding: '12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', textAlign: 'center' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>💳 Card</span>
                  <p style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--primary)', margin: '4px 0 0 0' }}>
                    ₹{completedOrders.filter(o => o.paymentMethod === 'card').reduce((sum, o) => sum + o.totalAmount, 0)}
                  </p>
                </div>
              </div>
            </div>

            {/* Kitchen Performance Breakdown */}
            <div className="glass-panel" style={{ borderRadius: 'var(--radius-lg)', padding: '20px' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                🍳 Kitchen Performance & Turnaround Times ({timeRange})
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
                {/* Category Averages */}
                <div style={{ backgroundColor: 'rgba(255,255,255,0.01)', padding: '16px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
                  <h4 style={{ margin: '0 0 12px 0', fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-secondary)' }}>Category Prep Speed</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {Object.entries(kitchenAnalytics.categoryPrepTimes).map(([catName, data]) => {
                      const avgMs = data.count > 0 ? data.totalTime / data.count : 0;
                      const avgMin = avgMs / 1000 / 60;
                      const isBottleneck = avgMin > 12;
                      return (
                        <div key={catName} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85rem' }}>
                          <span style={{ textTransform: 'capitalize' }}>{catName}</span>
                          <span style={{ fontWeight: 700, color: isBottleneck ? '#ef4444' : 'var(--success)' }}>
                            {avgMin > 0 ? `${Math.round(avgMin)} mins` : 'N/A'} {isBottleneck && '⚠️'}
                          </span>
                        </div>
                      );
                    })}
                    {Object.keys(kitchenAnalytics.categoryPrepTimes).length === 0 && (
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>No prep data tracked yet.</span>
                    )}
                  </div>
                </div>

                {/* Item-level Averages */}
                <div style={{ backgroundColor: 'rgba(255,255,255,0.01)', padding: '16px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
                  <h4 style={{ margin: '0 0 12px 0', fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-secondary)' }}>Slowest Items (Avg Prep Time)</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {Object.values(kitchenAnalytics.itemPrepTimes)
                      .sort((a, b) => (b.totalTime / b.count) - (a.totalTime / a.count))
                      .slice(0, 5)
                      .map((item) => {
                        const avgMs = item.count > 0 ? item.totalTime / item.count : 0;
                        const avgMin = avgMs / 1000 / 60;
                        const isBottleneck = avgMin > 12;
                        return (
                          <div key={item.name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85rem' }}>
                            <span>{item.name}</span>
                            <span style={{ fontWeight: 700, color: isBottleneck ? '#ef4444' : 'var(--text-primary)' }}>
                              {avgMin > 0 ? `${Math.round(avgMin)} mins` : 'N/A'} {isBottleneck && '⚠️'}
                            </span>
                          </div>
                        );
                      })}
                    {Object.keys(kitchenAnalytics.itemPrepTimes).length === 0 && (
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>No prep data tracked yet.</span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '24px', alignItems: 'flex-start' }}>
              
              {/* Left Column: Aggregated Items Sold Summary */}
              <div className="glass-panel" style={{ borderRadius: 'var(--radius-lg)', padding: '24px' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <ShoppingBag size={18} /> Sold Items Analytics ({timeRange === 'all' ? 'All-Time' : timeRange})
                </h3>
                
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}>
                        <th style={{ padding: '12px' }}>Item Name</th>
                        <th style={{ padding: '12px' }}>Category</th>
                        <th style={{ padding: '12px', textAlign: 'center' }}>Qty Sold</th>
                        <th style={{ padding: '12px', textAlign: 'right' }}>Revenue</th>
                      </tr>
                    </thead>
                    <tbody>
                      {getItemSalesSummary().map((item, idx) => (
                        <tr key={idx} style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-primary)' }}>
                          <td style={{ padding: '12px', fontWeight: 600 }}>{item.name}</td>
                          <td style={{ padding: '12px', textTransform: 'capitalize', color: 'var(--text-secondary)', fontSize: '0.8rem' }}>{item.category}</td>
                          <td style={{ padding: '12px', textAlign: 'center', fontWeight: 700, color: item.quantity > 0 ? 'var(--primary)' : 'var(--text-muted)' }}>
                            {item.quantity}
                          </td>
                          <td style={{ padding: '12px', textAlign: 'right', fontWeight: 700, color: item.revenue > 0 ? 'var(--success)' : 'var(--text-muted)' }}>
                            ₹{item.revenue}
                          </td>
                        </tr>
                      ))}
                      {getItemSalesSummary().length === 0 && (
                        <tr>
                          <td colSpan={4} style={{ padding: '30px', textAlign: 'center', color: 'var(--text-muted)' }}>
                            No sales data recorded for this time range.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Right Column: Historical Orders Ledger (Archived orders from past days / active orders) */}
              <div className="glass-panel" style={{ borderRadius: 'var(--radius-lg)', padding: '24px' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Calendar size={18} /> Orders History ledger ({timeRange === 'all' ? 'All-Time' : timeRange})
                </h3>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '600px', overflowY: 'auto', paddingRight: '4px' }}>
                  {periodOrders.map((order) => {
                    const orderDate = new Date(order.createdAt);
                    return (
                      <div 
                        key={order.id} 
                        style={{ 
                          padding: '14px', 
                          backgroundColor: 'rgba(255,255,255,0.02)', 
                          border: '1px solid var(--border-color)', 
                          borderRadius: 'var(--radius-md)' 
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                          <div>
                            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--primary)', backgroundColor: 'var(--bg-darkest)', padding: '2px 8px', borderRadius: '4px', marginRight: '8px' }}>
                              Table {order.tableNumber}
                            </span>
                            <span style={{ fontSize: '0.8rem', fontWeight: 700 }}>{order.id}</span>
                          </div>
                          <span className={`badge badge-${order.status}`} style={{ fontSize: '0.65rem' }}>{order.status}</span>
                        </div>

                        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '8px', display: 'flex', justifyContent: 'space-between' }}>
                          <span>{orderDate.toLocaleDateString()} at {orderDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          <span style={{ color: order.paymentStatus === 'paid' ? 'var(--success)' : 'var(--warning)', fontWeight: 600 }}>
                            {order.paymentStatus === 'paid' ? `Paid (${
                              order.paymentMethod === 'cash' ? 'Cash' :
                              order.paymentMethod === 'card' ? 'Card' :
                              order.paymentMethod === 'upi' ? 'UPI' :
                              order.paymentMethod === 'swiggy' ? 'Swiggy' :
                              order.paymentMethod === 'zomato' ? 'Zomato' :
                              order.paymentMethod === 'online' ? 'Online UPI' : order.paymentMethod
                            })` : 'Unpaid'}
                          </span>
                        </div>

                        <div style={{ borderTop: '1px solid rgba(255,255,255,0.03)', paddingTop: '6px', fontSize: '0.8rem' }}>
                          {order.items.map((item, idx) => (
                            <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', margin: '2px 0' }}>
                              <span>{item.quantity}x {item.menuItem.name}</span>
                              <span>₹{item.menuItem.price * item.quantity}</span>
                            </div>
                          ))}
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, color: 'var(--text-primary)', marginTop: '6px', fontSize: '0.85rem' }}>
                            <span>Total</span>
                            <span>₹{order.totalAmount}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  {periodOrders.length === 0 && (
                    <div style={{ padding: '30px', textAlign: 'center', color: 'var(--text-muted)' }}>
                      No orders logged for this time range.
                    </div>
                  )}
                </div>
              </div>

            </div>
          </div>
        )}

      </main>
    </div>
  );
};

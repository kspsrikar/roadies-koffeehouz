import React, { useState, useEffect } from 'react';
import { 
  ShoppingBag, 
  Plus, 
  Minus, 
  Trash2, 
  Check, 
  Coffee, 
  Pizza, 
  Clock, 
  ChefHat, 
  AlertTriangle,
  Flame,
  Receipt,
  Bell,
  Users,
  Sparkles,
  Bike
} from 'lucide-react';
import { 
  createOrder, 
  getOrders,
  subscribeToDatabase,
  getMenuItems,
  createTableAlert,
  updateOrderPaymentStatus,
  getSharedCart,
  updateSharedCart,
  clearSharedCart
} from './db/db';
import type { 
  MenuItem, 
  OrderItem, 
  Order,
  SharedCartItem
} from './db/db';
import { ContainerScroll } from './components/ui/container-scroll-animation';
import { Carousel, TestimonialCard } from './components/ui/retro-testimonial';
import { AmbientBackground } from './components/AmbientBackground';
import { TextScramble } from './components/ui/text-scramble';

interface CustomerViewProps {
  initialTable?: string;
}

export const BikerLoader: React.FC = () => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', margin: '20px auto', width: '100%' }}>
      <div style={{ position: 'relative', width: '120px', height: '45px', overflow: 'hidden', margin: '0 auto' }}>
        <div style={{
          position: 'absolute',
          animation: 'bikeRide 1.8s ease-in-out infinite',
          display: 'flex',
          alignItems: 'center',
          color: 'var(--primary)'
        }}>
          <Bike size={36} />
          {/* Small smoke puff animation */}
          <div style={{
            width: '6px',
            height: '6px',
            backgroundColor: 'rgba(255,255,255,0.4)',
            borderRadius: '50%',
            marginLeft: '-6px',
            marginTop: '12px',
            animation: 'exhaustSmoke 0.6s linear infinite'
          }} />
        </div>
      </div>
      <style>{`
        @keyframes bikeRide {
          0% { left: -40px; transform: scaleX(1) translateY(0px) rotate(0deg); }
          45% { transform: scaleX(1) translateY(-3px) rotate(-8deg); } /* Slight wheelie */
          50% { left: 80px; transform: scaleX(1) translateY(0px) rotate(0deg); }
          55% { transform: scaleX(-1) translateY(0px) rotate(0deg); } /* Turn around */
          95% { transform: scaleX(-1) translateY(-3px) rotate(8deg); }
          100% { left: -40px; transform: scaleX(-1) translateY(0px) rotate(0deg); }
        }
        @keyframes exhaustSmoke {
          0% { transform: scale(1) translate(0, 0); opacity: 0.8; }
          100% { transform: scale(3) translate(-15px, -8px); opacity: 0; }
        }
      `}</style>
    </div>
  );
};


export const CustomerView: React.FC<CustomerViewProps> = ({ initialTable }) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [guestName, setGuestName] = useState(() => sessionStorage.getItem('roadies_guest_name') || '');
  const [sharedCart, setSharedCart] = useState<SharedCartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  
  const [tableNumber, setTableNumber] = useState<string>(() => {
    // Check URL search parameters first
    const params = new URLSearchParams(window.location.search);
    const urlTable = params.get('table');
    if (urlTable) {
      sessionStorage.setItem('roadies_table_number', urlTable);
      return urlTable;
    }
    if (initialTable) {
      sessionStorage.setItem('roadies_table_number', initialTable);
      return initialTable;
    }
    return sessionStorage.getItem('roadies_table_number') || '';
  });

  const [isTableLocked, setIsTableLocked] = useState<boolean>(() => {
    const params = new URLSearchParams(window.location.search);
    const urlTable = params.get('table');
    return !!urlTable || !!initialTable || !!sessionStorage.getItem('roadies_table_number');
  });

  const [placedOrderId, setPlacedOrderId] = useState<string | null>(null);
  const [isShowingActiveOrder, setIsShowingActiveOrder] = useState(false);
  const [placedOrdersList, setPlacedOrdersList] = useState<Order[]>([]);
  const placedOrder = placedOrdersList.find(o => o.id === placedOrderId) || null;
  const [isMyOrdersOpen, setIsMyOrdersOpen] = useState(false);

  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [isServiceBellOpen, setIsServiceBellOpen] = useState(false);
  const [bellAlertSent, setBellAlertSent] = useState(false);


  const [isSettlingBillOpen, setIsSettlingBillOpen] = useState(false);
  const [billPaymentMethod, setBillPaymentMethod] = useState<'paytm' | 'cash' | 'card' | 'swiggy' | 'zomato' | null>(null);
  const [hasCompletedDining, setHasCompletedDining] = useState(false);
  const [pendingPaymentAction, setPendingPaymentAction] = useState<(() => void) | null>(null);
  const [sessionStartTime, setSessionStartTime] = useState<string>(() => {
    return sessionStorage.getItem('roadies_session_start_time') || '';
  });
  const [isSplitMode, setIsSplitMode] = useState(false);
  const [splitType, setSplitType] = useState<'equal' | 'item'>('equal');
  const [splitGuests, setSplitGuests] = useState(2);
  const [selectedSplitItems, setSelectedSplitItems] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const fetchTableOrders = (liveOrders: Order[]) => {
      if (tableNumber) {
        const tableOrders = liveOrders.filter(o => 
          o.tableNumber === tableNumber &&
          (!sessionStartTime || new Date(o.createdAt).getTime() >= new Date(sessionStartTime).getTime())
        );
        setPlacedOrdersList(tableOrders);
        
        // Auto-complete dining screen if we are actively tracking an order in this session,
        // and all active orders for this table are paid
        const activeOrders = tableOrders.filter(o => o.status !== 'cancelled');
        const unpaidActiveOrders = activeOrders.filter(o => o.paymentStatus !== 'paid');
        if (placedOrderId && activeOrders.length > 0 && unpaidActiveOrders.length === 0) {
          setHasCompletedDining(true);
        }

        // Auto-reconnect latest order state if exists and is unpaid
        const unpaidOrders = tableOrders.filter(o => o.paymentStatus !== 'paid' && o.status !== 'cancelled');
        if (!placedOrderId && unpaidOrders.length > 0) {
          const sorted = [...unpaidOrders].sort((a, b) => 
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
          setPlacedOrderId(sorted[0].id);
        }
      }
    };

    // Load initial data
    setMenuItems(getMenuItems());
    fetchTableOrders(getOrders());
    if (tableNumber) {
      setSharedCart(getSharedCart(tableNumber));
    }

    const handleSync = (data: { orders: Order[]; menu: MenuItem[]; carts: Record<string, SharedCartItem[]> }) => {
      fetchTableOrders(data.orders);
      setMenuItems(data.menu);
      if (tableNumber && data.carts) {
        setSharedCart(data.carts[tableNumber] || []);
      }
    };

    const unsubscribe = subscribeToDatabase(handleSync);
    return () => unsubscribe();
  }, [placedOrderId, tableNumber, sessionStartTime]);

  // Derived cart list representing the shared cart
  const cart: OrderItem[] = sharedCart.map(item => {
    const menuItem = menuItems.find(m => m.id === item.menuItemId);
    return menuItem ? { 
      menuItem, 
      quantity: item.quantity,
      addedBy: item.addedBy 
    } as any : null;
  }).filter(Boolean) as OrderItem[];

  const addToCart = (item: MenuItem) => {
    if (!tableNumber) return;
    const currentShared = getSharedCart(tableNumber);
    const existingIndex = currentShared.findIndex(i => i.menuItemId === item.id && i.addedBy === (guestName || 'Guest'));
    if (existingIndex !== -1) {
      currentShared[existingIndex].quantity += 1;
    } else {
      currentShared.push({
        menuItemId: item.id,
        quantity: 1,
        addedBy: guestName || 'Guest'
      });
    }
    updateSharedCart(tableNumber, currentShared);
  };

  const updateQuantity = (itemId: string, amount: number) => {
    if (!tableNumber) return;
    const currentShared = getSharedCart(tableNumber);
    const index = currentShared.findIndex(i => i.menuItemId === itemId && i.addedBy === (guestName || 'Guest'));
    if (index !== -1) {
      const newQty = currentShared[index].quantity + amount;
      if (newQty > 0) {
        currentShared[index].quantity = newQty;
      } else {
        currentShared.splice(index, 1);
      }
      updateSharedCart(tableNumber, currentShared);
    }
  };

  const removeFromCart = (itemId: string) => {
    if (!tableNumber) return;
    const currentShared = getSharedCart(tableNumber);
    const updated = currentShared.filter(i => !(i.menuItemId === itemId && i.addedBy === (guestName || 'Guest')));
    updateSharedCart(tableNumber, updated);
  };

  const triggerSmsNotification = (orders: Order[], totalAmount: number) => {
    const orderIds = orders.map(o => o.id).join(', ');
    const itemsSummary = orders.flatMap(o => o.items).map(item => `${item.quantity}x ${item.menuItem.name}`).join(', ');
    const smsBody = `Roadies Koffeehouz: Table ${tableNumber} has paid their bill! Orders: [${orderIds}]. Items: [${itemsSummary}]. Grand Total: ₹${totalAmount}.`;

    console.log(`[SMS Client] Dispatching notification to owner: "${smsBody}"`);

    fetch('/api/sms', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ to: '7989793092', body: smsBody })
    }).catch(err => console.warn('SMS log sync server offline', err));

    alert(`📲 [SMS SENT TO OWNER 7989793092]\n\n"${smsBody}"`);
  };

  const cartTotal = cart.reduce((acc, item) => acc + item.menuItem.price * item.quantity, 0);

  const handleCheckout = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tableNumber.trim()) {
      alert("Please enter your table number.");
      return;
    }
    if (cart.length === 0) {
      alert("Your cart is empty.");
      return;
    }

    // Save and Lock table number in session
    sessionStorage.setItem('roadies_table_number', tableNumber);
    setIsTableLocked(true);

    // Immediate counter checkout (payment will be done post-meals)
    const newOrder = createOrder(tableNumber, cart, 'counter', 'pending');
    setPlacedOrderId(newOrder.id);
    setIsShowingActiveOrder(true);
    clearSharedCart(tableNumber);
    setIsCartOpen(false);
  };

  const filteredItems = selectedCategory === 'all' 
    ? menuItems.filter(item => item.inStock !== false) 
    : menuItems.filter(item => item.category === selectedCategory && item.inStock !== false);

  const categories = [
    { id: 'all', label: 'All Items', icon: Coffee },
    { id: 'coffee', label: 'Coffee', icon: Coffee },
    { id: 'drinks', label: 'Drinks', icon: Flame },
    { id: 'pizza', label: 'Pizza', icon: Pizza },
    { id: 'pasta', label: 'Pasta', icon: Pizza },
    { id: 'sides', label: 'Sides', icon: Pizza },
    { id: 'dessert', label: 'Desserts', icon: Pizza },
  ];

  if (hasCompletedDining) {
    return (
      <div style={{
        minHeight: '100vh',
        backgroundColor: 'var(--bg-darkest)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px 20px',
        color: 'var(--text-primary)',
        textAlign: 'center'
      }}>
        <div className="glass-panel" style={{
          maxWidth: '500px',
          width: '100%',
          borderRadius: 'var(--radius-lg)',
          padding: '40px',
          border: '1px solid var(--border-color)',
          animation: 'fadeIn 0.5s ease-out'
        }}>
          <div style={{ 
            width: '70px', 
            height: '70px', 
            backgroundColor: 'rgba(16, 185, 129, 0.1)', 
            color: 'var(--success)', 
            borderRadius: '50%', 
            display: 'inline-flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            marginBottom: '24px'
          }}>
            <Check size={36} />
          </div>
          <h1 style={{ fontSize: '2.2rem', fontWeight: 800, margin: '0 0 12px 0' }} className="gradient-text">
            Thank You!
          </h1>
          <p style={{ fontSize: '1.1rem', color: 'var(--text-secondary)', marginBottom: '30px', lineHeight: 1.6 }}>
            We received your payment successfully. We hope you loved dining with us at Roadies Koffeehouz. Please visit us again!
          </p>
          <button 
            onClick={() => {
              // Return to menu while keeping session start time so previous bills remain visible
              setPlacedOrderId(null);
              setHasCompletedDining(false);
              setIsSettlingBillOpen(false);
              setBillPaymentMethod(null);
            }}
            className="btn btn-primary"
            style={{ width: '100%', padding: '12px', marginBottom: '12px', fontWeight: 700 }}
          >
            🍔 Order Again (Back to Menu)
          </button>
          <button 
            onClick={() => {
              sessionStorage.removeItem('roadies_table_number');
              sessionStorage.removeItem('roadies_guest_name');
              sessionStorage.removeItem('roadies_session_start_time');
              setTableNumber('');
              setGuestName('');
              setSessionStartTime('');
              setIsTableLocked(false);
              setPlacedOrderId(null);
              setPlacedOrdersList([]);
              setHasCompletedDining(false);
              setIsSettlingBillOpen(false);
              setBillPaymentMethod(null);
            }}
            className="btn btn-secondary"
            style={{ width: '100%', padding: '12px', fontWeight: 600 }}
          >
            🚪 Exit / Change Table
          </button>
        </div>
      </div>
    );
  }



  if (!tableNumber) {
    return (
      <div key="table-select-screen" style={{
        minHeight: '100vh',
        backgroundColor: 'var(--bg-darkest)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px'
      }}>
        <div className="glass-panel animate-fade" style={{
          maxWidth: '400px',
          width: '100%',
          borderRadius: 'var(--radius-lg)',
          padding: '36px 30px',
          border: '1px solid var(--border-color)',
          textAlign: 'center',
          boxShadow: '0 10px 30px rgba(0,0,0,0.5)'
        }}>
          <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'center' }}>
            <img src="/logo.png" alt="Roadies Koffeehouz Logo" style={{ height: '90px', objectFit: 'contain' }} />
          </div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: '6px' }} className="gradient-text">
            WELCOME TO ROADIES
          </h2>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '24px' }}>
            Please select your table number to start ordering.
          </p>

          <form onSubmit={(e) => {
            e.preventDefault();
            const inputTable = (document.getElementById('table-number-input') as HTMLInputElement).value.trim();
            if (inputTable) {
              const time = new Date().toISOString();
              sessionStorage.setItem('roadies_table_number', inputTable);
              sessionStorage.setItem('roadies_session_start_time', time);
              setTableNumber(inputTable);
              setSessionStartTime(time);
              setIsTableLocked(true);
            }
          }} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <input
              id="table-number-input"
              type="text"
              required
              placeholder="e.g. 1, 2, 3..."
              style={{
                width: '100%',
                backgroundColor: 'var(--bg-card)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-md)',
                padding: '12px 14px',
                color: 'white',
                fontSize: '1rem',
                textAlign: 'center'
              }}
              autoFocus
            />

            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: '100%', padding: '12px', borderRadius: 'var(--radius-md)', fontSize: '0.9rem', fontWeight: 700 }}
            >
              Select Table
            </button>
          </form>
        </div>
      </div>
    );
  }

  if (tableNumber && !guestName) {
    return (
      <div key="guest-name-screen" style={{
        minHeight: '100vh',
        backgroundColor: 'var(--bg-darkest)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px'
      }}>
        <div className="glass-panel animate-fade" style={{
          maxWidth: '400px',
          width: '100%',
          borderRadius: 'var(--radius-lg)',
          padding: '36px 30px',
          border: '1px solid var(--border-color)',
          textAlign: 'center',
          boxShadow: '0 10px 30px rgba(0,0,0,0.5)'
        }}>
          <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'center' }}>
            <img src="/logo.png" alt="Roadies Koffeehouz Logo" style={{ height: '90px', objectFit: 'contain' }} />
          </div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: '6px' }} className="gradient-text">
            JOIN TABLE {tableNumber}
          </h2>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '24px' }}>
            Enter your name to start ordering together with your table members.
          </p>

          <form onSubmit={(e) => {
            e.preventDefault();
            const inputName = (document.getElementById('guest-name-input') as HTMLInputElement).value.trim();
            if (inputName) {
              sessionStorage.setItem('roadies_guest_name', inputName);
              setGuestName(inputName);
              if (!sessionStorage.getItem('roadies_session_start_time')) {
                const time = new Date().toISOString();
                sessionStorage.setItem('roadies_session_start_time', time);
                setSessionStartTime(time);
              }
            }
          }} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <input
              id="guest-name-input"
              type="text"
              required
              placeholder="e.g. Rahul, Priya"
              style={{
                width: '100%',
                backgroundColor: 'var(--bg-card)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-md)',
                padding: '12px 14px',
                color: 'white',
                fontSize: '1rem',
                textAlign: 'center'
              }}
              autoFocus
            />

            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: '100%', padding: '12px', borderRadius: 'var(--radius-md)', fontSize: '0.9rem', fontWeight: 700 }}
            >
              Enter Dine-In Menu
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', position: 'relative', backgroundColor: 'transparent' }}>
      <AmbientBackground />
      {/* Top Header Bar */}
      <header className="glass-panel header-container" style={{ position: 'relative', zIndex: 10 }}>
        <div style={{ textAlign: 'left' }}>
          <h1 className="header-title-text" style={{ 
            fontSize: '1.25rem', 
            fontWeight: 800, 
            letterSpacing: '0.5px', 
            background: 'linear-gradient(to right, #ffffff 35%, #a1a1aa 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            margin: 0,
            textTransform: 'uppercase'
          }}>
            ROADIES KOFFEEHOUZ
          </h1>
          <p className="header-subtitle-text" style={{ fontSize: '0.62rem', letterSpacing: '1px', color: '#71717a', margin: '2px 0 0 0', textTransform: 'uppercase', fontWeight: 600 }}>
            Kharghar, Navi Mumbai
          </p>
        </div>

        <div className="header-right-actions">
          {/* Table Badge */}
          {tableNumber ? (
            <div className="table-badge-container" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>Table {tableNumber}</span>
              <button
                onClick={() => {
                  sessionStorage.removeItem('roadies_table_number');
                  sessionStorage.removeItem('roadies_guest_name');
                  sessionStorage.removeItem('roadies_session_start_time');
                  setTableNumber('');
                  setGuestName('');
                  setSessionStartTime('');
                  setIsTableLocked(false);
                  
                  // Clear URL parameter so it doesn't auto-lock again on reload
                  const url = new URL(window.location.href);
                  url.searchParams.delete('table');
                  window.history.replaceState({}, '', url.toString());
                }}
                style={{
                  background: 'rgba(255, 255, 255, 0.1)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  color: '#ffffff',
                  fontSize: '0.65rem',
                  padding: '2px 8px',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontWeight: 600,
                  transition: 'all 0.2s'
                }}
              >
                Change
              </button>
            </div>
          ) : (
            <div style={{ 
              fontSize: '0.8rem', 
              color: 'var(--danger)', 
              display: 'flex', 
              alignItems: 'center', 
              gap: '4px',
              backgroundColor: 'rgba(239, 68, 68, 0.08)',
              padding: '6px 12px',
              borderRadius: 'var(--radius-md)',
              border: '1px solid rgba(239, 68, 68, 0.15)'
            }}>
              <AlertTriangle size={14} /> Scan QR or Enter Table
            </div>
          )}

          {/* Service Bell Trigger */}
          {tableNumber && (
            <button 
              onClick={() => {
                setIsServiceBellOpen(true);
                setBellAlertSent(false);
              }}
              style={{ 
                backgroundColor: 'var(--bg-card)', 
                border: '1px solid var(--border-color)', 
                color: '#ffffff', 
                width: '40px', 
                height: '40px', 
                borderRadius: 'var(--radius-full)', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                cursor: 'pointer',
                marginRight: '4px'
              }}
              title="Call Waiter / Request Bill"
            >
              <Bell size={18} />
            </button>
          )}

          {/* Placed Orders Bill Trigger */}
          {placedOrdersList.length > 0 && (
            <button 
              onClick={() => setIsMyOrdersOpen(true)}
              style={{ 
                backgroundColor: 'var(--bg-card)', 
                border: '1px solid var(--border-color)', 
                color: '#ffffff', 
                width: '40px', 
                height: '40px', 
                borderRadius: 'var(--radius-full)', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                cursor: 'pointer',
                position: 'relative',
                marginRight: '4px'
              }}
              title="My Orders & Bill"
            >
              <Receipt size={18} />
              <span style={{ 
                position: 'absolute', 
                top: '-4px', 
                right: '-4px', 
                backgroundColor: '#ffffff', 
                color: '#000000', 
                fontSize: '0.65rem', 
                fontWeight: 800, 
                width: '18px', 
                height: '18px', 
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                {placedOrdersList.length}
              </span>
            </button>
          )}

          {/* Cart Trigger */}
          {cart.length > 0 && (
            <button 
              onClick={() => setIsCartOpen(true)}
              style={{ 
                position: 'relative', 
                backgroundColor: '#ffffff', 
                color: '#000000', 
                width: '40px', 
                height: '40px', 
                borderRadius: 'var(--radius-full)', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                cursor: 'pointer',
                boxShadow: '0 0 10px rgba(255, 255, 255, 0.25)'
              }}
            >
              <ShoppingBag size={18} />
              <span style={{ 
                position: 'absolute', 
                top: '-4px', 
                right: '-4px', 
                backgroundColor: 'white', 
                color: 'black', 
                fontSize: '0.7rem', 
                fontWeight: 800, 
                width: '18px', 
                height: '18px', 
                borderRadius: '50%', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center' 
              }}>
                {cart.reduce((sum, item) => sum + item.quantity, 0)}
              </span>
            </button>
          )}
        </div>
      </header>

      {/* Immersive Hero Landing Section */}
      <section style={{
        height: 'calc(100vh - 80px)',
        minHeight: '520px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        zIndex: 10,
        textAlign: 'center',
        padding: '20px',
        color: '#ffffff'
      }}>
        <div style={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(to bottom, rgba(19, 19, 23, 0.1) 0%, rgba(19, 19, 23, 0.55) 100%)',
          pointerEvents: 'none',
          zIndex: -1
        }} />

        <span style={{
          fontSize: '0.72rem',
          letterSpacing: '6px',
          textTransform: 'uppercase',
          color: 'var(--text-secondary)',
          fontWeight: 700,
          marginBottom: '12px',
          opacity: 0.85
        }}>
          AUTHENTIC BIKE CAFE & COFFEE
        </span>

        <h1 style={{
          fontSize: 'clamp(3rem, 10vw, 5rem)',
          fontWeight: 900,
          lineHeight: '1.05',
          letterSpacing: '6px',
          margin: '0 0 12px 0',
          fontFamily: 'var(--font-serif)',
          textTransform: 'uppercase',
          textShadow: '0 0 40px rgba(255, 255, 255, 0.45), 0 0 10px rgba(255, 255, 255, 0.2)'
        }}>
          <TextScramble duration={1.6} characterSet="ABCDEFGHIJKLMNOPQRSTUVWXYZ">
            ROADIES
          </TextScramble>
        </h1>

        <div style={{
          fontSize: '0.78rem',
          letterSpacing: '8px',
          color: '#ffffff',
          opacity: 0.6,
          textTransform: 'uppercase',
          fontWeight: 600,
          marginBottom: '18px'
        }}>
          रोडीज़ | ਰੋਡੀਜ਼
        </div>

        <p style={{
          fontFamily: 'var(--font-serif)',
          fontStyle: 'italic',
          fontSize: '1.25rem',
          color: 'var(--text-primary)',
          opacity: 0.95,
          margin: '0 0 20px 0',
          letterSpacing: '1px'
        }}>
          The Art of Coffee & Rides
        </p>

        <span style={{
          fontSize: '0.6rem',
          letterSpacing: '4px',
          color: 'var(--text-muted)',
          textTransform: 'uppercase',
          fontWeight: 700,
          display: 'block',
          marginBottom: '42px'
        }}>
          VIBE • COMMUNITY • CRAFT
        </span>

        <button
          onClick={() => {
            document.getElementById('menu-section')?.scrollIntoView({ behavior: 'smooth' });
          }}
          className="btn btn-primary animate-pulse"
          style={{
            padding: '16px 44px',
            fontSize: '0.92rem',
            borderRadius: 'var(--radius-full)',
            letterSpacing: '2px',
            fontWeight: 800,
            boxShadow: '0 0 22px rgba(255, 255, 255, 0.5), 0 0 8px rgba(255, 255, 255, 0.2)'
          }}
        >
          GO TO MENU
        </button>
      </section>

      {/* Main Content Area */}
      <main id="menu-section" className="container" style={{ flex: 1, padding: '24px 20px', paddingBottom: '100px', position: 'relative', zIndex: 10 }}>

        {/* Placed Order Status banner */}
        {placedOrder && isShowingActiveOrder && (
          <div className="glass-panel" style={{ 
            borderRadius: 'var(--radius-lg)', 
            padding: '20px', 
            marginBottom: '30px', 
            borderLeft: '4px solid var(--primary)',
            animation: 'fadeIn 0.5s ease-out'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
              <div>
                <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Active Order</span>
                <h3 style={{ fontSize: '1.1rem', margin: 0, fontWeight: 700 }}>{placedOrder.id}</h3>
              </div>
              <span className={`badge badge-${placedOrder.status}`}>{placedOrder.status}</span>
            </div>

            {/* Stepper tracker */}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '20px', position: 'relative' }}>
              <div style={{ 
                position: 'absolute', 
                top: '12px', 
                left: '20px', 
                right: '20px', 
                height: '2px', 
                backgroundColor: 'var(--border-color)', 
                zIndex: 1 
              }} />
              
              {/* Progress Line */}
              <div style={{ 
                position: 'absolute', 
                top: '12px', 
                left: '20px', 
                width: placedOrder.status === 'pending' ? '0%' : placedOrder.status === 'preparing' ? '50%' : '100%', 
                height: '2px', 
                backgroundColor: 'var(--primary)', 
                zIndex: 1,
                transition: 'width 0.4s ease'
              }} />

              {/* Steps */}
              {[
                { status: 'pending', label: 'Order Sent', icon: Check },
                { status: 'preparing', label: 'Preparing', icon: ChefHat },
                { status: 'served', label: 'Served', icon: Clock }
              ].map((step, idx) => {
                const isCompleted = 
                  placedOrder.status === 'served' ||
                  (placedOrder.status === 'preparing' && step.status !== 'served') ||
                  (placedOrder.status === 'pending' && step.status === 'pending');
                const isCurrent = placedOrder.status === step.status;
                const StepIcon = step.icon;

                return (
                  <div key={idx} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 2 }}>
                    <div style={{ 
                      width: '26px', 
                      height: '26px', 
                      borderRadius: '50%', 
                      backgroundColor: isCompleted ? 'var(--primary)' : 'var(--bg-card)', 
                      border: `2px solid ${isCurrent ? 'var(--primary)' : 'var(--border-color)'}`,
                      color: isCompleted ? 'var(--bg-darkest)' : 'var(--text-muted)',
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center',
                      transition: 'all 0.3s ease'
                    }}>
                      <StepIcon size={12} />
                    </div>
                    <span style={{ 
                      fontSize: '0.7rem', 
                      marginTop: '6px', 
                      fontWeight: isCurrent ? 700 : 500,
                      color: isCurrent ? 'var(--primary)' : 'var(--text-secondary)'
                    }}>
                      {step.label}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Order Items Summary */}
            <div style={{
              marginTop: '24px',
              backgroundColor: 'rgba(0, 0, 0, 0.2)',
              borderRadius: 'var(--radius-md)',
              padding: '16px',
              border: '1px solid var(--border-color)',
              textAlign: 'left'
            }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--primary)', display: 'block', marginBottom: '10px', letterSpacing: '0.05em' }}>
                ORDER SUMMARY
              </span>
              {placedOrder.items.map((item, idx) => (
                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: '0.85rem', borderBottom: idx !== placedOrder.items.length - 1 ? '1px solid rgba(255, 255, 255, 0.03)' : 'none' }}>
                  <span>
                    <strong style={{ color: 'var(--primary)', marginRight: '6px' }}>{item.quantity}x</strong> 
                    {item.menuItem.name}
                  </span>
                  <span style={{ color: 'var(--text-secondary)' }}>₹{item.menuItem.price * item.quantity}</span>
                </div>
              ))}
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '12px', paddingTop: '10px', borderTop: '1px solid rgba(255, 255, 255, 0.08)', fontWeight: 700, fontSize: '0.95rem' }}>
                <span>Total Amount</span>
                <span style={{ color: 'var(--primary)' }}>₹{placedOrder.totalAmount}</span>
              </div>
            </div>
            
            {placedOrder.status === 'served' ? (
              <div style={{ marginTop: '20px', textAlign: 'center' }}>
                <button 
                  onClick={() => setPlacedOrderId(null)} 
                  className="btn btn-secondary" 
                  style={{ width: '100%', fontSize: '0.85rem' }}
                >
                  Order Received - Back to Menu
                </button>
              </div>
            ) : (
              <div style={{ marginTop: '20px', textAlign: 'center' }}>
                <button 
                  onClick={() => setPlacedOrderId(null)} 
                  className="btn btn-secondary" 
                  style={{ width: '100%', fontSize: '0.85rem', backgroundColor: 'transparent', borderColor: 'var(--border-color)' }}
                >
                  Order Running - View Menu
                </button>
              </div>
            )}
          </div>
        )}

        {/* Category Pills Slider */}
        <div style={{ 
          display: 'flex', 
          gap: '8px', 
          overflowX: 'auto', 
          paddingBottom: '12px',
          marginBottom: '24px',
          scrollbarWidth: 'none'
        }}>
          {categories.map(cat => {
            const isActive = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                style={{
                  padding: '8px 16px',
                  borderRadius: 'var(--radius-full)',
                  backgroundColor: isActive ? '#ffffff' : 'var(--bg-card)',
                  color: isActive ? '#000000' : 'var(--text-primary)',
                  fontWeight: isActive ? 700 : 600,
                  fontSize: '0.85rem',
                  whiteSpace: 'nowrap',
                  cursor: 'pointer',
                  border: isActive ? 'none' : '1px solid var(--border-color)',
                  boxShadow: isActive ? '0 0 15px rgba(255, 255, 255, 0.45), 0 2px 6px rgba(0, 0, 0, 0.4)' : 'none',
                  transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)'
                }}
              >
                {cat.label}
              </button>
            );
          })}
        </div>

        {/* Carousel Menu Layout */}
        <div style={{ marginTop: '10px', marginBottom: '30px' }}>
          <Carousel
            items={filteredItems.map((item, idx) => {
              const cartItem = cart.find(i => i.menuItem.id === item.id);
              const testimonialItem = {
                id: item.id,
                name: item.name,
                price: item.price,
                category: item.category,
                description: item.description,
                profileImage: item.image || 'https://images.unsplash.com/photo-1541167760496-1628856ab772?w=500&auto=format&fit=crop',
                popular: item.popular
              };

              return (
                <TestimonialCard
                  key={item.id}
                  testimonial={testimonialItem}
                  index={idx}
                  cartQuantity={cartItem ? cartItem.quantity : 0}
                  onAdd={() => addToCart(item)}
                  onRemove={() => updateQuantity(item.id, -1)}
                  themeColor="var(--primary)"
                />
              );
            })}
          />
        </div>

        {/* Premium Visual Footer */}
        <footer style={{
          marginTop: '40px',
          borderRadius: 'var(--radius-lg)',
          overflow: 'hidden',
          border: '1px solid var(--border-color)',
          background: 'linear-gradient(180deg, rgba(30, 30, 30, 0.4) 0%, rgba(10, 10, 10, 0.8) 100%)',
          position: 'relative'
        }}>
          <div style={{
            height: '160px',
            backgroundImage: 'url(/storefront.jpg)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            position: 'relative'
          }}>
            <div style={{
              position: 'absolute',
              inset: 0,
              background: 'linear-gradient(to bottom, transparent, rgba(10, 10, 10, 0.95))'
            }} />
            <div style={{
              position: 'absolute',
              bottom: '16px',
              left: '20px',
              right: '20px'
            }}>
              <span style={{
                fontSize: '0.65rem',
                textTransform: 'uppercase',
                letterSpacing: '1.5px',
                color: 'var(--primary)',
                fontWeight: 700
              }}>Premium Cafe Experience</span>
              <h3 style={{ fontSize: '1.3rem', fontWeight: 800, margin: '4px 0 0 0', color: '#fff' }}>Roadies Koffeehouz</h3>
            </div>
          </div>
          <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '2px' }}>TIMINGS</span>
                <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-primary)' }}>10:00 AM - 11:00 PM (Daily)</span>
              </div>
              <div>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '2px' }}>CONTACT</span>
                <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-primary)' }}>+91 99309 82229</span>
              </div>
            </div>
            <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.05)', paddingTop: '12px', fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
              Sector 15, Kharghar, Navi Mumbai • Crafted with love & premium ingredients.
            </div>
          </div>
        </footer>
      </main>

      {/* Cart Drawer */}
      {isCartOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.65)',
          backdropFilter: 'blur(4px)',
          zIndex: 100,
          display: 'flex',
          justifyContent: 'flex-end'
        }} onClick={() => setIsCartOpen(false)}>
          <div 
            style={{
              width: '100%',
              maxWidth: '450px',
              height: '100%',
              backgroundColor: 'var(--bg-dark)',
              borderLeft: '1px solid var(--border-color)',
              display: 'flex',
              flexDirection: 'column',
              padding: '24px',
              boxShadow: '-10px 0 30px rgba(0, 0, 0, 0.5)',
              animation: 'slideInRight 0.25s cubic-bezier(0.4, 0, 0.2, 1)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Cart Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ShoppingBag size={20} /> Your Order
              </h3>
              <button 
                onClick={() => setIsCartOpen(false)}
                style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', cursor: 'pointer' }}
              >
                Close
              </button>
            </div>

            {/* Cart Items List */}
            <div style={{ flex: 1, overflowY: 'auto', marginBottom: '20px' }}>
              {cart.map((item, idx) => (
                <div 
                  key={idx} 
                  style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center', 
                    padding: '12px 0', 
                    borderBottom: '1px solid var(--border-color)' 
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                      <h5 style={{ fontSize: '0.95rem', fontWeight: 600, margin: 0 }}>{item.menuItem.name}</h5>
                      <span style={{ 
                        fontSize: '0.65rem', 
                        backgroundColor: 'rgba(255,255,255,0.05)', 
                        color: 'var(--text-secondary)',
                        padding: '1px 6px',
                        borderRadius: '4px',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '3px',
                        fontWeight: 600
                      }}>
                        <Users size={10} /> {(item as any).addedBy || 'Guest'}
                      </span>
                    </div>
                    <span style={{ fontSize: '0.8rem', color: 'var(--primary)', fontWeight: 600 }}>₹{item.menuItem.price}</span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      backgroundColor: 'var(--bg-card)', 
                      borderRadius: 'var(--radius-full)', 
                      border: '1px solid var(--border-color)' 
                    }}>
                      <button 
                        onClick={() => updateQuantity(item.menuItem.id, -1)}
                        style={{ padding: '6px 10px', color: 'var(--text-secondary)', cursor: 'pointer' }}
                      >
                        <Minus size={12} />
                      </button>
                      <span style={{ fontSize: '0.9rem', width: '20px', textAlign: 'center', fontWeight: 600 }}>
                        {item.quantity}
                      </span>
                      <button 
                        onClick={() => updateQuantity(item.menuItem.id, 1)}
                        style={{ padding: '6px 10px', color: 'var(--text-secondary)', cursor: 'pointer' }}
                      >
                        <Plus size={12} />
                      </button>
                    </div>

                    <button 
                      onClick={() => removeFromCart(item.menuItem.id)}
                      style={{ color: 'var(--danger)', padding: '6px', cursor: 'pointer' }}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}

              {cart.length === 0 && (
                <div style={{ textAlign: 'center', color: 'var(--text-muted)', marginTop: '40px' }}>
                  Your cart is empty. Fill it with good vibes!
                </div>
              )}
            </div>

            {/* Cart Footer / Checkout Form */}
            {cart.length > 0 && (
              <form onSubmit={handleCheckout} style={{ borderTop: '1px solid var(--border-color)', paddingTop: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                  <span>Subtotal</span>
                  <span>₹{cartTotal}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                  <span>CGST (2.5%)</span>
                  <span>₹{(cartTotal * 0.025).toFixed(2)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                  <span>SGST (2.5%)</span>
                  <span>₹{(cartTotal * 0.025).toFixed(2)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px', fontSize: '1.2rem', fontWeight: 800 }}>
                  <span>Grand Total (Incl. GST)</span>
                  <span style={{ color: 'var(--primary)' }}>₹{Math.round(cartTotal * 1.05)}</span>
                </div>

                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '6px', fontWeight: 600 }}>
                    TABLE NUMBER
                  </label>
                  {isTableLocked ? (
                    <div style={{ 
                      backgroundColor: 'rgba(255,255,255,0.03)', 
                      border: '1px solid var(--border-color)', 
                      borderRadius: 'var(--radius-md)', 
                      padding: '12px',
                      color: 'var(--text-secondary)',
                      fontSize: '0.95rem',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}>
                      <span style={{ fontWeight: 700, color: 'var(--primary)' }}>Table {tableNumber}</span>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Locked Securely</span>
                    </div>
                  ) : (
                    <input 
                      type="text" 
                      required 
                      value={tableNumber}
                      onChange={(e) => setTableNumber(e.target.value)}
                      placeholder="e.g. 5"
                      style={{ 
                        width: '100%', 
                        backgroundColor: 'var(--bg-card)', 
                        border: '1px solid var(--border-color)', 
                        borderRadius: 'var(--radius-md)', 
                        padding: '12px',
                        color: 'white',
                        fontSize: '0.95rem'
                      }}
                    />
                  )}
                  <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '6px' }}>
                    * Locked table protects order routing and waiter serving accuracy.
                  </p>
                </div>

                <button 
                  type="submit" 
                  className="btn btn-primary" 
                  style={{ width: '100%', padding: '14px', borderRadius: 'var(--radius-md)' }}
                >
                  Send Order to Waiter • ₹{Math.round(cartTotal * 1.05)}
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* My Orders / Bill Drawer */}
      {isMyOrdersOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.65)',
          backdropFilter: 'blur(4px)',
          zIndex: 100,
          display: 'flex',
          justifyContent: 'flex-end'
        }} onClick={() => setIsMyOrdersOpen(false)}>
          <div 
            style={{
              width: '100%',
              maxWidth: '450px',
              height: '100%',
              backgroundColor: 'var(--bg-dark)',
              borderLeft: '1px solid var(--border-color)',
              display: 'flex',
              flexDirection: 'column',
              padding: '24px',
              boxShadow: '-10px 0 30px rgba(0, 0, 0, 0.5)',
              animation: 'slideInRight 0.25s cubic-bezier(0.4, 0, 0.2, 1)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Drawer Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Receipt size={20} /> Table {tableNumber} Bill
                </h3>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>All orders placed in this session</p>
              </div>
              <button 
                onClick={() => setIsMyOrdersOpen(false)}
                style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', cursor: 'pointer' }}
              >
                Close
              </button>
            </div>

            {/* Orders List */}
            <div style={{ flex: 1, overflowY: 'auto', marginBottom: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {[...placedOrdersList].sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).map((order, idx) => (
                <div 
                  key={idx} 
                  style={{ 
                    backgroundColor: 'rgba(255,255,255,0.02)', 
                    border: '1px solid var(--border-color)', 
                    borderRadius: 'var(--radius-md)', 
                    padding: '16px',
                    cursor: 'pointer'
                  }}
                  onClick={() => {
                    setPlacedOrderId(order.id);
                    setIsShowingActiveOrder(true);
                    setIsMyOrdersOpen(false);
                  }}
                  title="Click to track live status"
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                    <span style={{ fontSize: '0.85rem', fontWeight: 700 }}>{order.id}</span>
                    <span className={`badge badge-${order.status}`} style={{ fontSize: '0.65rem' }}>{order.status}</span>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', borderBottom: '1px solid rgba(255,255,255,0.03)', paddingBottom: '8px', marginBottom: '8px' }}>
                    {order.items.map((item, itemIdx) => (
                      <div key={itemIdx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                        <span>{item.quantity}x {item.menuItem.name}</span>
                        <span>₹{item.menuItem.price * item.quantity}</span>
                      </div>
                    ))}
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', fontWeight: 700 }}>
                    <span>Amount</span>
                    <span style={{ color: 'var(--primary)' }}>₹{order.totalAmount}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Total Accumulation */}
            {(() => {
              const activeOrders = placedOrdersList.filter(o => o.status !== 'cancelled');
              const combinedSubtotal = activeOrders.reduce((sum, o) => sum + o.items.reduce((itemSum, item) => itemSum + item.menuItem.price * item.quantity, 0), 0);
              const combinedCgst = combinedSubtotal * 0.025;
              const combinedSgst = combinedSubtotal * 0.025;
              const combinedGrandTotal = activeOrders.reduce((sum, o) => sum + o.totalAmount, 0);
              const unpaidActiveOrders = activeOrders.filter(o => o.paymentStatus !== 'paid');

              return (
                <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                    <span>Total Placed Orders</span>
                    <span>{placedOrdersList.length}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                    <span>Base Subtotal</span>
                    <span>₹{combinedSubtotal}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                    <span>CGST (2.5%)</span>
                    <span>₹{combinedCgst.toFixed(2)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                    <span>SGST (2.5%)</span>
                    <span>₹{combinedSgst.toFixed(2)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px', fontSize: '1.25rem', fontWeight: 800 }}>
                    <span>Grand Total (Bill)</span>
                    <span style={{ color: 'var(--primary)' }}>
                      ₹{combinedGrandTotal}
                    </span>
                  </div>

                  {unpaidActiveOrders.length > 0 ? (
                    <button 
                      onClick={() => {
                        setIsSettlingBillOpen(true);
                        setBillPaymentMethod(null);
                        setIsMyOrdersOpen(false);
                      }}
                      className="btn btn-primary"
                      style={{ width: '100%', padding: '14px', borderRadius: 'var(--radius-md)', marginTop: '10px' }}
                    >
                      💳 Pay Bill • ₹{combinedGrandTotal}
                    </button>
                  ) : (
                    <p style={{ fontSize: '0.85rem', color: 'var(--success)', textAlign: 'center', marginTop: '12px', fontWeight: 600 }}>
                      ✔ All orders paid. Thank you!
                    </p>
                  )}
                </div>
              );
            })()}
              
              <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textAlign: 'center', marginTop: '10px' }}>
                * Excludes cancelled orders. Thank you for dining with us!
              </p>
            </div>
          </div>
        )}

      {/* Service Bell Modal Overlay */}
      {isServiceBellOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.75)',
          backdropFilter: 'blur(6px)',
          zIndex: 200,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px'
        }} onClick={() => setIsServiceBellOpen(false)}>
          <div 
            className="glass-panel" 
            style={{
              maxWidth: '400px',
              width: '100%',
              borderRadius: 'var(--radius-lg)',
              padding: '30px',
              textAlign: 'center',
              border: '1px solid var(--border-color)',
              animation: 'fadeIn 0.2s ease-out'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ 
              width: '56px', 
              height: '56px', 
              backgroundColor: 'var(--primary-light)', 
              color: 'var(--primary)', 
              borderRadius: '50%', 
              display: 'inline-flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              marginBottom: '16px'
            }}>
              <Bell size={26} />
            </div>

            {!bellAlertSent ? (
              <>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '8px' }}>Need Service?</h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '24px' }}>
                  Select an option below to notify the service staff at Table {tableNumber} immediately.
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <button 
                    onClick={() => {
                      createTableAlert(tableNumber, 'call_waiter');
                      setBellAlertSent(true);
                    }}
                    className="btn btn-primary"
                    style={{ width: '100%', padding: '12px' }}
                  >
                    🙋‍♂️ Call a Waiter
                  </button>
                  <button 
                    onClick={() => {
                      createTableAlert(tableNumber, 'request_bill');
                      setBellAlertSent(true);
                    }}
                    className="btn btn-secondary"
                    style={{ width: '100%', padding: '12px' }}
                  >
                    💳 Request the Bill
                  </button>
                  <button 
                    onClick={() => setIsServiceBellOpen(false)}
                    style={{ fontSize: '0.8rem', color: 'var(--text-muted)', cursor: 'pointer', marginTop: '8px' }}
                  >
                    Cancel
                  </button>
                </div>
              </>
            ) : (
              <>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '8px' }}>Request Sent!</h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--success)', marginBottom: '24px', fontWeight: 600 }}>
                  ✔ A waiter has been alerted and is heading to Table {tableNumber}.
                </p>
                <button 
                  onClick={() => setIsServiceBellOpen(false)}
                  className="btn btn-secondary"
                  style={{ width: '100%' }}
                >
                  Back to Menu
                </button>
              </>
            )}
          </div>
        </div>
      )}


      {/* Pay Bill / Settle Bill Modal Overlay */}
      {isSettlingBillOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.75)',
          backdropFilter: 'blur(6px)',
          zIndex: 200,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px'
        }} onClick={() => setIsSettlingBillOpen(false)}>
          <div 
            className="glass-panel" 
            style={{
              maxWidth: '400px',
              width: '100%',
              borderRadius: 'var(--radius-lg)',
              padding: '30px',
              textAlign: 'center',
              border: '1px solid var(--border-color)',
              animation: 'fadeIn 0.2s ease-out'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ 
              width: '56px', 
              height: '56px', 
              backgroundColor: 'var(--primary-light)', 
              color: 'var(--primary)', 
              borderRadius: '50%', 
              display: 'inline-flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              marginBottom: '16px'
            }}>
              <Receipt size={26} />
            </div>

            {billPaymentMethod === null ? (
              <>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '8px' }}>Settle Table Bill</h3>
                
                {/* Tab Switcher for Full Pay vs Split Bill */}
                <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', backgroundColor: 'rgba(255,255,255,0.02)', padding: '4px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
                  <button
                    onClick={() => setIsSplitMode(false)}
                    style={{
                      flex: 1,
                      padding: '8px',
                      borderRadius: '4px',
                      border: 'none',
                      backgroundColor: !isSplitMode ? 'var(--primary)' : 'transparent',
                      color: !isSplitMode ? 'var(--bg-darkest)' : 'var(--text-primary)',
                      fontSize: '0.8rem',
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                  >
                    Pay Full Bill
                  </button>
                  <button
                    onClick={() => setIsSplitMode(true)}
                    style={{
                      flex: 1,
                      padding: '8px',
                      borderRadius: '4px',
                      border: 'none',
                      backgroundColor: isSplitMode ? 'var(--primary)' : 'transparent',
                      color: isSplitMode ? 'var(--bg-darkest)' : 'var(--text-primary)',
                      fontSize: '0.8rem',
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                  >
                    Split Bill
                  </button>
                </div>

                {!isSplitMode ? (
                  <>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '20px' }}>
                      Choose how you would like to settle your total bill of <strong>₹{placedOrdersList.filter(o => o.status !== 'cancelled').reduce((sum, o) => sum + o.totalAmount, 0)}</strong> (incl. 5% GST).
                    </p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      <button 
                        onClick={() => {
                          const tableOrders = placedOrdersList.filter(o => o.status !== 'cancelled');
                          const totalAmt = tableOrders.reduce((sum, o) => sum + o.totalAmount, 0);
                          setBillPaymentMethod('paytm');
                          setPendingPaymentAction(() => () => {
                            tableOrders.forEach(o => updateOrderPaymentStatus(o.id, 'paid', 'upi'));
                            triggerSmsNotification(tableOrders, totalAmt);
                            setHasCompletedDining(true);
                            setPendingPaymentAction(null);
                          });
                        }}
                        className="btn btn-primary"
                        style={{ width: '100%', padding: '12px' }}
                      >
                        📲 Pay Online (UPI QR)
                      </button>
                      <button 
                        onClick={() => {
                          setBillPaymentMethod('card');
                          setTimeout(() => {
                            const tableOrders = placedOrdersList.filter(o => o.status !== 'cancelled');
                            tableOrders.forEach(o => updateOrderPaymentStatus(o.id, 'paid', 'card'));
                            setHasCompletedDining(true);
                          }, 4000);
                        }}
                        className="btn btn-secondary"
                        style={{ width: '100%', padding: '12px' }}
                      >
                        💳 Pay via Credit/Debit Card
                      </button>
                      <button 
                        onClick={() => {
                          setBillPaymentMethod('swiggy');
                          setTimeout(() => {
                            const tableOrders = placedOrdersList.filter(o => o.status !== 'cancelled');
                            tableOrders.forEach(o => updateOrderPaymentStatus(o.id, 'paid', 'swiggy'));
                            setHasCompletedDining(true);
                          }, 4000);
                        }}
                        className="btn btn-secondary"
                        style={{ width: '100%', padding: '12px', backgroundColor: 'rgba(252, 128, 25, 0.15)', borderColor: '#fc8019', color: '#fc8019' }}
                      >
                        🍊 Pay via Swiggy Dineout
                      </button>
                      <button 
                        onClick={() => {
                          setBillPaymentMethod('zomato');
                          setTimeout(() => {
                            const tableOrders = placedOrdersList.filter(o => o.status !== 'cancelled');
                            tableOrders.forEach(o => updateOrderPaymentStatus(o.id, 'paid', 'zomato'));
                            setHasCompletedDining(true);
                          }, 4000);
                        }}
                        className="btn btn-secondary"
                        style={{ width: '100%', padding: '12px', backgroundColor: 'rgba(203, 32, 45, 0.15)', borderColor: '#cb202d', color: '#cb202d' }}
                      >
                        🔴 Pay via Zomato Gold
                      </button>
                      <button 
                        onClick={() => {
                          setBillPaymentMethod('cash');
                          createTableAlert(tableNumber, 'request_bill');
                        }}
                        className="btn btn-secondary"
                        style={{ width: '100%', padding: '12px' }}
                      >
                        💵 Pay Cash to Waiter
                      </button>
                    </div>
                  </>
                ) : (
                  /* SPLIT BILL VIEW */
                  <>
                    {/* Split Type Selector */}
                    <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
                      <button
                        type="button"
                        onClick={() => setSplitType('equal')}
                        style={{
                          flex: 1,
                          padding: '6px',
                          borderRadius: '4px',
                          border: `1px solid ${splitType === 'equal' ? 'var(--primary)' : 'var(--border-color)'}`,
                          backgroundColor: splitType === 'equal' ? 'rgba(217, 119, 6, 0.1)' : 'transparent',
                          color: splitType === 'equal' ? 'var(--primary)' : 'var(--text-secondary)',
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          cursor: 'pointer'
                        }}
                      >
                        Split Equally
                      </button>
                      <button
                        type="button"
                        onClick={() => setSplitType('item')}
                        style={{
                          flex: 1,
                          padding: '6px',
                          borderRadius: '4px',
                          border: `1px solid ${splitType === 'item' ? 'var(--primary)' : 'var(--border-color)'}`,
                          backgroundColor: splitType === 'item' ? 'rgba(217, 119, 6, 0.1)' : 'transparent',
                          color: splitType === 'item' ? 'var(--primary)' : 'var(--text-secondary)',
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          cursor: 'pointer'
                        }}
                      >
                        Split by Items
                      </button>
                    </div>

                    {splitType === 'equal' ? (
                      /* EQUAL SPLIT CALCULATOR */
                      <div style={{ marginBottom: '20px' }}>
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '12px' }}>
                          Choose how many people are splitting the total bill of <strong>₹{placedOrdersList.filter(o => o.status !== 'cancelled').reduce((sum, o) => sum + o.totalAmount, 0)}</strong>.
                        </p>
                        
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '16px', margin: '16px 0' }}>
                          <button
                            type="button"
                            onClick={() => setSplitGuests(prev => Math.max(2, prev - 1))}
                            style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)', color: 'white', fontWeight: 'bold', cursor: 'pointer' }}
                          >
                            -
                          </button>
                          <span style={{ fontSize: '1.2rem', fontWeight: 800 }}>{splitGuests} Guests</span>
                          <button
                            type="button"
                            onClick={() => setSplitGuests(prev => Math.min(20, prev + 1))}
                            style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)', color: 'white', fontWeight: 'bold', cursor: 'pointer' }}
                          >
                            +
                          </button>
                        </div>

                        <div style={{ padding: '16px', backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: 'var(--radius-md)', border: '1px dashed var(--border-color)', marginBottom: '16px' }}>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>EACH GUEST PAYS</span>
                          <p style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--primary)', margin: '4px 0 0 0' }}>
                            ₹{Math.round(placedOrdersList.filter(o => o.status !== 'cancelled').reduce((sum, o) => sum + o.totalAmount, 0) / splitGuests)}
                          </p>
                        </div>
                      </div>
                    ) : (
                      /* ITEM SPLIT CALCULATOR */
                      <div style={{ marginBottom: '20px', maxHeight: '220px', overflowY: 'auto', textAlign: 'left', paddingRight: '4px' }}>
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '12px', textAlign: 'center' }}>
                          Select the items you ordered to calculate your personal share.
                        </p>

                        {placedOrdersList.filter(o => o.status !== 'cancelled').flatMap(o => o.items).map((item, idx) => {
                          const itemId = item.menuItem.id + '-' + idx;
                          const isChecked = !!selectedSplitItems[itemId];
                          return (
                            <label key={itemId} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.03)', cursor: 'pointer' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={(e) => {
                                    setSelectedSplitItems(prev => ({
                                      ...prev,
                                      [itemId]: e.target.checked
                                    }));
                                  }}
                                  style={{ cursor: 'pointer', accentColor: 'var(--primary)' }}
                                />
                                <span style={{ fontSize: '0.85rem' }}>{item.quantity}x {item.menuItem.name}</span>
                              </div>
                              <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--primary)', marginLeft: 'auto' }}>₹{item.menuItem.price * item.quantity}</span>
                            </label>
                          );
                        })}

                        {(() => {
                          // Calculate itemized share
                          const selectedSubtotal = placedOrdersList
                            .filter(o => o.status !== 'cancelled')
                            .flatMap(o => o.items)
                            .reduce((sum, item, idx) => {
                              const itemId = item.menuItem.id + '-' + idx;
                              return sum + (selectedSplitItems[itemId] ? item.menuItem.price * item.quantity : 0);
                            }, 0);
                          const selectedTotal = Math.round(selectedSubtotal * 1.05); // including 5% GST

                          return (
                            <div style={{ padding: '12px', backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: 'var(--radius-md)', border: '1px dashed var(--border-color)', marginTop: '12px', textAlign: 'center' }}>
                              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>YOUR CHOSEN SHARE TOTAL (INCL. GST)</span>
                              <p style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--primary)', margin: '4px 0 0 0' }}>
                                ₹{selectedTotal}
                              </p>
                            </div>
                          );
                        })()}
                      </div>
                    )}

                    {/* Pay Share Actions */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      <button
                        type="button"
                        onClick={() => {
                          // Calculate share amount
                          let shareTotal = 0;
                          if (splitType === 'equal') {
                            shareTotal = Math.round(placedOrdersList.filter(o => o.status !== 'cancelled').reduce((sum, o) => sum + o.totalAmount, 0) / splitGuests);
                          } else {
                            const selectedSubtotal = placedOrdersList
                              .filter(o => o.status !== 'cancelled')
                              .flatMap(o => o.items)
                              .reduce((sum, item, idx) => {
                                const itemId = item.menuItem.id + '-' + idx;
                                return sum + (selectedSplitItems[itemId] ? item.menuItem.price * item.quantity : 0);
                              }, 0);
                            shareTotal = Math.round(selectedSubtotal * 1.05);
                          }

                          if (shareTotal <= 0) {
                            alert("Please select at least one item or split share.");
                            return;
                          }

                          // Trigger Paytm QR mode for simulated checkout
                          setBillPaymentMethod('paytm');
                          setPendingPaymentAction(() => () => {
                            // In simulation, paying share completes dining successfully
                            const tableOrders = placedOrdersList.filter(o => o.status !== 'cancelled');
                            tableOrders.forEach(o => updateOrderPaymentStatus(o.id, 'paid', 'upi'));
                            
                            // Send SMS for split pay
                            const smsBody = `Roadies Koffeehouz: Table ${tableNumber} has paid a split share of ₹${shareTotal}. Complete Table Bill was ₹${tableOrders.reduce((sum, o) => sum + o.totalAmount, 0)}.`;
                            fetch('/api/sms', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ to: '7989793092', body: smsBody })
                            }).catch(err => console.warn('SMS log sync server offline', err));
                            alert(`📲 [SMS SENT TO OWNER 7989793092]\n\n"${smsBody}"`);

                            setHasCompletedDining(true);
                            setPendingPaymentAction(null);
                          });
                        }}
                        className="btn btn-primary"
                        style={{ width: '100%', padding: '12px', fontWeight: 700 }}
                      >
                        📲 Pay My Share Online (UPI/QR)
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setBillPaymentMethod('cash');
                          createTableAlert(tableNumber, 'request_bill');
                        }}
                        className="btn btn-secondary"
                        style={{ width: '100%', padding: '12px' }}
                      >
                        💵 Request Waiter to Collect Share
                      </button>
                    </div>
                  </>
                )}

                <button 
                  type="button"
                  onClick={() => setIsSettlingBillOpen(false)}
                  style={{ fontSize: '0.8rem', color: 'var(--text-muted)', cursor: 'pointer', marginTop: '14px', border: 'none', background: 'none' }}
                >
                  Cancel
                </button>
              </>
            ) : billPaymentMethod === 'paytm' ? (
              <>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '6px' }}>UPI QR Checkout</h3>
                <span style={{ fontSize: '0.65rem', backgroundColor: 'rgba(255,255,255,0.05)', color: 'var(--text-secondary)', padding: '2px 8px', borderRadius: '4px' }}>
                  UPI ID: 7989793092@fam
                </span>
                
                <div style={{ margin: '20px 0', padding: '16px', backgroundColor: 'rgba(0,0,0,0.2)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>SCAN QR TO PAY OWNER</span>
                  <div style={{ margin: '12px 0' }}>
                    <img 
                      src="/payment_qr.jpg" 
                      alt="UPI QR"
                      style={{ width: '160px', height: 'auto', display: 'inline-block', borderRadius: 'var(--radius-sm)' }}
                    />
                  </div>
                  <p style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--primary)' }}>
                    ₹{placedOrdersList.filter(o => o.status !== 'cancelled').reduce((sum, o) => sum + o.totalAmount, 0)}
                  </p>
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  <BikerLoader />
                  <span>Waiting for payment...</span>
                </div>

                <button
                  onClick={() => {
                    if (pendingPaymentAction) {
                      pendingPaymentAction();
                    }
                  }}
                  className="btn btn-primary"
                  style={{ width: '100%', marginTop: '20px', padding: '12px', fontWeight: 700 }}
                >
                  I Have Paid / Confirm Payment
                </button>
              </>
            ) : billPaymentMethod === 'card' ? (
              <>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '8px' }}>Credit/Debit Card Pay</h3>
                <span style={{ fontSize: '0.65rem', backgroundColor: 'rgba(255,255,255,0.05)', color: 'var(--text-secondary)', padding: '2px 8px', borderRadius: '4px' }}>
                  SECURED CARD GATEWAY
                </span>
                
                <div style={{ margin: '20px 0', padding: '20px', backgroundColor: 'rgba(0,0,0,0.2)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', textAlign: 'left' }}>
                  <div style={{ marginBottom: '12px' }}>
                    <label style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>CARD NUMBER</label>
                    <input type="text" disabled value="•••• •••• •••• 4892" style={{ width: '100%', padding: '8px', backgroundColor: 'var(--bg-darkest)', border: '1px solid var(--border-color)', color: 'white', borderRadius: '4px', fontSize: '0.9rem' }} />
                  </div>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <div style={{ flex: 1 }}>
                      <label style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>EXPIRY</label>
                      <input type="text" disabled value="12/29" style={{ width: '100%', padding: '8px', backgroundColor: 'var(--bg-darkest)', border: '1px solid var(--border-color)', color: 'white', borderRadius: '4px', fontSize: '0.9rem' }} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <label style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>CVV</label>
                      <input type="text" disabled value="•••" style={{ width: '100%', padding: '8px', backgroundColor: 'var(--bg-darkest)', border: '1px solid var(--border-color)', color: 'white', borderRadius: '4px', fontSize: '0.9rem' }} />
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  <BikerLoader />
                  <span>Processing Card details securely...</span>
                </div>
              </>
            ) : billPaymentMethod === 'swiggy' ? (
              <>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '8px', color: '#fc8019' }}>Swiggy Dineout</h3>
                <span style={{ fontSize: '0.65rem', backgroundColor: 'rgba(252, 128, 25, 0.1)', color: '#fc8019', padding: '2px 8px', borderRadius: '4px' }}>
                  SWIGGY PAY GATEWAY
                </span>
                
                <div style={{ margin: '20px 0', padding: '20px', backgroundColor: 'rgba(252, 128, 25, 0.05)', borderRadius: 'var(--radius-md)', border: '1px solid rgba(252, 128, 25, 0.2)' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '8px' }}>SWIGGY DINING BILL</span>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '6px' }}>
                    <span>Menu Total</span>
                    <span>₹{placedOrdersList.filter(o => o.status !== 'cancelled').reduce((sum, o) => sum + o.totalAmount, 0)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: 'var(--success)', fontWeight: 600, marginBottom: '8px' }}>
                    <span>Dineout discount (10%)</span>
                    <span>-₹{Math.round(placedOrdersList.filter(o => o.status !== 'cancelled').reduce((sum, o) => sum + o.totalAmount, 0) * 0.1)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px dashed rgba(255,255,255,0.1)', paddingTop: '8px', fontWeight: 800 }}>
                    <span>Swiggy Pay Total</span>
                    <span style={{ color: '#fc8019' }}>₹{Math.round(placedOrdersList.filter(o => o.status !== 'cancelled').reduce((sum, o) => sum + o.totalAmount, 0) * 0.9)}</span>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  <BikerLoader />
                  <span>Connecting to Swiggy App for confirmation...</span>
                </div>
              </>
            ) : billPaymentMethod === 'zomato' ? (
              <>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '8px', color: '#cb202d' }}>Zomato Gold Pay</h3>
                <span style={{ fontSize: '0.65rem', backgroundColor: 'rgba(203, 32, 45, 0.1)', color: '#cb202d', padding: '2px 8px', borderRadius: '4px' }}>
                  ZOMATO GOLD PARTNER
                </span>
                
                <div style={{ margin: '20px 0', padding: '20px', backgroundColor: 'rgba(203, 32, 45, 0.05)', borderRadius: 'var(--radius-md)', border: '1px solid rgba(203, 32, 45, 0.2)' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '8px' }}>ZOMATO GOLD DINING BILL</span>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '6px' }}>
                    <span>Menu Total</span>
                    <span>₹{placedOrdersList.filter(o => o.status !== 'cancelled').reduce((sum, o) => sum + o.totalAmount, 0)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: 'var(--success)', fontWeight: 600, marginBottom: '8px' }}>
                    <span>Zomato Gold discount (10%)</span>
                    <span>-₹{Math.round(placedOrdersList.filter(o => o.status !== 'cancelled').reduce((sum, o) => sum + o.totalAmount, 0) * 0.1)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px dashed rgba(255,255,255,0.1)', paddingTop: '8px', fontWeight: 800 }}>
                    <span>Zomato Pay Total</span>
                    <span style={{ color: '#cb202d' }}>₹{Math.round(placedOrdersList.filter(o => o.status !== 'cancelled').reduce((sum, o) => sum + o.totalAmount, 0) * 0.9)}</span>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  <BikerLoader />
                  <span>Connecting to Zomato App for verification...</span>
                </div>
              </>
            ) : (
              <>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '8px' }}>Cash requested</h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '24px' }}>
                  A waiter is coming to Table {tableNumber} to collect cash of <strong>₹{placedOrdersList.filter(o => o.status !== 'cancelled').reduce((sum, o) => sum + o.totalAmount, 0)}</strong>.
                </p>
                
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px', padding: '16px', backgroundColor: 'rgba(245,158,11,0.05)', border: '1px dashed var(--primary)', borderRadius: 'var(--radius-md)', marginBottom: '20px' }}>
                  <BikerLoader />
                  <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--primary)' }}>Waiting for Waiter payment verification...</span>
                </div>
                
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  * Once the waiter marks your order as Paid on their terminal, this screen will update automatically.
                </p>
                
                <button 
                  onClick={() => setIsSettlingBillOpen(false)}
                  className="btn btn-secondary"
                  style={{ width: '100%', marginTop: '16px' }}
                >
                  Close & View Menu
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

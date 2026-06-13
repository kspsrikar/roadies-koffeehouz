import React, { useState, useEffect, useRef } from 'react';
import { 
  getOrders, 
  updateOrderStatus, 
  subscribeToDatabase,
  getTableAlerts,
  dismissTableAlert,
  updateOrderPaymentStatus,
  getMenuItems,
  updateMenuItem
} from './db/db';
import type { 
  Order, 
  OrderStatus,
  TableAlert,
  MenuItem
} from './db/db';
import { 
  Clock, 
  ChefHat, 
  CheckCircle, 
  XCircle, 
  QrCode, 
  Layers, 
  ExternalLink,
  Copy,
  BellRing,
  Printer,
  DollarSign,
  Search,
  Volume2,
  Sliders
} from 'lucide-react';

interface BuzzerConfig {
  enabled: boolean;
  duration: number; // in seconds
}

interface BuzzerSettings {
  newOrder: BuzzerConfig;
  tableAlert: BuzzerConfig;
  dishReady: BuzzerConfig;
}

export const WaiterView: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [alerts, setAlerts] = useState<TableAlert[]>([]);
  const [activeTab, setActiveTab] = useState<OrderStatus | 'all'>('all');
  const [qrTable, setQrTable] = useState('5');
  const [generatedQr, setGeneratedQr] = useState('');
  const [copiedLink, setCopiedLink] = useState(false);
  
  // Waiter view sub-tab and menu list states
  const [waiterTab, setWaiterTab] = useState<'orders' | 'stock' | 'settings'>('orders');
  const [menu, setMenu] = useState<MenuItem[]>([]);
  const [stockSearch, setStockSearch] = useState('');
  const [selectedStockCategory, setSelectedStockCategory] = useState<string>('all');

  // Store alert count in ref to avoid stale closures
  const alertsCountRef = useRef(0);
  const readyOrdersCountRef = useRef(0);
  const ordersCountRef = useRef(0);

  const [buzzerSettings, setBuzzerSettings] = useState<BuzzerSettings>(() => {
    try {
      const saved = localStorage.getItem('roadies_buzzer_settings');
      if (saved) return JSON.parse(saved);
    } catch {}
    return {
      newOrder: { enabled: true, duration: 3 },
      tableAlert: { enabled: true, duration: 5 },
      dishReady: { enabled: true, duration: 3 }
    };
  });

  const saveBuzzerSettings = (newSettings: BuzzerSettings) => {
    setBuzzerSettings(newSettings);
    localStorage.setItem('roadies_buzzer_settings', JSON.stringify(newSettings));
  };

  const playAlertBuzzer = (durationSeconds: number = 7) => {
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;
      const ctx = new AudioContextClass();
      
      const playBuzz = (start: number, duration: number) => {
        const osc = ctx.createOscillator();
        const filter = ctx.createBiquadFilter();
        const gain = ctx.createGain();
        
        osc.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);
        
        // Use sawtooth wave for buzzy pager sound
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(140, ctx.currentTime + start);
        
        // Lowpass filter to round off harsh high frequencies
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(850, ctx.currentTime + start);

        // Increased gain to 0.35 for loudness
        gain.gain.setValueAtTime(0.35, ctx.currentTime + start);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + start + duration);
        
        osc.start(ctx.currentTime + start);
        osc.stop(ctx.currentTime + start + duration);
      };

      // Play repeating loud buzzer rhythm based on durationSeconds
      for (let i = 0; i < durationSeconds; i++) {
        playBuzz(i * 1.0, 0.6);
      }
    } catch {
      // Ignored if blocked by autoplay policies
    }
  };

  // Sync database live
  useEffect(() => {
    const initialOrders = getOrders();
    setOrders(initialOrders);
    setMenu(getMenuItems());
    const initialAlerts = getTableAlerts();
    setAlerts(initialAlerts);
    alertsCountRef.current = initialAlerts.length;
    readyOrdersCountRef.current = initialOrders.filter(o => o.status === 'ready').length;
    ordersCountRef.current = initialOrders.length;

    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }

    const unsubscribe = subscribeToDatabase((data) => {
      setOrders(data.orders);
      setMenu(data.menu);
      
      const currentOrdersCount = data.orders.length;
      const currentReadyCount = data.orders.filter(o => o.status === 'ready').length;

      // Load buzzer settings directly from localStorage to prevent state capture in closure
      let settings = {
        newOrder: { enabled: true, duration: 3 },
        tableAlert: { enabled: true, duration: 5 },
        dishReady: { enabled: true, duration: 3 }
      };
      try {
        const saved = localStorage.getItem('roadies_buzzer_settings');
        if (saved) settings = JSON.parse(saved);
      } catch {}

      // Trigger alerts on new order
      if (currentOrdersCount > ordersCountRef.current) {
        if (settings.newOrder.enabled) {
          playAlertBuzzer(settings.newOrder.duration);
        }
      }

      // Trigger alerts on new call alert
      if (data.alerts.length > alertsCountRef.current) {
        if (settings.tableAlert.enabled) {
          playAlertBuzzer(settings.tableAlert.duration);
        }
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification("🔔 New Table Alert!", { body: `A table is requesting service!` });
        }
      }

      // Trigger alerts on kitchen ready transition
      if (currentReadyCount > readyOrdersCountRef.current) {
        if (settings.dishReady.enabled) {
          playAlertBuzzer(settings.dishReady.duration);
        }
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification("🍳 Dish Ready for Pick-up!", { body: `An order is ready to serve from the kitchen!` });
        }
      }

      alertsCountRef.current = data.alerts.length;
      readyOrdersCountRef.current = currentReadyCount;
      ordersCountRef.current = currentOrdersCount;
      setAlerts(data.alerts);
    });
    return () => unsubscribe();
  }, []);

  const handleStatusChange = (orderId: string, newStatus: OrderStatus) => {
    updateOrderStatus(orderId, newStatus);
    setOrders(getOrders());
  };

  const handleMarkPaid = (orderId: string, paymentMethod?: Order['paymentMethod']) => {
    updateOrderPaymentStatus(orderId, 'paid', paymentMethod);
    setOrders(getOrders());
  };

  const handleDismissAlert = (alertId: string) => {
    dismissTableAlert(alertId);
    setAlerts(getTableAlerts());
  };

  const handleToggleStock = (item: MenuItem) => {
    const updatedItem = { ...item, inStock: item.inStock === false ? true : false };
    updateMenuItem(updatedItem);
    setMenu(getMenuItems());
  };

  const generateTableQr = () => {
    const link = `${window.location.origin}/?table=${qrTable}`;
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&color=ffffff&bgcolor=1b1b21&data=${encodeURIComponent(link)}`;
    setGeneratedQr(qrUrl);
  };

  const getTableLink = () => {
    return `${window.location.origin}/?table=${qrTable}`;
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(getTableLink());
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  // Print Kitchen Receipt (KOT)
  const handlePrintKOT = (order: Order) => {
    const printWindow = window.open('', '_blank', 'width=350,height=600');
    if (printWindow) {
      const subtotal = order.items.reduce((sum, item) => sum + item.menuItem.price * item.quantity, 0);
      const cgst = subtotal * 0.025;
      const sgst = subtotal * 0.025;
      const itemsHtml = order.items.map(i => `
        <div style="display:flex; justify-content:space-between; margin:4px 0; font-family:monospace; font-size:14px;">
          <span>${i.quantity}x ${i.menuItem.name}</span>
          <span>INR ${i.menuItem.price * i.quantity}</span>
        </div>
      `).join('');

      printWindow.document.write(`
        <html>
          <body style="font-family:sans-serif; padding:20px; color:#000; background:#fff;">
            <div style="text-align:center; border-bottom:1px dashed #000; padding-bottom:10px; margin-bottom:10px;">
              <h2 style="margin:0; font-size:18px; font-weight:bold;">ROADIES KOFFEEHOUZ</h2>
              <span style="font-size:11px;">Kharghar, Navi Mumbai</span><br/>
              <span style="font-size:13px; font-weight:bold;">TABLE ${order.tableNumber} • KOT</span>
            </div>
            
            <div style="font-size:11px; margin-bottom:10px; font-family:monospace;">
              Order ID: ${order.id}<br/>
              Time: ${new Date(order.createdAt).toLocaleTimeString()}<br/>
              Payment: ${(order.paymentMethod || 'counter').toUpperCase()} (${(order.paymentStatus || 'pending').toUpperCase()})
            </div>

            <div style="border-bottom:1px dashed #000; padding-bottom:10px; margin-bottom:10px;">
              ${itemsHtml}
            </div>

            <div style="display:flex; justify-content:space-between; font-size:13px; font-family:monospace; margin-bottom:4px;">
              <span>Subtotal</span>
              <span>INR ${subtotal}</span>
            </div>
            <div style="display:flex; justify-content:space-between; font-size:13px; font-family:monospace; margin-bottom:4px;">
              <span>CGST (2.5%)</span>
              <span>INR ${cgst.toFixed(2)}</span>
            </div>
            <div style="display:flex; justify-content:space-between; font-size:13px; font-family:monospace; margin-bottom:10px; border-bottom:1px dashed #000; padding-bottom:6px;">
              <span>SGST (2.5%)</span>
              <span>INR ${sgst.toFixed(2)}</span>
            </div>

            <div style="display:flex; justify-content:space-between; font-weight:bold; font-size:15px; font-family:monospace;">
              <span>GRAND TOTAL</span>
              <span>INR ${order.totalAmount}</span>
            </div>

            <div style="text-align:center; margin-top:24px; font-size:10px; font-style:italic;">
              Thank you! Serve hot.
            </div>
            <script>
              window.onload = function() {
                window.print();
                window.close();
              }
            </script>
          </body>
        </html>
      `);
      printWindow.document.close();
    }
  };

  useEffect(() => {
    generateTableQr();
  }, [qrTable]);

  const isToday = (dateStr: string) => {
    const d = new Date(dateStr);
    const today = new Date();
    return d.getDate() === today.getDate() &&
           d.getMonth() === today.getMonth() &&
           d.getFullYear() === today.getFullYear();
  };

  const todayOrders = orders.filter(o => {
    if (o.status === 'pending' || o.status === 'preparing' || o.status === 'ready') {
      return true;
    }
    return isToday(o.createdAt);
  });
  const todayAlerts = alerts.filter(a => {
    if (a.status === 'active') {
      return true;
    }
    return isToday(a.createdAt);
  });

  const filteredOrders = activeTab === 'all' 
    ? todayOrders 
    : todayOrders.filter(o => o.status === activeTab);

  const sortedOrders = [...filteredOrders].sort((a, b) => {
    const aTime = new Date(a.createdAt).getTime();
    const bTime = new Date(b.createdAt).getTime();
    const aActive = a.status === 'pending' || a.status === 'preparing';
    const bActive = b.status === 'pending' || b.status === 'preparing';
    
    if (aActive && !bActive) return -1;
    if (!aActive && bActive) return 1;
    
    return bTime - aTime;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', backgroundColor: 'var(--bg-darkest)' }}>
      
      {/* Alert chimes trigger for active alerts */}
      {todayAlerts.length > 0 && (
        <div style={{ 
          backgroundColor: 'var(--danger-light)', 
          borderBottom: '2px solid var(--danger)',
          padding: '12px 20px', 
          display: 'flex', 
          flexDirection: 'column', 
          gap: '8px',
          animation: 'pulseGlow 2s infinite' 
        }}>
          {todayAlerts.map((alert) => (
            <div key={alert.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--danger)', fontWeight: 700, fontSize: '0.9rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <BellRing size={16} className="animate-pulse" />
                <span>
                  ALERT: Table {alert.tableNumber} is requesting {alert.type === 'call_waiter' ? 'a Waiter' : 'the Bill'}!
                </span>
              </div>
              <button 
                onClick={() => handleDismissAlert(alert.id)}
                className="btn btn-danger"
                style={{ padding: '4px 10px', fontSize: '0.75rem', borderRadius: 'var(--radius-sm)' }}
              >
                Dismiss Alert
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Waiter Header */}
      <header className="glass-panel" style={{ 
        padding: '16px 20px', 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center' 
      }}>
        <div>
          <h1 style={{ fontSize: '1.4rem', margin: 0, fontWeight: 800 }} className="gradient-text">
            STAFF DASHBOARD
          </h1>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Roadies Koffeehouz Real-time orders</p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ 
            width: '8px', 
            height: '8px', 
            backgroundColor: 'var(--success)', 
            borderRadius: '50%',
            display: 'inline-block',
            boxShadow: '0 0 8px var(--success)'
          }} />
          <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>LIVE SYNC ENABLED</span>
        </div>
      </header>

      {/* Main Waiter Grid */}
      <main className="container" style={{ flex: 1, padding: '24px 20px', display: 'grid', gridTemplateColumns: '1fr 320px', gap: '24px', paddingBottom: '100px' }}>
        
        {/* Left Column: Main Feed */}
        <div>
          {/* Main Tab Switcher */}
          <div style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
            <button
              onClick={() => setWaiterTab('orders')}
              style={{
                flex: 1,
                padding: '12px 20px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: waiterTab === 'orders' ? 'var(--primary)' : 'var(--bg-card)',
                color: waiterTab === 'orders' ? 'var(--bg-darkest)' : 'var(--text-primary)',
                fontWeight: 700,
                fontSize: '0.9rem',
                cursor: 'pointer',
                border: 'none',
                transition: 'all 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                boxShadow: waiterTab === 'orders' ? '0 0 15px rgba(255, 255, 255, 0.25)' : 'none'
              }}
            >
              <Layers size={18} /> Orders Feed
            </button>
            <button
              onClick={() => setWaiterTab('stock')}
              style={{
                flex: 1,
                padding: '12px 20px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: waiterTab === 'stock' ? 'var(--primary)' : 'var(--bg-card)',
                color: waiterTab === 'stock' ? 'var(--bg-darkest)' : 'var(--text-primary)',
                fontWeight: 700,
                fontSize: '0.9rem',
                cursor: 'pointer',
                border: 'none',
                transition: 'all 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                boxShadow: waiterTab === 'stock' ? '0 0 15px rgba(255, 255, 255, 0.25)' : 'none'
              }}
            >
              <ChefHat size={18} /> Stock Control
            </button>
            <button
              onClick={() => setWaiterTab('settings')}
              style={{
                flex: 1,
                padding: '12px 20px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: waiterTab === 'settings' ? 'var(--primary)' : 'var(--bg-card)',
                color: waiterTab === 'settings' ? 'var(--bg-darkest)' : 'var(--text-primary)',
                fontWeight: 700,
                fontSize: '0.9rem',
                cursor: 'pointer',
                border: 'none',
                transition: 'all 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                boxShadow: waiterTab === 'settings' ? '0 0 15px rgba(255, 255, 255, 0.25)' : 'none'
              }}
            >
              <Volume2 size={18} /> Buzzer Settings
            </button>
          </div>

          {waiterTab === 'orders' && (
            <>
              {/* Status Tabs */}
              <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px', overflowX: 'auto' }}>
                {(['all', 'pending', 'preparing', 'ready', 'served', 'cancelled'] as const).map(tab => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    style={{
                      padding: '8px 16px',
                      borderRadius: 'var(--radius-md)',
                      backgroundColor: activeTab === tab ? 'var(--primary)' : 'var(--bg-card)',
                      color: activeTab === tab ? 'var(--bg-darkest)' : 'var(--text-primary)',
                      fontWeight: 600,
                      fontSize: '0.85rem',
                      textTransform: 'capitalize',
                      cursor: 'pointer',
                      border: 'none',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    {tab} ({tab === 'all' ? todayOrders.length : todayOrders.filter(o => o.status === tab).length})
                  </button>
                ))}
              </div>

              {/* Orders Cards Grid */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {sortedOrders.map((order) => {
                  const orderTime = new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                  
                  return (
                    <div 
                      key={order.id} 
                      className="glass-panel animate-fade"
                      style={{ 
                        borderRadius: 'var(--radius-lg)', 
                        padding: '20px',
                        borderLeft: `4px solid ${
                          order.status === 'pending' ? 'var(--warning)' : 
                          order.status === 'preparing' ? 'var(--info)' : 
                          order.status === 'served' ? 'var(--success)' : 'var(--danger)'
                        }`
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                        <div>
                          <span style={{ 
                            fontSize: '0.75rem', 
                            backgroundColor: 'var(--bg-darkest)', 
                            padding: '4px 10px', 
                            borderRadius: 'var(--radius-full)',
                            fontWeight: 700,
                            color: 'var(--primary)',
                            marginRight: '10px'
                          }}>
                            TABLE {order.tableNumber}
                          </span>
                          <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>ID: {order.id}</span>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <Clock size={12} /> {orderTime}
                          </span>
                          <span className={`badge badge-${order.status}`}>{order.status}</span>
                        </div>
                      </div>

                      {/* Payment status badge */}
                      <div style={{ display: 'flex', gap: '10px', marginBottom: '12px' }}>
                        <span style={{ 
                          fontSize: '0.75rem', 
                          backgroundColor: order.paymentStatus === 'paid' ? 'var(--success-light)' : 'rgba(255,255,255,0.03)',
                          color: order.paymentStatus === 'paid' ? 'var(--success)' : 'var(--text-secondary)',
                          padding: '2px 8px',
                          borderRadius: '4px',
                          fontWeight: 600,
                          border: `1px solid ${order.paymentStatus === 'paid' ? 'rgba(16,185,129,0.2)' : 'var(--border-color)'}`
                        }}>
                          Payment: {order.paymentStatus.toUpperCase()} ({
                            order.paymentMethod === 'cash' ? '💵 Cash to Waiter' :
                            order.paymentMethod === 'card' ? '💳 Credit/Debit Card' :
                            order.paymentMethod === 'upi' ? '📲 Paytm UPI QR' :
                            order.paymentMethod === 'swiggy' ? '🍊 Swiggy Dineout' :
                            order.paymentMethod === 'zomato' ? '🔴 Zomato Gold' :
                            order.paymentMethod === 'online' ? 'Online UPI' : 'Counter Pay'
                          })
                        </span>
                      </div>

                      {/* Order Items Table */}
                      <div style={{ marginBottom: '16px', borderTop: '1px solid var(--border-color)', borderBottom: '1px solid var(--border-color)', padding: '12px 0' }}>
                        {order.items.map((item, idx) => (
                          <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: '0.95rem' }}>
                            <span>
                              <strong style={{ color: 'var(--primary)' }}>{item.quantity}x</strong> {item.menuItem.name}
                            </span>
                            <span style={{ color: 'var(--text-secondary)' }}>₹{item.menuItem.price * item.quantity}</span>
                          </div>
                        ))}
                        {(() => {
                          const subtotal = order.items.reduce((sum, item) => sum + item.menuItem.price * item.quantity, 0);
                          const gstVal = subtotal * 0.05;
                          return (
                            <>
                              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                                <span>Subtotal</span>
                                <span>₹{subtotal}</span>
                              </div>
                              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                                <span>GST (5%)</span>
                                <span>₹{gstVal.toFixed(2)}</span>
                              </div>
                              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '10px', fontWeight: 700, fontSize: '1.05rem', borderTop: '1px dashed var(--border-color)', paddingTop: '8px' }}>
                                <span>Grand Total</span>
                                <span style={{ color: 'var(--primary)' }}>₹{order.totalAmount}</span>
                              </div>
                            </>
                          );
                        })()}
                      </div>

                      {/* Order Actions */}
                      <div style={{ display: 'flex', gap: '10px', justifyContent: 'space-between', alignItems: 'center' }}>
                        
                        {/* Left align: print KOT button */}
                        <button 
                          onClick={() => handlePrintKOT(order)}
                          className="btn btn-secondary"
                          style={{ padding: '8px 12px', fontSize: '0.8rem', gap: '4px' }}
                          title="Print receipt ticket"
                        >
                          <Printer size={14} /> Print KOT
                        </button>

                        {/* Right align: status modifications */}
                        <div style={{ display: 'flex', gap: '8px' }}>
                          {order.paymentStatus === 'pending' && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <select
                                defaultValue=""
                                onChange={(e) => {
                                  if (e.target.value) {
                                    handleMarkPaid(order.id, e.target.value as any);
                                  }
                                }}
                                style={{
                                  padding: '8px 12px',
                                  borderRadius: 'var(--radius-md)',
                                  backgroundColor: 'var(--bg-card)',
                                  border: '1px solid rgba(16, 185, 129, 0.3)',
                                  color: 'var(--success)',
                                  fontSize: '0.8rem',
                                  fontWeight: 700,
                                  cursor: 'pointer'
                                }}
                              >
                                <option value="" disabled>Mark Paid...</option>
                                <option value="cash">💵 Cash</option>
                                <option value="card">💳 Card</option>
                                <option value="upi">📲 UPI</option>
                              </select>
                            </div>
                          )}

                          {order.status === 'pending' && (
                            <>
                              <button 
                                onClick={() => handleStatusChange(order.id, 'cancelled')}
                                className="btn btn-secondary"
                                style={{ padding: '8px 12px', fontSize: '0.8rem' }}
                              >
                                <XCircle size={14} /> Decline
                              </button>
                              <button 
                                onClick={() => handleStatusChange(order.id, 'preparing')}
                                className="btn btn-primary"
                                style={{ padding: '8px 14px', fontSize: '0.8rem' }}
                              >
                                <ChefHat size={14} /> Prepare
                              </button>
                            </>
                          )}

                          {order.status === 'preparing' && (
                            <>
                              <button 
                                onClick={() => handleStatusChange(order.id, 'ready')}
                                className="btn btn-secondary"
                                style={{ padding: '8px 12px', fontSize: '0.8rem' }}
                              >
                                Mark Ready
                              </button>
                              <button 
                                onClick={() => handleStatusChange(order.id, 'served')}
                                className="btn btn-primary"
                                style={{ padding: '8px 16px', fontSize: '0.8rem' }}
                              >
                                <CheckCircle size={14} /> Serve Order
                              </button>
                            </>
                          )}

                          {order.status === 'ready' && (
                            <button 
                              onClick={() => handleStatusChange(order.id, 'served')}
                              className="btn btn-primary"
                              style={{ 
                                padding: '8px 16px', 
                                fontSize: '0.8rem'
                              }}
                            >
                              <CheckCircle size={14} /> Serve Order (Ready!)
                            </button>
                          )}

                          {order.status === 'served' && (
                            <span style={{ fontSize: '0.8rem', color: 'var(--success)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <CheckCircle size={14} /> Served Completed
                            </span>
                          )}

                          {order.status === 'cancelled' && (
                            <span style={{ fontSize: '0.8rem', color: 'var(--danger)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <XCircle size={14} /> Order Cancelled
                            </span>
                          )}
                        </div>

                      </div>
                    </div>
                  );
                })}

                {sortedOrders.length === 0 && (
                  <div className="glass-panel" style={{ padding: '40px', textAlign: 'center', borderRadius: 'var(--radius-lg)', color: 'var(--text-muted)' }}>
                    No orders in this category.
                  </div>
                )}
              </div>
            </>
          )}

          {waiterTab === 'stock' && (
            <div className="glass-panel animate-fade" style={{ borderRadius: 'var(--radius-lg)', padding: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
                <div>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0 }}>Item Stock Management</h3>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', margin: '4px 0 0 0' }}>
                    Toggle items available or sold out in real-time. Waiter edits affect Customer menu instantly.
                  </p>
                </div>
              </div>

              {/* Filters & Search */}
              <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap' }}>
                <div style={{ position: 'relative', flex: 1, minWidth: '200px' }}>
                  <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input
                    type="text"
                    placeholder="Search menu items..."
                    value={stockSearch}
                    onChange={(e) => setStockSearch(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 12px 10px 38px',
                      borderRadius: 'var(--radius-md)',
                      backgroundColor: 'var(--bg-card)',
                      border: '1px solid var(--border-color)',
                      color: 'white',
                      fontSize: '0.85rem'
                    }}
                  />
                </div>

                <select
                  value={selectedStockCategory}
                  onChange={(e) => setSelectedStockCategory(e.target.value)}
                  style={{
                    padding: '10px 16px',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: 'var(--bg-card)',
                    border: '1px solid var(--border-color)',
                    color: 'white',
                    fontSize: '0.85rem',
                    cursor: 'pointer'
                  }}
                >
                  <option value="all">All Categories</option>
                  <option value="coffee">Coffee</option>
                  <option value="drinks">Drinks</option>
                  <option value="pizza">Pizza</option>
                  <option value="pasta">Pasta</option>
                  <option value="sides">Sides</option>
                  <option value="dessert">Dessert</option>
                </select>
              </div>

              {/* Menu items stock list */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {menu
                  .filter(item => {
                    const matchSearch = item.name.toLowerCase().includes(stockSearch.toLowerCase()) || 
                                        item.description.toLowerCase().includes(stockSearch.toLowerCase());
                    const matchCategory = selectedStockCategory === 'all' || item.category === selectedStockCategory;
                    return matchSearch && matchCategory;
                  })
                  .map(item => (
                    <div 
                      key={item.id} 
                      style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'space-between', 
                        padding: '12px 16px', 
                        backgroundColor: 'rgba(255,255,255,0.02)', 
                        border: '1px solid var(--border-color)', 
                        borderRadius: 'var(--radius-md)',
                        gap: '16px' 
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flex: 1 }}>
                        {item.image ? (
                          <img 
                            src={item.image} 
                            alt={item.name} 
                            style={{ width: '48px', height: '48px', borderRadius: 'var(--radius-sm)', objectFit: 'cover' }} 
                          />
                        ) : (
                          <div style={{ width: '48px', height: '48px', borderRadius: 'var(--radius-sm)', backgroundColor: 'var(--bg-card)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                            No Pic
                          </div>
                        )}
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <strong style={{ fontSize: '0.95rem' }}>{item.name}</strong>
                            <span style={{ 
                              fontSize: '0.65rem', 
                              backgroundColor: 'rgba(255, 255, 255, 0.05)', 
                              padding: '2px 6px', 
                              borderRadius: '4px',
                              textTransform: 'uppercase',
                              fontWeight: 600,
                              color: 'var(--text-secondary)'
                            }}>
                              {item.category}
                            </span>
                            {item.popular && (
                              <span style={{ 
                                fontSize: '0.65rem', 
                                backgroundColor: 'rgba(217, 119, 6, 0.1)', 
                                padding: '2px 6px', 
                                borderRadius: '4px',
                                fontWeight: 700,
                                color: 'var(--primary)'
                              }}>
                                Popular
                              </span>
                            )}
                          </div>
                          <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', margin: '4px 0 0 0', lineClamp: 1, WebkitLineClamp: 1, display: '-webkit-box', WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                            {item.description}
                          </p>
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <span style={{ fontWeight: 700, color: 'var(--primary)', fontSize: '0.95rem', minWidth: '60px', textAlign: 'right' }}>
                          ₹{item.price}
                        </span>

                        <button
                          onClick={() => handleToggleStock(item)}
                          style={{
                            padding: '8px 16px',
                            borderRadius: 'var(--radius-md)',
                            backgroundColor: item.inStock !== false ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                            border: `1px solid ${item.inStock !== false ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
                            color: item.inStock !== false ? 'var(--success)' : 'var(--danger)',
                            fontWeight: 700,
                            fontSize: '0.8rem',
                            cursor: 'pointer',
                            minWidth: '110px',
                            transition: 'all 0.2s ease',
                            textAlign: 'center'
                          }}
                        >
                          {item.inStock !== false ? '● In Stock' : '○ Out of Stock'}
                        </button>
                      </div>
                    </div>
                  ))}
                {menu.filter(item => {
                  const matchSearch = item.name.toLowerCase().includes(stockSearch.toLowerCase()) || 
                                      item.description.toLowerCase().includes(stockSearch.toLowerCase());
                  const matchCategory = selectedStockCategory === 'all' || item.category === selectedStockCategory;
                  return matchSearch && matchCategory;
                }).length === 0 && (
                  <div style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                    No menu items match search/filters.
                  </div>
                )}
              </div>
            </div>
          )}

          {waiterTab === 'settings' && (
            <div className="glass-panel" style={{ padding: '30px', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)', animation: 'fadeIn 0.3s ease-out' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
                <div style={{ backgroundColor: 'var(--primary-light)', color: 'var(--primary)', padding: '10px', borderRadius: '10px' }}>
                  <Volume2 size={24} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.2rem', margin: 0, fontWeight: 800, color: 'var(--primary)', letterSpacing: '-0.3px' }}>Buzzer & Sound Settings</h3>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: 0 }}>Configure buzzer alerts and customize sound playtimes for staff actions.</p>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                
                {/* 1. New Order Alert */}
                <div style={{ padding: '20px', borderRadius: 'var(--radius-md)', backgroundColor: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ fontSize: '1.2rem' }}>📦</span>
                      <div>
                        <strong style={{ display: 'block', fontSize: '0.95rem' }}>New Order Buzzer</strong>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Triggers when a customer submits a new order</span>
                      </div>
                    </div>
                    <label className="switch" style={{ position: 'relative', display: 'inline-block', width: '46px', height: '24px' }}>
                      <input 
                        type="checkbox" 
                        checked={buzzerSettings.newOrder.enabled}
                        onChange={(e) => saveBuzzerSettings({
                          ...buzzerSettings,
                          newOrder: { ...buzzerSettings.newOrder, enabled: e.target.checked }
                        })}
                        style={{ opacity: 0, width: 0, height: 0 }}
                      />
                      <span className="slider-toggle" style={{ 
                        position: 'absolute', cursor: 'pointer', top: 0, left: 0, right: 0, bottom: 0, 
                        backgroundColor: buzzerSettings.newOrder.enabled ? 'var(--primary)' : '#3f3f46', 
                        transition: '0.3s', borderRadius: '34px',
                        boxShadow: buzzerSettings.newOrder.enabled ? '0 0 10px rgba(255,255,255,0.2)' : 'none'
                      }}>
                        <span style={{
                          position: 'absolute', content: '""', height: '18px', width: '18px', left: '3px', bottom: '3px',
                          backgroundColor: buzzerSettings.newOrder.enabled ? 'var(--bg-darkest)' : 'white',
                          transition: '0.3s', borderRadius: '50%',
                          transform: buzzerSettings.newOrder.enabled ? 'translateX(22px)' : 'none'
                        }} />
                      </span>
                    </label>
                  </div>
                  {buzzerSettings.newOrder.enabled && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                          <span>Buzzer Play Duration</span>
                          <strong style={{ color: 'var(--primary)' }}>{buzzerSettings.newOrder.duration} seconds</strong>
                        </div>
                        <input 
                          type="range" 
                          min="1" 
                          max="15" 
                          value={buzzerSettings.newOrder.duration}
                          onChange={(e) => saveBuzzerSettings({
                            ...buzzerSettings,
                            newOrder: { ...buzzerSettings.newOrder, duration: parseInt(e.target.value) }
                          })}
                          style={{ width: '100%', accentColor: 'var(--primary)', cursor: 'pointer' }}
                        />
                      </div>
                      <button 
                        onClick={() => playAlertBuzzer(buzzerSettings.newOrder.duration)}
                        className="btn btn-outline"
                        style={{ padding: '8px 16px', fontSize: '0.8rem', borderRadius: '8px', border: '1px solid var(--border-color)', color: 'var(--text-primary)', cursor: 'pointer', background: 'transparent' }}
                      >
                        🔊 Test
                      </button>
                    </div>
                  )}
                </div>

                {/* 2. New Table Call / Bill Request */}
                <div style={{ padding: '20px', borderRadius: 'var(--radius-md)', backgroundColor: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ fontSize: '1.2rem' }}>🔔</span>
                      <div>
                        <strong style={{ display: 'block', fontSize: '0.95rem' }}>Table Assistance / Bill Request</strong>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Triggers when a table calls the waiter or requests a bill</span>
                      </div>
                    </div>
                    <label className="switch" style={{ position: 'relative', display: 'inline-block', width: '46px', height: '24px' }}>
                      <input 
                        type="checkbox" 
                        checked={buzzerSettings.tableAlert.enabled}
                        onChange={(e) => saveBuzzerSettings({
                          ...buzzerSettings,
                          tableAlert: { ...buzzerSettings.tableAlert, enabled: e.target.checked }
                        })}
                        style={{ opacity: 0, width: 0, height: 0 }}
                      />
                      <span className="slider-toggle" style={{ 
                        position: 'absolute', cursor: 'pointer', top: 0, left: 0, right: 0, bottom: 0, 
                        backgroundColor: buzzerSettings.tableAlert.enabled ? 'var(--primary)' : '#3f3f46', 
                        transition: '0.3s', borderRadius: '34px',
                        boxShadow: buzzerSettings.tableAlert.enabled ? '0 0 10px rgba(255,255,255,0.2)' : 'none'
                      }}>
                        <span style={{
                          position: 'absolute', content: '""', height: '18px', width: '18px', left: '3px', bottom: '3px',
                          backgroundColor: buzzerSettings.tableAlert.enabled ? 'var(--bg-darkest)' : 'white',
                          transition: '0.3s', borderRadius: '50%',
                          transform: buzzerSettings.tableAlert.enabled ? 'translateX(22px)' : 'none'
                        }} />
                      </span>
                    </label>
                  </div>
                  {buzzerSettings.tableAlert.enabled && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                          <span>Buzzer Play Duration</span>
                          <strong style={{ color: 'var(--primary)' }}>{buzzerSettings.tableAlert.duration} seconds</strong>
                        </div>
                        <input 
                          type="range" 
                          min="1" 
                          max="15" 
                          value={buzzerSettings.tableAlert.duration}
                          onChange={(e) => saveBuzzerSettings({
                            ...buzzerSettings,
                            tableAlert: { ...buzzerSettings.tableAlert, duration: parseInt(e.target.value) }
                          })}
                          style={{ width: '100%', accentColor: 'var(--primary)', cursor: 'pointer' }}
                        />
                      </div>
                      <button 
                        onClick={() => playAlertBuzzer(buzzerSettings.tableAlert.duration)}
                        className="btn btn-outline"
                        style={{ padding: '8px 16px', fontSize: '0.8rem', borderRadius: '8px', border: '1px solid var(--border-color)', color: 'var(--text-primary)', cursor: 'pointer', background: 'transparent' }}
                      >
                        🔊 Test
                      </button>
                    </div>
                  )}
                </div>

                {/* 3. Kitchen Ready Alert */}
                <div style={{ padding: '20px', borderRadius: 'var(--radius-md)', backgroundColor: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ fontSize: '1.2rem' }}>🍳</span>
                      <div>
                        <strong style={{ display: 'block', fontSize: '0.95rem' }}>Dish Ready Alert</strong>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Triggers when a chef marks an order as ready for pickup</span>
                      </div>
                    </div>
                    <label className="switch" style={{ position: 'relative', display: 'inline-block', width: '46px', height: '24px' }}>
                      <input 
                        type="checkbox" 
                        checked={buzzerSettings.dishReady.enabled}
                        onChange={(e) => saveBuzzerSettings({
                          ...buzzerSettings,
                          dishReady: { ...buzzerSettings.dishReady, enabled: e.target.checked }
                        })}
                        style={{ opacity: 0, width: 0, height: 0 }}
                      />
                      <span className="slider-toggle" style={{ 
                        position: 'absolute', cursor: 'pointer', top: 0, left: 0, right: 0, bottom: 0, 
                        backgroundColor: buzzerSettings.dishReady.enabled ? 'var(--primary)' : '#3f3f46', 
                        transition: '0.3s', borderRadius: '34px',
                        boxShadow: buzzerSettings.dishReady.enabled ? '0 0 10px rgba(255,255,255,0.2)' : 'none'
                      }}>
                        <span style={{
                          position: 'absolute', content: '""', height: '18px', width: '18px', left: '3px', bottom: '3px',
                          backgroundColor: buzzerSettings.dishReady.enabled ? 'var(--bg-darkest)' : 'white',
                          transition: '0.3s', borderRadius: '50%',
                          transform: buzzerSettings.dishReady.enabled ? 'translateX(22px)' : 'none'
                        }} />
                      </span>
                    </label>
                  </div>
                  {buzzerSettings.dishReady.enabled && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                          <span>Buzzer Play Duration</span>
                          <strong style={{ color: 'var(--primary)' }}>{buzzerSettings.dishReady.duration} seconds</strong>
                        </div>
                        <input 
                          type="range" 
                          min="1" 
                          max="15" 
                          value={buzzerSettings.dishReady.duration}
                          onChange={(e) => saveBuzzerSettings({
                            ...buzzerSettings,
                            dishReady: { ...buzzerSettings.dishReady, duration: parseInt(e.target.value) }
                          })}
                          style={{ width: '100%', accentColor: 'var(--primary)', cursor: 'pointer' }}
                        />
                      </div>
                      <button 
                        onClick={() => playAlertBuzzer(buzzerSettings.dishReady.duration)}
                        className="btn btn-outline"
                        style={{ padding: '8px 16px', fontSize: '0.8rem', borderRadius: '8px', border: '1px solid var(--border-color)', color: 'var(--text-primary)', cursor: 'pointer', background: 'transparent' }}
                      >
                        🔊 Test
                      </button>
                    </div>
                  )}
                </div>

              </div>
            </div>
          )}
        </div>

        {/* Right Column: QR Generator & Management */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* QR Generator Box */}
          <div className="glass-panel" style={{ borderRadius: 'var(--radius-lg)', padding: '20px' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
              <QrCode size={18} /> QR Codes Manager
            </h3>

            {/* Common QR Section */}
            <div style={{ 
              backgroundColor: 'rgba(255, 255, 255, 0.02)', 
              border: '1px solid var(--border-color)', 
              borderRadius: 'var(--radius-md)', 
              padding: '12px',
              marginBottom: '16px',
              textAlign: 'center'
            }}>
              <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--primary)', display: 'block', marginBottom: '8px' }}>
                COMMON CAFE QR CODE
              </span>
              <img 
                src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&color=d97706&bgcolor=121214&data=${encodeURIComponent(window.location.origin + '/')}`} 
                alt="Common QR" 
                style={{ width: '130px', height: '130px', borderRadius: 'var(--radius-sm)', display: 'inline-block' }} 
              />
              <p style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '8px' }}>
                Print this single QR for the entire cafe. Customers enter their table number at checkout.
              </p>
              <button 
                onClick={() => {
                  navigator.clipboard.writeText(window.location.origin + '/');
                  alert('Common QR Link copied to clipboard!');
                }}
                className="btn btn-secondary" 
                style={{ width: '100%', fontSize: '0.75rem', padding: '6px 10px', marginTop: '10px' }}
              >
                Copy Common Link
              </button>
            </div>

            {/* Table Specific Section deleted as per request */}
          </div>

          {/* Quick Stats Panel */}
          <div className="glass-panel" style={{ borderRadius: 'var(--radius-lg)', padding: '20px' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
              <Layers size={18} /> Today's Stats
            </h3>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div style={{ backgroundColor: 'var(--bg-card)', padding: '12px', borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Total Sales</span>
                <p style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--primary)' }}>
                  ₹{orders.filter(o => o.status === 'served').reduce((sum, o) => sum + o.totalAmount, 0)}
                </p>
              </div>
              <div style={{ backgroundColor: 'var(--bg-card)', padding: '12px', borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Served Orders</span>
                <p style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--success)' }}>
                  {orders.filter(o => o.status === 'served').length}
                </p>
              </div>
            </div>
          </div>
        </div>

      </main>
    </div>
  );
};

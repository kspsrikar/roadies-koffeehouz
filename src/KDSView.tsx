import React, { useState, useEffect } from 'react';
import { 
  getOrders, 
  updateOrderStatus, 
  subscribeToDatabase 
} from './db/db';
import type { 
  Order, 
  OrderStatus 
} from './db/db';
import { 
  Clock, 
  ChefHat, 
  CheckCircle2, 
  AlertCircle, 
  CookingPot,
  Sparkles
} from 'lucide-react';

export const KDSView: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [activeTab, setActiveTab] = useState<'active' | 'ready'>('active');

  useEffect(() => {
    setOrders(getOrders());
    const unsubscribe = subscribeToDatabase((data) => {
      setOrders(data.orders);
    });
    return () => unsubscribe();
  }, []);

  const handleStatusChange = (orderId: string, newStatus: OrderStatus) => {
    updateOrderStatus(orderId, newStatus);
    setOrders(getOrders());
  };

  // KDS displays orders in chronological order (oldest first for FIFO)
  const activeOrders = orders
    .filter(o => o.status === 'pending' || o.status === 'preparing')
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

  const readyOrders = orders
    .filter(o => o.status === 'ready')
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  // Component to calculate and display elapsed preparation time
  const Timer: React.FC<{ start: string }> = ({ start }) => {
    const [elapsed, setElapsed] = useState(0);

    useEffect(() => {
      const calculate = () => {
        const diffMs = new Date().getTime() - new Date(start).getTime();
        setElapsed(Math.floor(diffMs / 60000)); // minutes
      };
      calculate();
      const interval = setInterval(calculate, 15000);
      return () => clearInterval(interval);
    }, [start]);

    const isDelayed = elapsed >= 12;

    return (
      <span style={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: '4px',
        color: isDelayed ? 'var(--danger)' : 'var(--text-secondary)',
        fontWeight: isDelayed ? 700 : 500,
        fontSize: '0.8rem',
        animation: isDelayed ? 'pulseGlow 2s infinite' : 'none'
      }}>
        <Clock size={12} />
        {elapsed} mins elapsed {isDelayed && '⚠️ LATE'}
      </span>
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', backgroundColor: 'var(--bg-darkest)', color: 'var(--text-primary)', fontFamily: 'var(--font-sans)' }}>
      
      {/* KDS Header */}
      <header style={{ 
        backgroundColor: 'var(--bg-dark)', 
        borderBottom: '1px solid var(--border-color)',
        padding: '16px 24px', 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center' 
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ backgroundColor: 'var(--primary-light)', color: 'var(--primary)', padding: '8px', borderRadius: '8px' }}>
            <CookingPot size={20} />
          </div>
          <div>
            <h1 style={{ fontSize: '1.3rem', margin: 0, fontWeight: 800, letterSpacing: '-0.5px', color: 'var(--primary)' }}>
              KITCHEN DISPLAY SYSTEM (KDS)
            </h1>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', margin: 0 }}>Roadies Koffeehouz Live Cook Queue</p>
          </div>
        </div>

        {/* Tab switchers: Queue vs Completed Ready */}
        <div style={{ display: 'flex', gap: '8px', backgroundColor: 'var(--bg-darkest)', padding: '4px', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
          <button
            onClick={() => setActiveTab('active')}
            style={{
              padding: '6px 14px',
              borderRadius: '4px',
              border: 'none',
              backgroundColor: activeTab === 'active' ? 'var(--primary)' : 'transparent',
              color: activeTab === 'active' ? '#121214' : 'var(--text-secondary)',
              fontSize: '0.8rem',
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            🍳 Cook Queue ({activeOrders.length})
          </button>
          <button
            onClick={() => setActiveTab('ready')}
            style={{
              padding: '6px 14px',
              borderRadius: '4px',
              border: 'none',
              backgroundColor: activeTab === 'ready' ? 'var(--primary)' : 'transparent',
              color: activeTab === 'ready' ? '#121214' : 'var(--text-secondary)',
              fontSize: '0.8rem',
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            🔔 Ready for Pick-up ({readyOrders.length})
          </button>
        </div>
      </header>

      {/* Grid Content */}
      <main style={{ flex: 1, padding: '24px', overflowY: 'auto' }}>
        {activeTab === 'active' ? (
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', 
            gap: '20px' 
          }}>
            {activeOrders.map((order) => {
              const isPreparing = order.status === 'preparing';
              return (
                <div 
                  key={order.id} 
                  style={{
                    backgroundColor: 'var(--bg-card)',
                    borderRadius: '12px',
                    border: `2px solid ${isPreparing ? '#10b981' : 'var(--border-color)'}`,
                    display: 'flex',
                    flexDirection: 'column',
                    overflow: 'hidden',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.4)'
                  }}
                >
                  {/* Card Header */}
                  <div style={{ 
                    padding: '12px 16px', 
                    borderBottom: '1px solid var(--border-color)',
                    backgroundColor: isPreparing ? 'rgba(16, 185, 129, 0.05)' : 'rgba(255, 255, 255, 0.03)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <div>
                      <span style={{ 
                        fontSize: '0.75rem', 
                        fontWeight: 800, 
                        color: isPreparing ? '#10b981' : 'var(--primary)',
                        backgroundColor: 'var(--bg-darkest)',
                        padding: '3px 8px',
                        borderRadius: '4px',
                        marginRight: '6px'
                      }}>
                        TABLE {order.tableNumber}
                      </span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600 }}>{order.id.split('-')[1] || order.id}</span>
                    </div>
                    <Timer start={order.createdAt} />
                  </div>

                  {/* Items List */}
                  <div style={{ padding: '16px', flex: 1, display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {order.items.map((item, idx) => (
                      <label 
                        key={idx} 
                        style={{ 
                          display: 'flex', 
                          alignItems: 'flex-start', 
                          gap: '10px', 
                          cursor: 'pointer',
                          fontSize: '0.95rem' 
                        }}
                      >
                        <input 
                          type="checkbox" 
                          style={{ 
                            marginTop: '4px',
                            cursor: 'pointer',
                            accentColor: 'var(--primary)',
                            width: '16px',
                            height: '16px' 
                          }} 
                        />
                        <div>
                          <strong style={{ fontSize: '1.05rem', color: 'var(--primary)' }}>{item.quantity}x</strong> {item.menuItem.name}
                          <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', margin: '2px 0 0 0', fontStyle: 'italic' }}>
                            {item.menuItem.category.toUpperCase()}
                          </p>
                        </div>
                      </label>
                    ))}
                  </div>

                  {/* Action Button */}
                  <div style={{ padding: '12px 16px', borderTop: '1px solid var(--border-color)', backgroundColor: 'var(--bg-darkest)' }}>
                    {isPreparing ? (
                      <button
                        onClick={() => handleStatusChange(order.id, 'ready')}
                        style={{
                          width: '100%',
                          padding: '10px',
                          backgroundColor: '#10b981',
                          border: 'none',
                          color: '#121214',
                          fontWeight: 700,
                          borderRadius: '6px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '6px'
                        }}
                      >
                        <CheckCircle2 size={16} /> Mark Ready
                      </button>
                    ) : (
                      <button
                        onClick={() => handleStatusChange(order.id, 'preparing')}
                        style={{
                          width: '100%',
                          padding: '10px',
                          backgroundColor: 'var(--primary)',
                          border: 'none',
                          color: '#121214',
                          fontWeight: 700,
                          borderRadius: '6px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '6px',
                          boxShadow: '0 0 10px rgba(255, 255, 255, 0.2)'
                        }}
                      >
                        <ChefHat size={16} /> Start Cooking
                      </button>
                    )}
                  </div>
                </div>
              );
            })}

            {activeOrders.length === 0 && (
              <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '60px', color: '#71717a' }}>
                <CookingPot size={48} style={{ margin: '0 auto 16px auto', display: 'block', opacity: 0.3 }} />
                <h3 style={{ fontSize: '1.2rem', margin: '0 0 6px 0', color: '#e4e4e7' }}>Kitchen is Clear!</h3>
                <p style={{ fontSize: '0.8rem', margin: 0 }}>No orders currently in queue. You are all caught up.</p>
              </div>
            )}
          </div>
        ) : (
          /* READY / PICK-UP VIEW */
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', 
            gap: '20px' 
          }}>
            {readyOrders.map((order) => (
              <div 
                key={order.id} 
                style={{
                  backgroundColor: 'var(--bg-card)',
                  borderRadius: '12px',
                  border: '1px solid var(--border-color)',
                  padding: '16px',
                  opacity: 0.95
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                  <span style={{ fontWeight: 800, color: '#10b981', backgroundColor: 'rgba(16, 185, 129, 0.05)', padding: '2px 8px', borderRadius: '4px', fontSize: '0.8rem' }}>
                    TABLE {order.tableNumber}
                  </span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{order.id.substring(0, 8)}</span>
                </div>
                
                <div style={{ borderBottom: '1px dashed var(--border-color)', paddingBottom: '10px', marginBottom: '10px' }}>
                  {order.items.map((item, idx) => (
                    <div key={idx} style={{ fontSize: '0.85rem', color: 'var(--text-primary)', margin: '4px 0' }}>
                      <strong>{item.quantity}x</strong> {item.menuItem.name}
                    </div>
                  ))}
                </div>

                <button
                  onClick={() => handleStatusChange(order.id, 'served')}
                  style={{
                    width: '100%',
                    padding: '8px',
                    backgroundColor: 'transparent',
                    border: '1px solid var(--border-color)',
                    color: 'var(--text-secondary)',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    borderRadius: '6px',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  Recall & Mark Served
                </button>
              </div>
            ))}

            {readyOrders.length === 0 && (
              <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '60px', color: '#71717a' }}>
                <Sparkles size={48} style={{ margin: '0 auto 16px auto', display: 'block', opacity: 0.3 }} />
                <p style={{ fontSize: '0.85rem' }}>No ready items waiting for pick-up.</p>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

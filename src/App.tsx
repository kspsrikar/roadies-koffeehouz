import { useState, useEffect } from 'react';
import { CustomerView } from './CustomerView';
import { WaiterView } from './WaiterView';
import { AdminView } from './AdminView';
import { KDSView } from './KDSView';

// Set to true to enable maintenance mode across the application
// Triggering fresh rebuild on Vercel
const MAINTENANCE_MODE = false;
const BYPASS_KEY = 'roadies'; // Append ?bypass=roadies to access the website during maintenance

function App() {
  const [currentPath, setCurrentPath] = useState(window.location.pathname);
  const [currentSearch, setCurrentSearch] = useState(window.location.search);

  useEffect(() => {
    const handleLocationChange = () => {
      setCurrentPath(window.location.pathname);
      setCurrentSearch(window.location.search);
    };

    // Listen to history changes
    window.addEventListener('popstate', handleLocationChange);
    return () => window.removeEventListener('popstate', handleLocationChange);
  }, []);

  const params = new URLSearchParams(currentSearch);
  const viewParam = params.get('view');
  const bypassParam = params.get('bypass');

  // Check if maintenance mode is active and not bypassed
  if (MAINTENANCE_MODE && bypassParam !== BYPASS_KEY) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        backgroundColor: '#09090b',
        color: '#f4f4f5',
        fontFamily: 'Outfit, sans-serif',
        padding: '24px',
        textAlign: 'center',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Background glows */}
        <div style={{
          position: 'absolute',
          top: '-10%',
          left: '20%',
          width: '400px',
          height: '400px',
          background: 'radial-gradient(circle, rgba(245, 158, 11, 0.15) 0%, rgba(245, 158, 11, 0) 70%)',
          filter: 'blur(40px)',
          zIndex: 1,
          pointerEvents: 'none'
        }} />
        <div style={{
          position: 'absolute',
          bottom: '-10%',
          right: '20%',
          width: '400px',
          height: '400px',
          background: 'radial-gradient(circle, rgba(245, 158, 11, 0.1) 0%, rgba(245, 158, 11, 0) 70%)',
          filter: 'blur(40px)',
          zIndex: 1,
          pointerEvents: 'none'
        }} />

        <div style={{
          position: 'relative',
          zIndex: 2,
          maxWidth: '500px',
          background: 'rgba(28, 28, 31, 0.65)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          border: '1px solid rgba(39, 39, 42, 0.8)',
          borderRadius: '24px',
          padding: '40px 32px',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 0 30px rgba(245, 158, 11, 0.05)'
        }}>
          {/* Animated Steam/Icon */}
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '80px',
            height: '80px',
            borderRadius: '50%',
            background: 'rgba(245, 158, 11, 0.1)',
            border: '1px solid rgba(245, 158, 11, 0.25)',
            marginBottom: '28px',
            color: '#f59e0b',
            fontSize: '36px',
            boxShadow: '0 0 15px rgba(245, 158, 11, 0.1)'
          }}>
            ☕
          </div>

          <h1 style={{
            fontSize: '28px',
            fontWeight: 700,
            marginBottom: '16px',
            letterSpacing: '-0.5px',
            background: 'linear-gradient(to right, #f4f4f5, #f59e0b)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}>
            Brewing Something Better
          </h1>

          <p style={{
            color: '#a1a1aa',
            fontSize: '15px',
            lineHeight: 1.6,
            marginBottom: '32px'
          }}>
            Our ordering system is temporarily offline for routine updates and scheduled maintenance. We'll be back shortly to serve you the perfect digital dining experience!
          </p>

          <div style={{
            display: 'inline-block',
            padding: '8px 16px',
            borderRadius: '9999px',
            background: 'rgba(245, 158, 11, 0.08)',
            border: '1px solid rgba(245, 158, 11, 0.15)',
            fontSize: '13px',
            fontWeight: 500,
            color: '#f59e0b'
          }}>
            ⏳ Estimated back online: Today
          </div>
        </div>
      </div>
    );
  }

  // Support both clean URLs (/waiter) and query params fallback (?view=waiter)
  if (currentPath === '/waiter' || viewParam === 'waiter') {
    return <WaiterView />;
  }

  if (currentPath === '/admin' || viewParam === 'admin') {
    return <AdminView />;
  }

  if (currentPath === '/kitchen' || viewParam === 'kitchen') {
    return <KDSView />;
  }

  // Default to Customer Menu
  return <CustomerView />;
}

export default App;


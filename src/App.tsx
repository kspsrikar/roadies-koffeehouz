import { useState, useEffect } from 'react';
import { CustomerView } from './CustomerView';
import { WaiterView } from './WaiterView';
import { AdminView } from './AdminView';
import { KDSView } from './KDSView';
import { AmbientBackground } from './components/AmbientBackground';

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
        backgroundColor: 'var(--bg-darkest)',
        color: 'var(--text-primary)',
        fontFamily: 'var(--font-sans)',
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
          background: 'radial-gradient(circle, rgba(255, 255, 255, 0.08) 0%, rgba(255, 255, 255, 0) 70%)',
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
          background: 'radial-gradient(circle, rgba(255, 255, 255, 0.05) 0%, rgba(255, 255, 255, 0) 70%)',
          filter: 'blur(40px)',
          zIndex: 1,
          pointerEvents: 'none'
        }} />

        <div style={{
          position: 'relative',
          zIndex: 2,
          maxWidth: '500px',
          background: 'rgba(43, 43, 52, 0.65)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          border: '1px solid var(--border-color)',
          borderRadius: '24px',
          padding: '40px 32px',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 0 30px rgba(255, 255, 255, 0.05)'
        }}>
          {/* Animated Steam/Icon */}
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '80px',
            height: '80px',
            borderRadius: '50%',
            background: 'var(--primary-light)',
            border: '1px solid var(--border-color)',
            marginBottom: '28px',
            color: 'var(--primary)',
            fontSize: '36px',
            boxShadow: '0 0 15px rgba(255, 255, 255, 0.1)'
          }}>
            ☕
          </div>

          <h1 style={{
            fontSize: '28px',
            fontWeight: 700,
            marginBottom: '16px',
            letterSpacing: '-0.5px',
            background: 'linear-gradient(to right, #f4f4f5, #ffffff)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}>
            Brewing Something Better
          </h1>

          <p style={{
            color: 'var(--text-secondary)',
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
            background: 'var(--primary-light)',
            border: '1px solid var(--border-color)',
            fontSize: '13px',
            fontWeight: 500,
            color: 'var(--primary)'
          }}>
            ⏳ Estimated back online: Today
          </div>
        </div>
      </div>
    );
  }

  // Support both clean URLs (/waiter) and query params fallback (?view=waiter)
  if (currentPath === '/waiter' || viewParam === 'waiter') {
    return (
      <PasscodeGuard targetPasscode="4321" sessionKey="roadies_waiter_auth" panelName="Waiter Dashboard">
        <WaiterView />
      </PasscodeGuard>
    );
  }

  if (currentPath === '/admin' || viewParam === 'admin') {
    return (
      <PasscodeGuard targetPasscode="4321" sessionKey="roadies_admin_auth" panelName="Admin Control Panel">
        <AdminView />
      </PasscodeGuard>
    );
  }

  if (currentPath === '/kitchen' || viewParam === 'kitchen') {
    return (
      <PasscodeGuard targetPasscode="4321" sessionKey="roadies_kitchen_auth" panelName="Kitchen Display (KDS)">
        <KDSView />
      </PasscodeGuard>
    );
  }

  // Default to Customer Menu
  return <CustomerView />;
}

import { Button } from '@/components/ui/neon-button';

// Security passcode component to lock staff/owner pages
function PasscodeGuard({
  targetPasscode,
  sessionKey,
  panelName,
  children
}: {
  targetPasscode: string;
  sessionKey: string;
  panelName: string;
  children: React.ReactNode;
}) {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return sessionStorage.getItem(sessionKey) === 'true';
  });
  const [passcode, setPasscode] = useState('');
  const [error, setError] = useState('');

  const handleUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    if (passcode === targetPasscode) {
      sessionStorage.setItem(sessionKey, 'true');
      setIsAuthenticated(true);
      setError('');
    } else {
      setError('❌ Incorrect passcode. Access Denied!');
      setPasscode('');
    }
  };

  if (isAuthenticated) {
    return <>{children}</>;
  }

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      backgroundColor: 'transparent',
      color: 'var(--text-primary)',
      fontFamily: 'var(--font-sans)',
      padding: '24px',
      textAlign: 'center',
      position: 'relative'
    }}>
      <AmbientBackground />

      <div className="glass-panel" style={{
        position: 'relative',
        zIndex: 2,
        maxWidth: '400px',
        width: '100%',
        borderRadius: 'var(--radius-lg)',
        padding: '36px 30px',
        border: '1px solid var(--border-color)',
        boxShadow: '0 10px 30px rgba(0,0,0,0.5)'
      }}>
        <div style={{
          fontSize: '36px',
          marginBottom: '16px',
          color: 'var(--primary)'
        }}>
          🔒
        </div>
        <h2 style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: '8px' }}>
          {panelName}
        </h2>
        <p style={{ fontSize: '0.85rem', color: '#a1a1aa', marginBottom: '24px' }}>
          Enter staff passcode to unlock this panel.
        </p>
 
        <form onSubmit={handleUnlock} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <input
            type="password"
            pattern="[0-9]*"
            inputMode="numeric"
            value={passcode}
            onChange={(e) => setPasscode(e.target.value)}
            placeholder="••••"
            required
            autoFocus
            style={{
              width: '100%',
              backgroundColor: '#121214',
              border: '1px solid #27272a',
              borderRadius: '10px',
              padding: '12px',
              color: 'white',
              fontSize: '1.25rem',
              letterSpacing: '0.5em',
              textAlign: 'center',
              outline: 'none'
            }}
          />

          {error && (
            <p style={{ fontSize: '0.8rem', color: '#ef4444', margin: '4px 0', fontWeight: 600 }}>
              {error}
            </p>
          )}

          <Button
            type="submit"
            className="w-full mt-2 py-3"
          >
            Authorize Access
          </Button>
        </form>
      </div>
    </div>
  );
}

export default App;


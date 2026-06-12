import { useState, useEffect } from 'react';
import { CustomerView } from './CustomerView';
import { WaiterView } from './WaiterView';
import { AdminView } from './AdminView';
import { KDSView } from './KDSView';

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

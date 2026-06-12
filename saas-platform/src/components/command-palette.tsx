'use client';

import React, { useEffect, useState } from 'react';
import { Search, Compass, Settings, ShoppingBag, Plus, Bell, RefreshCw } from 'lucide-react';

interface CommandPaletteProps {
  onNavigate: (route: string) => void;
  onTableAction: (tableNum: string) => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({ onNavigate, onTableAction }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  if (!isOpen) return null;

  const commands = [
    { name: 'Go to POS Dashboard', icon: ShoppingBag, category: 'Navigation', action: () => onNavigate('/dashboard/cashier') },
    { name: 'Go to KDS Kanban', icon: Compass, category: 'Navigation', action: () => onNavigate('/dashboard/chef') },
    { name: 'Go to Analytics & Revenue', icon: Settings, category: 'Navigation', action: () => onNavigate('/dashboard/admin') },
    { name: 'Go to Inventory Audit', icon: RefreshCw, category: 'Navigation', action: () => onNavigate('/dashboard/manager') },
    { name: 'View Active Alerts', icon: Bell, category: 'Actions', action: () => onNavigate('/dashboard/waiter') },
    { name: 'Create Quick Order - Table 1', icon: Plus, category: 'Quick Actions', action: () => onTableAction('1') },
    { name: 'Create Quick Order - Table 2', icon: Plus, category: 'Quick Actions', action: () => onTableAction('2') },
    { name: 'Create Quick Order - Table 5', icon: Plus, category: 'Quick Actions', action: () => onTableAction('5') }
  ];

  const filteredCommands = commands.filter((cmd) =>
    cmd.name.toLowerCase().includes(query.toLowerCase()) ||
    cmd.category.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/80 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-lg border border-zinc-800 rounded-2xl bg-zinc-900 shadow-2xl overflow-hidden">
        {/* Search Input */}
        <div className="flex items-center px-4 py-3 border-b border-zinc-800 gap-3">
          <Search className="text-zinc-500 w-5 h-5" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type a command or search shortcut... (Ctrl+K to close)"
            className="flex-1 bg-transparent text-sm text-white border-0 outline-none focus:ring-0 placeholder-zinc-500"
            autoFocus
          />
        </div>

        {/* Command List */}
        <div className="max-h-[300px] overflow-y-auto p-2">
          {filteredCommands.length > 0 ? (
            <div>
              {Array.from(new Set(filteredCommands.map((c) => c.category))).map((category) => (
                <div key={category} className="mb-2">
                  <div className="px-3 py-1.5 text-[10px] font-bold text-zinc-500 uppercase tracking-wider">
                    {category}
                  </div>
                  {filteredCommands
                    .filter((c) => c.category === category)
                    .map((cmd) => {
                      const Icon = cmd.icon;
                      return (
                        <button
                          key={cmd.name}
                          onClick={() => {
                            cmd.action();
                            setIsOpen(false);
                          }}
                          className="w-full flex items-center gap-3 px-3 py-2 text-zinc-300 hover:text-white hover:bg-zinc-800/60 rounded-lg text-sm text-left transition-all"
                        >
                          <Icon className="w-4 h-4 text-zinc-500" />
                          <span>{cmd.name}</span>
                        </button>
                      );
                    })}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6 text-zinc-500 text-sm">
              No command options match your search.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

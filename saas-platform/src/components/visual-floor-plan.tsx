'use client';

import React, { useState } from 'react';
import { Table } from '../lib/db-mock-types';
import { Layers, Users, Merge, Landmark, ToggleLeft } from 'lucide-react';

interface FloorPlanProps {
  tables: Table[];
  onTableClick: (table: Table) => void;
  onTableMerge: (tableId1: string, tableId2: string) => void;
}

export const VisualFloorPlan: React.FC<FloorPlanProps> = ({ tables, onTableClick, onTableMerge }) => {
  const [selectedSection, setSelectedSection] = useState<string>('Main Dining');
  const [mergeMode, setMergeMode] = useState<boolean>(false);
  const [mergeSelect, setMergeSelect] = useState<string | null>(null);

  const sections = Array.from(new Set(tables.map(t => t.floorSection)));

  const handleTablePress = (table: Table) => {
    if (mergeMode) {
      if (!mergeSelect) {
        setMergeSelect(table.id);
      } else {
        if (mergeSelect !== table.id) {
          onTableMerge(mergeSelect, table.id);
          setMergeSelect(null);
          setMergeMode(false);
        } else {
          setMergeSelect(null);
        }
      }
    } else {
      onTableClick(table);
    }
  };

  const getStatusColor = (status: Table['status']) => {
    switch (status) {
      case 'available': return 'bg-emerald-500/10 border-emerald-500 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.15)]';
      case 'occupied': return 'bg-rose-500/10 border-rose-500 text-rose-400 shadow-[0_0_15px_rgba(244,63,94,0.15)]';
      case 'reserved': return 'bg-amber-500/10 border-amber-500 text-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.15)]';
      case 'billing': return 'bg-indigo-500/10 border-indigo-500 text-indigo-400 shadow-[0_0_15px_rgba(99,102,241,0.15)]';
      default: return 'bg-zinc-800 border-zinc-700 text-zinc-400';
    }
  };

  return (
    <div className="glass-panel p-6 border border-zinc-800 rounded-2xl bg-zinc-950/70 backdrop-blur-md">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <Layers className="text-orange-500 w-5 h-5" /> Interactive Floor Plan
          </h2>
          <p className="text-xs text-zinc-400">Drag, merge, and monitor real-time tables status</p>
        </div>

        <div className="flex items-center gap-2">
          {sections.map(section => (
            <button
              key={section}
              onClick={() => setSelectedSection(section)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                selectedSection === section
                  ? 'bg-orange-600 text-white shadow-lg shadow-orange-600/20'
                  : 'bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white'
              }`}
            >
              {section}
            </button>
          ))}

          <button
            onClick={() => {
              setMergeMode(!mergeMode);
              setMergeSelect(null);
            }}
            className={`p-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1.5 transition-all ${
              mergeMode
                ? 'bg-amber-600 border-amber-500 text-white pulseGlow'
                : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white'
            }`}
          >
            <Merge className="w-3.5 h-3.5" />
            {mergeMode ? 'Selecting...' : 'Merge Mode'}
          </button>
        </div>
      </div>

      <div className="relative w-full h-[380px] bg-zinc-900/50 border border-zinc-800/80 rounded-xl overflow-hidden grid-bg">
        {tables
          .filter(t => t.floorSection === selectedSection)
          .map(table => {
            const isSelected = mergeSelect === table.id;
            return (
              <div
                key={table.id}
                onClick={() => handleTablePress(table)}
                style={{
                  position: 'absolute',
                  left: `${table.posX}%`,
                  top: `${table.posY}%`,
                  width: '90px',
                  height: '90px'
                }}
                className={`flex flex-col items-center justify-center border-2 rounded-2xl cursor-pointer select-none transition-all duration-300 hover:scale-105 ${getStatusColor(
                  table.status
                )} ${isSelected ? 'ring-2 ring-offset-2 ring-offset-zinc-950 ring-orange-500 scale-105' : ''}`}
              >
                <span className="text-xs font-semibold tracking-wider text-zinc-500 uppercase">Table</span>
                <span className="text-xl font-extrabold text-white">{table.tableNumber}</span>
                <div className="flex items-center gap-1 mt-1 text-[10px] opacity-80">
                  <Users className="w-3 h-3" />
                  <span>{table.capacity} pax</span>
                </div>
                {table.status === 'billing' && (
                  <span className="absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full bg-indigo-600 text-[10px] text-white font-bold animate-bounce border border-indigo-400">
                    $
                  </span>
                )}
              </div>
            );
          })}
      </div>

      <div className="flex flex-wrap items-center gap-4 mt-6 text-xs text-zinc-500 border-t border-zinc-900 pt-4">
        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> Available</span>
        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span> Occupied</span>
        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span> Reserved</span>
        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-indigo-500"></span> Billing Requested</span>
      </div>

      <style jsx>{`
        .grid-bg {
          background-size: 20px 20px;
          background-image: linear-gradient(to right, rgba(63, 63, 70, 0.05) 1px, transparent 1px),
                            linear-gradient(to bottom, rgba(63, 63, 70, 0.05) 1px, transparent 1px);
        }
      `}</style>
    </div>
  );
};

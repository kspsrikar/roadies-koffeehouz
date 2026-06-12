'use client';

import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell } from 'recharts';
import { TrendingUp, DollarSign, Clock, Award } from 'lucide-react';

const revenueData = [
  { day: 'Mon', revenue: 12400 },
  { day: 'Tue', revenue: 14500 },
  { day: 'Wed', revenue: 13900 },
  { day: 'Thu', revenue: 18200 },
  { day: 'Fri', revenue: 26400 },
  { day: 'Sat', revenue: 32800 },
  { day: 'Sun', revenue: 29500 }
];

const peakHoursData = [
  { hour: '12 PM', orders: 45 },
  { hour: '2 PM', orders: 32 },
  { hour: '4 PM', orders: 18 },
  { hour: '6 PM', orders: 55 },
  { hour: '8 PM', orders: 85 },
  { hour: '10 PM', orders: 62 }
];

const topProductsData = [
  { name: 'Cold Coffee', sales: 240, color: '#ea580c' },
  { name: 'Baked Calzone', sales: 185, color: '#f97316' },
  { name: 'Anti Veg Pizza', sales: 145, color: '#fb923c' },
  { name: 'Mocha Latte', sales: 120, color: '#ffedd5' }
];

export const AnalyticsCharts: React.FC = () => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* 1. Area Chart: Weekly Revenue */}
      <div className="glass-panel p-6 border border-zinc-800 rounded-2xl bg-zinc-950/70 backdrop-blur-md">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-orange-600/10 rounded-lg text-orange-500">
            <DollarSign className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-md font-bold text-white">Weekly Revenue Trend</h3>
            <p className="text-xs text-zinc-500">Total gross earnings across all branches</p>
          </div>
        </div>

        <div className="h-[250px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={revenueData}>
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ea580c" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#ea580c" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
              <XAxis dataKey="day" stroke="#71717a" fontSize={12} />
              <YAxis stroke="#71717a" fontSize={12} />
              <Tooltip contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', color: '#fff' }} />
              <Area type="monotone" dataKey="revenue" stroke="#ea580c" fillOpacity={1} fill="url(#colorRevenue)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 2. Bar Chart: Peak Hours Density */}
      <div className="glass-panel p-6 border border-zinc-800 rounded-2xl bg-zinc-950/70 backdrop-blur-md">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-orange-600/10 rounded-lg text-orange-500">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-md font-bold text-white">Peak Dining Hours</h3>
            <p className="text-xs text-zinc-500">Real-time load analysis based on orders volume</p>
          </div>
        </div>

        <div className="h-[250px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={peakHoursData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
              <XAxis dataKey="hour" stroke="#71717a" fontSize={12} />
              <YAxis stroke="#71717a" fontSize={12} />
              <Tooltip contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', color: '#fff' }} />
              <Bar dataKey="orders" fill="#ea580c" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 3. Horizontal Stats: Top Items */}
      <div className="glass-panel p-6 border border-zinc-800 rounded-2xl bg-zinc-950/70 backdrop-blur-md lg:col-span-2">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-orange-600/10 rounded-lg text-orange-500">
            <Award className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-md font-bold text-white">Best Selling Products</h3>
            <p className="text-xs text-zinc-500">Highest grossing menu items this week</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {topProductsData.map((item) => (
            <div key={item.name} className="p-4 rounded-xl border border-zinc-850 bg-zinc-900/40 hover:bg-zinc-900/70 transition-all flex flex-col justify-between">
              <span className="text-xs font-semibold text-zinc-400">{item.name}</span>
              <div className="flex justify-between items-baseline mt-4">
                <span className="text-2xl font-extrabold text-white">{item.sales}</span>
                <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-0.5">
                  <TrendingUp className="w-3 h-3" /> +12%
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

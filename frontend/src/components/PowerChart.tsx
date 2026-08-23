import React from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid
} from 'recharts';
import { TrendingUp } from 'lucide-react';

export interface ChartDataPoint {
  time: string;
  batteryV: number;
  solarV: number;
  powerW: number;
  temp: number;
}

interface PowerChartProps {
  data: ChartDataPoint[];
}

export const PowerChart: React.FC<PowerChartProps> = ({ data }) => {
  // Fallback demo points if data is just starting
  const chartData = data.length > 0 ? data : [
    { time: '00:00', batteryV: 3.85, solarV: 4.20, powerW: 0.50, temp: 28 },
    { time: '00:03', batteryV: 3.84, solarV: 4.22, powerW: 0.51, temp: 28 },
    { time: '00:06', batteryV: 3.84, solarV: 4.18, powerW: 0.49, temp: 29 },
    { time: '00:09', batteryV: 3.83, solarV: 4.30, powerW: 0.52, temp: 29 },
    { time: '00:12', batteryV: 3.82, solarV: 4.35, powerW: 0.53, temp: 29 }
  ];

  return (
    <div className="p-5 bg-slate-900/80 border border-slate-800/80 rounded-2xl backdrop-blur-md shadow-xl flex flex-col">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-cyan-500/10 text-cyan-400 rounded-lg border border-cyan-500/20">
            <TrendingUp className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-100">Live Microgrid Power Curves</h3>
            <p className="text-[11px] text-slate-400">Continuous 3s Telemetry Stream vs Battery Discharge</p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs font-mono">
          <span className="flex items-center gap-1 text-emerald-400">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" /> Battery (V)
          </span>
          <span className="flex items-center gap-1 text-amber-400">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400" /> Solar (V)
          </span>
          <span className="flex items-center gap-1 text-cyan-400">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400" /> Power (W)
          </span>
        </div>
      </div>

      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="batteryGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
              </linearGradient>
              <linearGradient id="solarGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.0} />
              </linearGradient>
              <linearGradient id="powerGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.0} />
              </linearGradient>
            </defs>

            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
            <XAxis dataKey="time" stroke="#64748b" tick={{ fontSize: 10 }} tickLine={false} />
            <YAxis stroke="#64748b" tick={{ fontSize: 10 }} tickLine={false} domain={[0, 6]} />

            <Tooltip
              contentStyle={{
                backgroundColor: '#0f172a',
                borderColor: '#334155',
                borderRadius: '0.75rem',
                fontSize: '12px',
                color: '#f8fafc'
              }}
            />

            <Area
              type="monotone"
              dataKey="batteryV"
              name="Battery (V)"
              stroke="#10b981"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#batteryGrad)"
            />
            <Area
              type="monotone"
              dataKey="solarV"
              name="Solar (V)"
              stroke="#f59e0b"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#solarGrad)"
            />
            <Area
              type="monotone"
              dataKey="powerW"
              name="Power (W)"
              stroke="#06b6d4"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#powerGrad)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

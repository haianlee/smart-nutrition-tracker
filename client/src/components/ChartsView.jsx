import React, { useState, useEffect } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ReferenceLine,
  CartesianGrid,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { TrendingUp, Flame, PieChart as PieIcon, Info, RefreshCw } from 'lucide-react';

export default function ChartsView({ tdee = 2200, targetCalories = 1900 }) {
  const [days, setDays] = useState(14);
  const [trendData, setTrendData] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchTrends = async (d) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/stats/trends?days=${d}`);
      if (res.ok) {
        const data = await res.json();
        setTrendData(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrends(days);
  }, [days]);

  // Compute weight domain for better chart zoom
  const validWeights = trendData
    .flatMap(d => [d.weight, d.movingAvg7])
    .filter(w => w !== null && w !== undefined);
  
  const minW = validWeights.length > 0 ? Math.floor(Math.min(...validWeights) - 1) : 60;
  const maxW = validWeights.length > 0 ? Math.ceil(Math.max(...validWeights) + 1) : 80;

  // Aggregate macros for the selected period
  const totalProtein = trendData.reduce((acc, d) => acc + (d.protein || 0), 0);
  const totalCarbs = trendData.reduce((acc, d) => acc + (d.carbs || 0), 0);
  const totalFat = trendData.reduce((acc, d) => acc + (d.fat || 0), 0);

  const macroPieData = [
    { name: '蛋白質', value: totalProtein, color: '#ef4444' },
    { name: '碳水化合物', value: totalCarbs, color: '#f59e0b' },
    { name: '脂肪', value: totalFat, color: '#06b6d4' }
  ];

  const totalMacroGrams = totalProtein + totalCarbs + totalFat || 1;

  return (
    <div className="space-y-6 pb-20">
      {/* Top Header & Range Selector */}
      <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-200">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
              <TrendingUp className="text-emerald-500" size={20} />
              連續性健康趨勢圖表
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">體重波動平滑曲線與熱量赤字/盈餘關聯</p>
          </div>

          <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-2xl self-start sm:self-auto">
            {[
              { label: '7 天', val: 7 },
              { label: '14 天', val: 14 },
              { label: '30 天', val: 30 },
              { label: '90 天', val: 90 }
            ].map(item => (
              <button
                key={item.val}
                onClick={() => setDays(item.val)}
                className={`text-xs px-3 py-1.5 rounded-xl font-medium transition ${
                  days === item.val
                    ? 'bg-white text-emerald-600 shadow-sm font-bold'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        {/* UX Tip Alert */}
        <div className="bg-emerald-50/70 border border-emerald-100 rounded-2xl p-3 text-xs text-emerald-800 flex items-start gap-2">
          <Info size={16} className="text-emerald-600 shrink-0 mt-0.5" />
          <div>
            <strong>7 日移動平均線 (7-day MA) 原理：</strong>
            體重每日因水分儲留與腸胃殘渣會有 0.5–1.5kg 自然浮動。圖中的紫色平滑線能消除短期雜訊，真實呈現體態與燃脂走勢。
          </div>
        </div>
      </div>

      {/* 1. Continuous Weight Chart (7-day MA) */}
      <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-200">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
            體重連續走勢 (含 7 日移動平均)
          </h3>
          <span className="text-xs text-slate-400">單位：kg</span>
        </div>

        <div className="h-64 w-full pt-2">
          {loading ? (
            <div className="h-full flex items-center justify-center text-slate-400 text-xs">
              載入圖表數據中...
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis
                  dataKey="date"
                  tickFormatter={d => d.slice(5)}
                  tick={{ fontSize: 11, fill: '#94a3b8' }}
                  stroke="#cbd5e1"
                />
                <YAxis
                  domain={[minW, maxW]}
                  tick={{ fontSize: 11, fill: '#94a3b8' }}
                  stroke="#cbd5e1"
                />
                <Tooltip
                  formatter={(val, name) => [
                    `${val} kg`,
                    name === 'weight' ? '每日量測體重' : '7日移動平均'
                  ]}
                  labelFormatter={d => `日期：${d}`}
                  contentStyle={{
                    backgroundColor: '#1e293b',
                    borderRadius: '12px',
                    border: 'none',
                    color: '#fff',
                    fontSize: '12px'
                  }}
                />
                <Legend
                  wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }}
                  formatter={(value) => value === 'weight' ? '實際體重' : '7日平滑平均線 (MA)'}
                />
                <Line
                  type="monotone"
                  dataKey="weight"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  dot={{ r: 3, fill: '#3b82f6' }}
                  activeDot={{ r: 5 }}
                  connectNulls={true}
                />
                <Line
                  type="monotone"
                  dataKey="movingAvg7"
                  stroke="#8b5cf6"
                  strokeWidth={3}
                  dot={false}
                  activeDot={{ r: 4 }}
                  connectNulls={true}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* 2. Calorie vs TDEE Deficit/Surplus Chart */}
      <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-200">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
            <Flame className="text-amber-500" size={17} />
            每日攝取熱量 vs. TDEE 維持熱量
          </h3>
          <span className="text-xs text-slate-400">綠色=赤字 / 紅色=盈餘</span>
        </div>

        <div className="h-64 w-full pt-2">
          {loading ? (
            <div className="h-full flex items-center justify-center text-slate-400 text-xs">
              載入熱量數據中...
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={trendData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis
                  dataKey="date"
                  tickFormatter={d => d.slice(5)}
                  tick={{ fontSize: 11, fill: '#94a3b8' }}
                  stroke="#cbd5e1"
                />
                <YAxis
                  tick={{ fontSize: 11, fill: '#94a3b8' }}
                  stroke="#cbd5e1"
                />
                <Tooltip
                  formatter={(val, name, item) => {
                    const d = item.payload;
                    const diff = d.tdee - d.calories;
                    return [
                      `${val} kcal (${diff >= 0 ? '赤字 -' + diff : '盈餘 +' + Math.abs(diff)} kcal)`,
                      '當日攝取'
                    ];
                  }}
                  labelFormatter={d => `日期：${d}`}
                  contentStyle={{
                    backgroundColor: '#1e293b',
                    borderRadius: '12px',
                    border: 'none',
                    color: '#fff',
                    fontSize: '12px'
                  }}
                />
                <ReferenceLine
                  y={tdee}
                  stroke="#ef4444"
                  strokeDasharray="4 4"
                  label={{ value: `TDEE: ${tdee}`, fill: '#ef4444', fontSize: 11, position: 'insideTopRight' }}
                />
                <ReferenceLine
                  y={targetCalories}
                  stroke="#10b981"
                  strokeDasharray="3 3"
                  label={{ value: `目標: ${targetCalories}`, fill: '#10b981', fontSize: 11, position: 'insideBottomRight' }}
                />
                <Bar dataKey="calories" radius={[6, 6, 0, 0]}>
                  {trendData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.calories > tdee ? '#f43f5e' : entry.calories > 0 ? '#10b981' : '#e2e8f0'}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* 3. Macronutrient Distribution */}
      <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-200">
        <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5 mb-3">
          <PieIcon className="text-teal-500" size={17} />
          週期巨量營養素比例 (三大營養總量)
        </h3>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="w-48 h-48">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={macroPieData}
                  innerRadius={45}
                  outerRadius={75}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {macroPieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(val, name) => [
                    `${val}g (${Math.round((val / totalMacroGrams) * 100)}%)`,
                    name
                  ]}
                  contentStyle={{
                    backgroundColor: '#1e293b',
                    borderRadius: '12px',
                    color: '#fff',
                    fontSize: '12px'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="flex-1 w-full space-y-3">
            {macroPieData.map(macro => {
              const pct = Math.round((macro.value / totalMacroGrams) * 100);
              return (
                <div key={macro.name} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="font-semibold text-slate-700 flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: macro.color }} />
                      {macro.name}
                    </span>
                    <span className="font-bold text-slate-900">{macro.value}g ({pct}%)</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${pct}%`, backgroundColor: macro.color }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

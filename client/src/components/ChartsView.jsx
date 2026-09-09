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

  const [macroMode, setMacroMode] = useState('week'); // 'day', 'week', 'range'

  // Determine slice and label based on macroMode (單日 vs 週累積 vs 週期累積)
  let targetMacroSlice = [];
  let macroRangeLabel = '';
  let macroDaysCount = 1;

  if (macroMode === 'day') {
    const todayEntry = trendData.length > 0 ? trendData[trendData.length - 1] : null;
    targetMacroSlice = todayEntry ? [todayEntry] : [];
    macroRangeLabel = todayEntry?.date ? `${todayEntry.date} (單日)` : '今日單日';
    macroDaysCount = 1;
  } else if (macroMode === 'week') {
    targetMacroSlice = trendData.slice(-7);
    const startD = targetMacroSlice[0]?.date || '';
    const endD = targetMacroSlice[targetMacroSlice.length - 1]?.date || '';
    macroRangeLabel = startD && endD ? `${startD} ~ ${endD}` : '近 7 天';
    macroDaysCount = Math.max(1, targetMacroSlice.length);
  } else {
    targetMacroSlice = trendData;
    const startD = targetMacroSlice[0]?.date || '';
    const endD = targetMacroSlice[targetMacroSlice.length - 1]?.date || '';
    macroRangeLabel = startD && endD ? `${startD} ~ ${endD}` : `近 ${days} 天`;
    macroDaysCount = Math.max(1, targetMacroSlice.length);
  }

  const macroProteinG = targetMacroSlice.reduce((acc, d) => acc + (d.protein || 0), 0);
  const macroCarbsG = targetMacroSlice.reduce((acc, d) => acc + (d.carbs || 0), 0);
  const macroFatG = targetMacroSlice.reduce((acc, d) => acc + (d.fat || 0), 0);

  const totalMacroGrams = macroProteinG + macroCarbsG + macroFatG || 1;

  // Calories: Protein 4 kcal/g, Carbs 4 kcal/g, Fat 9 kcal/g
  const proteinKcal = macroProteinG * 4;
  const carbsKcal = macroCarbsG * 4;
  const fatKcal = macroFatG * 9;
  const totalMacroKcal = proteinKcal + carbsKcal + fatKcal || 1;

  const macroPieData = [
    {
      name: '蛋白質',
      value: macroProteinG,
      kcal: proteinKcal,
      avg: Math.round(macroProteinG / macroDaysCount),
      color: '#ef4444'
    },
    {
      name: '碳水化合物',
      value: macroCarbsG,
      kcal: carbsKcal,
      avg: Math.round(macroCarbsG / macroDaysCount),
      color: '#f59e0b'
    },
    {
      name: '脂肪',
      value: macroFatG,
      kcal: fatKcal,
      avg: Math.round(macroFatG / macroDaysCount),
      color: '#06b6d4'
    }
  ];

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
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                <PieIcon className="text-teal-500" size={17} />
                巨量營養素比例
              </h3>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-teal-50 text-teal-700 border border-teal-200">
                {macroMode === 'day' ? '📅 今日單日' : macroMode === 'week' ? '📊 近 7 天 (週累積)' : `📈 近 ${days} 天 (全期累積)`}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              統計區間：{macroRangeLabel}（共 {macroDaysCount} 天數據）
            </p>
          </div>

          {/* 切換按鈕：單日 / 週累積 / 週期全累積 */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl self-start sm:self-auto">
            <button
              onClick={() => setMacroMode('day')}
              className={`px-3 py-1 text-xs font-medium rounded-lg transition-all ${
                macroMode === 'day'
                  ? 'bg-white text-teal-700 shadow-sm font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              今日單日
            </button>
            <button
              onClick={() => setMacroMode('week')}
              className={`px-3 py-1 text-xs font-medium rounded-lg transition-all ${
                macroMode === 'week'
                  ? 'bg-white text-teal-700 shadow-sm font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              近 7 天 (週累積)
            </button>
            {days !== 7 && (
              <button
                onClick={() => setMacroMode('range')}
                className={`px-3 py-1 text-xs font-medium rounded-lg transition-all ${
                  macroMode === 'range'
                    ? 'bg-white text-teal-700 shadow-sm font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                近 {days} 天全累積
              </button>
            )}
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-6 pt-2">
          <div className="relative w-48 h-48 flex items-center justify-center flex-shrink-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={macroPieData}
                  innerRadius={48}
                  outerRadius={76}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {macroPieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(val, name, item) => [
                    `${val}g (${Math.round((val / totalMacroGrams) * 100)}% 克數比 / ${Math.round((item.payload.kcal / totalMacroKcal) * 100)}% 熱量比)`,
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
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
              <span className="text-[11px] text-slate-400 font-medium">
                {macroMode === 'day' ? '單日總量' : `${macroDaysCount}天累積`}
              </span>
              <span className="text-base font-black text-slate-800">
                {Math.round(totalMacroGrams)}g
              </span>
              <span className="text-[10px] text-slate-400">
                {Math.round(totalMacroKcal)} kcal
              </span>
            </div>
          </div>

          <div className="flex-1 w-full space-y-3.5">
            {macroPieData.map(macro => {
              const gramPct = Math.round((macro.value / totalMacroGrams) * 100);
              const kcalPct = Math.round((macro.kcal / totalMacroKcal) * 100);
              return (
                <div key={macro.name} className="space-y-1.5 bg-slate-50/70 p-2.5 rounded-2xl border border-slate-100">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-semibold text-slate-700 flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: macro.color }} />
                      {macro.name}
                      {macroDaysCount > 1 && (
                        <span className="text-[10px] font-medium text-slate-500 bg-white px-1.5 py-0.5 rounded border border-slate-200">
                          均 {macro.avg}g/天
                        </span>
                      )}
                    </span>
                    <div className="text-right">
                      <span className="font-bold text-slate-900">{macro.value}g</span>
                      <span className="text-slate-500 text-[11px] ml-1.5">
                        (佔比 {gramPct}% | 熱量 {kcalPct}%)
                      </span>
                    </div>
                  </div>
                  <div className="w-full bg-slate-200/70 h-2 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${gramPct}%`, backgroundColor: macro.color }}
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

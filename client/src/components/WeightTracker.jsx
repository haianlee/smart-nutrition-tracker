import React, { useState } from 'react';
import { Scale, Plus, Trash2, Calendar, TrendingDown, TrendingUp, Check, AlertCircle } from 'lucide-react';

export default function WeightTracker({ weights, onWeightSaved, onWeightDeleted, heightCm = 175 }) {
  const todayStr = new Date().toISOString().split('T')[0];
  const nowTime = new Date().toTimeString().slice(0, 5);

  const [date, setDate] = useState(todayStr);
  const [time, setTime] = useState(nowTime);
  const [weightKg, setWeightKg] = useState('');
  const [bodyFatPct, setBodyFatPct] = useState('');
  const [notes, setNotes] = useState('');
  const [statusMsg, setStatusMsg] = useState('');

  // Calculate BMI if weight is available
  const currentWeightNum = Number(weightKg) || (weights.length > 0 ? weights[weights.length - 1].weightKg : null);
  const bmi = currentWeightNum && heightCm 
    ? (currentWeightNum / ((heightCm / 100) * (heightCm / 100))).toFixed(1)
    : null;

  // Compare latest two weights
  const latestWeight = weights.length > 0 ? weights[weights.length - 1] : null;
  const prevWeight = weights.length > 1 ? weights[weights.length - 2] : null;
  const weightDiff = latestWeight && prevWeight 
    ? (latestWeight.weightKg - prevWeight.weightKg).toFixed(2)
    : null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!weightKg || Number(weightKg) <= 0) {
      setStatusMsg('請輸入有效體重');
      return;
    }

    try {
      const res = await fetch('/api/weights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date,
          time,
          weightKg: parseFloat(weightKg),
          bodyFatPct: bodyFatPct ? parseFloat(bodyFatPct) : null,
          notes
        })
      });

      if (!res.ok) throw new Error('體重儲存失敗');

      const saved = await res.json();
      onWeightSaved(saved);
      setWeightKg('');
      setBodyFatPct('');
      setNotes('');
      setStatusMsg('✅ 體重記錄已更新！');
      setTimeout(() => setStatusMsg(''), 3000);
    } catch (err) {
      setStatusMsg(`錯誤: ${err.message}`);
    }
  };

  return (
    <div className="space-y-5 pb-16">
      {/* Top Quick Status Pill Cards */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-sm">
          <span className="text-xs text-slate-400 block font-medium">最新量測體重</span>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-2xl font-black text-slate-800">
              {latestWeight ? latestWeight.weightKg : '--'}
            </span>
            <span className="text-xs font-semibold text-slate-400">kg</span>
          </div>
          {weightDiff !== null && (
            <div className={`flex items-center gap-1 text-xs font-semibold mt-1 ${
              Number(weightDiff) <= 0 ? 'text-emerald-600' : 'text-rose-500'
            }`}>
              {Number(weightDiff) <= 0 ? <TrendingDown size={14} /> : <TrendingUp size={14} />}
              <span>{Number(weightDiff) > 0 ? `+${weightDiff}` : weightDiff} kg (較上次)</span>
            </div>
          )}
        </div>

        <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-sm">
          <span className="text-xs text-slate-400 block font-medium">BMI 身體質量指數</span>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-2xl font-black text-indigo-600">
              {bmi || '--'}
            </span>
            <span className="text-xs font-medium text-slate-400">
              {bmi ? (bmi < 18.5 ? '過輕' : bmi < 24 ? '正常標準' : bmi < 27 ? '過重' : '肥胖') : ''}
            </span>
          </div>
          <span className="text-[11px] text-slate-400 block mt-1">
            身高：{heightCm} cm
          </span>
        </div>
      </div>

      {/* Input Form Card */}
      <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-200">
        <h2 className="text-base font-bold text-slate-800 flex items-center gap-2 mb-4">
          <Scale className="text-indigo-500" size={20} />
          登錄體重與身體指標
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-slate-500 block mb-1">日期</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full text-sm px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 focus:outline-none focus:border-indigo-500"
                required
              />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-500 block mb-1">時間</label>
              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full text-sm px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 focus:outline-none focus:border-indigo-500"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-slate-500 block mb-1">體重 (kg) *</label>
              <input
                type="number"
                step="0.05"
                placeholder="例如 68.5"
                value={weightKg}
                onChange={(e) => setWeightKg(e.target.value)}
                className="w-full text-base font-semibold px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 focus:outline-none focus:border-indigo-500 text-indigo-900"
                required
              />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-500 block mb-1">體脂率 (%) 選填</label>
              <input
                type="number"
                step="0.1"
                placeholder="例如 19.5"
                value={bodyFatPct}
                onChange={(e) => setBodyFatPct(e.target.value)}
                className="w-full text-base font-semibold px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 focus:outline-none focus:border-indigo-500 text-slate-700"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-slate-500 block mb-1">備註 (選填)</label>
            <input
              type="text"
              placeholder="例：早起空腹量測、運動後量測"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <button
            type="submit"
            className="w-full py-3 px-4 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm shadow-md shadow-indigo-500/20 flex items-center justify-center gap-2 transition active:scale-98"
          >
            <Plus size={18} />
            <span>儲存體重記錄</span>
          </button>
        </form>

        {statusMsg && (
          <div className="mt-3 p-2.5 rounded-xl text-xs flex items-center gap-2 bg-indigo-50 text-indigo-800 border border-indigo-200 animate-fadeIn">
            <Check size={15} />
            <span>{statusMsg}</span>
          </div>
        )}
      </div>

      {/* History Weight Log */}
      <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-200">
        <h3 className="text-base font-bold text-slate-800 flex items-center gap-2 mb-3">
          <Calendar size={18} className="text-slate-500" />
          體重歷史記錄 ({weights.length} 筆)
        </h3>

        {weights.length === 0 ? (
          <div className="text-center py-8 text-slate-400 text-xs">
            目前尚無體重記錄，請在上表記錄今日體重！
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {[...weights].reverse().map(item => (
              <div key={item.id} className="py-3 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm text-slate-800">{item.date}</span>
                    <span className="text-xs text-slate-400">{item.time}</span>
                  </div>
                  {item.notes && (
                    <span className="text-xs text-slate-500 block mt-0.5">{item.notes}</span>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <span className="text-base font-bold text-indigo-700">{item.weightKg} <span className="text-xs font-normal text-slate-400">kg</span></span>
                    {item.bodyFatPct && (
                      <span className="text-xs text-slate-500 block">脂 {item.bodyFatPct}%</span>
                    )}
                  </div>
                  <button
                    onClick={() => onWeightDeleted(item.id)}
                    className="p-1.5 text-slate-300 hover:text-rose-500 transition"
                    title="刪除"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

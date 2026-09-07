import React from 'react';
import { Sparkles, Settings, Activity } from 'lucide-react';

export default function Navbar({ onOpenSettings, todayWeight, todayCalories, tdee }) {
  const isDeficit = (tdee - todayCalories) >= 0;
  
  return (
    <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-slate-200 px-4 py-3">
      <div className="max-w-2xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-white shadow-sm shadow-emerald-200">
            <Sparkles size={20} />
          </div>
          <div>
            <h1 className="text-base font-bold text-slate-800 leading-tight flex items-center gap-1.5">
              智慧飲食與體重管家
              <span className="text-[10px] uppercase font-semibold tracking-wider bg-emerald-50 text-emerald-600 px-1.5 py-0.5 rounded border border-emerald-200">
                Gemini 3.8 AI
              </span>
            </h1>
            <p className="text-xs text-slate-500">連續性數據追蹤與自動結報</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Daily quick pill */}
          <div className="hidden sm:flex items-center gap-2 text-xs bg-slate-100 px-3 py-1.5 rounded-full text-slate-600">
            <span>今日熱量: <strong className="text-slate-800">{todayCalories}</strong> kcal</span>
            <span className="text-slate-300">|</span>
            <span className={isDeficit ? "text-emerald-600 font-medium" : "text-rose-500 font-medium"}>
              {isDeficit ? `赤字 -${tdee - todayCalories}` : `盈餘 +${todayCalories - tdee}`}
            </span>
          </div>

          <button
            onClick={onOpenSettings}
            className="p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition active:scale-95"
            title="設定"
          >
            <Settings size={20} />
          </button>
        </div>
      </div>
    </header>
  );
}

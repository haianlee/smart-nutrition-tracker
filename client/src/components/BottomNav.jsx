import React from 'react';
import { Utensils, Scale, TrendingUp, FileText } from 'lucide-react';

export default function BottomNav({ activeTab, setActiveTab }) {
  const tabs = [
    { id: 'food', label: '飲食辨識', icon: Utensils },
    { id: 'weight', label: '體重記錄', icon: Scale },
    { id: 'charts', label: '趨勢圖表', icon: TrendingUp },
    { id: 'reports', label: '結算通報', icon: FileText }
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 bg-white/95 backdrop-blur-md border-t border-slate-200 py-1.5 px-4 pb-safe">
      <div className="max-w-md mx-auto flex items-center justify-around">
        {tabs.map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex flex-col items-center justify-center py-1 px-3 rounded-2xl transition-all duration-200 active:scale-95 ${
                isActive
                  ? 'text-emerald-600 font-semibold'
                  : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              <div className={`p-1 rounded-xl transition-colors ${isActive ? 'bg-emerald-50 text-emerald-600' : ''}`}>
                <Icon size={22} strokeWidth={isActive ? 2.3 : 1.8} />
              </div>
              <span className="text-[11px] mt-0.5">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}

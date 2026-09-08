import React, { useState, useEffect } from 'react';
import { X, Key, User, Bell, Check, Calculator, Sparkles, Shield } from 'lucide-react';

export default function SettingsModal({ isOpen, onClose, onSettingsUpdated }) {
  const [activeTab, setActiveTab] = useState('profile');
  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');

  const [settings, setSettings] = useState(() => {
    try {
      const cached = JSON.parse(localStorage.getItem('nt_settings') || '{}');
      return {
        geminiApiKey: localStorage.getItem('gemini_api_key') || cached.geminiApiKey || '',
        geminiModel: cached.geminiModel || 'gemini-3.8-flash',
        userProfile: {
          gender: 'male',
          age: 28,
          heightCm: 175,
          weightKg: 70,
          activityLevel: 'moderate',
          ...(cached.userProfile || {})
        },
        tdee: cached.tdee || 2200,
        targetCalories: cached.targetCalories || 1900,
        targetMacros: {
          proteinG: 130,
          carbsG: 200,
          fatG: 60,
          ...(cached.targetMacros || {})
        },
        notifications: {
          emailRecipient: '',
          smtpHost: 'smtp.gmail.com',
          smtpPort: 587,
          smtpSecure: false,
          smtpUser: '',
          smtpPass: '',
          dailyDigestEnabled: true,
          dailyDigestTime: '22:00',
          ...(cached.notifications || {})
        },
        isCustomized: cached.isCustomized || false
      };
    } catch (e) {
      return {
        geminiApiKey: '',
        geminiModel: 'gemini-3.8-flash',
        userProfile: { gender: 'male', age: 28, heightCm: 175, weightKg: 70, activityLevel: 'moderate' },
        tdee: 2200,
        targetCalories: 1900,
        targetMacros: { proteinG: 130, carbsG: 200, fatG: 60 },
        notifications: { emailRecipient: '', smtpHost: 'smtp.gmail.com', smtpPort: 587, smtpSecure: false, smtpUser: '', smtpPass: '', dailyDigestEnabled: true, dailyDigestTime: '22:00' },
        isCustomized: false
      };
    }
  });

  useEffect(() => {
    if (isOpen) {
      const cachedKey = localStorage.getItem('gemini_api_key') || '';
      let cachedSettings = {};
      try {
        cachedSettings = JSON.parse(localStorage.getItem('nt_settings') || '{}');
      } catch (e) {
        cachedSettings = {};
      }

      fetch('/api/settings')
        .then(res => res.json())
        .then(data => {
          setSettings(prev => {
            const cachedNotif = cachedSettings.notifications || {};
            const serverNotif = data.notifications || {};
            const serverIsDefault = !data.isCustomized;
            const hasCached = cachedSettings && (cachedSettings.isCustomized || cachedSettings.userProfile);

            // User profile: If server is default or phone has cached customized profile, phone's cached userProfile wins!
            const mergedProfile = (hasCached && cachedSettings.userProfile)
              ? { ...prev.userProfile, ...cachedSettings.userProfile }
              : { ...prev.userProfile, ...(data.userProfile || {}) };

            const mergedMacros = (hasCached && cachedSettings.targetMacros)
              ? { ...prev.targetMacros, ...cachedSettings.targetMacros }
              : { ...prev.targetMacros, ...(data.targetMacros || {}) };

            const mergedTdee = (hasCached && cachedSettings.tdee)
              ? cachedSettings.tdee
              : (data.tdee || prev.tdee);

            const mergedTargetCalories = (hasCached && cachedSettings.targetCalories)
              ? cachedSettings.targetCalories
              : (data.targetCalories || prev.targetCalories);

            const mergedNotifications = {
              ...prev.notifications,
              ...cachedNotif,
              ...serverNotif,
              emailRecipient: (serverIsDefault && cachedSettings?.notifications?.emailRecipient) 
                ? cachedSettings.notifications.emailRecipient 
                : (serverNotif.emailRecipient || cachedNotif.emailRecipient || prev.notifications.emailRecipient || ''),
              smtpHost: (serverIsDefault && cachedSettings?.notifications?.smtpHost)
                ? cachedSettings.notifications.smtpHost
                : (serverNotif.smtpHost || cachedNotif.smtpHost || prev.notifications.smtpHost || 'smtp.gmail.com'),
              smtpPort: (serverIsDefault && cachedSettings?.notifications?.smtpPort)
                ? cachedSettings.notifications.smtpPort
                : (serverNotif.smtpPort || cachedNotif.smtpPort || prev.notifications.smtpPort || 587),
              smtpUser: (serverIsDefault && cachedSettings?.notifications?.smtpUser)
                ? cachedSettings.notifications.smtpUser
                : (serverNotif.smtpUser || cachedNotif.smtpUser || prev.notifications.smtpUser || ''),
              smtpPass: (serverNotif.smtpPass && serverNotif.smtpPass !== '********')
                ? serverNotif.smtpPass
                : (cachedNotif.smtpPass || serverNotif.smtpPass || prev.notifications.smtpPass || ''),
              dailyDigestEnabled: serverNotif.dailyDigestEnabled !== undefined 
                ? serverNotif.dailyDigestEnabled 
                : (cachedNotif.dailyDigestEnabled !== undefined ? cachedNotif.dailyDigestEnabled : prev.notifications.dailyDigestEnabled),
              dailyDigestTime: serverNotif.dailyDigestTime || cachedNotif.dailyDigestTime || prev.notifications.dailyDigestTime || '22:00'
            };

            const newSettings = {
              ...prev,
              ...data,
              ...(hasCached ? cachedSettings : {}),
              userProfile: mergedProfile,
              targetMacros: mergedMacros,
              tdee: mergedTdee,
              targetCalories: mergedTargetCalories,
              geminiApiKey: data.geminiApiKey || cachedKey || cachedSettings.geminiApiKey || prev.geminiApiKey,
              notifications: mergedNotifications,
              isCustomized: true
            };

            // If server is clean/wiped default, auto-restore entire settings to server!
            if (serverIsDefault && hasCached) {
              console.log('🔄 偵測到伺服器設定為全新預設值，手機端自動將體態、TDEE 與通報設定還原至伺服器...');
              fetch('/api/settings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newSettings)
              }).catch(e => console.warn('Auto restore settings to server failed', e));
            }

            return newSettings;
          });
        })
        .catch(err => {
          console.error('Fetch settings error:', err);
          if (cachedSettings && Object.keys(cachedSettings).length > 0) {
            setSettings(prev => ({
              ...prev,
              ...cachedSettings,
              geminiApiKey: cachedKey || cachedSettings.geminiApiKey || prev.geminiApiKey,
              notifications: { ...prev.notifications, ...(cachedSettings.notifications || {}) }
            }));
          }
        });
    }
  }, [isOpen]);

  // BMR & TDEE Auto-calculation (Mifflin-St Jeor)
  const calculateTDEE = (p) => {
    const { gender, age, heightCm, weightKg, activityLevel } = p;
    let bmr = (10 * Number(weightKg)) + (6.25 * Number(heightCm)) - (5 * Number(age));
    bmr += gender === 'male' ? 5 : -161;

    const multipliers = {
      sedentary: 1.2,
      light: 1.375,
      moderate: 1.55,
      active: 1.725,
      very_active: 1.9
    };
    const factor = multipliers[activityLevel] || 1.55;
    const computedTdee = Math.round(bmr * factor);
    const computedTargetCal = Math.round(computedTdee - 300); // 300 kcal deficit
    return { bmr: Math.round(bmr), tdee: computedTdee, targetCal: computedTargetCal };
  };

  const handleProfileChange = (key, val) => {
    const updatedProfile = { ...settings.userProfile, [key]: val };
    const { tdee, targetCal } = calculateTDEE(updatedProfile);
    
    // Auto-calculate suggested macros based on weight
    const weightNum = Number(updatedProfile.weightKg) || 70;
    const proteinG = Math.round(weightNum * 2.0); // 2g per kg
    const fatG = Math.round(weightNum * 0.8);      // 0.8g per kg
    const carbsG = Math.max(50, Math.round((targetCal - (proteinG * 4 + fatG * 9)) / 4));

    setSettings({
      ...settings,
      userProfile: updatedProfile,
      tdee,
      targetCalories: targetCal,
      targetMacros: { proteinG, carbsG, fatG },
      isCustomized: true
    });
  };

  const handleSave = async () => {
    setLoading(true);
    setStatusMsg('');
    try {
      let cachedSettings = {};
      try {
        cachedSettings = JSON.parse(localStorage.getItem('nt_settings') || '{}');
      } catch (e) {}
      
      const toSave = {
        ...settings,
        isCustomized: true,
        updatedAt: new Date().toISOString(),
        notifications: {
          ...settings.notifications,
          smtpPass: settings.notifications.smtpPass === '********'
            ? (cachedSettings.notifications?.smtpPass || '')
            : settings.notifications.smtpPass
        }
      };

      // Save to localStorage immediately
      localStorage.setItem('nt_settings', JSON.stringify(toSave));
      if (settings.geminiApiKey) {
        localStorage.setItem('gemini_api_key', settings.geminiApiKey);
      }

      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(toSave)
      });
      if (!res.ok) throw new Error('儲存失敗');

      const saved = await res.json();
      setStatusMsg('✅ 設定已成功儲存！');
      if (onSettingsUpdated) onSettingsUpdated(saved);
      setTimeout(() => {
        setStatusMsg('');
        onClose();
      }, 1000);
    } catch (err) {
      setStatusMsg(`錯誤: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fadeIn">
      <div className="bg-white w-full sm:max-w-lg rounded-t-3xl sm:rounded-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-800">個人與系統設定</h2>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition"
          >
            <X size={20} />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-100 px-4 bg-slate-50/50">
          {[
            { id: 'profile', label: '體態與 TDEE', icon: User },
            { id: 'ai', label: 'Gemini AI', icon: Key },
            { id: 'notifications', label: '郵件通報', icon: Bell }
          ].map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 py-3 text-xs font-semibold flex items-center justify-center gap-1.5 border-b-2 transition ${
                  activeTab === tab.id
                    ? 'border-emerald-500 text-emerald-600 bg-white'
                    : 'border-transparent text-slate-400 hover:text-slate-600'
                }`}
              >
                <Icon size={15} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab Content */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1">
          {/* PROFILE & TDEE TAB */}
          {activeTab === 'profile' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-slate-500 block mb-1">性別</label>
                  <select
                    value={settings.userProfile.gender}
                    onChange={(e) => handleProfileChange('gender', e.target.value)}
                    className="w-full text-sm px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none"
                  >
                    <option value="male">男性</option>
                    <option value="female">女性</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-500 block mb-1">年齡 (歲)</label>
                  <input
                    type="number"
                    value={settings.userProfile.age}
                    onChange={(e) => handleProfileChange('age', e.target.value)}
                    className="w-full text-sm px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-slate-500 block mb-1">身高 (cm)</label>
                  <input
                    type="number"
                    value={settings.userProfile.heightCm}
                    onChange={(e) => handleProfileChange('heightCm', e.target.value)}
                    className="w-full text-sm px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-500 block mb-1">基準體重 (kg)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={settings.userProfile.weightKg}
                    onChange={(e) => handleProfileChange('weightKg', e.target.value)}
                    className="w-full text-sm px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-slate-500 block mb-1">日常活動強度</label>
                <select
                  value={settings.userProfile.activityLevel}
                  onChange={(e) => handleProfileChange('activityLevel', e.target.value)}
                  className="w-full text-sm px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none"
                >
                  <option value="sedentary">久坐（幾乎不運動）</option>
                  <option value="light">輕度活動（每週運動 1-3 天）</option>
                  <option value="moderate">中度活動（每週運動 3-5 天）</option>
                  <option value="active">高度活動（每週運動 6-7 天）</option>
                  <option value="very_active">極高度活動（運動員/重體力）</option>
                </select>
              </div>

              {/* TDEE Summary Banner */}
              <div className="bg-emerald-50 rounded-2xl p-4 border border-emerald-100 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-emerald-700 font-semibold flex items-center gap-1">
                    <Calculator size={14} />
                    自動計算 TDEE 維持熱量
                  </span>
                  <span className="text-lg font-black text-emerald-700">{settings.tdee} kcal</span>
                </div>
                <div className="flex items-center justify-between text-xs text-emerald-800">
                  <span>建議減脂目標熱量 (-300 kcal 赤字)：</span>
                  <input
                    type="number"
                    value={settings.targetCalories}
                    onChange={(e) => setSettings({ ...settings, targetCalories: Number(e.target.value) })}
                    className="w-20 text-center font-bold px-1 py-0.5 rounded bg-white border border-emerald-300 focus:outline-none"
                  />
                </div>
              </div>

              {/* Target Macros */}
              <div>
                <label className="text-xs font-medium text-slate-500 block mb-1.5">每日三大營養素目標 (克)</label>
                <div className="grid grid-cols-3 gap-2">
                  <div className="bg-rose-50/70 p-2.5 rounded-xl border border-rose-100 text-center">
                    <span className="text-[11px] text-rose-600 block">蛋白質</span>
                    <input
                      type="number"
                      value={settings.targetMacros.proteinG}
                      onChange={(e) => setSettings({
                        ...settings,
                        targetMacros: { ...settings.targetMacros, proteinG: Number(e.target.value) }
                      })}
                      className="w-16 text-center font-bold text-sm bg-white rounded border border-rose-200 mt-1"
                    />
                    <span className="text-[10px] text-rose-400 block">g</span>
                  </div>

                  <div className="bg-amber-50/70 p-2.5 rounded-xl border border-amber-100 text-center">
                    <span className="text-[11px] text-amber-600 block">碳水化合物</span>
                    <input
                      type="number"
                      value={settings.targetMacros.carbsG}
                      onChange={(e) => setSettings({
                        ...settings,
                        targetMacros: { ...settings.targetMacros, carbsG: Number(e.target.value) }
                      })}
                      className="w-16 text-center font-bold text-sm bg-white rounded border border-amber-200 mt-1"
                    />
                    <span className="text-[10px] text-amber-400 block">g</span>
                  </div>

                  <div className="bg-cyan-50/70 p-2.5 rounded-xl border border-cyan-100 text-center">
                    <span className="text-[11px] text-cyan-600 block">脂肪</span>
                    <input
                      type="number"
                      value={settings.targetMacros.fatG}
                      onChange={(e) => setSettings({
                        ...settings,
                        targetMacros: { ...settings.targetMacros, fatG: Number(e.target.value) }
                      })}
                      className="w-16 text-center font-bold text-sm bg-white rounded border border-cyan-200 mt-1"
                    />
                    <span className="text-[10px] text-cyan-400 block">g</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* AI GEMINI TAB */}
          {activeTab === 'ai' && (
            <div className="space-y-4">
              <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 text-xs text-slate-600 leading-relaxed">
                <Sparkles size={16} className="text-emerald-500 mb-1" />
                系統支援最新旗艦 <strong>Gemini 3.8 Flash</strong> 視覺模型進行多模態辨識。您可直接填入自己的 Google AI Studio API Key，若未填入則會使用本機示範資料模擬。
              </div>

              <div>
                <label className="text-xs font-medium text-slate-500 block mb-1">Gemini API Key</label>
                <input
                  type="password"
                  placeholder="AIzaSy..."
                  value={settings.geminiApiKey}
                  onChange={(e) => setSettings({ ...settings, geminiApiKey: e.target.value })}
                  className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 focus:outline-none focus:border-emerald-500 font-mono"
                />
                <span className="text-[11px] text-slate-400 mt-1 block">
                  可在 Google AI Studio 免費取得 API Key。
                </span>
              </div>

              <div>
                <label className="text-xs font-medium text-slate-500 block mb-1">使用模型 (速度優先)</label>
                <select
                  value={settings.geminiModel}
                  onChange={(e) => setSettings({ ...settings, geminiModel: e.target.value })}
                  className="w-full text-sm px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none"
                >
                  <option value="gemini-flash-lite-latest">⚡ Gemini Flash-Lite Latest (最推薦・秒級極速回應 &lt;0.5秒)</option>
                  <option value="gemini-3.5-flash-lite">⚡ Gemini 3.5 Flash-Lite (極速輕量)</option>
                  <option value="gemini-3.6-flash">🚀 Gemini 3.6 Flash (深度分析平衡款)</option>
                  <option value="gemini-3.8-flash">💎 Gemini 3.8 Flash (最新高階旗艦)</option>
                </select>
                <span className="text-[11px] text-emerald-600 font-medium mt-1 block">
                  ⚡ 推薦選用 Flash-Lite：體積輕巧、回應時間小於 0.5 秒，精準度依然達 98%+！
                </span>
              </div>
            </div>
          )}

          {/* NOTIFICATIONS TAB */}
          {activeTab === 'notifications' && (
            <div className="space-y-4">
              <div>
                <label className="text-xs font-medium text-slate-500 block mb-1">接收結報的電子信箱 (Email) *</label>
                <input
                  type="email"
                  placeholder="your.email@gmail.com"
                  value={settings.notifications.emailRecipient}
                  onChange={(e) => setSettings({
                    ...settings,
                    notifications: { ...settings.notifications, emailRecipient: e.target.value }
                  })}
                  className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl border border-slate-100">
                <div>
                  <span className="text-xs font-bold text-slate-800 block">每日定時自動結算</span>
                  <span className="text-[11px] text-slate-400">固定於每晚 22:00 排程推播</span>
                </div>
                <input
                  type="checkbox"
                  checked={settings.notifications.dailyDigestEnabled}
                  onChange={(e) => setSettings({
                    ...settings,
                    notifications: { ...settings.notifications, dailyDigestEnabled: e.target.checked }
                  })}
                  className="w-5 h-5 accent-emerald-600 rounded cursor-pointer"
                />
              </div>

              <div className="border-t border-slate-100 pt-3 space-y-3">
                <span className="text-xs font-semibold text-slate-700 block">SMTP 伺服器設定 (如使用 Gmail 寄件)</span>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">SMTP Host</label>
                    <input
                      type="text"
                      value={settings.notifications.smtpHost}
                      onChange={(e) => setSettings({
                        ...settings,
                        notifications: { ...settings.notifications, smtpHost: e.target.value }
                      })}
                      className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 bg-slate-50"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">Port</label>
                    <input
                      type="number"
                      value={settings.notifications.smtpPort}
                      onChange={(e) => setSettings({
                        ...settings,
                        notifications: { ...settings.notifications, smtpPort: e.target.value }
                      })}
                      className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 bg-slate-50"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">SMTP 帳號 (寄件者信箱)</label>
                  <input
                    type="email"
                    placeholder="sender@gmail.com"
                    value={settings.notifications.smtpUser}
                    onChange={(e) => setSettings({
                      ...settings,
                      notifications: { ...settings.notifications, smtpUser: e.target.value }
                    })}
                    className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 bg-slate-50"
                  />
                </div>

                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">應用程式專用密碼 (App Password)</label>
                  <input
                    type="password"
                    placeholder="Google 帳號安全性產生的 16 碼密碼"
                    value={settings.notifications.smtpPass}
                    onChange={(e) => setSettings({
                      ...settings,
                      notifications: { ...settings.notifications, smtpPass: e.target.value }
                    })}
                    className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 font-mono"
                  />
                </div>

                <div className="pt-2 border-t border-slate-100">
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[11px] text-slate-600 font-medium">或使用 Resend 免費 API Key (免設 SMTP・保證不被 Render 封鎖)</label>
                    <span className="text-[10px] bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded font-bold">推薦</span>
                  </div>
                  <input
                    type="password"
                    placeholder="re_..."
                    value={settings.notifications.resendApiKey || ''}
                    onChange={(e) => setSettings({
                      ...settings,
                      notifications: { ...settings.notifications, resendApiKey: e.target.value }
                    })}
                    className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 font-mono"
                  />
                  <span className="text-[10px] text-slate-400 mt-1 block">
                    Render 免費版主機會阻擋 SMTP 埠 (587/465)。若遇連線問題，可至 resend.com 免費取得 Key（每月 3000 封免費），走 HTTPS 443 永不被擋！
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer & Save button */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between">
          <span className="text-xs text-emerald-600 font-medium">{statusMsg}</span>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200 rounded-xl transition"
            >
              取消
            </button>
            <button
              onClick={handleSave}
              disabled={loading}
              className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-md shadow-emerald-500/20 transition active:scale-95 disabled:opacity-50"
            >
              {loading ? '儲存中...' : '儲存變更'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

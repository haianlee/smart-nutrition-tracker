import React, { useState, useEffect } from 'react';
import { X, Key, User, Bell, Check, Calculator, Sparkles, Shield, Send, Copy, MessageSquare, ExternalLink, ChevronDown, ChevronUp } from 'lucide-react';

export default function SettingsModal({ isOpen, onClose, onSettingsUpdated }) {
  const [activeTab, setActiveTab] = useState('profile');
  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');
  const [copiedGasScript, setCopiedGasScript] = useState(false);
  const [showSmtpAdvanced, setShowSmtpAdvanced] = useState(false);
  const [showGasTutorial, setShowGasTutorial] = useState(false);
  const [showTgTutorial, setShowTgTutorial] = useState(false);
  const [showLineTutorial, setShowLineTutorial] = useState(false);

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
          gasWebhookUrl: '',
          telegramBotToken: '',
          telegramChatId: '',
          lineToken: '',
          lineUserId: '',
          smtpHost: 'smtp.gmail.com',
          smtpPort: 587,
          smtpSecure: false,
          smtpUser: '',
          smtpPass: '',
          resendApiKey: '',
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
            : settings.notifications.smtpPass,
          telegramBotToken: settings.notifications.telegramBotToken?.includes('...')
            ? (cachedSettings.notifications?.telegramBotToken || '')
            : settings.notifications.telegramBotToken,
          lineToken: settings.notifications.lineToken?.includes('...')
            ? (cachedSettings.notifications?.lineToken || '')
            : settings.notifications.lineToken,
          resendApiKey: settings.notifications.resendApiKey === 're_********'
            ? (cachedSettings.notifications?.resendApiKey || '')
            : settings.notifications.resendApiKey
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
              {/* Daily schedule switch */}
              <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-2xl border border-slate-200">
                <div>
                  <span className="text-xs font-bold text-slate-800 block">每日自動結報排程</span>
                  <span className="text-[11px] text-slate-500">每晚 22:00 自動結算今日熱量、營養素與 AI 建議</span>
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

              {/* SECTION B: Google Apps Script Webhook */}
              <div className="p-3.5 rounded-2xl border border-emerald-200 bg-emerald-50/40 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                    <span className="text-xs font-bold text-emerald-900">方案 B：Google Apps Script (推薦！免網域寄 Gmail)</span>
                  </div>
                  <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.5 rounded">100% 免費</span>
                </div>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  完全不需要租用網域或購買付費服務！利用 Google 提供的免費雲端小腳本，由您的個人 Gmail 帳號自動寄送 HTML 彩色結報給自己。
                </p>

                <div>
                  <label className="text-[11px] font-medium text-slate-600 block mb-1">接收的 Email 信箱</label>
                  <input
                    type="email"
                    placeholder="your.email@gmail.com"
                    value={settings.notifications.emailRecipient}
                    onChange={(e) => setSettings({
                      ...settings,
                      notifications: { ...settings.notifications, emailRecipient: e.target.value }
                    })}
                    className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 bg-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-medium text-slate-600 block mb-1">Google Apps Script 網頁應用程式網址 (Webhook URL)</label>
                  <input
                    type="url"
                    placeholder="https://script.google.com/macros/s/.../exec"
                    value={settings.notifications.gasWebhookUrl || ''}
                    onChange={(e) => setSettings({
                      ...settings,
                      notifications: { ...settings.notifications, gasWebhookUrl: e.target.value }
                    })}
                    className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 bg-white font-mono focus:outline-none focus:border-emerald-500"
                  />
                </div>

                {/* Tutorial Accordion */}
                <button
                  type="button"
                  onClick={() => setShowGasTutorial(!showGasTutorial)}
                  className="text-[11px] text-emerald-700 font-medium flex items-center gap-1 hover:underline pt-1"
                >
                  {showGasTutorial ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                  <span>查看「1 分鐘建立 Google Apps Script」極簡教學 & 腳本代碼</span>
                </button>

                {showGasTutorial && (
                  <div className="bg-white p-3 rounded-xl border border-emerald-100 text-[11px] text-slate-600 space-y-2 animate-fadeIn">
                    <ol className="list-decimal list-inside space-y-1 text-slate-700">
                      <li>前往 <a href="https://script.google.com" target="_blank" rel="noreferrer" className="text-blue-600 underline">script.google.com</a> 點擊「新增專案」。</li>
                      <li>將編輯器內的預設程式碼全部刪除，貼上下方代碼：</li>
                    </ol>

                    <div className="relative">
                      <pre className="bg-slate-900 text-slate-100 p-2.5 rounded-lg text-[10px] overflow-x-auto font-mono max-h-36">
{`function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);
    var recipient = data.recipient || Session.getActiveUser().getEmail();
    var subject = data.subject || "【每日健康結報】";
    MailApp.sendEmail({
      to: recipient,
      subject: subject,
      htmlBody: data.htmlBody
    });
    return ContentService.createTextOutput(JSON.stringify({ status: "success" }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ status: "error", message: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// 首次設定請在編輯器上方選 testAuth 點執行以完成 Google 授權
function testAuth() {
  MailApp.sendEmail({
    to: Session.getActiveUser().getEmail(),
    subject: "測試授權成功",
    body: "您的 Google Apps Script 郵件轉寄權限已啟用！"
  });
}`}
                      </pre>
                      <button
                        type="button"
                        onClick={() => {
                          const script = `function doPost(e) {\n  try {\n    var data = JSON.parse(e.postData.contents);\n    var recipient = data.recipient || Session.getActiveUser().getEmail();\n    var subject = data.subject || "【每日健康結報】";\n    MailApp.sendEmail({\n      to: recipient,\n      subject: subject,\n      htmlBody: data.htmlBody\n    });\n    return ContentService.createTextOutput(JSON.stringify({ status: "success" }))\n      .setMimeType(ContentService.MimeType.JSON);\n  } catch (err) {\n    return ContentService.createTextOutput(JSON.stringify({ status: "error", message: err.toString() }))\n      .setMimeType(ContentService.MimeType.JSON);\n  }\n}\n\nfunction testAuth() {\n  MailApp.sendEmail({\n    to: Session.getActiveUser().getEmail(),\n    subject: "測試授權成功",\n    body: "您的 Google Apps Script 郵件轉寄權限已啟用！"\n  });\n}`;
                          navigator.clipboard.writeText(script);
                          setCopiedGasScript(true);
                          setTimeout(() => setCopiedGasScript(false), 2000);
                        }}
                        className="absolute top-2 right-2 bg-emerald-600 text-white text-[10px] px-2 py-1 rounded shadow hover:bg-emerald-700 flex items-center gap-1"
                      >
                        {copiedGasScript ? <Check size={12} /> : <Copy size={12} />}
                        {copiedGasScript ? '已複製！' : '複製代碼'}
                      </button>
                    </div>

                    <ol start="3" className="list-decimal list-inside space-y-1.5 text-slate-700">
                      <li>上方函式選單選 <strong>testAuth</strong> 點「執行」，彈出視窗請點「審查權限 ➔ 進階 ➔ 前往（允許）」。</li>
                      <li>點右上角「部署」➔「新增部署作業」➔ 種類選「網頁應用程式」。</li>
                      <li><strong>「誰可以存取」請務必選「所有人 (Anyone)」</strong>。</li>
                      <li>點擊「部署」，複製「網頁應用程式網址」貼到上方欄位即可！</li>
                    </ol>
                  </div>
                )}
              </div>

              {/* SECTION C: Telegram Bot Push */}
              <div className="p-3.5 rounded-2xl border border-sky-200 bg-sky-50/40 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-sky-500"></span>
                    <span className="text-xs font-bold text-sky-900">方案 C：Telegram Bot 即時推播 (手機最快收到)</span>
                  </div>
                  <span className="text-[10px] bg-sky-100 text-sky-800 font-bold px-1.5 py-0.5 rounded">免信箱・零遺漏</span>
                </div>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  晚上 10 點手機直接叮咚彈出今日結報（含卡路里、TDEE、營養素及 AI 營養師明日具體建議）。
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className="text-[11px] font-medium text-slate-600 block mb-1">Telegram Bot Token</label>
                    <input
                      type="password"
                      placeholder="123456789:ABCdefGhI..."
                      value={settings.notifications.telegramBotToken || ''}
                      onChange={(e) => setSettings({
                        ...settings,
                        notifications: { ...settings.notifications, telegramBotToken: e.target.value }
                      })}
                      className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 bg-white font-mono focus:outline-none focus:border-sky-500"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-medium text-slate-600 block mb-1">您的 Chat ID</label>
                    <input
                      type="text"
                      placeholder="例如: 987654321"
                      value={settings.notifications.telegramChatId || ''}
                      onChange={(e) => setSettings({
                        ...settings,
                        notifications: { ...settings.notifications, telegramChatId: e.target.value }
                      })}
                      className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 bg-white font-mono focus:outline-none focus:border-sky-500"
                    />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setShowTgTutorial(!showTgTutorial)}
                  className="text-[11px] text-sky-700 font-medium flex items-center gap-1 hover:underline pt-0.5"
                >
                  {showTgTutorial ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                  <span>如何 1 分鐘免費取得 Telegram Token & Chat ID？</span>
                </button>

                {showTgTutorial && (
                  <div className="bg-white p-3 rounded-xl border border-sky-100 text-[11px] text-slate-600 space-y-1.5 animate-fadeIn">
                    <div>1. 在 Telegram 搜尋 <strong>@BotFather</strong>，輸入 <code>/newbot</code> 依照提示命名，即可取得 <strong>Bot Token</strong>。</div>
                    <div>2. 在 Telegram 搜尋您的機器人並點擊 <strong>Start</strong> 發送任意訊息。</div>
                    <div>3. 搜尋 <strong>@userinfobot</strong> 點擊 Start，它會立刻告訴您專屬的 <strong>Id (Chat ID)</strong>。</div>
                  </div>
                )}
              </div>

              {/* SECTION LINE: LINE Messaging API */}
              <div className="p-3.5 rounded-2xl border border-emerald-300 bg-emerald-50/50 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-[#06c755]"></span>
                    <span className="text-xs font-bold text-slate-800">方案 LINE：LINE 官方機器人即時推播 (台灣最常用)</span>
                  </div>
                  <span className="text-[10px] bg-[#06c755]/15 text-[#06c755] font-bold px-1.5 py-0.5 rounded">每月 200 則免費</span>
                </div>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  每晚 22:00 或點選結報，由您專屬的 LINE 營養師機器人直接發送當日卡路里、TDEE 盈虧與 AI 建議到您的 LINE！
                </p>

                <div className="space-y-2.5">
                  <div>
                    <label className="text-[11px] font-medium text-slate-600 block mb-1">LINE Channel Access Token (長期權杖)</label>
                    <input
                      type="password"
                      placeholder="貼上 LINE Developers 後台生成的 Channel Access Token..."
                      value={settings.notifications.lineToken || ''}
                      onChange={(e) => setSettings({
                        ...settings,
                        notifications: { ...settings.notifications, lineToken: e.target.value }
                      })}
                      className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 bg-white font-mono focus:outline-none focus:border-[#06c755]"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-medium text-slate-600 block mb-1">您的個人 LINE User ID (以 U 開頭)</label>
                    <input
                      type="text"
                      placeholder="例如: U1234567890abcdef1234567890abcdef"
                      value={settings.notifications.lineUserId || ''}
                      onChange={(e) => setSettings({
                        ...settings,
                        notifications: { ...settings.notifications, lineUserId: e.target.value }
                      })}
                      className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 bg-white font-mono focus:outline-none focus:border-[#06c755]"
                    />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setShowLineTutorial(!showLineTutorial)}
                  className="text-[11px] text-[#06c755] font-semibold flex items-center gap-1 hover:underline pt-0.5"
                >
                  {showLineTutorial ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                  <span>查看「3 分鐘建立 LINE 官方機器人」步驟教學</span>
                </button>

                {showLineTutorial && (
                  <div className="bg-white p-3.5 rounded-xl border border-emerald-100 text-[11px] text-slate-700 space-y-2 animate-fadeIn">
                    <ol className="list-decimal list-inside space-y-1.5">
                      <li>前往 <a href="https://developers.line.biz/" target="_blank" rel="noreferrer" className="text-blue-600 underline font-medium">LINE Developers Console</a>，使用個人 LINE 帳號登入。</li>
                      <li>點擊「Create a new provider」，輸入名稱（例如：<code>健康管理</code>）。</li>
                      <li>點擊「Create a Messaging API channel」：
                        <ul className="list-disc list-inside pl-3 pt-0.5 text-slate-500 text-[10px]">
                          <li>名稱填「AI 營養管家」，分類隨意選（如 Health），勾選同意條款並送出。</li>
                        </ul>
                      </li>
                      <li>進入「Messaging API」頁籤，用手機 LINE 掃描頁面上的 <strong>QR Code 加機器人為好友</strong>。</li>
                      <li>在頁籤最下方找到 <strong>Channel access token (long-lived)</strong>，點擊「Issue」複製 Token 貼到上方第一欄。</li>
                      <li>在「Basic settings」頁籤最下方，複製 <strong>Your user ID</strong>（開頭為 U）貼到上方第二欄即可！</li>
                    </ol>
                  </div>
                )}
              </div>

              {/* ADVANCED / SMTP COLLAPSIBLE */}
              <div className="pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowSmtpAdvanced(!showSmtpAdvanced)}
                  className="text-xs font-semibold text-slate-500 flex items-center justify-between w-full py-1 hover:text-slate-700"
                >
                  <span>進階設定：自訂 SMTP 伺服器 / Resend API Key</span>
                  {showSmtpAdvanced ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                </button>

                {showSmtpAdvanced && (
                  <div className="pt-3 space-y-3 animate-fadeIn">
                    <div className="p-2.5 bg-amber-50 rounded-xl border border-amber-200 text-[10px] text-amber-800">
                      ⚠️ 注意：Render 免費版防火牆已封鎖對外 SMTP Port (587/465)，若使用 Render 主機請優先採用上方「方案 B (GAS)」或「方案 C (Telegram)」。
                    </div>

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
                      <label className="text-[11px] text-slate-400 block mb-1">SMTP 帳號 (寄件者)</label>
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

                    <div>
                      <label className="text-[11px] text-slate-400 block mb-1">Resend API Key (選填)</label>
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
                    </div>
                  </div>
                )}
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

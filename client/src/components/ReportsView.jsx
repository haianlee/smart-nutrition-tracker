import React, { useState, useEffect, useRef } from 'react';
import {
  Mail,
  Download,
  Database,
  AlertCircle,
  Eye,
  Calendar,
  Sparkles,
  Send,
  Upload,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  CheckCircle2,
  Share2,
  Smartphone,
  Bot,
  RefreshCw
} from 'lucide-react';
import { getLocalDateStr, stepDateStr, formatFriendlyDate } from '../utils/dateUtils';

export default function ReportsView({ currentDate, onDataChanged }) {
  const [reportDate, setReportDate] = useState(currentDate || getLocalDateStr());
  const [dailySummary, setDailySummary] = useState(null);
  const [dailyAdvice, setDailyAdvice] = useState(null);
  const [isLoadingDaily, setIsLoadingDaily] = useState(false);
  const [isLoadingAdvice, setIsLoadingAdvice] = useState(false);
  const [isGeneratingAdvice, setIsGeneratingAdvice] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isSeeding, setIsSeeding] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');
  const [statusType, setStatusType] = useState('info'); // 'info', 'success', 'error'
  const [previewOpen, setPreviewOpen] = useState(false);
  const fileInputRef = useRef(null);

  const todayStr = getLocalDateStr();

  // Sync with prop if currentDate changes
  useEffect(() => {
    if (currentDate) {
      setReportDate(currentDate);
    }
  }, [currentDate]);

  const fetchDaily = async (targetDate = reportDate) => {
    setIsLoadingDaily(true);
    try {
      const res = await fetch(`/api/stats/daily?date=${encodeURIComponent(targetDate)}`);
      if (res.ok) {
        const data = await res.json();
        setDailySummary(data);
      } else {
        console.warn('Failed to fetch daily summary for date:', targetDate);
      }
    } catch (err) {
      console.error('Error in fetchDaily:', err);
    } finally {
      setIsLoadingDaily(false);
    }
  };

  const fetchAdvice = async (targetDate = reportDate) => {
    setIsLoadingAdvice(true);
    try {
      const localCache = JSON.parse(localStorage.getItem(`nt_advice_${targetDate}`) || 'null');
      if (localCache) {
        setDailyAdvice(localCache);
      }

      const res = await fetch(`/api/ai-daily-advice?date=${encodeURIComponent(targetDate)}`);
      if (res.ok) {
        const data = await res.json();
        if (data) {
          setDailyAdvice(data);
          localStorage.setItem(`nt_advice_${targetDate}`, JSON.stringify(data));
        } else if (!localCache) {
          setDailyAdvice(null);
        }
      }
    } catch (err) {
      console.error('Error in fetchAdvice:', err);
    } finally {
      setIsLoadingAdvice(false);
    }
  };

  useEffect(() => {
    fetchDaily(reportDate);
    fetchAdvice(reportDate);
  }, [reportDate]);

  const handlePrevDay = () => {
    setReportDate(prev => stepDateStr(prev, -1));
  };

  const handleNextDay = () => {
    setReportDate(prev => stepDateStr(prev, 1));
  };

  const handleToday = () => {
    setReportDate(todayStr);
  };

  const showFeedback = (msg, type = 'info', duration = 4000) => {
    setStatusMsg(msg);
    setStatusType(type);
    if (duration > 0) {
      setTimeout(() => setStatusMsg(''), duration);
    }
  };

  const handleSendEmail = async () => {
    setIsSending(true);
    setStatusMsg('');
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s client timeout to accommodate Google Apps Script cold starts

      const res = await fetch('/api/send-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date: reportDate }),
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      let data = {};
      try {
        data = await res.json();
      } catch (jsonErr) {
        data = { error: `雲端主機回應異常 (HTTP ${res.status})` };
      }

      if (!res.ok) {
        throw new Error(data.error || '發送失敗，請確認推播與郵件設定');
      }

      const successMsg = data.summary
        ? `✅ ${data.summary}`
        : `✅ 已成功發送結報至 ${data.recipient || '指定管道'}！`;
      showFeedback(successMsg, 'success', 6000);
    } catch (err) {
      console.error('Send report error:', err);
      if (err.name === 'AbortError') {
        showFeedback('⚠️ 發送逾時：Render 雲端封鎖了 SMTP 連線。請至設定中配置「方案 B (Google Apps Script)」或「方案 C (Telegram)」！', 'error', 9000);
      } else {
        showFeedback(`⚠️ ${err.message}`, 'error', 9000);
      }
    } finally {
      setIsSending(false);
    }
  };

  const handleGenerateAdvice = async (forceRefresh = false) => {
    setIsGeneratingAdvice(true);
    try {
      const cachedKey = localStorage.getItem('gemini_api_key') || '';
      const headers = { 'Content-Type': 'application/json' };
      if (cachedKey) {
        headers['x-gemini-key'] = cachedKey;
      }

      const res = await fetch('/api/ai-daily-advice', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          date: reportDate,
          forceRefresh
        })
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || '生成建議失敗');
      }

      const data = await res.json();
      setDailyAdvice(data);
      localStorage.setItem(`nt_advice_${reportDate}`, JSON.stringify(data));
      showFeedback('✨ AI 營養師已完成今日飲食診斷與明日規劃！', 'success', 4000);
    } catch (err) {
      console.error('Error generating advice:', err);
      showFeedback(`診斷失敗: ${err.message}`, 'error', 5000);
    } finally {
      setIsGeneratingAdvice(false);
    }
  };

  const handleSendViaNativeMail = () => {
    if (!dailySummary) return;
    const isDef = (dailySummary.deficit ?? 0) >= 0;
    const defTxt = isDef ? `赤字 -${dailySummary.deficit}` : `盈餘 +${Math.abs(dailySummary.deficit || 0)}`;
    const subject = encodeURIComponent(`【每日健康結報】${reportDate} 攝取 ${dailySummary.totalCalories || 0} kcal (${defTxt} kcal)`);
    
    let bodyText = `【每日飲食與體重結報】\n日期：${reportDate}\n\n`;
    bodyText += `🔥 今日總攝取：${dailySummary.totalCalories || 0} kcal (維持目標: ${dailySummary.targetCalories || 1900} kcal)\n`;
    bodyText += `⚖️ TDEE 淨盈虧：${defTxt} kcal (維持熱量: ${dailySummary.tdee || 2200} kcal)\n`;
    bodyText += `🏃 今日體重：${dailySummary.weight ? dailySummary.weight + ' kg' : '未記錄'}\n\n`;
    bodyText += `🥩 三大營養素：\n- 蛋白質：${dailySummary.totalProtein || 0}g\n- 碳水化合物：${dailySummary.totalCarbs || 0}g\n- 脂肪：${dailySummary.totalFat || 0}g\n- 膳食纖維：${dailySummary.totalFiber || 0}g\n\n`;

    if (dailyAdvice) {
      bodyText += `🤖【AI 營養師診斷・${dailyAdvice.grade} (${dailyAdvice.score}分)】\n`;
      bodyText += `${dailyAdvice.summary}\n`;
      if (dailyAdvice.tomorrowPlan) {
        bodyText += `\n📅【明日飲食規劃重點】\n`;
        bodyText += `- 目標：${dailyAdvice.tomorrowPlan.calorieTargetNote || ''}\n`;
        bodyText += `- 重點：${dailyAdvice.tomorrowPlan.macroFocus || ''}\n`;
        (dailyAdvice.tomorrowPlan.suggestedMeals || []).forEach(sm => {
          bodyText += `  • [${sm.mealType}] ${sm.tip}\n`;
        });
      }
      bodyText += `\n`;
    }

    bodyText += `📋 今日餐點明細 (${dailySummary.meals?.length || 0} 餐)：\n`;
    (dailySummary.meals || []).forEach(m => {
      bodyText += `- [${m.time || '--:--'}] ${m.foodName} (${m.estimatedWeightG || 0}g) : ${m.calories || 0} kcal\n`;
    });
    bodyText += `\n-- 來自 智慧飲食與體重管家`;

    window.location.href = `mailto:?subject=${subject}&body=${encodeURIComponent(bodyText)}`;
  };

  const handleShareReport = async () => {
    if (!dailySummary) return;
    const isDef = (dailySummary.deficit ?? 0) >= 0;
    const defTxt = isDef ? `赤字 -${dailySummary.deficit}` : `盈餘 +${Math.abs(dailySummary.deficit || 0)}`;
    let shareText = `🥗【每日健康結報 - ${reportDate}】\n`;
    shareText += `🔥 總攝取：${dailySummary.totalCalories || 0} kcal / ${dailySummary.targetCalories || 1900}\n`;
    shareText += `⚖️ TDEE 盈虧：${defTxt} kcal\n`;
    if (dailySummary.weight) shareText += `🏃 體重：${dailySummary.weight} kg\n`;
    shareText += `🥩 蛋白質 ${dailySummary.totalProtein || 0}g | 🍚 碳水 ${dailySummary.totalCarbs || 0}g | 🥑 脂肪 ${dailySummary.totalFat || 0}g\n`;

    if (dailyAdvice) {
      shareText += `\n🤖 AI評級：${dailyAdvice.grade} (${dailyAdvice.score}分)\n`;
      shareText += `💡 總結：${dailyAdvice.summary}\n`;
      if (dailyAdvice.tomorrowPlan?.macroFocus) {
        shareText += `🎯 明日重點：${dailyAdvice.tomorrowPlan.macroFocus}\n`;
      }
    }

    if (navigator.share) {
      try {
        await navigator.share({
          title: `健康結報 - ${reportDate}`,
          text: shareText
        });
      } catch (e) {}
    } else {
      try {
        await navigator.clipboard.writeText(shareText);
        showFeedback('📋 結報摘要已複製到剪貼簿，可直接貼到 LINE！', 'success', 4000);
      } catch (e) {
        showFeedback('複製失敗，請手動選取複製', 'error');
      }
    }
  };

  const handleSeedDemo = async () => {
    if (!window.confirm('確定要載入過去 14 天示範數據嗎？這會加入模擬飲食與體重，方便立即體驗連續圖表！')) {
      return;
    }
    setIsSeeding(true);
    try {
      const res = await fetch('/api/seed-demo', { method: 'POST' });
      if (res.ok) {
        showFeedback('🌱 已成功匯入 14 天完整示範健康數據！', 'success', 4000);
        fetchDaily(reportDate);
        if (typeof onDataChanged === 'function') onDataChanged();
      } else {
        showFeedback('匯入示範資料失敗', 'error');
      }
    } catch (err) {
      showFeedback('匯入失敗: ' + err.message, 'error');
    } finally {
      setIsSeeding(false);
    }
  };

  const handleExportCsv = () => {
    window.open('/api/export-csv', '_blank');
  };

  const handleDownloadBackup = () => {
    window.open('/api/backup-json', '_blank');
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!window.confirm(`確定要以備份檔「${file.name}」還原健康資料庫嗎？這將覆蓋現有紀錄。`)) {
      e.target.value = '';
      return;
    }

    setIsRestoring(true);
    setStatusMsg('');
    try {
      const text = await file.text();
      const jsonContent = JSON.parse(text);
      const res = await fetch('/api/restore-json', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(jsonContent)
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || '還原失敗');

      // Update phone localStorage
      if (jsonContent.meals && Array.isArray(jsonContent.meals)) {
        localStorage.setItem('nt_all_meals', JSON.stringify(jsonContent.meals));
      }
      if (jsonContent.weights && Array.isArray(jsonContent.weights)) {
        localStorage.setItem('nt_all_weights', JSON.stringify(jsonContent.weights));
      }

      showFeedback(`✅ 備份還原成功！(飲食 ${result.mealsCount || 0} 筆，體重 ${result.weightsCount || 0} 筆)`, 'success', 5000);
      fetchDaily(reportDate);
      if (typeof onDataChanged === 'function') onDataChanged();
    } catch (err) {
      showFeedback(`❌ 還原失敗: ${err.message}`, 'error', 6000);
    } finally {
      setIsRestoring(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const isCurrentToday = reportDate === todayStr;

  return (
    <div className="space-y-5 pb-20">
      {/* Date Navigation Bar for Reports */}
      <div className="bg-white rounded-2xl p-3 shadow-sm border border-slate-200 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={handlePrevDay}
            className="p-2 rounded-xl text-slate-500 hover:bg-slate-100 active:scale-95 transition"
            title="前一天"
          >
            <ChevronLeft size={18} />
          </button>

          <div className="flex items-center gap-2">
            <Calendar size={17} className="text-emerald-600" />
            <input
              type="date"
              value={reportDate}
              onChange={(e) => setReportDate(e.target.value)}
              className="font-bold text-sm text-slate-800 bg-transparent border-none focus:outline-none cursor-pointer"
            />
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
              {formatFriendlyDate(reportDate)}
            </span>
          </div>

          <button
            onClick={handleNextDay}
            className="p-2 rounded-xl text-slate-500 hover:bg-slate-100 active:scale-95 transition"
            title="後一天"
          >
            <ChevronRight size={18} />
          </button>
        </div>

        {!isCurrentToday && (
          <button
            onClick={handleToday}
            className="py-1 px-3 rounded-xl bg-emerald-50 text-emerald-700 font-semibold text-xs flex items-center gap-1 border border-emerald-200 hover:bg-emerald-100 transition active:scale-95"
          >
            <RotateCcw size={13} />
            <span>回今天</span>
          </button>
        )}
      </div>

      {/* AI Advisor & Tomorrow Planner Hero Card */}
      <div className="bg-gradient-to-br from-slate-900 via-teal-950 to-emerald-950 text-white rounded-3xl p-5 sm:p-6 shadow-xl border border-teal-500/30 relative overflow-hidden">
        {/* Ambient background decoration */}
        <div className="absolute -top-12 -right-12 w-40 h-40 bg-teal-500/10 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -bottom-10 -left-10 w-36 h-36 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />

        {/* Card Header */}
        <div className="flex items-center justify-between mb-4 relative z-10">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-2xl bg-teal-400/20 text-teal-300 border border-teal-400/30">
              <Bot size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white">AI 營養師：今日診斷與明日規劃</h2>
                {dailyAdvice?.isMock && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 font-medium">
                    離線示範
                  </span>
                )}
              </div>
              <p className="text-xs text-teal-200/70">
                依據 {reportDate} 飲食組合、熱量赤字與巨量營養素即時診斷
              </p>
            </div>
          </div>

          {dailyAdvice && !isGeneratingAdvice && (
            <button
              onClick={() => handleGenerateAdvice(true)}
              disabled={isGeneratingAdvice}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-teal-200 transition active:scale-95 text-xs flex items-center gap-1 border border-white/10"
              title="重新由 AI 進行今日診斷"
            >
              <RefreshCw size={13} className={isGeneratingAdvice ? 'animate-spin' : ''} />
              <span className="hidden sm:inline">重新分析</span>
            </button>
          )}
        </div>

        {/* Content States */}
        {isGeneratingAdvice ? (
          <div className="py-8 flex flex-col items-center justify-center text-center space-y-3 relative z-10 animate-fadeIn">
            <div className="relative">
              <div className="w-12 h-12 border-4 border-teal-500/30 border-t-teal-400 rounded-full animate-spin" />
              <Sparkles size={18} className="absolute inset-0 m-auto text-teal-300 animate-pulse" />
            </div>
            <div>
              <p className="text-sm font-bold text-teal-100">AI 營養師正在閱覽今日餐點與營養素...</p>
              <p className="text-xs text-teal-300/70 mt-1">分析熱量赤字平衡，為您訂製明日最佳菜單與生活指引</p>
            </div>
          </div>
        ) : dailyAdvice ? (
          <div className="space-y-4 relative z-10 animate-fadeIn">
            {/* Score & Grade Banner */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white/10 p-3.5 rounded-2xl border border-white/10">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex flex-col items-center justify-center text-white font-black shadow-md shrink-0">
                  <span className="text-base leading-none">{dailyAdvice.score}</span>
                  <span className="text-[9px] opacity-80 mt-0.5">分</span>
                </div>
                <div>
                  <span className="text-xs font-bold text-teal-300 px-2 py-0.5 rounded-full bg-teal-500/20 border border-teal-500/30 inline-block mb-1">
                    {dailyAdvice.grade}
                  </span>
                  <p className="text-xs text-slate-100 leading-relaxed font-medium">
                    {dailyAdvice.summary}
                  </p>
                </div>
              </div>
            </div>

            {/* Highlights & Warnings Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {/* Highlights */}
              <div className="bg-emerald-950/50 border border-emerald-500/30 p-3 rounded-2xl">
                <span className="text-xs font-bold text-emerald-300 flex items-center gap-1 mb-2">
                  <CheckCircle2 size={14} className="text-emerald-400" />
                  今日達標亮點
                </span>
                <ul className="space-y-1.5 text-xs text-slate-200">
                  {(dailyAdvice.highlights || []).map((h, i) => (
                    <li key={i} className="flex items-start gap-1.5 leading-snug">
                      <span className="text-emerald-400 shrink-0 font-bold">•</span>
                      <span>{h}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Warnings */}
              <div className="bg-amber-950/40 border border-amber-500/30 p-3 rounded-2xl">
                <span className="text-xs font-bold text-amber-300 flex items-center gap-1 mb-2">
                  <AlertCircle size={14} className="text-amber-400" />
                  需注意之失衡與微調
                </span>
                <ul className="space-y-1.5 text-xs text-slate-200">
                  {(dailyAdvice.warnings || []).map((w, i) => (
                    <li key={i} className="flex items-start gap-1.5 leading-snug">
                      <span className="text-amber-400 shrink-0 font-bold">•</span>
                      <span>{w}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Tomorrow Plan Section */}
            {dailyAdvice.tomorrowPlan && (
              <div className="bg-white/10 rounded-2xl p-3.5 border border-white/10 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 border-b border-white/10 pb-2">
                  <span className="text-xs font-bold text-teal-200 flex items-center gap-1.5">
                    <Calendar size={14} className="text-teal-400" />
                    明日飲食規劃藍圖 (Tomorrow's Blueprint)
                  </span>
                  <span className="text-[11px] text-teal-300/80 font-medium">
                    {dailyAdvice.tomorrowPlan.calorieTargetNote || ''}
                  </span>
                </div>

                {dailyAdvice.tomorrowPlan.macroFocus && (
                  <div className="text-xs text-emerald-200 bg-emerald-500/10 p-2 rounded-xl border border-emerald-500/20 flex items-start gap-1.5">
                    <Sparkles size={14} className="text-emerald-400 shrink-0 mt-0.5" />
                    <span><strong>補強重點：</strong>{dailyAdvice.tomorrowPlan.macroFocus}</span>
                  </div>
                )}

                {/* 3 Meals suggestions */}
                {dailyAdvice.tomorrowPlan.suggestedMeals && dailyAdvice.tomorrowPlan.suggestedMeals.length > 0 && (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
                    {dailyAdvice.tomorrowPlan.suggestedMeals.map((sm, idx) => (
                      <div key={idx} className="bg-slate-900/60 p-2.5 rounded-xl border border-white/5 space-y-1">
                        <span className="text-[11px] font-bold text-teal-300 px-1.5 py-0.5 rounded bg-teal-500/20 inline-block">
                          {sm.mealType}
                        </span>
                        <p className="text-xs text-slate-200 leading-snug">
                          {sm.tip}
                        </p>
                      </div>
                    ))}
                  </div>
                )}

                {/* Habits */}
                {dailyAdvice.tomorrowPlan.actionableHabits && dailyAdvice.tomorrowPlan.actionableHabits.length > 0 && (
                  <div className="pt-2 border-t border-white/10 space-y-1 text-xs text-slate-300">
                    <span className="font-semibold text-teal-200 block text-[11px]">💡 生活與飲水叮嚀：</span>
                    {dailyAdvice.tomorrowPlan.actionableHabits.map((habit, idx) => (
                      <div key={idx} className="flex items-start gap-1.5 text-slate-300 leading-tight">
                        <span className="text-teal-400 font-bold shrink-0">✔</span>
                        <span>{habit}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          /* Empty / Unanalyzed state */
          <div className="bg-white/5 rounded-2xl p-5 text-center border border-white/10 space-y-3 relative z-10">
            <div className="w-10 h-10 rounded-2xl bg-teal-500/20 text-teal-300 flex items-center justify-center mx-auto border border-teal-500/30">
              <Sparkles size={20} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">尚未生成今日飲食診斷與明日規劃</h3>
              <p className="text-xs text-slate-300 mt-1 max-w-md mx-auto leading-relaxed">
                由 AI 營養師全面盤點今日攝取熱量、赤字比率與巨量營養素平衡，為您總結成效並訂定隔日具體外食/自煮菜單指引！
              </p>
            </div>
            <button
              onClick={() => handleGenerateAdvice(false)}
              disabled={isGeneratingAdvice}
              className="py-2.5 px-5 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 font-bold text-xs text-white shadow-lg shadow-teal-500/25 transition active:scale-95 inline-flex items-center gap-2"
            >
              <Sparkles size={15} />
              <span>⚡ 生成今日 AI 飲食診斷與明日規劃</span>
            </button>
          </div>
        )}
      </div>

      {/* Action Notification Card */}
      <div className="bg-gradient-to-tr from-slate-900 to-slate-800 text-white rounded-3xl p-6 shadow-md">
        <div className="flex items-center gap-2.5 mb-2">
          <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
            <Mail size={20} />
          </div>
          <h2 className="text-base font-bold">結算通報與推播發送</h2>
        </div>
        <p className="text-xs text-slate-300 mb-5 leading-relaxed">
          系統支援每日 22:00 自動結算發送，亦可手動觸發。郵件將統整 <strong className="text-emerald-300 font-bold">{reportDate}</strong> 的總熱量、TDEE 赤字、三大營養素與餐點明細。
        </p>

        <div className="grid grid-cols-2 gap-2.5">
          <button
            onClick={handleSendEmail}
            disabled={isSending}
            className="py-3 px-3 rounded-2xl bg-emerald-500 hover:bg-emerald-600 font-semibold text-xs text-white flex items-center justify-center gap-1.5 transition active:scale-95 disabled:opacity-60 shadow-md shadow-emerald-500/30"
            title="由伺服器自動發送 Email"
          >
            {isSending ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>發送中...</span>
              </>
            ) : (
              <>
                <Send size={15} />
                <span>發送結報 ({isCurrentToday ? '今日' : reportDate})</span>
              </>
            )}
          </button>

          <button
            onClick={handleSendViaNativeMail}
            className="py-3 px-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 font-semibold text-xs text-white flex items-center justify-center gap-1.5 transition active:scale-95 shadow-md shadow-indigo-600/30"
            title="開啟手機內建郵件 App 直接寄出（免設 SMTP・保證不被雲端防火牆阻擋）"
          >
            <Smartphone size={15} />
            <span>手機郵件 App 寄出</span>
          </button>

          <button
            onClick={handleShareReport}
            className="py-2.5 px-3 rounded-2xl bg-white/10 hover:bg-white/20 font-medium text-xs text-white flex items-center justify-center gap-1.5 transition active:scale-95 border border-white/10"
            title="分享至 LINE 或複製結報文字"
          >
            <Share2 size={15} />
            <span>分享 / 複製摘要</span>
          </button>

          <button
            onClick={() => setPreviewOpen(true)}
            className="py-2.5 px-3 rounded-2xl bg-white/10 hover:bg-white/20 font-medium text-xs text-white flex items-center justify-center gap-1.5 transition active:scale-95 border border-white/10"
          >
            <Eye size={15} />
            <span>預覽 Email 格式</span>
          </button>
        </div>

        {statusMsg && (
          <div className={`mt-4 p-3 rounded-2xl text-xs flex items-center gap-2 animate-fadeIn border ${
            statusType === 'error'
              ? 'bg-rose-500/20 text-rose-300 border-rose-500/30'
              : statusType === 'success'
              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
              : 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30'
          }`}>
            {statusType === 'success' ? (
              <CheckCircle2 size={16} className="shrink-0 text-emerald-400" />
            ) : (
              <AlertCircle size={16} className="shrink-0" />
            )}
            <span className="leading-relaxed">{statusMsg}</span>
          </div>
        )}
      </div>

      {/* Today's Digest Snapshot Card */}
      <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-200">
        <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-2">
          <div className="flex items-center gap-2">
            <Calendar size={18} className="text-emerald-600" />
            <h3 className="text-sm font-bold text-slate-800">
              {isCurrentToday ? '今日' : reportDate} 摘要即時結算 ({dailySummary?.date || reportDate})
            </h3>
          </div>
          <span className="text-xs text-slate-400 font-medium">
            已登錄 {dailySummary?.mealCount ?? 0} 餐
          </span>
        </div>

        {isLoadingDaily ? (
          <div className="py-8 flex flex-col items-center justify-center text-slate-400 gap-2">
            <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
            <span className="text-xs">結算中...</span>
          </div>
        ) : dailySummary ? (
          <>
            <div className="grid grid-cols-3 gap-2.5 mb-4">
              <div className="bg-slate-50 p-3 rounded-2xl text-center border border-slate-100">
                <span className="text-[11px] text-slate-400 block font-medium">總攝取</span>
                <span className="text-lg font-black text-amber-600">{dailySummary.totalCalories ?? 0}</span>
                <span className="text-[10px] text-slate-400 block">/ {dailySummary.targetCalories ?? 1900} kcal</span>
              </div>

              <div className="bg-slate-50 p-3 rounded-2xl text-center border border-slate-100">
                <span className="text-[11px] text-slate-400 block font-medium">TDEE 淨赤字</span>
                <span className={`text-lg font-black ${(dailySummary.deficit ?? 0) >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {(dailySummary.deficit ?? 0) >= 0 ? `-${dailySummary.deficit}` : `+${Math.abs(dailySummary.deficit || 0)}`}
                </span>
                <span className="text-[10px] text-slate-400 block">kcal</span>
              </div>

              <div className="bg-slate-50 p-3 rounded-2xl text-center border border-slate-100">
                <span className="text-[11px] text-slate-400 block font-medium">當日體重</span>
                <span className="text-lg font-black text-indigo-600">
                  {dailySummary.weight ? `${dailySummary.weight}kg` : '--'}
                </span>
                <span className="text-[10px] text-slate-400 block">
                  {dailySummary.bodyFat ? `脂 ${dailySummary.bodyFat}%` : '未測'}
                </span>
              </div>
            </div>

            {/* Macro Pills */}
            <div className="flex justify-between items-center bg-slate-50/70 p-3 rounded-2xl text-xs text-slate-600 border border-slate-100">
              <span>🥩 蛋白質 <strong>{dailySummary.totalProtein ?? 0}g</strong></span>
              <span>🍚 碳水 <strong>{dailySummary.totalCarbs ?? 0}g</strong></span>
              <span>🥑 脂肪 <strong>{dailySummary.totalFat ?? 0}g</strong></span>
              <span>🥦 纖維 <strong>{dailySummary.totalFiber ?? 0}g</strong></span>
            </div>

            {/* Meals preview list for this report date */}
            {dailySummary.meals && dailySummary.meals.length > 0 && (
              <div className="mt-4 pt-3 border-t border-slate-100">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
                  當日餐點清單 ({dailySummary.meals.length} 道)
                </span>
                <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                  {dailySummary.meals.map((m) => (
                    <div key={m.id} className="flex items-center justify-between text-xs py-1.5 px-2.5 rounded-xl bg-slate-50 border border-slate-100">
                      <div className="flex items-center gap-2 truncate">
                        <span className="text-slate-400 font-mono text-[11px]">{m.time || '--:--'}</span>
                        <span className="font-semibold text-slate-700 truncate">{m.foodName}</span>
                        {m.estimatedWeightG > 0 && (
                          <span className="text-[10px] text-slate-400">({m.estimatedWeightG}g)</span>
                        )}
                      </div>
                      <span className="font-bold text-amber-600 shrink-0">{m.calories} kcal</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="p-4 text-center text-xs text-slate-400">
            查無此日之摘要資料
          </div>
        )}
      </div>

      {/* Backup & Export Utility Card */}
      <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-200 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
            <Database size={18} className="text-slate-500" />
            資料管理與備份
          </h3>
          <span className="text-[11px] bg-emerald-50 text-emerald-700 px-2.5 py-0.5 rounded-full font-medium flex items-center gap-1 border border-emerald-200">
            <ShieldCheck size={13} />
            手機自動備份防護中
          </span>
        </div>

        <p className="text-xs text-slate-500 leading-relaxed">
          手機端已啟用雙向離線快取防護。當 Render 雲端改版重開時，手機會自動將紀錄補回伺服器。您亦可隨時手動下載或還原完整 JSON 備份檔。
        </p>

        {/* Hidden File Input for Restore */}
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileUpload}
          accept=".json,application/json"
          className="hidden"
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          <button
            onClick={handleDownloadBackup}
            className="py-3 px-4 rounded-2xl bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-700 text-xs font-semibold flex items-center justify-center gap-2 transition active:scale-95"
          >
            <Download size={16} className="text-indigo-600" />
            <span>下載完整備份 (JSON)</span>
          </button>

          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isRestoring}
            className="py-3 px-4 rounded-2xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-semibold flex items-center justify-center gap-2 transition active:scale-95 disabled:opacity-50"
          >
            {isRestoring ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-slate-400 border-t-slate-700 rounded-full animate-spin" />
                <span>還原中...</span>
              </>
            ) : (
              <>
                <Upload size={16} className="text-slate-600" />
                <span>上傳備份檔還原 (JSON)</span>
              </>
            )}
          </button>

          <button
            onClick={handleExportCsv}
            className="py-3 px-4 rounded-2xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center justify-center gap-2 transition active:scale-95"
          >
            <Download size={16} className="text-slate-500" />
            <span>匯出 CSV (Excel / 試算表)</span>
          </button>

          <button
            onClick={handleSeedDemo}
            disabled={isSeeding}
            className="py-3 px-4 rounded-2xl border border-emerald-200 bg-emerald-50/50 hover:bg-emerald-50 text-emerald-700 text-xs font-semibold flex items-center justify-center gap-2 transition active:scale-95 disabled:opacity-50"
          >
            <Sparkles size={16} className="text-emerald-500" />
            <span>載入 14 天示範健康數據</span>
          </button>
        </div>
      </div>

      {/* Email Preview Modal */}
      {previewOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-xl h-[85vh] rounded-3xl overflow-hidden shadow-2xl flex flex-col animate-fadeIn">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h3 className="font-bold text-sm text-slate-800 flex items-center gap-2">
                <Eye size={17} className="text-emerald-600" />
                HTML 結報郵件即時預覽 ({reportDate})
              </h3>
              <button
                onClick={() => setPreviewOpen(false)}
                className="text-xs px-3 py-1.5 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 font-medium transition active:scale-95"
              >
                關閉
              </button>
            </div>
            <iframe
              src={`/api/preview-report-html?date=${encodeURIComponent(reportDate)}`}
              title="Report Preview"
              className="w-full flex-1 border-none bg-slate-100"
            />
          </div>
        </div>
      )}
    </div>
  );
}

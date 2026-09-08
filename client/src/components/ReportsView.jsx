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
  CheckCircle2
} from 'lucide-react';
import { getLocalDateStr, stepDateStr, formatFriendlyDate } from '../utils/dateUtils';

export default function ReportsView({ currentDate, onDataChanged }) {
  const [reportDate, setReportDate] = useState(currentDate || getLocalDateStr());
  const [dailySummary, setDailySummary] = useState(null);
  const [isLoadingDaily, setIsLoadingDaily] = useState(false);
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

  useEffect(() => {
    fetchDaily(reportDate);
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
      const res = await fetch('/api/send-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date: reportDate })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || '發送失敗，請確認 SMTP 設定');
      }

      showFeedback(`✅ 已成功發送結報至 ${data.recipient || '指定信箱'}！`, 'success', 5000);
    } catch (err) {
      showFeedback(`⚠️ 發送失敗: ${err.message} (請至右上角⚙️設定填寫 Gmail 應用程式密碼)`, 'error', 6000);
    } finally {
      setIsSending(false);
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

        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={handleSendEmail}
            disabled={isSending}
            className="py-3 px-3 rounded-2xl bg-emerald-500 hover:bg-emerald-600 font-semibold text-xs text-white flex items-center justify-center gap-2 transition active:scale-95 disabled:opacity-60 shadow-md shadow-emerald-500/30"
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
            onClick={() => setPreviewOpen(true)}
            className="py-3 px-3 rounded-2xl bg-white/10 hover:bg-white/20 font-medium text-xs text-white flex items-center justify-center gap-2 transition active:scale-95 border border-white/10"
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

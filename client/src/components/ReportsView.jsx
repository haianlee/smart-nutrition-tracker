import React, { useState, useEffect } from 'react';
import { Mail, Download, Database, Check, AlertCircle, Eye, Calendar, Sparkles, Send } from 'lucide-react';

export default function ReportsView({ onDataChanged }) {
  const [dailySummary, setDailySummary] = useState(null);
  const [isSending, setIsSending] = useState(false);
  const [isSeeding, setIsSeeding] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');
  const [previewOpen, setPreviewOpen] = useState(false);

  const fetchDaily = async () => {
    try {
      const res = await fetch('/api/stats/daily');
      if (res.ok) {
        const data = await res.json();
        setDailySummary(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchDaily();
  }, []);

  const handleSendEmail = async () => {
    setIsSending(true);
    setStatusMsg('');
    try {
      const res = await fetch('/api/send-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || '發送失敗');

      setStatusMsg(`✅ 已成功發送結報至 ${data.recipient || '指定信箱'}！`);
      setTimeout(() => setStatusMsg(''), 4000);
    } catch (err) {
      setStatusMsg(`⚠️ 發送失敗: ${err.message}`);
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
        setStatusMsg('🌱 已成功匯入 14 天完整示範健康數據！');
        fetchDaily();
        if (onDataChanged) onDataChanged();
        setTimeout(() => setStatusMsg(''), 4000);
      }
    } catch (err) {
      setStatusMsg('匯入失敗: ' + err.message);
    } finally {
      setIsSeeding(false);
    }
  };

  const handleExportCsv = () => {
    window.open('/api/export-csv', '_blank');
  };

  return (
    <div className="space-y-5 pb-20">
      {/* Action Notification Card */}
      <div className="bg-gradient-to-tr from-slate-900 to-slate-800 text-white rounded-3xl p-6 shadow-md">
        <div className="flex items-center gap-2.5 mb-2">
          <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
            <Mail size={20} />
          </div>
          <h2 className="text-base font-bold">定時結報與推播發送</h2>
        </div>
        <p className="text-xs text-slate-300 mb-5 leading-relaxed">
          系統支援每日 22:00 自動結算，或由您隨時點擊手動觸發。郵件包含今日總攝取、赤字分析、三大營養素與餐點清單。
        </p>

        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={handleSendEmail}
            disabled={isSending}
            className="py-3 px-3 rounded-2xl bg-emerald-500 hover:bg-emerald-600 font-semibold text-xs text-white flex items-center justify-center gap-2 transition active:scale-98 disabled:opacity-60 shadow-md shadow-emerald-500/30"
          >
            {isSending ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>發送中...</span>
              </>
            ) : (
              <>
                <Send size={15} />
                <span>發送今日結報</span>
              </>
            )}
          </button>

          <button
            onClick={() => setPreviewOpen(true)}
            className="py-3 px-3 rounded-2xl bg-white/10 hover:bg-white/20 font-medium text-xs text-white flex items-center justify-center gap-2 transition active:scale-98 border border-white/10"
          >
            <Eye size={15} />
            <span>預覽 Email 格式</span>
          </button>
        </div>

        {statusMsg && (
          <div className="mt-4 p-3 rounded-2xl text-xs flex items-center gap-2 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 animate-fadeIn">
            <AlertCircle size={15} className="shrink-0" />
            <span>{statusMsg}</span>
          </div>
        )}
      </div>

      {/* Today's Digest Snapshot Card */}
      {dailySummary && (
        <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-200">
          <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-2">
            <div className="flex items-center gap-2">
              <Calendar size={18} className="text-emerald-600" />
              <h3 className="text-sm font-bold text-slate-800">今日摘要即時結算 ({dailySummary.date})</h3>
            </div>
            <span className="text-xs text-slate-400 font-medium">已登錄 {dailySummary.mealCount} 餐</span>
          </div>

          <div className="grid grid-cols-3 gap-2.5 mb-4">
            <div className="bg-slate-50 p-3 rounded-2xl text-center border border-slate-100">
              <span className="text-[11px] text-slate-400 block font-medium">總熱量</span>
              <span className="text-lg font-black text-amber-600">{dailySummary.totalCalories}</span>
              <span className="text-[10px] text-slate-400 block">/ {dailySummary.targetCalories} kcal</span>
            </div>

            <div className="bg-slate-50 p-3 rounded-2xl text-center border border-slate-100">
              <span className="text-[11px] text-slate-400 block font-medium">TDEE 淨赤字</span>
              <span className={`text-lg font-black ${dailySummary.deficit >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                {dailySummary.deficit >= 0 ? `-${dailySummary.deficit}` : `+${Math.abs(dailySummary.deficit)}`}
              </span>
              <span className="text-[10px] text-slate-400 block">kcal</span>
            </div>

            <div className="bg-slate-50 p-3 rounded-2xl text-center border border-slate-100">
              <span className="text-[11px] text-slate-400 block font-medium">今日體重</span>
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
            <span>🥩 蛋白質 <strong>{dailySummary.totalProtein}g</strong></span>
            <span>🍚 碳水 <strong>{dailySummary.totalCarbs}g</strong></span>
            <span>🥑 脂肪 <strong>{dailySummary.totalFat}g</strong></span>
            <span>🥦 纖維 <strong>{dailySummary.totalFiber}g</strong></span>
          </div>
        </div>
      )}

      {/* Backup & Export Utility Card */}
      <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-200 space-y-3">
        <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
          <Database size={18} className="text-slate-500" />
          資料管理與備份
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          <button
            onClick={handleExportCsv}
            className="py-3 px-4 rounded-2xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center justify-center gap-2 transition active:scale-98"
          >
            <Download size={16} className="text-slate-500" />
            <span>匯出 CSV (Excel / 試算表)</span>
          </button>

          <button
            onClick={handleSeedDemo}
            disabled={isSeeding}
            className="py-3 px-4 rounded-2xl border border-emerald-200 bg-emerald-50/50 hover:bg-emerald-50 text-emerald-700 text-xs font-semibold flex items-center justify-center gap-2 transition active:scale-98 disabled:opacity-50"
          >
            <Sparkles size={16} className="text-emerald-500" />
            <span>載入 14 天示範健康數據</span>
          </button>
        </div>
      </div>

      {/* Email Preview Modal */}
      {previewOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-xl h-[80vh] rounded-3xl overflow-hidden shadow-2xl flex flex-col animate-fadeIn">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-bold text-sm text-slate-800 flex items-center gap-2">
                <Eye size={17} className="text-emerald-600" />
                HTML 郵件結報即時預覽
              </h3>
              <button
                onClick={() => setPreviewOpen(false)}
                className="text-xs px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 font-medium transition"
              >
                關閉
              </button>
            </div>
            <iframe
              src="/api/preview-report-html"
              title="Report Preview"
              className="w-full flex-1 border-none"
            />
          </div>
        </div>
      )}
    </div>
  );
}

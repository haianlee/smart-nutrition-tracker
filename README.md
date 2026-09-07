# 智慧飲食與體重管家 (AI Vision Nutrition & Weight Tracker) 🥗⚖️

一套專為手機體驗最佳化、可拍照上傳食物或手動輸入、由 **Gemini AI** 自動分析熱量與三大營養素、追蹤體重趨勢（含 **7 日移動平均線** 與 **TDEE 熱量赤字/盈餘**）並支援定期/即時 **Email 圖文結報** 的全方位管理工具。

---

## 🌟 核心特色

1. **手機即拍即辨識 (Gemini 3.8 Flash Multimodal)**：
   - 點擊「手機拍照」直接喚起後置相機拍照或由相簿選取。
   - 嚴格結構化 JSON 輸出：菜名、推估重量 (g)、總熱量 (kcal)、蛋白質、碳水化合物、脂肪、膳食纖維、細部食材拆解與判斷依據。
   - **數值微調覆寫 (Live Override)**：隨時修改重量、菜名或卡路里，調整重量時提供等比例自動換算。
   - **文字查表模式**：可直接輸入「地瓜 150g」或「無糖豆漿 400ml + 水煮蛋 2 顆」，快速計算。

2. **連續性體重與熱量動態圖表**：
   - **體重走勢 + 7 日移動平均線 (7-day MA)**：自動消除人體每日 0.5–1.5kg 的水分浮動，真實反映體態與減脂趨勢。
   - **每日熱量攝取 vs. TDEE 維持熱量**：雙軸/柱狀視覺化，**綠色表示燃脂赤字 (Deficit)**，**紅色表示熱量盈餘 (Surplus)**。
   - **週期巨量營養素比例圖**：蛋白質、碳水化合物、脂肪總量與圓餅佔比。
   - 支援 7 天、14 天、30 天、90 天切換。

3. **自動結算與定時推播 (Daily / Weekly / Monthly Reports)**：
   - **定時排程**：每日 22:00 自動彙整今日飲食明細、熱量赤字與體重，直接寄送響應式 HTML 郵件至您的信箱。
   - **手動發送與預覽**：介面提供「發送今日結報」與「預覽 Email 格式」按鈕。
   - **資料管理**：支援一鍵匯出 CSV 試算表（可在 Excel / Google Sheets 開啟）。

4. **雙軌落地支援**：
   - **方案一（本專案預設）**：現代化 Web App / PWA（React + Tailwind CSS + Node/Express + SQLite）。
   - **方案二（Google Workspace）**：隨附 `google-workspace/Code.gs` 與圖文架設指南，可 100% 免伺服器託管於 Google Sheets + AppSheet。

---

## 🚀 快速啟動指南 (本機與手機連線)

### 1. 安裝與啟動
```bash
# 1. 安裝前後端依賴
npm install
npm --prefix client install

# 2. 啟動服務 (同時啟動後端 API 與前端)
npm start
```
伺服器將在 `http://localhost:3001` 啟動，並自動託管前後端。

### 2. 手機開啟與連線方式
1. 確認手機與電腦連線在**同一個 Wi-Fi 區域網路**。
2. 在電腦終端機查詢電腦的區域 IP（Windows 執行 `ipconfig`，例如 `192.168.1.100`）。
3. 用手機瀏覽器（Safari 或 Chrome）打開：
   ```
   http://192.168.1.100:3001
   ```
4. **加入手機主畫面 (PWA)**：
   - **iPhone (iOS)**：點擊 Safari 下方「分享」按鈕 -> 選擇「加入主畫面」。
   - **Android**：點擊 Chrome 右上角選單 -> 選擇「加到主畫面」或「安裝應用程式」。
   - 即可像原生 App 一樣全螢幕開啟並隨時拍照！

---

## ⚙️ 環境設定與 API 配置

點擊介面右上角的 **⚙️ 設定** 圖示，可直接在手機/網頁上設定：

1. **體態與 TDEE**：
   - 輸入性別、年齡、身高、體重與日常活動強度，系統會利用 **Mifflin-St Jeor 公式** 自動推算您的 BMR 與 TDEE。
   - 自動建議每日蛋白質（體重 2 倍）、脂肪與碳水化合物克數。

2. **Gemini AI 金鑰**：
   - 前往 [Google AI Studio](https://aistudio.google.com) 免費申請 API Key。
   - 將金鑰貼入設定頁或儲存於根目錄 `.env`（`GEMINI_API_KEY=AIzaSy...`）。
   - *提示：在未填入金鑰前，系統內建示範分析模式，可隨時體驗所有功能。*

3. **郵件通報 (SMTP)**：
   - 填入接收報告的電子郵件（如 `your_email@gmail.com`）。
   - 若使用 Gmail 寄送，請於 Google 帳號「安全性」設定中產生「應用程式密碼 (App Password)」，填入 SMTP Pass 即可啟用每晚 22:00 自動推播！

---

## 📂 專案檔案架構

```
focused-kepler/
├── server/                      # 後端 Express 伺服器
│   ├── index.js                 # API 伺服器主入口與靜態資源託管
│   ├── db.js                    # 本地資料庫與 7-day MA 平滑計算
│   ├── gemini.js                # Gemini 2.5 Flash Vision 多模態食物分析
│   ├── mailer.js                # Nodemailer 與 HTML 結報產生器
│   └── scheduler.js             # node-cron 定時排程
├── client/                      # 前端 PWA (React + Tailwind CSS + Recharts)
│   ├── src/
│   │   ├── App.jsx              # 主頁面容器與資料流管理
│   │   ├── components/
│   │   │   ├── Navbar.jsx       # 頂部導覽列與今日赤字膠囊
│   │   │   ├── BottomNav.jsx    # 手機底部導覽列 (4 大分頁)
│   │   │   ├── FoodCapture.jsx  # 相機拍照/相簿選取/微調覆寫
│   │   │   ├── WeightTracker.jsx# 體重登錄與 BMI
│   │   │   ├── ChartsView.jsx   # 7-day MA 體重圖 + TDEE 盈虧柱狀圖 + 營養圓餅圖
│   │   │   ├── ReportsView.jsx  # 結報發送、HTML 預覽與 CSV 匯出
│   │   │   └── SettingsModal.jsx# 個人體態 TDEE 計算與金鑰設定
│   │   ├── index.css            # Tailwind 樣式
│   │   └── main.jsx
│   └── vite.config.js
├── google-workspace/            # 方案 A 備用 Google 生態系包
│   ├── Code.gs                  # Google Apps Script 完整程式碼
│   └── README_GAS.md            # Google Sheets + AppSheet 5分鐘架設指南
├── package.json
└── README.md
```

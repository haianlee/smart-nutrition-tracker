# 雲端 24 小時免費部署指南 (Render.com / Railway) 🚀

本指南帶您將「智慧飲食與體重管家」免費部署至雲端，**即使電腦關機、人在外面使用 4G/5G，手機依然能 24 小時隨時拍照記錄！**

---

## 方式一：部署到 Render.com（最推薦，每月免費 750 小時）

### 步驟 1：註冊 / 登入 Render
1. 前往 [Render.com](https://render.com/)。
2. 點擊右上角 **Sign Up / Log In**（推薦直接使用 **GitHub** 或 **Google** 帳號登入）。

---

### 步驟 2：建立 Web Service
1. 進入 Render 主儀表板（Dashboard），點擊右上角 **「New +」** -> 選擇 **「Web Service」**。
2. 選擇連結您的 GitHub 專案庫（Repository），或者點擊 **「Public Git repository」** 輸入您的專案網址。
   *(如果您使用的是本機代碼，請先將本專案推送到您的 GitHub)*。

---

### 步驟 3：設定專案參數（超簡單）
Render 會自動偵測 Node.js 專案，請確認以下欄位：
- **Name**: `my-nutrition-tracker` (或任何您喜歡的名稱)
- **Region**: 建議選擇 `Singapore` (新加坡) 或 `Oregon` (美西)，連線速度最快。
- **Branch**: `main`
- **Runtime**: `Node`
- **Build Command**:
  ```bash
  npm install && npm run build
  ```
- **Start Command**:
  ```bash
  npm start
  ```
- **Instance Type**: 選擇 **Free**（免費方案）

---

### 步驟 4：設定環境變數 (Environment Variables)
在下方點擊 **Add Environment Variable**：
- **Key**: `GEMINI_API_KEY`
- **Value**: 填入您的 Gemini API Key
- **Key**: `NODE_VERSION`
- **Value**: `22.0.0`

---

### 步驟 5：點擊部署
1. 點擊最下方的 **「Deploy Web Service」**。
2. 等待約 2～3 分鐘建置完成，上方就會出現您的專屬永久 HTTPS 網址：
   ```
   https://my-nutrition-tracker.onrender.com
   ```
3. 用手機打開這個網址，點擊「加入主畫面」，**您的專屬飲食 AI App 就正式上線了！電腦關機完全不影響使用！**

---

## 方式二：部署到 Railway.app

1. 前往 [Railway.app](https://railway.app/)，使用 GitHub 登入。
2. 點擊 **「New Project」** -> **「Deploy from GitHub repo」** 選擇此專案。
3. Railway 會自動讀取專案內的 `Dockerfile`，點擊 **Deploy** 即可完成！

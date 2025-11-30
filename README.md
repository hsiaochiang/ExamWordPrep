# 會考單字學習網站

專為會考高頻單字練習打造的前端網站，提供登入、單字範圍選擇、學習卡、測驗、歷史紀錄與管理者後台。使用 React + Vite（HashRouter），資料全存在瀏覽器端（LocalStorage 與可匯入/匯出的 JSON）。

## 安裝環境
1. 安裝 [Node.js](https://nodejs.org/)（建議 LTS）。
2. 下載/clone 專案後，在根目錄執行：
   ```bash
   npm install
   ```

## 開發模式
```bash
npm run dev
```
啟動後於終端顯示的網址開啟瀏覽器（預設 http://localhost:5173/）。

## 轉換 TOP 單字 PDF → JSON
1. 將 TOP 單字 PDF 放在專案根目錄（名稱不限）。
2. 執行：
   ```bash
   node tools/convert-top-pdf-to-json.mjs input.pdf public/data/words.json
   ```
   - 第一個參數為輸入 PDF 路徑。
   - 第二個參數為輸出 JSON 路徑（可省略，預設 `public/data/words.json`）。
3. `words.json` 欄位：
   - `id`: 唯一識別碼
   - `word`: 英文單字
   - `posRaw`: 原始詞性標註
   - `meaningZh`: 中文解釋
   - `frequencyGroup`: 出現次數分級（1–10）
   - `page`: PDF 頁碼

## 建置與部署
```bash
npm run build
```
輸出在 `dist/`，可直接部署到 GitHub Pages / Netlify / Vercel 等靜態主機。
- GitHub Pages：可搭配 `gh-pages` 套件或直接上傳 `dist`。
- Netlify / Vercel：將 `dist/` 作為靜態輸出目錄即可。

## 匯入／匯出使用者資料
- 管理者登入（預設帳號密碼 `admin/admin`），進入「使用者管理」使用匯入/匯出功能。
- 匯出會下載包含 `users` / `records` / `userSettings` 的 JSON 備份。
- 匯入可選擇「覆蓋」或「合併」現有資料，方便在不同裝置間同步。

## 專案目錄重點
- `src/`：前端 React 原始碼（HashRouter）
- `public/data/words-sample.json`：示範單字檔，正式使用可覆蓋為轉換後的 `words.json`
- `tools/convert-top-pdf-to-json.mjs`：本機 PDF 轉 JSON 的 Node CLI

所有頁面文案使用繁體中文，並考量 RWD；同裝置多使用者的設定與紀錄皆以帳號為單位存放。

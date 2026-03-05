# 🏦 Vault — Personal Budget Planner & Expense Tracker

> A full-stack personal finance app powered by **Notion API**, built with **React (Vite)** for web, **React Native (Expo)** for mobile, and **Node.js + Express** for the backend.

---

## ✨ Features

| Feature | Web | Mobile |
|---|---|---|
| Dashboard with income/expense/savings cards | ✅ | ✅ |
| Add Expense with OCR receipt scanning | ✅ | ✅ |
| Expense list with search & filter | ✅ | ✅ |
| Income manager (salary + side hustle) | ✅ | ✅ |
| Budget limits with progress bars + alerts | ✅ | ✅ |
| Recurring expenses (auto-added by cron) | ✅ | — |
| Month-end statistics + charts | ✅ | ✅ |
| PDF export | ✅ | — |
| Black & Gold / Purple & Rose Gold themes | ✅ | ✅ |
| Notion as database (real-time sync) | ✅ | ✅ |
| Work salary auto-added on last day of month | ✅ | ✅ |

---

## 🗂️ Project Structure

```
/vault
  /shared               ← Shared logic (hooks, utils, constants, types)
    /hooks              ← useExpenses, useIncome, useBudget
    /utils              ← notionClient.js, formatCurrency.js, ocr.js, dateUtils.js
    /constants          ← categories.js, themes.js
    /types              ← TypeScript types
  /web                  ← Vite + React web app
    /src
      /components       ← Reusable UI components
      /pages            ← Dashboard, Expenses, Income, Budget, Stats, Settings
      /context          ← ThemeContext, AppContext
      /styles           ← Global CSS
  /mobile               ← Expo React Native app
    /app                ← expo-router screens
      /(tabs)           ← Bottom tab screens
    /components         ← Mobile UI components
    /context            ← Mobile theme + app context
  /server               ← Express API server
    /routes             ← expenses, income, budget, recurring, ocr, setup, stats
    /services           ← notionService.js, ocrService.js, cronJobs.js
    /middleware         ← errorHandler.js
  .env.example          ← Environment variable template
  package.json          ← Root monorepo config
```

---

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- A [Notion account](https://notion.so)
- (Optional) Google Cloud Vision API key for server-side OCR

### Step 1 — Clone & Install

```bash
git clone <repo-url>
cd vault

# Install all dependencies
npm run install:all

# OR install manually:
cd server && npm install
cd ../web && npm install
cd ../mobile && npm install
```

### Step 2 — Environment Setup

```bash
cp .env.example server/.env
```

Open `server/.env` and fill in (at minimum):

```env
PORT=3001
```

> The Notion API key and database IDs are set via the **in-app setup wizard** — you don't need to add them manually. They are stored in `server/.vault-config.json` after onboarding.

---

## 🔑 Notion Integration Setup

### Step 1 — Create a Notion Integration

1. Go to [https://www.notion.so/my-integrations](https://www.notion.so/my-integrations)
2. Click **"+ New integration"**
3. Give it a name (e.g. `Vault`)
4. Select your workspace
5. Click **"Submit"**
6. Copy the **"Internal Integration Token"** (starts with `secret_...`)

### Step 2 — Create a Parent Page

1. In Notion, create a new **page** (e.g. "Vault Budget")
2. Open that page and click **"Share"** at the top right
3. Click **"Invite"**, search for your integration name (`Vault`), and click **Invite**
4. Copy the page URL — it looks like:
   ```
   https://www.notion.so/Your-Page-Title-abc123def456789012345678901234
   ```
   The page ID is the last 32-character hex string.

### Step 3 — Run the App Setup Wizard

1. Start the server: `npm run dev:server`
2. Start the web app: `npm run dev:web`
3. Open `http://localhost:5173`
4. The onboarding wizard will appear — enter your **Notion API Key** and **Parent Page URL**
5. Vault will automatically create 4 Notion databases under your page:
   - 📋 **Vault – Expenses**
   - 💵 **Vault – Income**
   - 🎯 **Vault – Budget Limits**
   - 🔄 **Vault – Recurring Expenses**

### Step 4 — Connect Side Hustle DB (Optional)

If you have an existing Notion database for tracking side hustle income:

1. In the onboarding wizard, paste the **database URL**
2. Click **"Fetch Fields"** — Vault reads all column names from your DB
3. Map:
   - **Amount Field** → the column containing the income amount
   - **Date Field** → the column with the income date
4. Click **"Map & Continue"**

> This mapping is stored in `server/.vault-config.json`. You can update it anytime in Settings.

### Step 5 — Set Budget Limits

1. In the wizard, enter monthly spending limits per category
2. These are written directly to your Notion Budget Limits database
3. You can edit them later in the **Budget** page

---

## 🏃 Running the App

### Development (Web + Server together)

```bash
npm run dev
```

This starts:
- **Server** at `http://localhost:3001`
- **Web app** at `http://localhost:5173`

### Server Only

```bash
npm run dev:server
```

### Web Only (needs server running)

```bash
npm run dev:web
```

### Mobile (Expo)

```bash
npm run dev:mobile
```

Then scan the QR code with the **Expo Go** app on your phone.

> **Important for mobile:** Set the server URL to your machine's local IP address (e.g. `http://192.168.1.10:3001`) in the mobile onboarding screen or Settings, not `localhost`.

---

## ⚙️ Environment Variables

Full `.env` reference for `server/.env`:

```env
# Server port
PORT=3001

# Notion API Key (also set via onboarding wizard)
NOTION_API_KEY=secret_xxxxxxxxxxxxxxxxxxxxxxxxx

# Notion parent page ID (32-char hex)
NOTION_PARENT_PAGE_ID=abc123def456789012345678901234ab

# Auto-populated after setup:
EXPENSES_DB_ID=
INCOME_DB_ID=
BUDGET_DB_ID=
RECURRING_DB_ID=

# Side hustle DB (optional)
SIDE_HUSTLE_DB_ID=
SIDE_HUSTLE_AMOUNT_FIELD=Amount
SIDE_HUSTLE_DATE_FIELD=Date

# Google Cloud Vision OCR (optional — leave blank to use Tesseract.js)
OCR_API_KEY=
```

---

## 🎯 Budget Categories

Default categories (with icons and colors):

| Category | Icon | Color |
|---|---|---|
| Food & Dining | 🍽️ | Red |
| Transport | 🚗 | Teal |
| Bills & Utilities | ⚡ | Blue |
| Entertainment | 🎬 | Green |
| Savings / Investments | 💰 | Gold |
| Shopping | 🛍️ | Purple |
| Health | ❤️ | Mint |

---

## 💰 Income Automation

### Work Salary (₹10,000)
- A cron job runs **daily at 11:55 PM**
- On the **last day of each month**, it checks if a salary entry exists
- If not, it auto-creates: `Source = "Work Salary"`, `Type = "Salary"`, `Amount = ₹10,000`
- To change the salary amount, edit `WORK_SALARY_AMOUNT` in `shared/constants/categories.js`

### Recurring Expenses
- Add subscriptions, EMIs, or regular bills in the **Recurring** page
- The daily cron job checks if today matches any active recurring item's `dayOfMonth`
- If so, it auto-creates an expense entry in Notion

---

## 🧾 Receipt OCR

### Client-side (Tesseract.js — Default)
- Works offline, no API key needed
- Automatically extracts **amount** and **guesses category** from receipt text
- Click **"📷 Scan Receipt"** in the Add Expense form

### Server-side (Google Cloud Vision — Optional)
- More accurate, especially for printed receipts
- Set `OCR_API_KEY` in your `.env`
- The web app sends the image to `POST /api/ocr/scan`

---

## 🎨 Themes

Two built-in themes, switchable from **Settings**:

### Black & Gold (Default)
- Background: `#0A0A0A`
- Accent: `#D4AF37` (golden yellow)

### Purple & Rose Gold
- Background: `#0D0A14`
- Accent: `#C9A96E` (rose gold)
- Secondary: `#7B2FBE` (purple)

Theme preference is saved in `localStorage` (web) / `AsyncStorage` (mobile) and persists across sessions.

---

## 📊 Notion Database Schemas

### Expenses DB
| Property | Type | Notes |
|---|---|---|
| Name | Title | Expense description |
| Amount | Number | In ₹ |
| Category | Select | food, transport, bills, etc. |
| Date | Date | |
| Payment Method | Select | Cash / UPI / Card |
| Notes | Text | Optional |
| Receipt Image URL | URL | From OCR scan |
| Month | Formula | `formatDate(Date, "MMMM YYYY")` |

### Income DB
| Property | Type | Notes |
|---|---|---|
| Source | Title | e.g. "Work Salary" |
| Amount | Number | |
| Date | Date | |
| Type | Select | Salary / Side Hustle |
| Month | Formula | |

### Budget Limits DB
| Property | Type | Notes |
|---|---|---|
| Category | Title | Category ID |
| Monthly Limit | Number | Max spend in ₹ |
| Alert Threshold % | Number | Default: 80 |

### Recurring Expenses DB
| Property | Type | Notes |
|---|---|---|
| Name | Title | |
| Amount | Number | |
| Category | Select | |
| Day of Month | Number | 1–28 |
| Active | Checkbox | Toggle on/off |

---

## 🛠️ API Reference

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/health` | Server health check |
| GET | `/api/expenses?month=2024-01` | List expenses |
| POST | `/api/expenses` | Create expense |
| PATCH | `/api/expenses/:id` | Update expense |
| DELETE | `/api/expenses/:id` | Archive expense |
| GET | `/api/income?month=2024-01` | List income (main + side hustle) |
| POST | `/api/income` | Create income entry |
| GET | `/api/budget` | Get all budget limits |
| POST | `/api/budget` | Upsert budget limit |
| GET | `/api/recurring` | List recurring expenses |
| POST | `/api/recurring` | Create recurring |
| PATCH | `/api/recurring/:id` | Update recurring |
| DELETE | `/api/recurring/:id` | Delete recurring |
| GET | `/api/stats?month=2024-01` | Month statistics |
| GET | `/api/stats/trend` | 6-month trend data |
| POST | `/api/ocr/scan` | Scan receipt image (base64) |
| POST | `/api/setup/verify` | Verify Notion connection |
| POST | `/api/setup/databases` | Create all 4 Notion DBs |
| GET | `/api/setup/sidehustle/fields?dbId=...` | Get fields from side hustle DB |
| POST | `/api/setup/sidehustle` | Map side hustle columns |
| GET | `/api/setup/status` | Check if app is configured |

---

## 🐛 Troubleshooting

### "Cannot reach server" on mobile
- Make sure your phone and computer are on the **same Wi-Fi network**
- Use your machine's LAN IP (e.g. `192.168.1.x`), not `localhost`
- Check firewall settings — port 3001 must be accessible

### Notion API errors
- Ensure the integration is **shared** with the parent page (click Share → Invite)
- Check the API key starts with `secret_`
- The page ID must be the 32-character hex string from the URL

### OCR not detecting amounts
- Try better lighting / flatter surface when taking photos
- Ensure the receipt total is clearly visible
- Manually enter the amount if OCR fails

### Work salary not auto-added
- The cron job runs at **11:55 PM** on the last day of the month
- The server must be running at that time
- Check `server/services/cronJobs.js` logs

---

## 📱 Mobile Setup Notes

The mobile app (Expo) connects to the same Express server as the web app.

1. Run `npm run dev:server` on your computer
2. Find your local IP: `ipconfig` (Windows) or `ifconfig` (Mac/Linux)
3. In the mobile onboarding, enter `http://<your-ip>:3001`
4. The app stores this URL in AsyncStorage

---

## 🏗️ Tech Stack

| Layer | Technology |
|---|---|
| Web Frontend | React 18 + Vite |
| Mobile | React Native (Expo) + expo-router |
| Shared Logic | Vanilla JS hooks + utils |
| Backend | Node.js + Express |
| Database | Notion API |
| Charts (Web) | Recharts |
| Charts (Mobile) | Custom bar/pie charts |
| OCR | Tesseract.js (client) / Google Vision (server) |
| PDF Export | jsPDF |
| Cron Jobs | node-cron |
| Auth | None (Notion API key in server .env) |

---

## 📄 License

MIT — build and use freely.

---

*Built with ❤️ — Vault keeps your finances as organized as your code.*

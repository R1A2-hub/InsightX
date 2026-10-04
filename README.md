# InsightX — AI Data Analyst

> **"Compute first. Explain second."**  
> All numerical business calculations are performed deterministically by the application engine. The AI model explains verified results and never estimates, calculates, or fabricates business numbers.

InsightX is an end-to-end AI-powered business analytics platform built for small and medium businesses (SMBs). Users upload raw sales datasets (CSV or Excel `.xlsx`), and InsightX executes a complete automated intelligence pipeline:

**Upload → Validate → Profile → Clean → Understand Schema → Calculate Metrics → Analyze Products/Categories/Regions → Detect Trends → Detect Anomalies → Forecast → Generate Evidence → Generate AI Insights → Answer Natural-Language Questions.**

---

## Key Capabilities

1. **Deterministic Analytics Engine**:
   - Automatic column normalization for aliases (`qty` → `Quantity`, `price` → `Selling_Price`, `sales` → `Revenue`, `expense` → `Cost`).
   - Mathematical derivation: `Revenue = Quantity × Selling_Price`, `Profit = Revenue − Cost`, `Profit Margin = (Profit / Revenue) × 100`.
   - Missing cost handling: Gracefully degrades profit metrics to *Unavailable* without breaking revenue analytics.
   - Month-over-Month (MoM) growth calculations.
   - Interquartile Range (IQR) anomaly detection for extreme volume and revenue outliers.
   - Ordinary Least Squares (OLS) linear regression forecasting for next-period revenue projections with MAE and RMSE metrics.

2. **Evidence Builder Architecture**:
   - Before any AI interaction, deterministic calculations are formatted into structured `EvidenceObject` records with verified mathematical figures.
   - The AI explanation layer uses these Evidence records as grounded source data, preventing hallucinations.

3. **Natural-Language Business Analyst**:
   - Supports both English and Hinglish conversational queries (e.g., *"Which product generated the most revenue?"* or *"north ya south me se konsa better perform krha h?"*).
   - Classifies query intents, extracts entities, computes comparisons, and returns formatted evidence alongside AI commentary.

4. **Data Quality & Audit Transparency**:
   - Full audit trail of cleaned duplicate rows, median-imputed null values, date normalizations, and column mappings.

---

## Project Structure

```
├── backend/                        # Python FastAPI Backend Architecture
│   ├── app/
│   │   ├── ai/
│   │   │   └── gemini_service.py   # Isolated Gemini API explanation layer
│   │   ├── analytics/
│   │   │   ├── engine.py           # pandas, NumPy, scikit-learn deterministic engine
│   │   │   ├── evidence_builder.py # Evidence object constructor
│   │   │   └── intent_engine.py    # Regex & semantic question intent classifier
│   │   ├── api/
│   │   │   └── routes.py           # FastAPI REST endpoints
│   │   ├── core/
│   │   │   └── config.py           # Application settings & environment variables
│   │   ├── data/
│   │   │   └── processor.py        # File validation, cleaning, and normalization
│   │   ├── schemas/
│   │   │   └── analytics.py        # Pydantic validation models
│   │   └── main.py                 # FastAPI application factory
│   ├── requirements.txt            # Python dependencies (pandas, scikit-learn, etc.)
│   └── tests/
│       └── test_analytics.py       # pytest test suite for deterministic engine
│
├── server/                         # Full-Stack TypeScript Unified Server
│   └── app/
│       ├── ai/
│       │   └── geminiService.ts    # Google GenAI explanation layer with fallback
│       ├── analytics/
│       │   ├── engine.ts           # Deterministic metrics, IQR anomaly & OLS regression
│       │   ├── evidenceBuilder.ts  # Evidence object generation
│       │   └── intentEngine.ts     # Bilingual (English/Hinglish) intent resolver
│       ├── api/
│       │   └── routes.ts           # Express REST endpoints
│       ├── data/
│       │   ├── processor.ts        # CSV/XLSX parser, deduplicator & median imputer
│       │   └── sampleData.ts       # Realistic SMB multi-month datasets
│       ├── models/
│       │   └── repository.ts       # In-memory storage (PostgreSQL-ready interface)
│       ├── schemas/
│       │   └── analytics.ts        # TypeScript data schemas
│       └── services/
│           └── datasetService.ts   # Pipeline orchestration service
│
├── src/                            # Frontend (React + Vite + Tailwind CSS)
│   ├── charts/
│   │   ├── DimensionBarChart.tsx   # Product/Category/Region distribution bars
│   │   ├── ForecastChart.tsx       # OLS linear regression forecast chart
│   │   └── RevenueProfitChart.tsx  # Interactive monthly trend & profit area chart
│   ├── components/
│   │   ├── EmptyState.tsx          # Upload dropzone & sample loader
│   │   ├── KpiCardsGrid.tsx        # 5 core business KPI tiles
│   │   ├── Sidebar.tsx             # Collapsible left navigation
│   │   └── TopBar.tsx              # Dataset switcher, search, and notification panel
│   ├── pages/
│   │   ├── AIInsightsPage.tsx      # Grounded AI insights with inspectable evidence
│   │   ├── AnalystChatPage.tsx     # English & Hinglish interactive business Q&A
│   │   ├── AnalyticsPage.tsx       # Deep dive dimensions & side-by-side comparison
│   │   ├── DashboardPage.tsx       # Executive business intelligence overview
│   │   ├── DataQualityPage.tsx     # Missing values, deduplication & capability audit
│   │   ├── DatasetsPage.tsx        # File upload, sample selection & active datasets
│   │   ├── ForecastsPage.tsx       # Historical trends vs. OLS predicted revenue
│   │   └── SettingsPage.tsx        # Architectural guardrails & pipeline specs
│   ├── services/
│   │   └── api.ts                  # REST API client & currency formatting
│   ├── types/
│   │   └── analytics.ts            # Frontend shared TypeScript interfaces
│   ├── App.tsx                     # Main layout & route controller
│   ├── index.css                   # Tailwind CSS styling & typography
│   └── main.tsx                    # React DOM entrypoint
│
├── tests/
│   └── analytics.test.ts           # Vitest comprehensive unit test suite
├── server.ts                       # Express + Vite server entrypoint (Port 3000)
├── package.json
└── tsconfig.json
```

---

## Local Setup & Quick Start

### Option 1: Full-Stack Node.js / Vite Runtime (Recommended for Immediate Use)

The application includes a unified Express + Vite dev server that runs both the frontend and deterministic analytics backend on port 3000.

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Configure Environment Variables**:
   Create a `.env` file based on `.env.example`:
   ```bash
   cp .env.example .env
   ```
   Add your Google Gemini API key:
   ```env
   GEMINI_API_KEY="your-gemini-api-key"
   ```
   *(Note: The deterministic engine, forecasts, comparisons, and rule-based insights run fully even without an API key).*

3. **Start the Development Server**:
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser.

4. **Run Unit Tests**:
   ```bash
   npm test
   ```

---

### Option 2: Python FastAPI Backend

If you wish to run the standalone Python FastAPI backend:

1. **Navigate to the backend directory and set up a virtual environment**:
   ```bash
   cd backend
   python3 -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

2. **Install Python Dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

3. **Run the FastAPI Server**:
   ```bash
   uvicorn app.main:app --reload --port 8000
   ```
   Interactive API documentation will be available at [http://localhost:8000/docs](http://localhost:8000/docs).

4. **Run Python Tests**:
   ```bash
   pytest tests/
   ```

---

## Dual-Client Architecture (Web & Android)

InsightX provides two clients backed by a single, shared deterministic analytics and AI engine:

```
┌────────────────────────────────────────────────────────┐
│                      Clients                           │
│  ┌──────────────────────┐    ┌──────────────────────┐  │
│  │     Web Browser      │    │  Android Application │  │
│  │ (Desktop & Mobile)   │    │(Capacitor native APK)│  │
│  └──────────┬───────────┘    └──────────┬───────────┘  │
└─────────────┼───────────────────────────┼──────────────┘
              │                           │
              └─────────────┬─────────────┘
                            ▼
              ┌───────────────────────────┐
              │    Central Backend API    │
              │  (Node / Express / CORS)  │
              └─────────────┬─────────────┘
                            ▼
       ┌────────────────────────────────────────┐
       │   Deterministic Analytics Pipeline     │
       │  (Upload, Clean, KPIs, Trend, Forecast)│
       └────────────────────┬───────────────────┘
                            ▼
       ┌────────────────────────────────────────┐
       │       Evidence Builder (Data Only)     │
       └────────────────────┬───────────────────┘
                            ▼
       ┌────────────────────────────────────────┐
       │     Google Gemini 3.8 Flash Layer      │
       │    (Explains Verified Numbers Only)    │
       └────────────────────────────────────────┘
```

The web application remains 100% operational at:
**`https://insightx-ai-data-analyst-20453368826.asia-southeast1.run.app`**

---

## Android Project Details

- **Application Name**: `InsightX — AI Data Analyst`
- **Application ID / Package**: `com.insightx.aidataanalyst`
- **Framework**: Capacitor 8 + Android Gradle
- **Target Android SDK**: API 36 (Android 15+)
- **Minimum Android SDK**: API 24 (Android 7.0+)
- **Android Features**:
  - File picker for `.csv` and `.xlsx` upload
  - Native hardware Back Button support (closes drawer, navigates to Dashboard, or exits app)
  - Dark status bar matching InsightX slate branding (`#0f172a`)
  - Adaptive launcher icons (`ic_launcher` and `ic_launcher_round`)
  - Native splash screen with InsightX icon and "Compute first. Explain second."
  - Mobile bottom navigation bar for touch optimization

---

## Android Build & Packaging Guide

### Prerequisites
- Node.js 22+
- Java JDK 17 or 21 (`export JAVA_HOME=/path/to/jdk`)
- Android Studio / Android SDK (with Command-line Tools and Platform 36 installed)

### 1. Build and Sync Web Assets to Android
Whenever frontend code changes:
```bash
npm run android:sync
```
This builds the production bundle and copies assets into `android/app/src/main/assets/public`.

### 2. Generate Debug APK (for Testing)
```bash
cd android
./gradlew assembleDebug
```
The output file is located at:
`android/app/build/outputs/apk/debug/app-debug.apk`

### 3. Install Debug APK on an Android Device or Emulator
```bash
adb install -r android/app/build/outputs/apk/debug/app-debug.apk
```

### 4. Generate Production Release APK
```bash
cd android
./gradlew assembleRelease
```
The output file is located at:
`android/app/build/outputs/apk/release/app-release-unsigned.apk`

### 5. Generate Signed Android App Bundle (.aab) for Google Play
Google Play Console requires an `.aab` (Android App Bundle):
```bash
cd android
./gradlew bundleRelease
```
The output bundle is located at:
`android/app/build/outputs/bundle/release/app-release.aab`

#### Signing the App Bundle for Google Play
To sign the `.aab` for Google Play release:
1. Generate your release keystore (if not already created):
   ```bash
   keytool -genkey -v -keystore insightx-release.keystore -alias insightx -keyalg RSA -keysize 2048 -validity 10000
   ```
2. Sign using `jarsigner`:
   ```bash
   jarsigner -verbose -sigalg SHA256withRSA -digestalg SHA-256 -keystore insightx-release.keystore android/app/build/outputs/bundle/release/app-release.aab insightx
   ```
3. Upload the signed `app-release.aab` to Google Play Console.

### 6. Local Testing & Emulator Configuration
- **Live Cloud Run Mode (Default)**: In the Android app, API requests automatically connect to the production Cloud Run backend: `https://insightx-ai-data-analyst-20453368826.asia-southeast1.run.app`.
- **Local Testing Mode (Android Emulator)**: When testing against a local dev server running on your computer:
  1. Open the Android app.
  2. Navigate to **Settings** (`/settings`).
  3. Under **Backend API Connection**, enter `http://10.0.2.2:3000` (the standard Android emulator alias for localhost).
  4. Tap **Apply** and **Test Connection**. The ping indicator will confirm connectivity with latency in milliseconds.
  5. Tap **Reset** at any time to return to the live production Cloud Run backend.

---

## Architectural Rules

- **Zero Invention**: Gemini never computes math or summarizes raw row arrays directly.
- **Evidence-Only Context**: The AI layer only receives pre-calculated KPIs, dimension aggregates, and statistical anomalies as serialized evidence strings.
- **Graceful Degradation**: If an AI request fails, exceeds quotas, or is unconfigured, the application falls back cleanly to deterministic template explanations without UI breakage.
- **PostgreSQL Ready**: The storage layer is decoupled into `IDatasetRepository`, allowing migration from in-memory maps to PostgreSQL with zero changes to analytics or AI layers.


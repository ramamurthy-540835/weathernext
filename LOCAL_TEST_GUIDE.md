# 🚀 WeatherNext v3 — Local Development & Testing Guide

## 📍 URL Strategy

### Current Status
- **Old URL** (Untouched): `https://your-old-domain.com` (kept for backward compatibility)
- **New Frontend URL** (This Dev): `http://localhost:3000` (local testing)
- **New Production Frontend**: `https://weathernext-dashboard-v3.run.app` (to be deployed)
- **New Backend API**: `https://api.weathernext-uae.ncm.ae` (to be deployed)

---

## 🎯 Local Testing Checklist

### ✅ **1. Default Location & Cities**
- [ ] Load dashboard → defaults to **Dubai (25.2°N, 55.27°E)**
- [ ] City presets show **all 7 UAE emirates**
- [ ] Try clicking: Dubai, Abu Dhabi, Sharjah, Ajman, RAK, Fujairah, Umm Al Quwain
- [ ] Each city loads forecast data

### ✅ **2. 15-Day Forecast Display**
- [ ] Click any emirate → **ForecastDays15 component appears**
- [ ] Shows **15-day grid** with:
  - Day number + date
  - Confidence level (HIGH/MODERATE/LOW-MODERATE/LOW)
  - Temperature range (min–max)
  - Rain P90 (if present)
  - Visual confidence meter
- [ ] Colors match confidence:
  - GREEN (Days 1-3) = HIGH
  - ORANGE (Days 4-5) = MODERATE
  - YELLOW (Days 6-10) = LOW-MODERATE
  - BLUE (Days 11-15) = LOW

### ✅ **3. UAE Alert Scan**
- [ ] Top-left shows **🇦🇪 UAE Alert Scan** button
- [ ] Click it → scans **all 7 emirates**
- [ ] Shows counts: "X DANGER · Y WARNING · Z Clear"
- [ ] Click expand → list of emirates with hazard details
- [ ] Click any emirate → navigates to location + shows forecast

### ✅ **4. Forecast Panel Tabs**
- [ ] Select location
- [ ] Check **Forecast** tab:
  - Temperature line chart
  - Precipitation bar chart
  - Wind speed area chart
  - Pressure line chart
  - All with +0h to +360h (15 days) on X-axis
- [ ] Check **Ensemble** tab:
  - 64-member ensemble spread
  - Confidence bands (tight/wide)
- [ ] Check **Alerts** tab:
  - Hazard warnings (DANGER/WARNING/INFO)
  - Member counts (X of 64)
  - Probability percentages
  - Recommendations for NCM
- [ ] Check **Cyclones** tab:
  - Cyclone tracking (if any active)
- [ ] Check **Architecture** tab:
  - System overview
  - 64-member ensemble explanation
  - Data pipeline
  - NCM workflow
  - ASCII architecture diagram

### ✅ **5. Gemini 3.1 Pro AI Assistant**
- [ ] Click **"Talk to Weather AI"** button
- [ ] Try starter questions:
  - "What's the dust storm risk (P90)?"
  - "Heat stress forecast for next 72h?"
  - "Any cyclone threat to UAE?"
  - "Wind patterns for maritime ops?"
  - "Extreme heat advisory needed?"
- [ ] Verify responses include:
  - [RISK LEVEL]: HIGH/CRITICAL/ELEVATED/LOW/NONE
  - [ENSEMBLE BREAKDOWN]: Mean, P10, P90, member count %
  - [15-DAY OUTLOOK]: Days 1-3, Days 4-5, Days 6-10, Days 11-15
  - [NCM DECISION]: Specific action for forecasters
  - [PROBABILISTIC TAIL RISK]: P90 worst-case
- [ ] Responses should be probabilistic:
  - ✓ "42 of 64 members (66%) predict..."
  - ✗ NOT "will rain" or "won't rain"

### ✅ **6. Earthquake Click Handler**
- [ ] Open map (Flat Map view)
- [ ] Observe earthquake triangles (if any visible)
- [ ] Click on earthquake marker
- [ ] Should:
  - Navigate to earthquake location
  - Show sidebar with forecast for that location
  - Display earthquake details

### ✅ **7. Confidence Visualization**
- [ ] 15-day forecast should show confidence for **ALL days**
- [ ] Even Days 11-15 should have:
  - Visible confidence badge (TREND/LOW)
  - Colored card (BLUE)
  - Confidence meter bar
- [ ] **Not hidden or disabled** for later days

### ✅ **8. Architecture Component**
- [ ] Click Architecture tab (in sidebar)
- [ ] Expandable sections:
  - System Overview
  - 64-Member Ensemble
  - Data Pipeline
  - NCM Operational Workflow
  - Architecture Diagram (ASCII)
  - Integration Points
- [ ] Each section explains WeatherNext 2.0 features

### ✅ **9. Map Projections & Controls**
- [ ] Flat Map button → switches to flat mercator projection
- [ ] 3D Globe button → switches to 3D globe
- [ ] Auto-Rotate button (on globe) → rotates slowly
- [ ] 🌀 Spiral button → spiral overlay (if cyclones active)
- [ ] ⚙️ Architecture button → opens architecture view

### ✅ **10. Mobile Responsiveness**
- [ ] Resize browser → sidebar collapses/expands
- [ ] Forecast grid responsive on small screens
- [ ] Confidence cards stack vertically on mobile

---

## 🔧 API Endpoints to Test Locally

### Forecast API (15-day)
```bash
curl "http://localhost:3000/api/forecast?lat=25.2&lon=55.27&initDate=2026-04-15&initHour=0&maxHours=360"
```
Expected response includes `forecastConfig`, all 15 days of data, confidence levels

### Alerts API (15-day)
```bash
curl "http://localhost:3000/api/alerts?lat=25.2&lon=55.27&initDate=2026-04-15&initHour=0&maxHours=360"
```
Expected: Array of hazards with member counts (X of 64)

### Ensemble API (15-day)
```bash
curl "http://localhost:3000/api/ensemble?lat=25.2&lon=55.27&initDate=2026-04-15&initHour=0&maxHours=360"
```
Expected: All 64 ensemble members with timeseries

### Chat API (Gemini 3.1 Pro)
```bash
curl -X POST "http://localhost:3000/api/chat" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "What is the heat stress risk for Dubai?",
    "weatherContext": {/* forecast data */}
  }'
```
Expected: Streaming response with ensemble breakdown, confidence levels

---

## 🌐 Production URL Deployment Plan

Once local testing ✅ passes:

### **NEW URLs (Post-Deployment)**
```
Frontend (New):  https://weathernext-dashboard-v3.run.app
Backend (New):   https://api.weathernext-uae.ncm.ae
Old URL:         https://your-old-domain.com (UNCHANGED)
```

### **Cloud Run Deployment**
```bash
# Build v3 image
gcloud builds submit --config=cloudbuild.yaml

# Deploy to Cloud Run
gcloud run deploy weathernext-dashboard-v3 \
  --image us-central1-docker.pkg.dev/ctoteam/weathernext/dashboard:v3 \
  --region us-central1 \
  --set-env-vars NCM_REGION=UAE,FORECAST_DAYS=15,ENSEMBLE_MEMBERS=64
```

### **Backend API (Separate Service)**
```bash
# Deploy backend to separate Cloud Run service
gcloud run deploy weathernext-api-v3 \
  --image us-central1-docker.pkg.dev/ctoteam/weathernext/api:v3 \
  --region us-central1 \
  --set-env-vars BIGQUERY_PROJECT_ID=ctoteam
```

### **DNS/Load Balancing**
```
api.weathernext-uae.ncm.ae  → Cloud Run Backend API
weathernext-dashboard-v3.run.app → Cloud Run Frontend
old-domain.com              → OLD URL (unchanged)
```

---

## 📊 Feature Completeness Checklist

### Core Features
- [x] 15-day forecast (360 hours)
- [x] 64-member ensemble
- [x] Confidence visualization (all days)
- [x] UAE Alert Scan (all 7 emirates)
- [x] Gemini 3.1 Pro integration
- [x] Architecture documentation
- [x] Earthquake click handler
- [x] Docker v3 with caching
- [x] Cloud Build v3 pipeline

### UI/UX
- [x] ForecastDays15 component
- [x] Confidence color coding
- [x] Responsive grid layout
- [x] Architecture tabs
- [x] Map projections (globe/flat)
- [x] Alert scan UI

### APIs
- [x] /api/forecast (360h support)
- [x] /api/ensemble (360h support)
- [x] /api/alerts (360h support, UAE hazards)
- [x] /api/chat (Gemini 3.1 Pro)

### Data & Models
- [x] FORECAST_CONFIG with 15-day settings
- [x] UAE_HAZARD_THRESHOLDS
- [x] Confidence degradation by day
- [x] Percentile coverage (P10, P25, P50, P75, P90)

---

## 🚀 Next Steps

1. **✅ Test locally** (this guide)
2. **Build Docker v3 image** (`npm run build` + docker build)
3. **Push to Artifact Registry** (cloudbuild.yaml)
4. **Deploy to Cloud Run** (both frontend + backend)
5. **Configure new URLs** (DNS, load balancer)
6. **Keep old URL alive** (no changes)
7. **Announce new URLs** to NCM users

---

## 📞 Local Server Info

```
Frontend Dev:   http://localhost:3000
API Routes:     http://localhost:3000/api/*
Network:        http://10.100.15.44:3000 (from other machines)
```

**Log file**: `/tmp/nextjs.log`
**PID**: Check with `ps aux | grep "next dev"`

---

## ✨ All Features Included ✨

This version includes everything discussed:
✅ 15-day forecast with visual confidence
✅ Gemini 3.1 Pro with full prompts
✅ Docker v3 with multi-layer caching
✅ UAE-only alert scan
✅ All 7 emirates support
✅ Architecture documentation
✅ Earthquake navigation fix
✅ Confidence visualization (all days, not hidden)
✅ New Frontend & Backend URLs (ready for production)
✅ Old URL untouched & functional

**Ready to test!** 🎯

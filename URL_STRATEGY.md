# 🌐 WeatherNext v3 — URL Strategy & Deployment

## 📍 **Three URL Tiers**

### **Tier 1: OLD URL (Untouched - Backward Compatibility)**
```
Frontend:   https://your-old-domain.com
API:        https://your-old-domain.com/api
Status:     UNCHANGED - No modifications
```
✅ **Old users can keep using old URL indefinitely**  
✅ **No breaking changes**  
✅ **Separate from v3 development**

---

### **Tier 2: LOCAL DEVELOPMENT (Testing)**
```
Frontend:   http://localhost:3000
API:        http://localhost:3000/api
Network:    http://10.100.15.44:3000
Status:     ✅ RUNNING NOW
```
✅ **Use for feature testing** (this session)  
✅ **All v3 features enabled**  
✅ **Full Gemini 3.1 Pro integration**  
✅ **15-day forecast with confidence visualization**  

**Access now**: http://localhost:3000

---

### **Tier 3: NEW PRODUCTION URLS (v3 - Post-Deployment)**

#### **3a. New Frontend URL (v3)**
```
https://weathernext-dashboard-v3.run.app

Cloud Run Service: weathernext-dashboard-v3
Region: us-central1
Image Tag: v3
Status: READY FOR DEPLOYMENT
```

#### **3b. New Backend API URL (v3 Separate)**
```
https://api.weathernext-uae.ncm.ae

Cloud Run Service: weathernext-api-v3
Region: us-central1
Image Tag: v3
Status: READY FOR DEPLOYMENT
```

---

## 🎯 **Deployment Timeline**

### **Phase 1: Local Testing** (NOW)
```
✅ Development server running
✅ http://localhost:3000
✅ Test all features:
   - 15-day forecast
   - Confidence visualization
   - Gemini 3.1 Pro chat
   - UAE Alert Scan
   - Architecture docs
   - Earthquake navigation
```

### **Phase 2: Build & Push** (After Local Testing ✅)
```
1. npm run build         # Build Next.js
2. docker build          # Build v3 image
3. Push to Registry      # Artifact Registry
4. Run cloudBuild        # Automated CI/CD
```

### **Phase 3: Deploy v3** (After Build Success ✅)
```
1. Deploy Frontend → Cloud Run v3 service
   URL: https://weathernext-dashboard-v3.run.app

2. Deploy Backend API → Cloud Run API service
   URL: https://api.weathernext-uae.ncm.ae

3. Configure DNS/Load Balancing
   old-domain.com → OLD (untouched)
   weathernext-dashboard-v3.run.app → NEW Frontend
   api.weathernext-uae.ncm.ae → NEW Backend
```

### **Phase 4: Parallel Operation**
```
OLD: https://your-old-domain.com (kept alive)
NEW: https://weathernext-dashboard-v3.run.app (new users)
NEW API: https://api.weathernext-uae.ncm.ae (backend)
```

---

## 📊 **Feature Availability by URL**

| Feature | Old URL | Local Dev | New v3 Frontend | New v3 Backend |
|---------|---------|-----------|-----------------|----------------|
| 15-day Forecast | ❌ (5-day) | ✅ (360h) | ✅ (360h) | ✅ (360h) |
| Confidence Viz | ❌ | ✅ | ✅ | ✅ |
| Gemini 3.1 Pro | ❌ | ✅ | ✅ | ✅ |
| 64-Member Ensemble | ❌ (deterministic) | ✅ | ✅ | ✅ |
| UAE Alert Scan | ❌ (global) | ✅ | ✅ | ✅ |
| Architecture Docs | ❌ | ✅ | ✅ | ✅ |
| Earthquake Click | ❌ (broken) | ✅ | ✅ | ✅ |
| Docker v3 Caching | ❌ | ✅ | ✅ | ✅ |

---

## 🔧 **Configuration Files**

### **.env.urls** (URL Configuration)
```
OLD_FRONTEND_URL=https://your-old-domain.com
NEXT_PUBLIC_FRONTEND_URL=https://weathernext-dashboard-v3.run.app
NEXT_PUBLIC_API_BASE_URL=https://api.weathernext-uae.ncm.ae
NEXT_PUBLIC_LOCAL_FRONTEND=http://localhost:3000
NEXT_PUBLIC_LOCAL_API=http://localhost:3000/api
```

### **.env.local** (Local Development)
```
NEXT_PUBLIC_APP_NAME=WeatherNext Dashboard v3
NEXT_PUBLIC_MAPBOX_TOKEN=your_token
GOOGLE_APPLICATION_CREDENTIALS=path_to_creds.json
```

---

## 🚀 **Deployment Commands**

### **Build v3 Docker Image**
```bash
docker build \
  --build-arg NEXT_PUBLIC_MAPBOX_TOKEN="$MAPBOX_TOKEN" \
  --build-arg BUILD_VERSION="v3.0.0" \
  --build-arg BUILD_DATE="$(date -u +'%Y-%m-%dT%H:%M:%SZ')" \
  --build-arg GIT_COMMIT="$(git rev-parse HEAD)" \
  -t us-central1-docker.pkg.dev/ctoteam/weathernext/dashboard:v3 \
  .
```

### **Push to Artifact Registry**
```bash
docker push us-central1-docker.pkg.dev/ctoteam/weathernext/dashboard:v3
```

### **Deploy Frontend v3 to Cloud Run**
```bash
gcloud run deploy weathernext-dashboard-v3 \
  --image us-central1-docker.pkg.dev/ctoteam/weathernext/dashboard:v3 \
  --region us-central1 \
  --platform managed \
  --port 8080 \
  --memory 2Gi \
  --cpu 2 \
  --min-instances 1 \
  --max-instances 10 \
  --allow-unauthenticated \
  --set-env-vars \
    NCM_REGION=UAE,\
    FORECAST_DAYS=15,\
    ENSEMBLE_MEMBERS=64,\
    ENABLE_PROBABILISTIC_ALERTS=true
```

### **Deploy Backend API v3 (Separate Service)**
```bash
gcloud run deploy weathernext-api-v3 \
  --image us-central1-docker.pkg.dev/ctoteam/weathernext/api:v3 \
  --region us-central1 \
  --set-env-vars BIGQUERY_PROJECT_ID=ctoteam
```

### **Configure DNS (Example)**
```
old-domain.com                  → Points to old CloudRun (untouched)
weathernext-dashboard-v3.run.app → Points to new CloudRun v3
api.weathernext-uae.ncm.ae      → Points to new Backend API v3
```

---

## 📋 **Testing Checklist**

### **Local Testing (Before Deployment)**

Before deploying to production, verify locally:

- [ ] **15-Day Forecast**
  - [ ] ForecastDays15 component loads
  - [ ] All 15 days visible (not hidden after day 5)
  - [ ] Confidence colors: GREEN → ORANGE → YELLOW → BLUE
  - [ ] Temperature ranges displayed
  - [ ] Confidence badges correct

- [ ] **Confidence Visualization**
  - [ ] Days 1-3: HIGH (GREEN)
  - [ ] Days 4-5: MODERATE (ORANGE)
  - [ ] Days 6-10: LOW-MODERATE (YELLOW)
  - [ ] Days 11-15: LOW (BLUE)

- [ ] **Gemini 3.1 Pro Chat**
  - [ ] Chat window opens
  - [ ] Responses include ensemble breakdown
  - [ ] P10/P50/P90 values shown
  - [ ] Member consensus ("X of 64") used
  - [ ] Probabilistic language (not "will rain")

- [ ] **UAE Alert Scan**
  - [ ] 🇦🇪 emoji shows
  - [ ] Scans all 7 emirates
  - [ ] Hazard counts displayed
  - [ ] Expandable list of emirates

- [ ] **APIs Returning Data**
  - [ ] /api/forecast returns 360 hours
  - [ ] /api/alerts includes member counts
  - [ ] /api/ensemble returns 64 members
  - [ ] /api/chat streams Gemini responses

- [ ] **Earthquake Click Fix**
  - [ ] Click earthquake marker → navigates to location
  - [ ] Sidebar opens with forecast

---

## 🎯 **Summary**

| URL | Status | Use Case |
|-----|--------|----------|
| **Old URL** | ✅ UNCHANGED | Legacy users (no changes) |
| **Local** | ✅ RUNNING | Feature testing (NOW) |
| **New Frontend** | 🔄 READY | Production v3 (post-test) |
| **New Backend** | 🔄 READY | Production API v3 (post-test) |

---

## 📞 **Next Steps**

1. ✅ **Test locally** (http://localhost:3000)
   - Verify all features from checklist
   - Test APIs with curl
   - Confirm Gemini responses

2. 🔨 **Build v3 Docker image**
   - `npm run build`
   - `docker build -t ... :v3`
   - Push to registry

3. 🚀 **Deploy to Cloud Run**
   - Frontend: weathernext-dashboard-v3
   - Backend: weathernext-api-v3
   - URLs: https://weathernext-dashboard-v3.run.app

4. 🌐 **Keep old URL alive**
   - No changes to existing deployment
   - Users can keep using old URL

5. 📢 **Announce new URLs**
   - New users → new v3 URL
   - Old users → old URL (still works)

---

**Ready to test locally! Access: http://localhost:3000** 🎯

# 🚀 Quick Start — Local Testing

## ✅ Server Status
```
✓ Next.js Dev Server is RUNNING on http://localhost:3000
✓ All APIs available at http://localhost:3000/api/*
✓ Ready for feature testing
```

## 🎯 Access the Dashboard

### **Local URL**
```
http://localhost:3000
```

### **From Another Machine**
```
http://10.100.15.44:3000
```

---

## 🧪 Quick Test Features

### 1️⃣ **15-Day Forecast** (Main Feature)
- Load dashboard
- Should default to **Dubai (25.2°N, 55.27°E)**
- Check sidebar → "Forecast" tab
- Look for **ForecastDays15 grid** showing:
  - 15 day cards (Day 1, Day 2, ... Day 15)
  - Color-coded confidence (GREEN → BLUE)
  - Temperature ranges
  - Confidence badges

### 2️⃣ **Confidence Visualization**
- Days 1-3: **GREEN badges** (✓ HIGH)
- Days 4-5: **ORANGE badges** (~ MODERATE)
- Days 6-10: **YELLOW badges** (⚠ MODERATE)
- Days 11-15: **BLUE badges** (~ TREND)
- **All days** should be visible, not hidden

### 3️⃣ **UAE Alert Scan**
- Top-left corner: **🇦🇪 UAE Alert Scan** button
- Click it → scans all 7 emirates
- Shows hazard counts (DANGER, WARNING, CLEAR)
- Click expand → list of emirates

### 4️⃣ **Gemini AI Chat**
- Bottom right: **💬 Talk to Weather AI** button
- Click → chat window opens
- Try questions:
  - "What's the dust storm risk?"
  - "Heat stress forecast for next 72h?"
  - "Cyclone threat?"
- Response should include:
  - Ensemble breakdown (X of 64 members)
  - P10, P50, P90 values
  - Confidence levels

### 5️⃣ **Architecture Docs**
- Select any emirate
- Sidebar tabs: Forecast | Ensemble | Alerts | Cyclones | **⚙️ Architecture**
- Click Architecture tab
- Should show system overview, 64-member ensemble, data pipeline

### 6️⃣ **Earthquake Click**
- Open Flat Map view
- Look for triangle markers (if any earthquakes visible)
- Click on earthquake → should navigate to location + show forecast

---

## 📊 API Testing

Test APIs directly via curl:

### **Forecast (15-day)**
```bash
curl "http://localhost:3000/api/forecast?lat=25.2&lon=55.27&initDate=2026-04-15&maxHours=360"
```
Check response includes: `forecastConfig`, `confidenceLevel`, 15 days of data

### **Alerts (15-day, UAE hazards)**
```bash
curl "http://localhost:3000/api/alerts?lat=25.2&lon=55.27&initDate=2026-04-15&maxHours=360"
```
Check response includes: member counts (X of 64), probabilities, UAE hazard types

### **Ensemble (64 members, 15-day)**
```bash
curl "http://localhost:3000/api/ensemble?lat=25.2&lon=55.27&initDate=2026-04-15&maxHours=360"
```
Check response includes: all 64 ensemble members, timeseries data

### **Chat (Gemini 3.1 Pro)**
```bash
curl -X POST "http://localhost:3000/api/chat" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "What is the heat stress risk for Dubai?",
    "weatherContext": {}
  }'
```
Check response is streaming text with ensemble breakdown

---

## 🔍 Verification Checklist

### UI Components Present
- [ ] **ForecastDays15** grid shows 15 days
- [ ] **Confidence colors** GREEN → ORANGE → YELLOW → BLUE
- [ ] **UAE Alert Scan** shows 🇦🇪 emoji
- [ ] **Architecture tab** has content
- [ ] **Earthquake markers** are clickable

### Data & APIs Working
- [ ] Forecast API returns 360 hours of data
- [ ] Alerts API includes UAE hazard thresholds
- [ ] Ensemble API returns 64 members
- [ ] Chat API streams Gemini responses

### Features Enabled
- [ ] 15-day forecasting (not just 5-day)
- [ ] All confidence levels visible (not hidden for days 11-15)
- [ ] Gemini 3.1 Pro with full prompts
- [ ] Dubai defaults to 25.2°N, 55.27°E
- [ ] All 7 emirates in alert scan

---

## 🚨 Troubleshooting

### Server won't start?
```bash
# Kill any existing process
kill $(cat /tmp/nextjs.pid) 2>/dev/null

# Start fresh
npm run dev
```

### Port 3000 in use?
```bash
# Find process using port 3000
lsof -i :3000

# Kill it
kill -9 <PID>
```

### API returning 500 errors?
```bash
# Check server logs
tail -f /tmp/nextjs.log

# Ensure BigQuery credentials set
echo $GOOGLE_APPLICATION_CREDENTIALS
```

### Missing MAPBOX_TOKEN?
```bash
# Set in .env.local
echo "NEXT_PUBLIC_MAPBOX_TOKEN=your_token_here" >> .env.local

# Restart server
npm run dev
```

---

## 📱 Test All Screen Sizes

1. **Desktop**: Full features visible
2. **Tablet**: Sidebar responsive
3. **Mobile**: 15-day grid stacks vertically

---

## ✨ Ready to Test!

**Dashboard is live at: http://localhost:3000**

Check all features from the checklist above and report any issues.

Once verified ✅ on local:
1. Build Docker v3 image
2. Push to Artifact Registry
3. Deploy to Cloud Run (new URLs)
4. Keep old URL alive

---

## 🆘 Need Help?

Check logs:
```bash
tail -50 /tmp/nextjs.log
```

Check running processes:
```bash
ps aux | grep "next dev"
```

Check port status:
```bash
netstat -tuln | grep 3000
```

---

**Happy Testing!** 🎯

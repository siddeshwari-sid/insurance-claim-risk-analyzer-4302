# Insurance Fraud Signal Detection & Investigator Dashboard

## 📌 Overview
This project is designed to detect potential insurance fraud using a rule-based scoring system and provide an investigator-friendly dashboard.

It helps insurance companies identify high-risk claims early and prioritize investigation efficiently.

---

## 🚨 Problem Statement
Insurance fraud causes huge financial losses every year.  
Fraud signals are often hidden in large datasets and detected too late.

Challenges:
- No proper fraud prioritization
- Manual investigation takes time
- High-risk claims are missed

---

## 💡 Solution
This system:
- Uploads claim data (CSV)
- Applies fraud detection rules
- Generates a risk score (0–100)
- Highlights high-risk claims
- Provides investigator dashboard

---

## ⚙️ Features
- 📊 Dashboard with claim summary
- 📂 CSV upload with validation
- 🧠 Fraud detection engine (5 rules)
- 🚨 Risk scoring (Low / Medium / High)
- 👨‍💼 Investigator queue
- 📄 Claim detail view
- ✅ Outcome tracking

---

## 🧠 Fraud Detection Rules
- Duplicate address (+20)
- High claim velocity (+25)
- High claim amount (+20)
- Repeated third party (+20)
- Early claim after policy start (+15)

---

## 🛠️ Tech Stack
- Frontend: React JS
- Styling: Tailwind CSS
- Backend: Express.js
- Platform: KAVIA.AI
- Version Control: GitHub

---

cd fraud_detection_frontend
npm install
npm start

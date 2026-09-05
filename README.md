# SahakarConnect - Cooperative Gig Services Platform

**Smart India Hackathon 2026 (Problem Statement 26089)**  
**Sponsored by:** Ministry of Cooperation, Government of India  
**Theme:** Smart Automation / Worker Cooperatives & Community Services

---

## 🚀 Quick Start Guide (Run Locally)

### Option 1: Standalone Local Execution (Fastest for Demo)

#### 1. Backend Setup & Database Seeding
```bash
cd backend
npm install
npx prisma db push
npx ts-node prisma/seed.ts
npm run dev
```
*Backend API server runs at `http://localhost:5000` (Socket.io enabled).*

#### 2. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
*Frontend web application runs at `http://localhost:3000`.*

---

### Option 2: Docker Compose Execution

```bash
docker-compose up --build
```
*Spins up PostgreSQL, Backend Express microservice, and Frontend Nginx web server.*

---

## 🔑 Seeded Demo Login Credentials (OTP for dev mode: `123456`)

| Role | Name / Description | Phone Number | Dev OTP | Quick Login Shortcut |
|---|---|---|---|---|
| **Government Admin** | Ministry Official (Platform Oversight) | `9999999999` | `123456` | One-click button in login modal |
| **Cooperative Admin** | Rajesh Sharma (NCR Coop Chair) | `9810011111` | `123456` | One-click button in login modal |
| **Worker Member** | Amit Kumar (Plumber, NCR Coop) | `9711000001` | `123456` | One-click button in login modal |
| **Customer** | Priya Sharma (Books Services) | `9900112233` | `123456` | One-click button in login modal |

---

## 💡 Core Features Implemented

1. **Phone + Mock OTP Auth**: JWT-based session management with role authorization (`CUSTOMER`, `WORKER`, `COOP_ADMIN`, `GOV_ADMIN`).
2. **Transparent 80/15/5 Payout Logic**: Real-time automatic split: 80% to Worker, 15% to Cooperative Fund, 5% to Platform.
3. **Democratic Governance (1-Member-1-Vote)**: Workers cast votes on cooperative proposals (rate adjustments, welfare fund spending).
4. **AI Smart Match Scoring**: Ranks workers based on weighted proximity, rating, availability, and skill match with transparent tooltips.
5. **Real-time Status Tracking**: WebSockets (Socket.io) updates customer and worker UI live during booking state changes.
6. **Multilingual Support**: Instant toggle between English and Hindi using `i18next`.
7. **Ministry & Platform Analytics**: Recharts visualizations for total GMV, payouts distributed, coop funds accumulated, and category demand.

---

## 📁 Repository Structure

```
sih/
├── ARCHITECTURE.md
├── README.md
├── docker-compose.yml
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma
│   │   └── seed.ts
│   ├── src/
│   │   ├── routes/
│   │   ├── services/
│   │   ├── socket.ts
│   │   └── index.ts
│   ├── Dockerfile
│   └── package.json
└── frontend/
    ├── src/
    │   ├── components/
    │   ├── context/
    │   ├── i18n/
    │   ├── App.tsx
    │   └── main.tsx
    ├── Dockerfile
    └── package.json
```

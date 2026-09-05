# SahakarConnect - Technical Architecture & Solution Blueprint

**Problem Statement 26089 (Smart India Hackathon 2026, Ministry of Cooperation)**  
*Title:* Cooperative Gig Services Platform for Household & Community Services

---

## Executive Summary & Core Pitch

Commercial gig aggregators (such as Urban Company or Uber) extract **20% to 30% commission** from every transaction, offering gig workers zero equity, zero decision-making power, and zero health/welfare protection. 

**SahakarConnect** fundamentally restructures the gig economy around **Worker Cooperatives**. The platform enforces an automatic, immutable fee distribution:

```
Total Service Booking Fee
├── 80% Direct Worker Share (Paid straight to worker account)
├── 15% Cooperative Welfare Fund (Health insurance, emergency grants & training)
└── 5% Platform Technology Fee (Open-technology maintenance & hosting)
```

---

## 1. System Architecture

```
                  ┌───────────────────────────────────────────┐
                  │          React + Vite + Tailwind          │
                  │    i18n (EN/HI) • Recharts • Socket.io    │
                  └─────────────────────┬─────────────────────┘
                                        │ REST API & WebSockets
                                        ▼
                  ┌───────────────────────────────────────────┐
                  │         Node.js + Express + TS            │
                  │      Auth • Payouts • AI Matching         │
                  └──────────────┬──────────────┬─────────────┘
                                 │              │
                    Prisma ORM   │              │ Socket.io
                                 ▼              ▼
                    ┌──────────────────┐  ┌──────────────────┐
                    │ SQLite / Postgres│  │ Client WebSockets│
                    └──────────────────┘  └──────────────────┘
```

---

## 2. Key Differentiators & Technical Logic

### A. 80/15/5 Automated Payout Engine (`payoutService.ts`)
Upon booking status transitioning to `COMPLETED`, a database transaction automatically calculates:
$$\text{Worker Share} = \text{Amount} \times 0.80$$
$$\text{Cooperative Share} = \text{Amount} \times 0.15$$
$$\text{Platform Fee} = \text{Amount} \times 0.05$$

A payout ledger record is created, and the cooperative's `fund_balance` is atomically incremented by the 15% share.

### B. Democratic 1-Member-1-Vote Governance (`governanceRoutes.ts`)
Worker members of a cooperative vote democratically on critical decisions (such as rate updates or new member admissions).
- **Rule Enforcement:** Enforced by unique composite database constraint `@@unique([proposal_id, worker_id])`.
- **Transparency:** Results are calculated live and visualized as percentage distribution bar charts.

### C. Transparent AI Smart Matching Formula (`matchingService.ts`)
Customer searches rank available cooperative workers using a transparent weighted scoring algorithm:

$$\text{Match Score} = (0.4 \times \text{Proximity}) + (0.3 \times \text{Rating}) + (0.2 \times \text{Availability}) + (0.1 \times \text{Skill Match})$$

- **Proximity Score:** Inverse Haversine distance: $\frac{1}{1 + \text{distance}/10}$
- **Rating Score:** $\frac{\text{Rating Avg}}{5.0}$
- **Availability:** $1.0$ if online, $0.0$ if offline
- **Skill Match:** $1.0$ for exact match, $0.8$ for partial keyword match

---

## 3. Database Schema Entity Relationship

- **User**: Base authentication profile (`CUSTOMER`, `WORKER`, `COOP_ADMIN`, `GOV_ADMIN`).
- **Cooperative**: Regional registered cooperative entity with `fund_balance` and `status`.
- **Worker**: Linked to User & Cooperative, tracking rating, location, and availability.
- **ServiceCategory**: Base pricing catalog for services.
- **Booking**: Core transaction tracking lifecycle state (`REQUESTED` -> `ACCEPTED` -> `IN_PROGRESS` -> `COMPLETED`).
- **Payout**: Financial split record linked 1-to-1 with completed Booking.
- **Proposal & Vote**: Democratic governance polling tables.

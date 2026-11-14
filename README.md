# ⚡ KataLyst

### Empowering Workers. Connecting Communities. Building Cooperatives.

A cooperative-first gig services platform designed to create a fairer, more transparent gig economy by connecting customers with skilled workers while promoting democratic governance and equitable earnings.

<p align="center">
  <strong>FAIR WORK • TRANSPARENT EARNINGS • COLLECTIVE GROWTH</strong>
</p>

---

## 🌍 What is KataLyst?

Traditional gig platforms often leave workers with limited control over their earnings, working conditions, and decision-making.

**KataLyst takes a different approach.**

It introduces a cooperative-driven ecosystem where workers aren't just service providers — they're part of a community.

The platform connects customers with skilled workers while enabling:

- Fair and transparent earnings distribution.
- Intelligent worker discovery and matching.
- Cooperative welfare fund management.
- Democratic decision-making through voting.
- Real-time communication and service tracking.

### 👤 Four Perspectives. One Ecosystem.

| Role | What they can do |
|---|---|
| 🛒 Customer | Discover services, raise requests and track bookings. |
| 👷 Worker | Receive job requests, manage availability and participate in cooperatives. |
| 🏢 Cooperative Admin | Manage cooperative operations, members and proposals. |
| 🏛️ Government Admin | Monitor platform activity and administrative operations. |

---

## ✨ Core Features

### 🔍 Intelligent Worker Matching

Finding the right worker shouldn't be random.

KataLyst uses a weighted scoring algorithm to rank workers based on:

| Parameter | Weight |
|---|---:|
| 📍 Geographical Proximity | 35% |
| ⭐ Customer Rating | 25% |
| 🛡️ Reliability | 15% |
| 🟢 Availability | 15% |
| 🧰 Skill Matching | 10% |

The system uses the Haversine formula to calculate geographical distance and generates a matching score with a breakdown of individual factors.

### 💰 The 80 / 15 / 5 Model

A transparent revenue distribution mechanism designed around worker welfare.

```text
             BOOKING COMPLETED
                    |
              TOTAL AMOUNT
                    |
          +---------+---------+
          |         |         |
          v         v         v

        80%       15%        5%
       WORKER   COOPERATIVE  PLATFORM
                  FUND       FEE
          |         |         |
          v         v         v
       Earnings  Welfare   Maintenance
                  Fund
```

| Allocation | Percentage |
|---|---:|
| Worker Earnings | 80% |
| Cooperative Welfare Fund | 15% |
| Platform Maintenance | 5% |

The backend calculates these shares, records the payout and updates the cooperative fund balance through database transactions.

*Note: The current implementation records payout allocations; it does not execute actual bank or UPI transfers.*

### 🗳️ Democratic Governance

Workers deserve a voice in the decisions that affect them.

KataLyst introduces cooperative governance through:

- Proposal creation by cooperative administrators.
- Worker participation in voting.
- One vote per worker per proposal.
- Database-level protection against duplicate votes.
- Transparent proposal records.

### ⚡ Real-Time Communication

Powered by Socket.io.

- New service request notifications.
- Worker acceptance updates.
- Booking status updates.
- Real-time application events.

### 🌐 Multilingual Experience

- English and Hindi support.
- Language management using i18next.
- Persistent language preferences.

### 📊 Administrative Insights

Role-specific dashboards provide access to platform and cooperative information, including booking activity, workers, funds and administrative analytics.

---

# 🏛️ System Architecture

KataLyst follows a modular client-server architecture.

The frontend handles user interactions and role-specific dashboards, while the backend manages authentication, business logic, real-time events and database operations.

## High-Level Architecture

```text
                    ┌──────────────────────────────┐
                    │          USERS               │
                    └──────────────┬───────────────┘
                                   │
              ┌────────────────────┼────────────────────┐
              │                    │                    │
              ▼                    ▼                    ▼
       ┌────────────┐      ┌────────────┐      ┌────────────┐
       │  CUSTOMER  │      │   WORKER   │      │    ADMIN   │
       │  PORTAL    │      │   PORTAL   │      │  PORTALS   │
       └──────┬─────┘      └──────┬─────┘      └──────┬─────┘
              │                   │                   │
              └───────────────────┼───────────────────┘
                                  │
                                  ▼
                 ┌────────────────────────────┐
                 │       FRONTEND             │
                 │                            │
                 │     React + TypeScript     │
                 │                            │
                 │  • React Router            │
                 │  • Authentication Context  │
                 │  • Zustand                  │
                 │  • TanStack Query           │
                 │  • Socket.io Client         │
                 └──────────────┬─────────────┘
                                │
                       REST API / WebSocket
                                │
                                ▼
                 ┌────────────────────────────┐
                 │        BACKEND             │
                 │                            │
                 │     Node.js + Express      │
                 │                            │
                 │  • Authentication          │
                 │  • Authorization           │
                 │  • API Routes              │
                 │  • Socket.io Server        │
                 └──────────────┬─────────────┘
                                │
                                ▼
                 ┌────────────────────────────┐
                 │     BUSINESS LOGIC         │
                 │                            │
                 │  ┌──────────────────────┐  │
                 │  │ Worker Matching      │  │
                 │  ├──────────────────────┤  │
                 │  │ Payout Processing    │  │
                 │  ├──────────────────────┤  │
                 │  │ Request Management   │  │
                 │  ├──────────────────────┤  │
                 │  │ Cooperative Governance│ │
                 │  └──────────────────────┘  │
                 └──────────────┬─────────────┘
                                │
                                ▼
                 ┌────────────────────────────┐
                 │       DATA ACCESS          │
                 │                            │
                 │         Prisma ORM         │
                 └──────────────┬─────────────┘
                                │
                                ▼
                 ┌────────────────────────────┐
                 │        DATABASE           │
                 │                            │
                 │           SQLite           │
                 └────────────────────────────┘
```

## 🔄 How the Platform Works

### 1. Service Request Lifecycle

```text
       CUSTOMER
           |
           v
   Create Service Request
           |
           v
    Backend Validation
           |
           v
   Request Available to Workers
           |
           v
   Workers Accept / Decline
           |
           v
    Customer Selects Worker
           |
           v
      Booking Confirmed
           |
           v
       Work Started
           |
           v
     Work Completed
           |
           v
      Payout Processing
           |
           v
      Booking Finished
```

### 2. Worker Matching Pipeline

```text
       CUSTOMER REQUEST
              |
              v
      Retrieve Workers
              |
              v
      Calculate Distance
              |
              v
       Evaluate Rating
              |
              v
      Evaluate Reliability
              |
              v
      Check Availability
              |
              v
       Match Worker Skills
              |
              v
       Calculate Weighted
          Match Score
              |
              v
       Rank Matching Workers
```

**Matching Formula**

```text
Match Score =

    0.35 × Proximity Score
  + 0.25 × Rating Score
  + 0.15 × Reliability Score
  + 0.15 × Availability Score
  + 0.10 × Skill Match Score
```

### 3. Payout Processing Pipeline

```text
       COMPLETED BOOKING
               |
               v
       Calculate Total Amount
               |
               v
       Calculate Revenue Shares
               |
        ┌──────┼──────┐
        |      |      |
        v      v      v
       80%    15%     5%
        |      |      |
        v      v      v
      Worker  Welfare Platform
      Share   Fund   Fee
        |      |
        └──┬───┘
           |
           v
    Database Transaction
           |
           v
     Payout Record Created
           |
           v
    Cooperative Fund Updated
```

### 4. Cooperative Voting Pipeline

```text
     ADMIN CREATES PROPOSAL
               |
               v
       PROPOSAL PUBLISHED
               |
               v
        WORKER CASTS VOTE
               |
               v
        CHECK EXISTING VOTE
               |
          ┌────┴────┐
          |         |
          v         v
       NEW VOTE   DUPLICATE
          |         |
          v         v
        SAVE      REJECT
          |
          v
    UPDATE PROPOSAL RESULTS
```

---

# 🗄️ Database Design

KataLyst uses Prisma ORM with a relational SQLite database.

### Core Models

| Model | Responsibility |
|---|---|
| User | User profiles and roles |
| Worker | Worker skills, availability, ratings and reliability |
| Cooperative | Cooperative information and fund balance |
| ServiceCategory | Available service categories |
| ServiceRequest | Customer service requests |
| RequestAcceptance | Worker responses to requests |
| Booking | Confirmed service bookings |
| Payout | Revenue allocation records |
| Rating | Customer feedback |
| Proposal | Cooperative proposals |
| Vote | Worker voting records |

### Entity Relationships

```text
                     USER
                      |
          ┌───────────┼───────────┐
          |           |           |
          v           v           v
        WORKER    CUSTOMER    COOPERATIVE
          |           |           |
          |           |           |
          v           v           v
       BOOKING   SERVICE REQUEST  PROPOSAL
          |           |           |
          v           v           v
        PAYOUT    ACCEPTANCE      VOTE
          |
          v
       COOPERATIVE
       FUND BALANCE

       BOOKING
          |
          └──────────────> RATING
```

For the complete database schema, refer to:

`backend/prisma/schema.prisma`

---

# 🛠️ Technology Stack

### Frontend

| Technology | Usage |
|---|---|
| React 18 | UI development |
| TypeScript | Type safety |
| Vite | Build tool |
| Tailwind CSS | Styling |
| React Router | Routing |
| Zustand | State management |
| TanStack Query | Server-state management |
| Socket.io Client | Real-time communication |
| i18next | Internationalization |
| Recharts | Data visualization |
| Lucide React | Icons |

### Backend

| Technology | Usage |
|---|---|
| Node.js | Runtime |
| Express.js | Backend framework |
| TypeScript | Type safety |
| Prisma ORM | Database access |
| SQLite | Database |
| JWT | Authentication |
| Socket.io | Real-time communication |

### Development Tools

- Git and GitHub
- Docker
- Docker Compose
- Nginx
- npm

---

# 📁 Project Structure

```text
KataLyst/
│
├── backend/
│   │
│   ├── prisma/
│   │   ├── schema.prisma
│   │   └── seed.ts
│   │
│   ├── src/
│   │   ├── middleware/
│   │   │   └── auth.ts
│   │   │
│   │   ├── routes/
│   │   │   ├── authRoutes.ts
│   │   │   ├── bookingRoutes.ts
│   │   │   ├── categoryRoutes.ts
│   │   │   ├── workerRoutes.ts
│   │   │   ├── requestRoutes.ts
│   │   │   ├── cooperativeRoutes.ts
│   │   │   ├── governanceRoutes.ts
│   │   │   └── adminRoutes.ts
│   │   │
│   │   ├── services/
│   │   │   ├── matchingService.ts
│   │   │   └── payoutService.ts
│   │   │
│   │   ├── socket.ts
│   │   └── index.ts
│   │
│   ├── package.json
│   └── Dockerfile
│
├── frontend/
│   │
│   ├── src/
│   │   ├── components/
│   │   ├── context/
│   │   ├── i18n/
│   │   ├── lib/
│   │   ├── App.tsx
│   │   └── main.tsx
│   │
│   ├── package.json
│   ├── vite.config.ts
│   └── Dockerfile
│
├── docker-compose.yml
├── ARCHITECTURE.md
└── README.md
```

---

# 🚀 Getting Started

Follow these instructions to run KataLyst locally.

### Prerequisites

Make sure you have installed:

- Node.js 20 or later
- npm
- Git

### 1. Clone the Repository

```bash
git clone https://github.com/ManishDalal329/KataLyst.git

cd KataLyst
```

### 2. Backend Setup

```bash
cd backend

npm install
```

Create a `.env` file inside the `backend` directory:

```env
PORT=5000
DATABASE_URL="file:./dev.db"
JWT_SECRET="your_secure_secret"
```

Generate the Prisma client:

```bash
npm run prisma:generate
```

Synchronize the database:

```bash
npm run prisma:db:push
```

Seed the database:

```bash
npm run prisma:seed
```

Start the backend:

```bash
npm run dev
```

Backend runs at:

`http://localhost:5000`

Health check:

`http://localhost:5000/health`

### 3. Frontend Setup

Open another terminal:

```bash
cd frontend

npm install

npm run dev
```

Frontend runs at:

`http://localhost:3000`

The Vite development server proxies API and Socket.io requests to the backend at port 5000.

---

# 🔐 Security Considerations

- JWT authentication for protected API routes.
- Role-based authorization.
- Database-level unique constraints for voting and request acceptance.
- Prisma transactions for payout processing.
- Environment variables for sensitive configuration.
- Development OTP authentication must be replaced before production deployment.
- Production deployments should configure restricted CORS origins and secure secrets.

---

# 🤝 Contributing

Contributions, bug reports, feature requests and suggestions are welcome!

### Contribution Workflow

**1. Fork the repository.**

**2. Clone your fork.**

```bash
git clone https://github.com/YOUR_USERNAME/KataLyst.git

cd KataLyst
```

**3. Create a feature branch.**

```bash
git checkout -b feature/your-feature-name
```

**4. Make your changes and test them.**

**5. Commit your changes.**

```bash
git add .

git commit -m "feat: describe your changes"
```

**6. Push your branch.**

```bash
git push origin feature/your-feature-name
```

**7. Open a Pull Request.**

Please provide a clear description of your changes and keep contributions focused.

---

# 🔮 Future Roadmap

Some potential improvements for the platform:

- [ ] Production-grade OTP authentication.
- [ ] Actual UPI and banking payout integration.
- [ ] PostgreSQL production database configuration.
- [ ] Advanced geospatial worker discovery.
- [ ] Worker KYC and verification workflows.
- [ ] Comprehensive unit and integration tests.
- [ ] GitHub Actions CI/CD pipeline.
- [ ] Production monitoring and analytics.
- [ ] Enhanced cooperative management tools.

---

# 📄 License

See the repository's `LICENSE` file for licensing terms.

---

<p align="center">

### ⚡ KataLyst

**Building a fairer gig economy, one cooperative at a time.**

*Empowering Workers • Enabling Communities • Creating Opportunities*

</p>

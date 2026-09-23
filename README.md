# Campus Skill Exchange

A peer-to-peer campus skill-sharing and mentorship web application designed for university students to exchange technical and creative skills, book 1-on-1 mentorship sessions, track credit balances, and collaborate seamlessly.

---

## 🚀 Features

- **Dynamic Dashboard**: Overview of wallet balance, upcoming sessions, quick statistics, and recent activity.
- **Explore Skills & Mentors**: Real-time name prefix search, skill category tabs (React, Python, UI/UX, DSA, etc.), department filters (CSE, ECE, EEE, IT, MECH), rating filters, and sorting.
- **Mentor Profiles & Availability**: Detailed mentor profiles with teaching specialties, ratings, reviews, and interactive day-by-day availability slots.
- **Session Booking & Requests**: Direct session scheduling with automatic calendar conflict validation and credit reservations.
- **Rescheduling Workflow**: Two-way reschedule proposals with counterparty accept/reject controls and mentor availability bypass.
- **Learner Waiting Room & Mentor Control**: Distinct role-based pre-session lobby with real-time status indicators and media test controls.
- **Review & Feedback System**: Post-session rating and review submission with automated mentor reputation calculations.
- **Credit Wallet**: Skill credits exchange system (+10 credits to mentor, -5 credits from learner upon session completion).

---

## 🛠️ Technology Stack

- **Frontend Framework**: React 19 + TypeScript
- **Build Tool / Bundler**: Vite
- **Styling**: Tailwind CSS 4 + Lucide React Icons + Framer Motion
- **Routing**: React Router v7
- **Deployment Platform**: AWS EC2 (Ubuntu Linux) + Nginx Web Server

---

## 💻 Local Development Setup

### Prerequisites
- Node.js (v18 or higher)
- npm (v9 or higher)
- Git

### Installation & Run Steps

1. **Clone the repository**:
   ```bash
   git clone https://github.com/<your-username>/campus-skill-exchange.git
   cd campus-skill-exchange
   ```

2. **Navigate to the frontend directory**:
   ```bash
   cd frontend
   ```

3. **Install dependencies**:
   ```bash
   npm install
   ```

4. **Start the development server**:
   ```bash
   npm run dev
   ```
   Open your browser and navigate to `http://localhost:5173`.

5. **Build for production**:
   ```bash
   npm run build
   ```

---

## ☁️ Deployment on AWS EC2

1. **Launch an AWS EC2 Instance** (Ubuntu 24.04 LTS, `t2.micro`).
2. **Configure Security Group**:
   - Inbound Rule: HTTP (Port `80`), SSH (Port `22`).
3. **Connect via SSH**:
   ```bash
   ssh -i "your-key.pem" ubuntu@<EC2-PUBLIC-IP>
   ```
4. **Install Node.js & Nginx**:
   ```bash
   sudo apt update && sudo apt upgrade -y
   curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
   sudo apt install -y nodejs nginx git
   ```
5. **Clone & Build**:
   ```bash
   git clone https://github.com/<your-username>/campus-skill-exchange.git
   cd campus-skill-exchange/frontend
   npm install
   npm run build
   ```
6. **Serve via Nginx**:
   ```bash
   sudo cp -r dist/* /var/www/html/
   sudo systemctl restart nginx
   ```
7. **Access Remotely**:
   Open `http://<EC2-PUBLIC-IP>` in any browser.

---

## ?? Sprint 08: Continuous Integration with Jenkins

This project is integrated with an automated Continuous Integration (CI) pipeline powered by **Jenkins LTS** and **Docker**:

- **Automated Source Retrieval**: Clones and verifies commits from GitHub (https://github.com/KLP13/skill-exchange-platform.git).
- **Automated Build & Transpilation**: Installs npm dependencies and compiles TypeScript (
pm run build).
- **Static Code Analysis & Quality Gate**: Enforces type-safety and static lint checks (
pm run typecheck).
- **Container Artifact Packaging**: Builds versioned Docker container images (skillswap-backend:build- and skillswap-frontend:build-).
- **Agile CI Feedback Loop**: Provides immediate build status reporting (SUCCESS / FAILURE) to developers.

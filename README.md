# Skillmate - Peer-to-Peer Skill Exchange Platform

Skillmate is a credit-based marketplace web application designed for students to exchange skills. One hour of teaching earns you one credit, which you can spend to learn a skill from another student. No money is exchanged, making learning accessible and collaborative.

## Tech Stack
- **Frontend:** React, Vite, Vanilla CSS
- **Backend:** Node.js, Express.js, JWT Authentication
- **Database:** MySQL

---

## API Endpoints Reference

### Authentication
- `POST /api/auth/signup` - Register a new account locally (earns 5 starting credits).
- `POST /api/auth/signin` - Log in with local email/password credentials.
- `POST /api/auth/google` - Exchange Google Identity credentials and authenticate user session.
- `GET /api/auth/me` - Retrieve current active session details (JWT protected).

### User Management & Profiles
- `GET /api/users/:id` - Fetch user bio, location, college department, skills list, and availability times.
- `PUT /api/users/:id` - Update user bio, location, and educational metadata.
- `PUT /api/users/:id/skills` - Update shared and wanted skills registry.
- `PUT /api/users/:id/availability` - Sync weekly calendar availability slots.

---

## Database Setup
1. Create a MySQL database using the schema:
   ```bash
   mysql -u root -p < server/schema.sql
   ```
2. Set up environment configurations inside `server/.env` and `.env` in the root.

---

## Team Collaborators
- **KLP13** (kakarlaprasad2004@gmail.com) - Project lead & core design
- **Chidvilas Reddy** (chidvisirigireddy@gmail.com) - Features showcase
- **Gnanith-Pathi** (gnanith050406@gmail.com) - Authentication controller
- **lokesh123107** (chithirala.lokesh2023@vitstudent.ac.in) - Database & Backend APIs

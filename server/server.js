const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Initialize MySQL pool
let pool;
try {
  pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'skillmate_db',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
  });
  console.log('MySQL connection pool initialized.');
} catch (error) {
  console.error('Failed to initialize MySQL pool:', error.message);
}

// Initialize Google OAuth2 client
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// JWT Auth Middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, process.env.JWT_SECRET || 'skillmate_jwt_secret_token_12345678', (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
};

// Helper: Generate JWT
const generateToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET || 'skillmate_jwt_secret_token_12345678', {
    expiresIn: '7d'
  });
};

// --- API Endpoints ---

// 1. Local Registration (Sign Up)
app.post('/api/auth/signup', async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  try {
    // Check if user already exists
    const [existing] = await pool.query('SELECT id FROM users WHERE email = ?', [email]);
    if (existing.length > 0) {
      return res.status(400).json({ error: 'User with this email already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert user
    const [result] = await pool.query(
      'INSERT INTO users (name, email, password) VALUES (?, ?, ?)',
      [name, email, hashedPassword]
    );

    const userId = result.insertId;
    const token = generateToken(userId);

    res.status(201).json({
      token,
      user: {
        id: userId,
        name,
        email,
        credits: 5 // Default starting credits
      }
    });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ error: 'Internal server error during registration. Make sure MySQL is running.' });
  }
});

// 2. Local Login (Sign In)
app.post('/api/auth/signin', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  try {
    // Find user
    const [users] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
    if (users.length === 0) {
      return res.status(400).json({ error: 'Invalid email or password' });
    }

    const user = users[0];

    // Check if user is Google-only (has no password)
    if (!user.password) {
      return res.status(400).json({ error: 'Account created using Google. Please log in with Google.' });
    }

    // Compare passwords
    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return res.status(400).json({ error: 'Invalid email or password' });
    }

    const token = generateToken(user.id);

    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        credits: user.credits
      }
    });
  } catch (error) {
    console.error('Signin error:', error);
    res.status(500).json({ error: 'Internal server error during signin. Make sure MySQL is running.' });
  }
});

// 3. Google Sign-In/Sign-Up
app.post('/api/auth/google', async (req, res) => {
  const { credential } = req.body;

  if (!credential) {
    return res.status(400).json({ error: 'Credential token required' });
  }

  try {
    // Verify Google ID Token
    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID
    });
    
    const payload = ticket.getPayload();
    const googleId = payload['sub'];
    const email = payload['email'];
    const name = payload['name'];

    // Check if user already has an account associated with this Google ID
    let [users] = await pool.query('SELECT * FROM users WHERE google_id = ?', [googleId]);
    
    if (users.length === 0) {
      // Check if user exists with the same email (created locally)
      const [emailUsers] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
      
      if (emailUsers.length > 0) {
        // Link Google ID to existing account
        await pool.query('UPDATE users SET google_id = ? WHERE email = ?', [googleId, email]);
        [users] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
      } else {
        // Create new account for this Google user
        const [result] = await pool.query(
          'INSERT INTO users (name, email, google_id) VALUES (?, ?, ?)',
          [name, email, googleId]
        );
        const newUserId = result.insertId;
        [users] = await pool.query('SELECT * FROM users WHERE id = ?', [newUserId]);
      }
    }

    const user = users[0];
    const token = generateToken(user.id);

    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        credits: user.credits
      }
    });
  } catch (error) {
    console.error('Google Auth error:', error);
    res.status(400).json({ error: 'Google login token verification failed.' });
  }
});

// 4. Fetch Profile details (Protected Route)
app.get('/api/auth/me', authenticateToken, async (req, res) => {
  try {
    const [users] = await pool.query('SELECT id, name, email, credits FROM users WHERE id = ?', [req.user.id]);
    if (users.length === 0) {
      return res.status(404).json({ error: 'User profile not found' });
    }
    res.json({ user: users[0] });
  } catch (error) {
    console.error('Fetch profile error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 5. Fetch Full User Profile (metadata, skills, availability)
app.get('/api/users/:id', authenticateToken, async (req, res) => {
  const userId = req.params.id;

  try {
    const [users] = await pool.query(
      `SELECT id, name, email, bio, profile_photo_url, location, occupation, college_name, department, year_of_study, role, status, reputation_points, credits 
       FROM users WHERE id = ?`,
      [userId]
    );

    if (users.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const [skills] = await pool.query(
      `SELECT skill_name, type, proficiency FROM user_skills WHERE user_id = ?`,
      [userId]
    );

    const [availability] = await pool.query(
      `SELECT day_of_week, start_time, end_time FROM user_availability WHERE user_id = ?`,
      [userId]
    );

    res.json({
      user: {
        ...users[0],
        skills,
        availability
      }
    });
  } catch (error) {
    console.error('Fetch full profile error:', error);
    res.status(500).json({ error: 'Failed to fetch user profile details' });
  }
});

// 6. Update User Profile Metadata
app.put('/api/users/:id', authenticateToken, async (req, res) => {
  const userId = req.params.id;

  // Security check: users can only edit their own profile
  if (req.user.id.toString() !== userId.toString()) {
    return res.status(403).json({ error: 'Unauthorized to edit this profile' });
  }

  const { name, bio, location, occupation, college_name, department, year_of_study } = req.body;

  if (!name) {
    return res.status(400).json({ error: 'Name is required' });
  }

  try {
    await pool.query(
      `UPDATE users SET name = ?, bio = ?, location = ?, occupation = ?, college_name = ?, department = ?, year_of_study = ? 
       WHERE id = ?`,
      [name, bio || null, location || null, occupation || null, college_name || null, department || null, year_of_study || null, userId]
    );

    res.json({ message: 'Profile updated successfully!' });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Failed to update profile details' });
  }
});

// 7. Update User Skills (shared & wanted)
app.put('/api/users/:id/skills', authenticateToken, async (req, res) => {
  const userId = req.params.id;

  if (req.user.id.toString() !== userId.toString()) {
    return res.status(403).json({ error: 'Unauthorized' });
  }

  const { skills } = req.body; // Array of { skill_name, type, proficiency }

  if (!Array.isArray(skills)) {
    return res.status(400).json({ error: 'Skills must be an array' });
  }

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // Remove existing skills
    await conn.query('DELETE FROM user_skills WHERE user_id = ?', [userId]);

    // Insert new skills if array is not empty
    if (skills.length > 0) {
      const values = skills.map(s => [userId, s.skill_name, s.type, s.proficiency]);
      await conn.query(
        'INSERT INTO user_skills (user_id, skill_name, type, proficiency) VALUES ?',
        [values]
      );
    }

    await conn.commit();
    res.json({ message: 'Skills updated successfully!' });
  } catch (error) {
    await conn.rollback();
    console.error('Update skills error:', error);
    res.status(500).json({ error: 'Failed to update skills registry' });
  } finally {
    conn.release();
  }
});

// 8. Update User Availability Slots
app.put('/api/users/:id/availability', authenticateToken, async (req, res) => {
  const userId = req.params.id;

  if (req.user.id.toString() !== userId.toString()) {
    return res.status(403).json({ error: 'Unauthorized' });
  }

  const { slots } = req.body; // Array of { day_of_week, start_time, end_time }

  if (!Array.isArray(slots)) {
    return res.status(400).json({ error: 'Slots must be an array' });
  }

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // Remove existing availability slots
    await conn.query('DELETE FROM user_availability WHERE user_id = ?', [userId]);

    // Insert new slots if array is not empty
    if (slots.length > 0) {
      const values = slots.map(s => [userId, s.day_of_week, s.start_time, s.end_time]);
      await conn.query(
        'INSERT INTO user_availability (user_id, day_of_week, start_time, end_time) VALUES ?',
        [values]
      );
    }

    await conn.commit();
    res.json({ message: 'Availability schedule updated successfully!' });
  } catch (error) {
    await conn.rollback();
    console.error('Update availability error:', error);
    res.status(500).json({ error: 'Failed to update availability slots' });
  } finally {
    conn.release();
  }
});

// Start Server
app.listen(PORT, () => {
  console.log(`Express server running on http://localhost:${PORT}`);
});

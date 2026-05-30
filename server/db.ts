import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';

const DB_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DB_DIR, 'db.json');

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  password_hash: string;
  role: 'admin' | 'user';
  package_type: 'FREE' | 'PREMIUM' | 'ENTERPRISE';
  tokens_remaining: number;
  total_tokens_used: number;
  api_provider: string; // e.g., 'gemini-3.5-flash', 'gemini-3.1-pro-preview'
  account_status: 'ACTIVE' | 'SUSPENDED';
  created_at: string;
  updated_at: string;
  last_login?: string;
}

export interface OTPVerification {
  id: string;
  email: string;
  otp_code: string;
  expires_at: string;
  verified: boolean;
  created_at: string;
}

export interface Subscription {
  id: string;
  user_id: string;
  package_name: 'FREE' | 'PREMIUM' | 'ENTERPRISE';
  package_price: number;
  token_limit: number;
  expiry_date: string;
  status: 'ACTIVE' | 'EXPIRED' | 'CANCELLED';
}

export interface ApiUsageLog {
  id: string;
  user_id: string;
  email: string;
  api_used: string;
  tokens_consumed: number;
  request_type: string;
  created_at: string;
}

export interface SentOtpLog {
  id: string;
  email: string;
  type: string;
  smtp_status: 'SUCCESS' | 'FAILED' | 'SIMULATED';
  timestamp: string;
}

interface DatabaseSchema {
  users: User[];
  otp_verifications: OTPVerification[];
  subscriptions: Subscription[];
  api_usage_logs: ApiUsageLog[];
  sent_otp_logs: SentOtpLog[];
}

const DEFAULT_SECTOR: DatabaseSchema = {
  users: [],
  otp_verifications: [],
  subscriptions: [],
  api_usage_logs: [],
  sent_otp_logs: []
};

// Helper to write database safely
function saveDB(data: DatabaseSchema) {
  if (!fs.existsSync(DB_DIR)) {
    fs.mkdirSync(DB_DIR, { recursive: true });
  }
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf8');
}

// Helper to load database
export function loadDB(): DatabaseSchema {
  try {
    if (!fs.existsSync(DB_FILE)) {
      // Seed initial data
      const salt = bcrypt.genSaltSync(10);
      const adminPasswordHash = bcrypt.hashSync('admin123', salt);
      const userPasswordHash = bcrypt.hashSync('user123', salt);

      const db: DatabaseSchema = {
        users: [
          {
            id: 'u-admin-01',
            name: 'System Admin',
            email: 'admin@canvascloud.com',
            phone: '+1 555-0100',
            password_hash: adminPasswordHash,
            role: 'admin',
            package_type: 'ENTERPRISE',
            tokens_remaining: 1000000,
            total_tokens_used: 4250,
            api_provider: 'gemini-3.1-pro-preview',
            account_status: 'ACTIVE',
            created_at: new Date('2026-01-15T08:00:00.000Z').toISOString(),
            updated_at: new Date('2026-05-29T10:19:30.000Z').toISOString(),
            last_login: new Date('2026-05-29T10:12:12.000Z').toISOString()
          },
          {
            id: 'u-user-02',
            name: 'Jane Foster',
            email: 'user@canvascloud.com',
            phone: '+1 555-0199',
            password_hash: userPasswordHash,
            role: 'user',
            package_type: 'FREE',
            tokens_remaining: 150,
            total_tokens_used: 350,
            api_provider: 'gemini-3.5-flash',
            account_status: 'ACTIVE',
            created_at: new Date('2026-04-10T12:00:00.000Z').toISOString(),
            updated_at: new Date('2026-05-29T09:15:00.000Z').toISOString(),
            last_login: new Date('2026-05-29T08:10:00.000Z').toISOString()
          }
        ],
        otp_verifications: [],
        subscriptions: [
          {
            id: 'sub-01',
            user_id: 'u-admin-01',
            package_name: 'ENTERPRISE',
            package_price: 199,
            token_limit: 1000000,
            expiry_date: '2027-05-29T12:00:00.000Z',
            status: 'ACTIVE'
          },
          {
            id: 'sub-02',
            user_id: 'u-user-02',
            package_name: 'FREE',
            package_price: 0,
            token_limit: 500,
            expiry_date: '2026-06-29T12:00:00.000Z',
            status: 'ACTIVE'
          }
        ],
        api_usage_logs: [
          {
            id: 'log-01',
            user_id: 'u-user-02',
            email: 'user@canvascloud.com',
            api_used: 'gemini-3.5-flash',
            tokens_consumed: 10,
            request_type: 'AI Paint Assist',
            created_at: new Date('2026-05-28T14:22:00.000Z').toISOString()
          },
          {
            id: 'log-02',
            user_id: 'u-user-02',
            email: 'user@canvascloud.com',
            api_used: 'gemini-3.5-flash',
            tokens_consumed: 15,
            request_type: 'AI Image Trace',
            created_at: new Date('2026-05-29T07:44:00.000Z').toISOString()
          },
          {
            id: 'log-03',
            user_id: 'u-admin-01',
            email: 'admin@canvascloud.com',
            api_used: 'gemini-3.1-pro-preview',
            tokens_consumed: 50,
            request_type: 'AI High Fidelity Polish',
            created_at: new Date('2026-05-29T09:12:00.000Z').toISOString()
          }
        ],
        sent_otp_logs: [
          {
            id: 'otp-log-01',
            email: 'user@canvascloud.com',
            type: 'Verification OTP',
            smtp_status: 'SIMULATED',
            timestamp: new Date('2026-04-10T11:58:00.000Z').toISOString()
          }
        ]
      };
      saveDB(db);
      return db;
    }
    const content = fs.readFileSync(DB_FILE, 'utf8');
    const db = JSON.parse(content) as DatabaseSchema;
    if (db && db.users && !db.users.some(u => u.id === 'u-guest-00')) {
      db.users.push({
        id: 'u-guest-00',
        name: 'Guest Director',
        email: 'guest@dundeestudio.com',
        phone: '+1 555-0000',
        password_hash: '',
        role: 'user',
        package_type: 'FREE',
        tokens_remaining: 5000,
        total_tokens_used: 0,
        api_provider: 'gemini-3.5-flash',
        account_status: 'ACTIVE',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
      if (db.subscriptions) {
        db.subscriptions.push({
          id: 'sub-guest-00',
          user_id: 'u-guest-00',
          package_name: 'FREE',
          package_price: 0,
          token_limit: 5000,
          expiry_date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
          status: 'ACTIVE'
        });
      }
      try {
        fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf8');
      } catch (e) {
        console.error('Failed to persist dynamic guest user:', e);
      }
    }
    return db;
  } catch (error) {
    console.error('Failed to load local DB, fallback to default:', error);
    return DEFAULT_SECTOR;
  }
}

export const dbService = {
  getUsers: () => loadDB().users,
  
  getUserById: (id: string) => {
    return loadDB().users.find(u => u.id === id);
  },
  
  getUserByEmail: (email: string) => {
    const cleanEmail = email.trim().toLowerCase();
    return loadDB().users.find(u => u.email.toLowerCase() === cleanEmail);
  },
  
  createUser: (userInfo: Omit<User, 'id' | 'created_at' | 'updated_at' | 'total_tokens_used' | 'tokens_remaining' | 'package_type' | 'api_provider' | 'account_status'>) => {
    const db = loadDB();
    const id = 'u-' + Math.random().toString(36).substr(2, 9);
    
    // Default allocations
    const package_type = 'FREE';
    const tokens_remaining = 500; // default 500 free tokens
    const api_provider = 'gemini-3.5-flash';
    const newUser: User = {
      ...userInfo,
      id,
      email: userInfo.email.trim().toLowerCase(),
      package_type,
      tokens_remaining,
      total_tokens_used: 0,
      api_provider,
      account_status: 'ACTIVE',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    db.users.push(newUser);
    
    // Add default subscription
    const subId = 'sub-' + Math.random().toString(36).substr(2, 9);
    const newSub: Subscription = {
      id: subId,
      user_id: id,
      package_name: 'FREE',
      package_price: 0,
      token_limit: 500,
      expiry_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
      status: 'ACTIVE'
    };
    db.subscriptions.push(newSub);
    
    saveDB(db);
    return { user: newUser, subscription: newSub };
  },

  updateUser: (id: string, updates: Partial<User>) => {
    const db = loadDB();
    const index = db.users.findIndex(u => u.id === id);
    if (index === -1) return null;
    
    db.users[index] = {
      ...db.users[index],
      ...updates,
      updated_at: new Date().toISOString()
    };
    
    saveDB(db);
    return db.users[index];
  },

  deleteUser: (id: string) => {
    const db = loadDB();
    db.users = db.users.filter(u => u.id !== id);
    db.subscriptions = db.subscriptions.filter(s => s.user_id !== id);
    db.api_usage_logs = db.api_usage_logs.filter(l => l.user_id !== id);
    saveDB(db);
    return true;
  },

  addOtp: (email: string, code: string, minutesExpiry = 5) => {
    const db = loadDB();
    const cleanEmail = email.trim().toLowerCase();
    const id = 'otp-' + Math.random().toString(36).substr(2, 9);
    
    // De-activate old OTPs for safety
    db.otp_verifications = db.otp_verifications.map(o => {
      if (o.email.toLowerCase() === cleanEmail) {
        return { ...o, verified: true }; // treat as spent
      }
      return o;
    });

    const newOtp: OTPVerification = {
      id,
      email: cleanEmail,
      otp_code: code,
      expires_at: new Date(Date.now() + minutesExpiry * 60 * 1000).toISOString(),
      verified: false,
      created_at: new Date().toISOString()
    };
    
    db.otp_verifications.push(newOtp);
    saveDB(db);
    return newOtp;
  },

  verifyOtp: (email: string, code: string): boolean => {
    const db = loadDB();
    const cleanEmail = email.trim().toLowerCase();
    const now = new Date().toISOString();
    
    // Find matching active OTP
    const otp = db.otp_verifications.find(o => 
      o.email.toLowerCase() === cleanEmail && 
      o.otp_code === code && 
      !o.verified && 
      o.expires_at > now
    );

    if (!otp) return false;

    // Mark as verified
    db.otp_verifications = db.otp_verifications.map(o => {
      if (o.id === otp.id) {
        return { ...o, verified: true };
      }
      return o;
    });

    saveDB(db);
    return true;
  },

  getSubscriptions: () => loadDB().subscriptions,

  getSubscriptionByUserId: (userId: string) => {
    return loadDB().subscriptions.find(s => s.user_id === userId && s.status === 'ACTIVE');
  },

  upgradeSubscription: (userId: string, tier: 'FREE' | 'PREMIUM' | 'ENTERPRISE') => {
    const db = loadDB();
    
    // 1. Update user tier & tokens
    const userIndex = db.users.findIndex(u => u.id === userId);
    if (userIndex === -1) return null;
    
    let tokenBonus = 500;
    let price = 0;
    let apiProvider = 'gemini-3.5-flash';
    
    if (tier === 'PREMIUM') {
      tokenBonus = 15000;
      price = 29;
      apiProvider = 'gemini-3.5-flash'; // Let's use latest standard but premium allowances
    } else if (tier === 'ENTERPRISE') {
      tokenBonus = 100000;
      price = 149;
      apiProvider = 'gemini-3.1-pro-preview'; // highest grade model
    }
    
    db.users[userIndex].package_type = tier;
    db.users[userIndex].tokens_remaining += tokenBonus;
    db.users[userIndex].api_provider = apiProvider;
    db.users[userIndex].updated_at = new Date().toISOString();
    
    // 2. Archive old subscriptions
    db.subscriptions = db.subscriptions.map(s => {
      if (s.user_id === userId && s.status === 'ACTIVE') {
        return { ...s, status: 'CANCELLED' as const };
      }
      return s;
    });

    // 3. Add new active subscription
    const newSub: Subscription = {
      id: 'sub-' + Math.random().toString(36).substr(2, 9),
      user_id: userId,
      package_name: tier,
      package_price: price,
      token_limit: tokenBonus,
      expiry_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      status: 'ACTIVE'
    };
    db.subscriptions.push(newSub);
    
    saveDB(db);
    return { user: db.users[userIndex], subscription: newSub };
  },

  addApiUsageLog: (userId: string, apiUsed: string, tokensConsumed: number, requestType: string) => {
    const db = loadDB();
    const user = db.users.find(u => u.id === userId);
    if (!user) return null;

    // Deduct tokens
    user.tokens_remaining = Math.max(0, user.tokens_remaining - tokensConsumed);
    user.total_tokens_used += tokensConsumed;
    
    const newLog: ApiUsageLog = {
      id: 'log-' + Math.random().toString(36).substr(2, 9),
      user_id: userId,
      email: user.email,
      api_used: apiUsed,
      tokens_consumed: tokensConsumed,
      request_type: requestType,
      created_at: new Date().toISOString()
    };

    db.api_usage_logs.push(newLog);
    saveDB(db);
    return newLog;
  },

  getApiUsageLogs: () => loadDB().api_usage_logs,
  
  getApiUsageLogsByUserId: (userId: string) => {
    return loadDB().api_usage_logs.filter(l => l.user_id === userId);
  },

  addSentOtpLog: (email: string, type: string, status: 'SUCCESS' | 'FAILED' | 'SIMULATED') => {
    const db = loadDB();
    const newLog: SentOtpLog = {
      id: 'otp-log-' + Math.random().toString(36).substr(2, 9),
      email,
      type,
      smtp_status: status,
      timestamp: new Date().toISOString()
    };
    db.sent_otp_logs.push(newLog);
    saveDB(db);
    return newLog;
  },

  getSentOtpLogs: () => loadDB().sent_otp_logs
};

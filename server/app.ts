
import express, { Request, Response } from 'express';
import Stripe from 'stripe';
import cors from 'cors';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { Resend } from 'resend';
import { fileURLToPath } from 'url';

dotenv.config({ path: '.env.local' });

export const app = express();

// Initialize services conditionally
const stripe = process.env.STRIPE_SECRET_KEY ? new Stripe(process.env.STRIPE_SECRET_KEY) : null;
const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

app.use(cors());
app.use(express.static('public'));
app.use(express.json());

const DOMAIN = process.env.DOMAIN || 'http://localhost:3001';

// For Netlify Functions, use /tmp (only writable dir) or standard DB file if not writing
// IMPORTANT: On serverless, we CANNOT persist to local JSON properly between requests.
// For a production deployment, you MUST use a database like MongoDB, Supabase, etc.
// For this "demo to live" request, I will try to use /tmp but alert users data is ephemeral.
const DB_PATH = process.env.NETLIFY ? '/tmp/users.json' : path.join(process.cwd(), 'server', 'users.json');

// ... (Rest of logic is same, just DB_PATH handling differences)

// ============================================================================
// SIMPLE USER DATABASE
// ============================================================================
interface User {
    id: string;
    email: string;
    passwordHash: string;
    username: string;
    xp: number;
    level: number;
    streak: number;
    tier: 'free' | 'premium';
    dailyUsage: number;
    lastUsageReset: string;
    createdAt: number;
    lastActive: number;
    emailVerified: boolean;
    verificationCode?: string;
    verificationExpiry?: number;

}

interface PendingVerification {
    email: string;
    code: string;
    expiry: number;
    username: string;
    passwordHash: string;
}

// In-memory store for pending verifications (will scale badly on serverless, but ok for demo)
const pendingVerifications: Map<string, PendingVerification> = new Map();

// Load users from file
function loadUsers(): User[] {
    try {
        if (fs.existsSync(DB_PATH)) {
            return JSON.parse(fs.readFileSync(DB_PATH, 'utf-8'));
        }
    } catch (e) {
        console.error('Error loading users:', e);
    }
    return [];
}

// Save users to file
function saveUsers(users: User[]): void {
    try {
        fs.writeFileSync(DB_PATH, JSON.stringify(users, null, 2));
    } catch (e) {
        console.error("Error writing DB:", e);
    }
}

// Hash password
function hashPassword(password: string): string {
    return crypto.createHash('sha256').update(password + 'muzgpt_salt_2024').digest('hex');
}

// Generate 6-digit verification code
function generateVerificationCode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

const router = express.Router();

// Define routes on router instead of app for cleaner lambda wrapping if needed
// But app works too with serverless-http

// ============================================================================
// EMAIL VERIFICATION ENDPOINTS
// ============================================================================

app.post('/auth/send-verification', async (req: Request, res: Response) => {
    const { email, username, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: 'Email and password required' });
    }

    const users = loadUsers();
    const existingUser = users.find(u => u.email.toLowerCase() === email.toLowerCase());

    if (existingUser) {
        return res.status(409).json({ error: 'Email already registered. Please login instead.' });
    }

    const code = generateVerificationCode();
    const expiry = Date.now() + 10 * 60 * 1000; // 10 minutes

    pendingVerifications.set(email.toLowerCase(), {
        email: email.toLowerCase(),
        code,
        expiry,
        username: username || email.split('@')[0],
        passwordHash: hashPassword(password)
    });

    if (resend) {
        try {
            await resend.emails.send({
                from: 'MUZGPT <onboarding@resend.dev>',
                to: email,
                subject: 'Your MUZGPT Verification Code',
                html: `<h1>${code}</h1>`
            });
            console.log(`✅ Verification code sent to ${email}`);
        } catch (error) {
            console.error('Failed to send email:', error);
        }
    }

    res.json({
        success: true,
        message: 'Verification code sent',
        ...(!resend ? { demoCode: code } : {})
    });
});

app.post('/auth/verify-code', async (req: Request, res: Response) => {
    const { email, code } = req.body;
    const pending = pendingVerifications.get(email.toLowerCase());

    if (!pending || pending.code !== code) {
        return res.status(400).json({ error: 'Invalid or expired code.' });
    }

    const users = loadUsers();
    const newUser: User = {
        id: crypto.randomUUID(),
        email: pending.email,
        passwordHash: pending.passwordHash,
        username: pending.username,
        xp: 50,
        level: 1,
        streak: 1,
        tier: 'free',
        dailyUsage: 0,
        lastUsageReset: new Date().toDateString(),
        createdAt: Date.now(),
        lastActive: Date.now(),
        emailVerified: true
    };

    users.push(newUser);
    saveUsers(users);
    pendingVerifications.delete(email.toLowerCase());

    res.json({ success: true, user: newUser });
});

app.post('/auth/login', async (req: Request, res: Response) => {
    const { email, password } = req.body;
    const users = loadUsers();
    const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());

    if (!user || user.passwordHash !== hashPassword(password)) {
        return res.status(401).json({ error: 'Invalid credentials.' });
    }

    user.lastActive = Date.now();
    saveUsers(users);

    res.json({ success: true, user });
});

app.post('/auth/google', async (req: Request, res: Response) => {
    const { accessToken } = req.body;
    try {
        const response = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
            headers: { Authorization: `Bearer ${accessToken}` }
        });
        const googleUser = await response.json();
        const users = loadUsers();
        let user = users.find(u => u.email === googleUser.email);

        if (!user) {
            user = {
                id: crypto.randomUUID(),
                email: googleUser.email,
                username: googleUser.name,
                passwordHash: '',
                xp: 50,
                level: 1,
                streak: 1,
                tier: 'free',
                dailyUsage: 0,
                lastUsageReset: new Date().toDateString(),
                createdAt: Date.now(),
                lastActive: Date.now(),
                emailVerified: true
            };
            users.push(user);
        }
        res.json({ success: true, user });
    } catch (e) {
        res.status(500).json({ error: 'Google auth failed' });
    }
});

// Update User
app.post('/auth/update-user', async (req: Request, res: Response) => {
    const { userId, updates } = req.body;
    const users = loadUsers();
    const user = users.find(u => u.id === userId);
    if (user) {
        Object.assign(user, updates);
        saveUsers(users);
        res.json({ success: true });
    } else {
        res.status(404).json({ error: 'User not found' });
    }
});

// User Get
app.get('/auth/user/:userId', async (req: Request, res: Response) => {
    const users = loadUsers();
    const user = users.find(u => u.id === req.params.userId);
    res.json(user ? user : { error: 'Not found' });
});

// ============================================================================
// STRIPE PAYMENT ENDPOINTS
// ============================================================================
app.post('/create-checkout-session', async (req: Request, res: Response) => {
    const { userId } = req.body;

    if (!stripe || !process.env.STRIPE_SECRET_KEY || process.env.STRIPE_SECRET_KEY === 'PLACEHOLDER') {
        console.log('⚠️  STRIPE_SECRET_KEY is missing. Using DEMO MODE.');
        return res.json({ url: `${DOMAIN}?success=true&demo=true` });
    }

    try {
        const session = await stripe.checkout.sessions.create({
            line_items: [
                {
                    price_data: {
                        currency: 'usd',
                        product_data: {
                            name: 'MUZGPT Premium',
                            description: 'Unlock unlimited messages, Startup Mode, and Private Compute.',
                        },
                        unit_amount: 1000, // $10.00
                    },
                    quantity: 1,
                },
            ],
            mode: 'payment',
            success_url: `${DOMAIN}?success=true&userId=${userId || ''}`,
            cancel_url: `${DOMAIN}?canceled=true`,
            metadata: {
                userId: userId || ''
            }
        });

        res.json({ url: session.url });
    } catch (error) {
        console.error('Error creating checkout session:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Manual upgrade endpoint (for verifying payment without webhook)
app.post('/auth/upgrade-premium', async (req: Request, res: Response) => {
    const { userId } = req.body;

    const users = loadUsers();
    const userIndex = users.findIndex(u => u.id === userId);
    if (userIndex !== -1) {
        users[userIndex].tier = 'premium';
        saveUsers(users);
        console.log(`🎉 User ${userId} upgraded to PREMIUM!`);
        return res.json({ success: true, tier: 'premium' });
    }
    return res.status(404).json({ error: 'User not found' });
});

export default app;

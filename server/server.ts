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

const app = express();

// Initialize services conditionally
const stripe = process.env.STRIPE_SECRET_KEY ? new Stripe(process.env.STRIPE_SECRET_KEY) : null;
const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

app.use(cors());
app.use(express.static('public'));
app.use(express.json());

const DOMAIN = process.env.DOMAIN || 'http://localhost:3001';
const DB_PATH = path.join(process.cwd(), 'server', 'users.json');

// ============================================================================
// SIMPLE USER DATABASE (JSON-based, easy to migrate to MongoDB/Supabase later)
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
    stripeCustomerId?: string;
}

interface PendingVerification {
    email: string;
    code: string;
    expiry: number;
    username: string;
    passwordHash: string;
}

// In-memory store for pending verifications (not persisted)
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
    fs.writeFileSync(DB_PATH, JSON.stringify(users, null, 2));
}

// Hash password (simple for demo, use bcrypt in production)
function hashPassword(password: string): string {
    return crypto.createHash('sha256').update(password + 'muzgpt_salt_2024').digest('hex');
}

// Generate 6-digit verification code
function generateVerificationCode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

// ============================================================================
// EMAIL VERIFICATION ENDPOINTS
// ============================================================================

// Send verification code to email
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

    // Store pending verification
    pendingVerifications.set(email.toLowerCase(), {
        email: email.toLowerCase(),
        code,
        expiry,
        username: username || email.split('@')[0],
        passwordHash: hashPassword(password)
    });

    // Send email
    if (resend) {
        try {
            await resend.emails.send({
                from: 'MUZGPT <onboarding@resend.dev>',
                to: email,
                subject: 'Your MUZGPT Verification Code',
                html: `
                    <div style="font-family: 'Segoe UI', sans-serif; max-width: 500px; margin: 0 auto; padding: 40px; background: linear-gradient(135deg, #0a0a12 0%, #1a1a2e 100%); border-radius: 20px;">
                        <div style="text-align: center; margin-bottom: 30px;">
                            <h1 style="color: #fff; font-size: 32px; margin: 0;">MUZGPT</h1>
                            <p style="color: #6366f1; font-size: 12px; letter-spacing: 3px; margin-top: 5px;">NEURAL VERIFICATION</p>
                        </div>
                        <div style="background: rgba(255,255,255,0.05); border-radius: 15px; padding: 30px; text-align: center;">
                            <p style="color: #94a3b8; margin: 0 0 20px;">Your verification code is:</p>
                            <div style="font-size: 42px; font-weight: bold; letter-spacing: 8px; color: #fff; background: linear-gradient(90deg, #6366f1, #a855f7); -webkit-background-clip: text; -webkit-text-fill-color: transparent; padding: 20px;">
                                ${code}
                            </div>
                            <p style="color: #64748b; font-size: 12px; margin-top: 20px;">This code expires in 10 minutes.</p>
                        </div>
                        <p style="color: #475569; font-size: 11px; text-align: center; margin-top: 30px;">
                            If you didn't request this, please ignore this email.
                        </p>
                    </div>
                `
            });
            console.log(`✅ Verification code sent to ${email}: ${code}`);
        } catch (error) {
            console.error('Failed to send email:', error);
            // Continue anyway for demo purposes - show code in console
        }
    } else {
        console.log(`📧 DEMO MODE - Verification code for ${email}: ${code}`);
    }

    res.json({
        success: true,
        message: 'Verification code sent',
        // In demo mode, return the code (remove in production!)
        ...(resend ? {} : { demoCode: code })
    });
});

// Verify code and create account
app.post('/auth/verify-code', async (req: Request, res: Response) => {
    const { email, code } = req.body;

    const pending = pendingVerifications.get(email.toLowerCase());

    if (!pending) {
        return res.status(404).json({ error: 'No pending verification. Please sign up again.' });
    }

    if (Date.now() > pending.expiry) {
        pendingVerifications.delete(email.toLowerCase());
        return res.status(410).json({ error: 'Code expired. Please request a new one.' });
    }

    if (pending.code !== code) {
        return res.status(400).json({ error: 'Invalid code. Please try again.' });
    }

    // Create user
    const users = loadUsers();
    const newUser: User = {
        id: crypto.randomUUID(),
        email: pending.email,
        passwordHash: pending.passwordHash,
        username: pending.username,
        xp: 50, // Welcome bonus
        level: 1,
        streak: 1,
        tier: 'free', // ALWAYS FREE TO START!!!
        dailyUsage: 0,
        lastUsageReset: new Date().toDateString(),
        createdAt: Date.now(),
        lastActive: Date.now(),
        emailVerified: true
    };

    users.push(newUser);
    saveUsers(users);
    pendingVerifications.delete(email.toLowerCase());

    console.log(`✅ New user created: ${newUser.email} (tier: ${newUser.tier})`);

    res.json({
        success: true,
        user: {
            id: newUser.id,
            email: newUser.email,
            username: newUser.username,
            xp: newUser.xp,
            level: newUser.level,
            streak: newUser.streak,
            tier: newUser.tier,
            dailyUsage: newUser.dailyUsage,
            lastUsageReset: newUser.lastUsageReset
        }
    });
});

// ============================================================================
// LOGIN ENDPOINT
// ============================================================================
app.post('/auth/login', async (req: Request, res: Response) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: 'Email and password required' });
    }

    const users = loadUsers();
    const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());

    if (!user) {
        return res.status(404).json({ error: 'Account not found. Please sign up first.' });
    }

    if (user.passwordHash !== hashPassword(password)) {
        return res.status(401).json({ error: 'Invalid password.' });
    }

    // Update last active
    user.lastActive = Date.now();

    // Reset daily usage if new day
    const today = new Date().toDateString();
    if (user.lastUsageReset !== today) {
        user.dailyUsage = 0;
        user.lastUsageReset = today;
    }

    saveUsers(users);

    console.log(`✅ User logged in: ${user.email} (tier: ${user.tier})`);

    res.json({
        success: true,
        user: {
            id: user.id,
            email: user.email,
            username: user.username,
            xp: user.xp,
            level: user.level,
            streak: user.streak,
            tier: user.tier,
            dailyUsage: user.dailyUsage,
            lastUsageReset: user.lastUsageReset
        }
    });
});

// ============================================================================
// UPDATE USER DATA (XP, usage, etc.)
// ============================================================================
app.post('/auth/update-user', async (req: Request, res: Response) => {
    const { userId, updates } = req.body;

    const users = loadUsers();
    const userIndex = users.findIndex(u => u.id === userId);

    if (userIndex === -1) {
        return res.status(404).json({ error: 'User not found' });
    }

    // Only allow updating specific fields
    const allowedUpdates = ['xp', 'level', 'streak', 'dailyUsage', 'lastUsageReset', 'lastActive'];
    for (const key of allowedUpdates) {
        if (updates[key] !== undefined) {
            (users[userIndex] as any)[key] = updates[key];
        }
    }

    saveUsers(users);
    res.json({ success: true });
});

// ============================================================================
// GOOGLE OAUTH ENDPOINT
// ============================================================================
app.post('/auth/google', async (req: Request, res: Response) => {
    const { accessToken } = req.body;

    try {
        // Fetch user info from Google
        const response = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
            headers: { Authorization: `Bearer ${accessToken}` }
        });

        if (!response.ok) {
            return res.status(401).json({ error: 'Invalid Google token' });
        }

        const googleUser = await response.json();
        const email = googleUser.email;
        const name = googleUser.name || email.split('@')[0];

        const users = loadUsers();
        let user = users.find(u => u.email.toLowerCase() === email.toLowerCase());

        if (!user) {
            // Create new user from Google login
            user = {
                id: crypto.randomUUID(),
                email: email.toLowerCase(),
                passwordHash: '', // No password for OAuth users
                username: name,
                xp: 50,
                level: 1,
                streak: 1,
                tier: 'free', // ALWAYS FREE!!!
                dailyUsage: 0,
                lastUsageReset: new Date().toDateString(),
                createdAt: Date.now(),
                lastActive: Date.now(),
                emailVerified: true
            };
            users.push(user);
            saveUsers(users);
            console.log(`✅ New Google user created: ${user.email} (tier: ${user.tier})`);
        } else {
            // Update existing user
            user.lastActive = Date.now();
            const today = new Date().toDateString();
            if (user.lastUsageReset !== today) {
                user.dailyUsage = 0;
                user.lastUsageReset = today;
            }
            saveUsers(users);
            console.log(`✅ Google user logged in: ${user.email} (tier: ${user.tier})`);
        }

        res.json({
            success: true,
            user: {
                id: user.id,
                email: user.email,
                username: user.username,
                xp: user.xp,
                level: user.level,
                streak: user.streak,
                tier: user.tier,
                dailyUsage: user.dailyUsage,
                lastUsageReset: user.lastUsageReset
            }
        });
    } catch (error) {
        console.error('Google auth error:', error);
        res.status(500).json({ error: 'Authentication failed' });
    }
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

// Stripe Webhook to handle successful payments
app.post('/webhook', express.raw({ type: 'application/json' }), async (req: Request, res: Response) => {
    const sig = req.headers['stripe-signature'] as string;
    const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

    if (!stripe || !endpointSecret) {
        console.log('Webhook: Missing Stripe config');
        return res.status(400).send('Webhook config missing');
    }

    let event;
    try {
        event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
    } catch (err: any) {
        console.log(`Webhook signature verification failed.`, err.message);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    if (event.type === 'checkout.session.completed') {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.userId;

        if (userId) {
            const users = loadUsers();
            const userIndex = users.findIndex(u => u.id === userId);
            if (userIndex !== -1) {
                users[userIndex].tier = 'premium';
                saveUsers(users);
                console.log(`🎉 User ${userId} upgraded to PREMIUM!`);
            }
        }
    }

    res.json({ received: true });
});

// Manual upgrade endpoint (for verifying payment without webhook)
app.post('/auth/upgrade-premium', async (req: Request, res: Response) => {
    const { userId, sessionId } = req.body;

    if (!stripe) {
        // Demo mode - upgrade immediately
        const users = loadUsers();
        const userIndex = users.findIndex(u => u.id === userId);
        if (userIndex !== -1) {
            users[userIndex].tier = 'premium';
            saveUsers(users);
            console.log(`🎉 DEMO: User ${userId} upgraded to PREMIUM!`);
            return res.json({ success: true, tier: 'premium' });
        }
        return res.status(404).json({ error: 'User not found' });
    }

    try {
        // Verify the session was paid
        const session = await stripe.checkout.sessions.retrieve(sessionId);
        if (session.payment_status === 'paid') {
            const users = loadUsers();
            const userIndex = users.findIndex(u => u.id === userId);
            if (userIndex !== -1) {
                users[userIndex].tier = 'premium';
                saveUsers(users);
                console.log(`🎉 User ${userId} upgraded to PREMIUM!`);
                return res.json({ success: true, tier: 'premium' });
            }
        }
        res.status(400).json({ error: 'Payment not verified' });
    } catch (error) {
        console.error('Error verifying payment:', error);
        res.status(500).json({ error: 'Verification failed' });
    }
});

// Get user data
app.get('/auth/user/:userId', async (req: Request, res: Response) => {
    const { userId } = req.params;
    const users = loadUsers();
    const user = users.find(u => u.id === userId);

    if (!user) {
        return res.status(404).json({ error: 'User not found' });
    }

    res.json({
        id: user.id,
        email: user.email,
        username: user.username,
        xp: user.xp,
        level: user.level,
        streak: user.streak,
        tier: user.tier,
        dailyUsage: user.dailyUsage,
        lastUsageReset: user.lastUsageReset
    });
});

const PORT = 4242;
app.listen(PORT, () => {
    console.log(`\n🚀 MUZGPT Server running on port ${PORT}`);
    console.log(`📧 Email Service: ${resend ? 'Resend Active' : 'DEMO MODE (codes shown in console)'}`);
    console.log(`💳 Stripe: ${stripe ? 'Active' : 'DEMO MODE'}\n`);
});

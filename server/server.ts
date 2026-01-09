import express from 'express';
import Stripe from 'stripe';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const app = express();
// Initialize Stripe only if key is present
const stripe = process.env.STRIPE_SECRET_KEY ? new Stripe(process.env.STRIPE_SECRET_KEY) : null;

app.use(cors());
app.use(express.static('public'));
app.use(express.json());

const DOMAIN = 'http://localhost:3001';

app.post('/create-checkout-session', async (req, res) => {
    // CHECK FOR STRIPE KEYS
    if (!stripe || !process.env.STRIPE_SECRET_KEY || process.env.STRIPE_SECRET_KEY === 'PLACEHOLDER') {
        console.log('⚠️  STRIPE_SECRET_KEY is missing. Using DEMO MODE.');
        console.log('👉  To enable real payments, add STRIPE_SECRET_KEY to your .env.local file.');
        return res.json({ url: `${DOMAIN}?success=true&demo=true` });
    }

    try {
        if (!stripe) throw new Error("Stripe not initialized");
        const session = await stripe.checkout.sessions.create({
            line_items: [
                {
                    price_data: {
                        currency: 'usd',
                        product_data: {
                            name: 'MUZGPT Premium',
                            description: 'Unlock unlimited messages, Startup Mode, and Private Compute.',
                        },
                        unit_amount: 1000,
                    },
                    quantity: 1,
                },
            ],
            mode: 'payment',
            success_url: `${DOMAIN}?success=true`,
            cancel_url: `${DOMAIN}?canceled=true`,
        });

        res.json({ url: session.url });
    } catch (error) {
        console.error('Error creating checkout session:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

const PORT = 4242;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

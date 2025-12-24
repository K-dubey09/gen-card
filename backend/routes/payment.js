const express = require('express');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { User, Transaction } = require('../models');
const { isAuthenticated } = require('../middleware/auth');

const router = express.Router();

// Credit packages
const CREDIT_PACKAGES = {
    starter: { credits: 50, price: 499, priceDisplay: '$4.99' },
    basic: { credits: 100, price: 899, priceDisplay: '$8.99' },
    pro: { credits: 250, price: 1999, priceDisplay: '$19.99' },
    premium: { credits: 500, price: 3499, priceDisplay: '$34.99' }
};

// Get available packages
router.get('/packages', (req, res) => {
    res.json({ packages: CREDIT_PACKAGES });
});

// Create payment intent
router.post('/create-intent', isAuthenticated, async (req, res) => {
    try {
        const { packageName } = req.body;

        if (!CREDIT_PACKAGES[packageName]) {
            return res.status(400).json({ error: 'Invalid package' });
        }

        const packageInfo = CREDIT_PACKAGES[packageName];

        const paymentIntent = await stripe.paymentIntents.create({
            amount: packageInfo.price,
            currency: 'usd',
            metadata: {
                userId: req.session.userId,
                package: packageName,
                credits: packageInfo.credits
            }
        });

        res.json({
            clientSecret: paymentIntent.client_secret,
            credits: packageInfo.credits
        });
    } catch (error) {
        console.error('Payment intent error:', error);
        res.status(500).json({ error: 'Failed to create payment intent' });
    }
});

// Confirm payment
router.post('/confirm', isAuthenticated, async (req, res) => {
    try {
        const { paymentIntentId, packageName } = req.body;

        if (!CREDIT_PACKAGES[packageName]) {
            return res.status(400).json({ error: 'Invalid package' });
        }

        // Verify payment with Stripe
        const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

        if (paymentIntent.status !== 'succeeded') {
            return res.status(400).json({ error: 'Payment not completed' });
        }

        const packageInfo = CREDIT_PACKAGES[packageName];
        const user = await User.findByPk(req.session.userId);

        // Add credits
        user.credits += packageInfo.credits;
        await user.save();

        // Record transaction
        await Transaction.create({
            userId: user.id,
            type: 'purchase',
            amount: packageInfo.credits,
            description: `Purchased ${packageName} package`,
            paymentId: paymentIntentId
        });

        res.json({
            success: true,
            creditsAdded: packageInfo.credits,
            totalCredits: user.credits
        });
    } catch (error) {
        console.error('Payment confirmation error:', error);
        res.status(500).json({ error: 'Failed to confirm payment' });
    }
});

module.exports = router;

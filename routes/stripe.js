// routes/stripe.js
const express = require('express');
const router = express.Router();
const Stripe = require('stripe');
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);
const Transaction = require('../models/Transaction');
const bodyParser = require('body-parser');


// Set up raw body parser to receive the webhook events as raw data
router.post('/webhook', bodyParser.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
  } catch (err) {
    console.log(`Webhook signature verification failed: ${err.message}`);
    return res.status(400).send(`Webhook error: ${err.message}`);
  }

  switch (event.type) {
    case 'checkout.session.completed':
      const session = event.data.object; 

      try {
      
        const transaction = new Transaction({
          transactionId: session.id,
          amount: session.amount_total / 100, 
          currency: session.currency,
          email: session.customer_email,
          status: session.payment_status,
          planId: session.metadata.planId, 
          userId: session.metadata.userId,
          date: new Date(),
        });

        await transaction.save();
        console.log('Transaction saved successfully');

        res.status(200).send('Event processed');
      } catch (err) {
        console.error('Error saving transaction:', err);
        res.status(500).send('Internal server error');
      }
      break;

    default:
      console.log(`Unhandled event type: ${event.type}`);
      res.status(200).send('Event received');
      break;
  }
});

router.get('/user-transactions/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const transactions = await Transaction.find({ 'metadata.userId': userId }).sort({ date: -1 });
    res.status(200).json(transactions);
  } catch (err) {
    console.error('Error fetching user transactions:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/create-checkout-session', async (req, res) => {
  const { priceId, userId, userEmail } = req.body;
  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    payment_method_types: ['card'],
    line_items: [
      {
        price: priceId, 
        quantity: 1,
      },
    ],
    customer_email: userEmail,
    success_url: `https://betak-front.vercel.app/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `https://betak-front.vercel.app/cancel`,
    metadata: { userId },
  });

  res.json({ url: session.url });
});

router.get('/verify-subscription', async (req, res) => {
  const sessionId = req.query.session_id;

  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    const paymentIntentId = session.payment_intent;

    let receiptUrl = null;

    if (paymentIntentId) {
      const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
      const charge = paymentIntent.charges.data[0];
      receiptUrl = charge?.receipt_url || null;
    }

    res.json({
      success: true,
      receiptUrl,
      transactionId: session.id,
      email: session.customer_email,
      amountTotal: session.amount_total / 100, 
    });
  } catch (error) {
    console.error('Stripe session fetch failed:', error.message);
    res.status(400).json({ success: false, error: error.message });
  }
});

router.get('/transactions', async (req, res) => {
  try {
    const sessions = await stripe.checkout.sessions.list({
      limit: 10,
    });
    res.json(sessions);
  } catch (error) {
    console.error('Error fetching transactions:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;

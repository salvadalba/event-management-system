const express = require('express');
const { body, validationResult } = require('express-validator');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { pool } = require('../config/database');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// Create payment intent
router.post('/create-intent', [
  body('registrationId').isUUID(),
  body('amount').isFloat({ min: 0.01 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { registrationId, amount } = req.body;

    // Get registration details
    const result = await pool.query(
      'SELECT * FROM registrations WHERE id = $1 AND payment_status = \'pending\'',
      [registrationId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Registration not found or already paid'
      });
    }

    const registration = result.rows[0];

    // Create Stripe payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency: registration.currency.toLowerCase(),
      metadata: {
        registration_id: registrationId,
        event_id: registration.event_id,
        user_email: registration.email
      },
      automatic_payment_methods: {
        enabled: true
      }
    });

    res.json({
      success: true,
      data: {
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id
      }
    });
  } catch (error) {
    console.error('Create payment intent error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error creating payment intent'
    });
  }
});

// Confirm payment
router.post('/confirm', [
  body('paymentIntentId').notEmpty(),
  body('registrationId').isUUID()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { paymentIntentId, registrationId } = req.body;

    // Verify payment intent with Stripe
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    if (paymentIntent.status !== 'succeeded') {
      return res.status(400).json({
        success: false,
        error: 'Payment not successful'
      });
    }

    // Update registration
    await pool.query(
      'UPDATE registrations SET payment_status = \'paid\', status = \'confirmed\', payment_id = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      [paymentIntentId, registrationId]
    );

    // TODO: Send payment confirmation email
    // TODO: Generate and send tickets

    res.json({
      success: true,
      message: 'Payment confirmed successfully'
    });
  } catch (error) {
    console.error('Confirm payment error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error confirming payment'
    });
  }
});

// Stripe webhook handler
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.log(`Webhook signature verification failed.`, err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the event
  switch (event.type) {
    case 'payment_intent.succeeded':
      const paymentIntent = event.data.object;

      // Update registration if payment is successful
      if (paymentIntent.metadata?.registration_id) {
        await pool.query(
          'UPDATE registrations SET payment_status = \'paid\', status = \'confirmed\', payment_id = $1 WHERE id = $2',
          [paymentIntent.id, paymentIntent.metadata.registration_id]
        );

        // TODO: Send confirmation email and tickets
      }
      break;

    case 'payment_intent.payment_failed':
      // Handle failed payment
      const failedPayment = event.data.object;

      if (failedPayment.metadata?.registration_id) {
        await pool.query(
          'UPDATE registrations SET payment_status = \'failed\' WHERE id = $1',
          [failedPayment.metadata.registration_id]
        );

        // TODO: Send payment failure notification
      }
      break;

    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  // Return a 200 response to acknowledge receipt of the event
  res.json({ received: true });
});

module.exports = router;
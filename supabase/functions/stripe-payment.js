const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

exports.handler = async (req, res) => {
  try {
    const { amount, currency, paymentMethodId } = req.body;

    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency,
      payment_method: paymentMethodId,
      confirm: true,
    });

    res.status(200).json({ success: true, paymentIntent });
  } catch (error) {
    console.error('Payment processing error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }
  try {
    const { sessionId, productKey } = JSON.parse(event.body || '{}');
    if (!sessionId || !productKey) {
      return { statusCode: 200, body: JSON.stringify({ valid: false }) };
    }
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    const paid = session.payment_status === 'paid';
    const matches = session.metadata && session.metadata.product_key === productKey;
    return { statusCode: 200, body: JSON.stringify({ valid: !!(paid && matches) }) };
  } catch (err) {
    console.error('verify-purchase error:', err);
    return { statusCode: 200, body: JSON.stringify({ valid: false }) };
  }
};
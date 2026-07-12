const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { getStore } = require('@netlify/blobs');

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
    if (!paid || !matches) {
      return { statusCode: 200, body: JSON.stringify({ valid: false }) };
    }

    /* Mémoire minimale côté serveur : ce paiement a-t-il déjà servi
       à débloquer le produit ? Si oui, on refuse — impossible à
       partager plusieurs fois, sans base de données externe. */
    const store = getStore('redeemed-sessions');
    const already = await store.get(sessionId);
    if (already) {
      return { statusCode: 200, body: JSON.stringify({ valid: false, reason: 'already_redeemed' }) };
    }
    await store.set(sessionId, new Date().toISOString());

    return { statusCode: 200, body: JSON.stringify({ valid: true }) };
  } catch (err) {
    console.error('verify-purchase error:', err);
    return { statusCode: 200, body: JSON.stringify({ valid: false }) };
  }
};
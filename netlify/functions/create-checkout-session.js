const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }
  try {
    const { productKey, productName, amountCents, customerEmail } = JSON.parse(event.body || '{}');
    if (!productKey || !productName || !amountCents || !customerEmail) {
      return { statusCode: 400, body: JSON.stringify({ error: 'productKey, productName, amountCents et customerEmail sont requis.' }) };
    }
    const siteUrl = process.env.SITE_URL || 'https://tonsite.netlify.app';
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: 'eur',
          product_data: { name: productName },
          unit_amount: amountCents,
        },
        quantity: 1,
      }],
      customer_email: customerEmail,
      metadata: { product_key: productKey },
      success_url: `${siteUrl}/?unlock=${encodeURIComponent(productKey)}&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${siteUrl}/`,
    });
    return { statusCode: 200, body: JSON.stringify({ url: session.url }) };
  } catch (err) {
    console.error('create-checkout-session error:', err);
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};
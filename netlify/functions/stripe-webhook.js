const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

exports.handler = async (event) => {
  const signature = event.headers['stripe-signature'];
  let stripeEvent;
  try {
    stripeEvent = stripe.webhooks.constructEvent(event.body, signature, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('Signature webhook invalide:', err.message);
    return { statusCode: 400, body: `Webhook Error: ${err.message}` };
  }
  if (stripeEvent.type === 'checkout.session.completed') {
    const session = stripeEvent.data.object;
    const email = session.customer_details?.email || session.customer_email;
    const productKey = session.metadata?.product_key;
    if (email && productKey) {
      await supabase.from('customers').upsert({ email }, { onConflict: 'email' });
      const { error } = await supabase.from('purchases').upsert({
        customer_email: email,
        product_key: productKey,
        stripe_session_id: session.id,
        amount_total: session.amount_total,
      }, { onConflict: 'stripe_session_id' });
      if (error) console.error('Erreur insertion Supabase:', error);
    }
  }
  return { statusCode: 200, body: JSON.stringify({ received: true }) };
};
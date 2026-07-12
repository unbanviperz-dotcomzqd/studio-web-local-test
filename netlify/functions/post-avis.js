const { getStore } = require('@netlify/blobs');

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }
  try {
    const { name, text, level, rating, email } = JSON.parse(event.body || '{}');
    if (!name || !text || !rating || !email) {
      return { statusCode: 400, body: JSON.stringify({ error: 'name, text, rating et email sont requis.' }) };
    }

    /* Vérifie que cet email correspond bien à un achat réel du livre */
    const ownersStore = getStore('book-owners');
    const owns = await ownersStore.get(String(email).toLowerCase());
    if (!owns) {
      return { statusCode: 403, body: JSON.stringify({ error: 'not_verified_owner' }) };
    }

    const store = getStore('avis-data');
    const raw = await store.get('avis-list');
    const avis = raw ? JSON.parse(raw) : [];
    const newAvis = {
      name: String(name).slice(0, 60),
      text: String(text).slice(0, 800),
      level: (level===null || level===undefined || level==='') ? null : Number(level),
      rating: Math.max(1, Math.min(5, Number(rating)||5)),
      date: new Date().toISOString()
      /* l'email n'est jamais stocké dans l'avis public, seulement utilisé pour vérifier */
    };
    avis.unshift(newAvis);
    await store.set('avis-list', JSON.stringify(avis));
    return { statusCode: 200, body: JSON.stringify({ success: true }) };
  } catch (err) {
    console.error('post-avis error:', err);
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};
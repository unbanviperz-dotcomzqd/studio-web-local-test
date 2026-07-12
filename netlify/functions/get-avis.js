const { getStore } = require('@netlify/blobs');

exports.handler = async (event) => {
  if (event.httpMethod !== 'GET') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }
  try {
    const store = getStore('avis-data');
    const raw = await store.get('avis-list');
    const avis = raw ? JSON.parse(raw) : [];
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(avis)
    };
  } catch (err) {
    console.error('get-avis error:', err);
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};
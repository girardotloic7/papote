// ============================================================
// api/groq.js — Proxy serveur pour l'API Groq
// ============================================================
// Ce fichier tourne cote serveur (Vercel), jamais cote client.
// Il recupere la cle API dans les variables d'environnement,
// puis relaie la requete vers Groq, et renvoie la reponse a l'app.
// La cle n'apparait JAMAIS dans le navigateur.
// ============================================================

module.exports = async function handler(req, res) {
  // Securite : on n'accepte que les requetes POST
  if (req.method !== 'POST') {
    return res.status(405).json({
      error: { message: 'Methode non autorisee. Utilise POST.' }
    });
  }

  try {
    // Parse le body si besoin
    let body = req.body;
    if (typeof body === 'string') {
      try { body = JSON.parse(body); } catch (e) { body = {}; }
    }
    body = body || {};

    const messages = body.messages;
    const max_tokens = body.max_tokens || 900;

    // Verification basique des parametres
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({
        error: { message: 'Parametre "messages" manquant ou invalide.' }
      });
    }

    // Verification que la cle est bien configuree sur Vercel
    if (!process.env.GROQ_KEY) {
      return res.status(500).json({
        error: { message: 'GROQ_KEY non configuree sur le serveur.' }
      });
    }

    // Appel a Groq avec la cle secrete (cachee dans les env vars Vercel)
    const groqResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + process.env.GROQ_KEY
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        max_tokens: max_tokens,
        messages: messages
      })
    });

    const data = await groqResponse.json();

    // On renvoie exactement ce que Groq a repondu
    return res.status(groqResponse.ok ? 200 : groqResponse.status).json(data);

  } catch (err) {
    return res.status(500).json({
      error: { message: err.message || 'Erreur serveur inconnue' }
    });
  }
};

// ============================================================
// api/groq.js — Proxy serveur pour l'API Groq
// ============================================================
// Ce fichier tourne côté serveur (Vercel), jamais côté client.
// Il récupère la clé API dans les variables d'environnement,
// puis relaie la requête vers Groq, et renvoie la réponse à l'app.
// La clé n'apparaît JAMAIS dans le navigateur.
// ============================================================

export default async function handler(req, res) {
  // Sécurité : on n'accepte que les requêtes POST
  if (req.method \!== 'POST') {
    return res.status(405).json({
      error: { message: 'Méthode non autorisée. Utilise POST.' }
    });
  }

  try {
    const { messages, max_tokens = 900 } = req.body || {};

    // Vérification basique des paramètres
    if (\!messages || \!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({
        error: { message: 'Paramètre "messages" manquant ou invalide.' }
      });
    }

    // Vérification que la clé est bien configurée sur Vercel
    if (\!process.env.GROQ_KEY) {
      return res.status(500).json({
        error: { message: 'GROQ_KEY non configurée sur le serveur.' }
      });
    }

    // Appel à Groq avec la clé secrète (cachée dans les env vars Vercel)
    const groqResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + process.env.GROQ_KEY
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        max_tokens,
        messages
      })
    });

    const data = await groqResponse.json();

    // On renvoie exactement ce que Groq a répondu
    return res.status(groqResponse.ok ? 200 : groqResponse.status).json(data);

  } catch (err) {
    return res.status(500).json({
      error: { message: err.message || 'Erreur serveur inconnue' }
    });
  }
}

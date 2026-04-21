// ============================================================
// api/groq.js — Proxy serveur pour l'API Groq
// ============================================================
// Ce fichier tourne cote serveur (Vercel), jamais cote client.
// Il recupere la cle API dans les variables d'environnement,
// puis relaie la requete vers Groq, et renvoie la reponse a l'app.
// La cle n'apparait JAMAIS dans le navigateur.
//
// Protections :
//  - Rate limiting (20 requetes/minute par IP)
//  - Timeout de 30s sur l'appel Groq
//  - Plafond max_tokens (2000) et taille body (20000 chars)
//  - Erreurs explicites
// ============================================================

// --- Rate limiting en memoire (reset sur cold start de la fonction) ---
const MAX_REQUESTS_PER_MINUTE = 20;
const WINDOW_MS = 60 * 1000;
const rateLimitStore = new Map(); // IP -> [timestamps]

function checkRateLimit(ip) {
  const now = Date.now();
  const windowStart = now - WINDOW_MS;
  let timestamps = rateLimitStore.get(ip) || [];
  timestamps = timestamps.filter((t) => t > windowStart);
  if (timestamps.length >= MAX_REQUESTS_PER_MINUTE) return false;
  timestamps.push(now);
  rateLimitStore.set(ip, timestamps);
  // Nettoyage occasionnel pour eviter la croissance infinie
  if (rateLimitStore.size > 1000) {
    for (const [key, stamps] of rateLimitStore.entries()) {
      const kept = stamps.filter((t) => t > windowStart);
      if (kept.length === 0) rateLimitStore.delete(key);
      else rateLimitStore.set(key, kept);
    }
  }
  return true;
}

module.exports = async function handler(req, res) {
  // Securite : on n'accepte que les requetes POST
  if (req.method !== 'POST') {
    return res.status(405).json({
      error: { message: 'Methode non autorisee. Utilise POST.' }
    });
  }

  // Rate limiting par IP
  const ip =
    (req.headers['x-forwarded-for'] || '').split(',')[0].trim() ||
    req.headers['x-real-ip'] ||
    'unknown';

  if (!checkRateLimit(ip)) {
    return res.status(429).json({
      error: { message: 'Trop de requetes. Patientez 1 minute avant de reessayer.' }
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
    // Plafond sur max_tokens pour eviter les abus
    const max_tokens = Math.min(Number(body.max_tokens) || 900, 2000);

    // Verification basique des parametres
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({
        error: { message: 'Parametre "messages" manquant ou invalide.' }
      });
    }

    // Limite taille totale du prompt
    const totalChars = messages.reduce(
      (sum, m) => sum + String(m.content || '').length,
      0
    );
    if (totalChars > 20000) {
      return res.status(413).json({
        error: { message: 'Message trop long (limite : 20000 caracteres).' }
      });
    }

    // Verification que la cle est bien configuree sur Vercel
    if (!process.env.GROQ_KEY) {
      return res.status(500).json({
        error: { message: 'GROQ_KEY non configuree sur le serveur.' }
      });
    }

    // Appel a Groq avec timeout de 30s
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);

    try {
      const groqResponse = await fetch(
        'https://api.groq.com/openai/v1/chat/completions',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + process.env.GROQ_KEY
          },
          body: JSON.stringify({
            model: 'llama-3.3-70b-versatile',
            max_tokens: max_tokens,
            messages: messages
          }),
          signal: controller.signal
        }
      );

      clearTimeout(timeoutId);

      const data = await groqResponse.json();

      // On renvoie exactement ce que Groq a repondu
      return res
        .status(groqResponse.ok ? 200 : groqResponse.status)
        .json(data);
    } catch (err) {
      clearTimeout(timeoutId);
      if (err.name === 'AbortError') {
        return res.status(504).json({
          error: {
            message: "L'IA prend trop de temps a repondre. Reessayez dans quelques instants."
          }
        });
      }
      throw err;
    }
  } catch (err) {
    return res.status(500).json({
      error: { message: err.message || 'Erreur serveur inconnue' }
    });
  }
};

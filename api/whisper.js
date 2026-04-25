// ============================================================
// api/whisper.js — Proxy serveur pour la transcription audio via Groq Whisper
// ============================================================
// Reçoit un audio en base64 du client, l'envoie à Groq Whisper (whisper-large-v3)
// et renvoie le texte transcrit. La clé API ne quitte jamais le serveur.
//
// Protections :
//  - Rate limiting (30 requêtes/minute par IP)
//  - Timeout de 30s
//  - Taille audio max 4 MB (≈ 1 min à bitrate normal)
//  - Erreurs explicites
// ============================================================

const MAX_REQUESTS_PER_MINUTE = 30;
const WINDOW_MS = 60 * 1000;
const MAX_AUDIO_BYTES = 3 * 1024 * 1024; // 3 MB raw (≈ 45-60 s)
const rateLimitStore = new Map();

function checkRateLimit(ip) {
  const now = Date.now();
  const windowStart = now - WINDOW_MS;
  let timestamps = rateLimitStore.get(ip) || [];
  timestamps = timestamps.filter((t) => t > windowStart);
  if (timestamps.length >= MAX_REQUESTS_PER_MINUTE) return false;
  timestamps.push(now);
  rateLimitStore.set(ip, timestamps);
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
  if (req.method !== 'POST') {
    return res.status(405).json({
      error: { message: 'Méthode non autorisée. Utilise POST.' }
    });
  }

  const ip =
    (req.headers['x-forwarded-for'] || '').split(',')[0].trim() ||
    req.headers['x-real-ip'] ||
    'unknown';

  if (!checkRateLimit(ip)) {
    return res.status(429).json({
      error: { message: 'Trop de requêtes. Patientez 1 minute avant de réessayer.' }
    });
  }

  try {
    let body = req.body;
    if (typeof body === 'string') {
      try { body = JSON.parse(body); } catch (e) { body = {}; }
    }
    body = body || {};

    const audioB64 = body.audio;
    const mimeType = (body.mimeType || 'audio/webm').toString();
    const language = (body.language || 'fr').toString();

    if (!audioB64 || typeof audioB64 !== 'string') {
      return res.status(400).json({
        error: { message: 'Paramètre "audio" (base64) manquant.' }
      });
    }

    if (!process.env.GROQ_KEY) {
      return res.status(500).json({
        error: { message: 'GROQ_KEY non configurée sur le serveur.' }
      });
    }

    // Décoder le base64
    let buffer;
    try {
      buffer = Buffer.from(audioB64, 'base64');
    } catch (e) {
      return res.status(400).json({
        error: { message: 'Audio base64 invalide.' }
      });
    }

    if (buffer.length === 0) {
      return res.status(400).json({
        error: { message: 'Audio vide.' }
      });
    }
    if (buffer.length > MAX_AUDIO_BYTES) {
      return res.status(413).json({
        error: { message: 'Audio trop long (max ≈ 1 minute).' }
      });
    }

    // Choisir l'extension de fichier selon le mimeType (Whisper en a besoin)
    const ext =
      mimeType.includes('mp4') || mimeType.includes('m4a') ? 'm4a' :
      mimeType.includes('mpeg') || mimeType.includes('mp3') ? 'mp3' :
      mimeType.includes('wav') ? 'wav' :
      mimeType.includes('ogg') ? 'ogg' :
      mimeType.includes('webm') ? 'webm' :
      'webm';

    // Construire le multipart/form-data pour Groq
    // (FormData et Blob sont natifs dans Node 18+ sur Vercel)
    const formData = new FormData();
    const blob = new Blob([buffer], { type: mimeType });
    formData.append('file', blob, `audio.${ext}`);
    formData.append('model', 'whisper-large-v3');
    if (language) formData.append('language', language);
    formData.append('response_format', 'json');
    formData.append('temperature', '0');

    // Appel à Groq avec timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);

    try {
      const groqResponse = await fetch(
        'https://api.groq.com/openai/v1/audio/transcriptions',
        {
          method: 'POST',
          headers: {
            'Authorization': 'Bearer ' + process.env.GROQ_KEY
          },
          body: formData,
          signal: controller.signal
        }
      );

      clearTimeout(timeoutId);

      const data = await groqResponse.json();

      if (!groqResponse.ok) {
        return res.status(groqResponse.status).json({
          error: { message: (data && data.error && data.error.message) || 'Erreur transcription' }
        });
      }

      // Whisper renvoie { text: "..." }
      return res.status(200).json({ text: (data && data.text) || '' });

    } catch (err) {
      clearTimeout(timeoutId);
      if (err.name === 'AbortError') {
        return res.status(504).json({
          error: { message: "La transcription prend trop de temps. Réessaie avec un audio plus court." }
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

// Config Vercel : autoriser un body plus gros pour l'audio en base64
module.exports.config = {
  api: {
    bodyParser: { sizeLimit: '5mb' }
  }
};

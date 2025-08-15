import { Router } from 'express';
import { ensureAuthenticated } from '../config/session.js';
import { insertDocument, searchDocuments } from '../db/init.js';

const router = Router();

function parseEmbedding(input) {
  if (Array.isArray(input)) return input;
  if (typeof input === 'string') {
    return JSON.parse(input);
  }
  throw new Error('Invalid embedding format');
}

router.post('/insert', ensureAuthenticated, async (req, res) => {
  try {
    const { namespace, content, embedding } = req.body;
    if (!namespace || !content || !embedding) {
      return res.status(400).json({ error: 'namespace, content, embedding are required' });
    }
    const vector = parseEmbedding(embedding);
    const result = await insertDocument({ namespace, content, embedding: vector });
    res.json({ id: result.id });
  } catch (e) {
    res.status(500).json({ error: 'Insert failed', detail: String(e?.message || e) });
  }
});

router.post('/search', ensureAuthenticated, async (req, res) => {
  try {
    const { namespace, embedding, limit } = req.body;
    if (!namespace || !embedding) {
      return res.status(400).json({ error: 'namespace and embedding are required' });
    }
    const vector = parseEmbedding(embedding);
    const results = await searchDocuments({ namespace, embedding: vector, limit: Number(limit || 5) });
    res.json({ results });
  } catch (e) {
    res.status(500).json({ error: 'Search failed', detail: String(e?.message || e) });
  }
});

export default router;



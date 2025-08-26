import { Router } from 'express';
import { ensureAuthenticated } from '../middleware/auth.js';
import { 
  insertDocument, 
  searchDocuments, 
  deleteDocument, 
  getDocumentsByNamespace 
} from '../db/init.js';

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
    const { namespace, content, embedding, metadata } = req.body;
    if (!namespace || !content || !embedding) {
      return res.status(400).json({ error: 'namespace, content, embedding are required' });
    }
    
    const vector = parseEmbedding(embedding);
    if (!Array.isArray(vector) || vector.length === 0) {
      return res.status(400).json({ error: 'embedding must be a valid array of numbers' });
    }
    
    const result = await insertDocument({ 
      namespace, 
      content, 
      embedding: vector, 
      metadata: metadata || {} 
    });
    
    res.json({ 
      id: result.id, 
      namespace: result.namespace,
      created_at: result.created_at 
    });
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
    if (!Array.isArray(vector) || vector.length === 0) {
      return res.status(400).json({ error: 'embedding must be a valid array of numbers' });
    }
    
    const results = await searchDocuments({ 
      namespace, 
      embedding: vector, 
      limit: Number(limit || 5) 
    });
    
    res.json({ results });
  } catch (e) {
    res.status(500).json({ error: 'Search failed', detail: String(e?.message || e) });
  }
});

// Get documents by namespace
router.get('/documents/:namespace', ensureAuthenticated, async (req, res) => {
  try {
    const { namespace } = req.params;
    const { limit } = req.query;
    
    const documents = await getDocumentsByNamespace(namespace, Number(limit || 100));
    res.json({ documents });
  } catch (e) {
    res.status(500).json({ error: 'Failed to get documents', detail: String(e?.message || e) });
  }
});

// Delete a document
router.delete('/documents/:id', ensureAuthenticated, async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await deleteDocument(Number(id));
    
    if (deleted) {
      res.json({ success: true, message: 'Document deleted successfully' });
    } else {
      res.status(404).json({ error: 'Document not found' });
    }
  } catch (e) {
    res.status(500).json({ error: 'Delete failed', detail: String(e?.message || e) });
  }
});

export default router;



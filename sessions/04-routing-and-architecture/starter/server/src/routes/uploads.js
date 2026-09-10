/**
 * In-memory file upload — real `multipart/form-data`, so Session 7's homework
 * uses a genuine `FormData` + progress flow rather than a base64 shortcut.
 * Files live in memory and vanish on reset, which is right for a workshop.
 */
import { Router } from 'express';
import multer from 'multer';
import { getDb } from '../db/store.js';
import { requireAuth } from '../middleware/auth.js';
import { unprocessable, notFound } from '../lib/errors.js';

const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED = ['image/png', 'image/jpeg', 'image/webp', 'image/gif', 'image/svg+xml'];

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_BYTES, files: 5 },
});

const router = Router();

router.post('/uploads', requireAuth, (req, res, next) => {
  upload.array('files', 5)(req, res, (err) => {
    if (err) {
      // multer's own errors, mapped onto the field so RHF can show them.
      return next(unprocessable({ files: err.code === 'LIMIT_FILE_SIZE' ? 'Each file must be under 5 MB' : err.message }));
    }
    try {
      const files = req.files ?? [];
      if (!files.length) throw unprocessable({ files: 'Choose at least one file' });

      const rejected = files.filter((f) => !ALLOWED.includes(f.mimetype));
      if (rejected.length) {
        throw unprocessable({ files: `Unsupported file type: ${rejected.map((f) => f.mimetype).join(', ')}. Allowed: PNG, JPEG, WebP, GIF, SVG.` });
      }
      const uploads = getDb().uploads;
      const data = files.map((f, i) => {
        const id = `upl_${Date.now().toString(36)}_${i}`;
        uploads.set(id, { id, buffer: f.buffer, mimetype: f.mimetype, originalName: f.originalname, size: f.size, uploadedBy: req.user.id, uploadedAt: new Date().toISOString() });
        return { id, url: `/api/uploads/${id}`, name: f.originalname, size: f.size, mimetype: f.mimetype };
      });
      res.status(201).json({ data });
    } catch (e) { next(e); }
  });
});

router.get('/uploads/:id', (req, res, next) => {
  try {
    const file = getDb().uploads.get(req.params.id);
    if (!file) throw notFound('Upload');
    res.type(file.mimetype);
    res.set('Cache-Control', 'public, max-age=3600');
    res.send(file.buffer);
  } catch (err) { next(err); }
});

router.delete('/uploads/:id', requireAuth, (req, res, next) => {
  try {
    if (!getDb().uploads.delete(req.params.id)) throw notFound('Upload');
    res.status(204).end();
  } catch (err) { next(err); }
});

export default router;

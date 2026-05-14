const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const prisma = require('../prismaClient');
const { isAuthenticated } = require('../middleware/auth');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'uploads/documents';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['.pdf', '.txt', '.doc', '.docx', '.jpg', '.jpeg', '.png', '.bmp', '.tiff'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedTypes.includes(ext)) cb(null, true);
    else cb(new Error('Invalid file type.'));
  }
});

// Get all documents for user
router.get('/', isAuthenticated, async (req, res) => {
  try {
    const userId = parseInt(req.user.id, 10);
    const documents = await prisma.document.findMany({ where: { userId }, orderBy: { createdAt: 'desc' } });
    res.json({ documents });
  } catch (error) {
    console.error('Error fetching documents (Prisma):', error);
    res.status(500).json({ error: 'Failed to fetch documents' });
  }
});

// Upload document
router.post('/upload', isAuthenticated, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

    const userId = parseInt(req.user.id, 10);
    const document = await prisma.document.create({
      data: {
        userId,
        fileName: req.file.filename,
        originalName: req.file.originalname,
        fileType: path.extname(req.file.originalname),
        fileSize: req.file.size,
        filePath: req.file.path,
        description: req.body.description || null,
        tags: req.body.tags ? JSON.parse(req.body.tags) : null,
        category: req.body.category || 'General'
      }
    });

    res.json({ success: true, document, message: 'Document uploaded successfully' });
  } catch (error) {
    console.error('Error uploading document (Prisma):', error);
    res.status(500).json({ error: 'Failed to upload document' });
  }
});

// Get single document
router.get('/:id', isAuthenticated, async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const userId = parseInt(req.user.id, 10);
    const document = await prisma.document.findFirst({ where: { id, userId } });
    if (!document) return res.status(404).json({ error: 'Document not found' });
    res.json({ document });
  } catch (error) {
    console.error('Error fetching document (Prisma):', error);
    res.status(500).json({ error: 'Failed to fetch document' });
  }
});

// Update document metadata
router.put('/:id', isAuthenticated, async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const userId = parseInt(req.user.id, 10);
    const { description, tags, category, incrementSessionCount } = req.body;

    const existing = await prisma.document.findFirst({ where: { id, userId } });
    if (!existing) return res.status(404).json({ error: 'Document not found' });

    const data = {};
    if (description !== undefined) data.description = description;
    if (tags !== undefined) data.tags = tags;
    if (category !== undefined) data.category = category;
    if (incrementSessionCount === true) data.sessionCount = (existing.sessionCount || 0) + 1;

    const updated = await prisma.document.update({ where: { id }, data });
    res.json({ success: true, document: updated, message: 'Document updated successfully' });
  } catch (error) {
    console.error('Error updating document (Prisma):', error);
    res.status(500).json({ error: 'Failed to update document' });
  }
});

// Delete document
router.delete('/:id', isAuthenticated, async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const userId = parseInt(req.user.id, 10);
    const document = await prisma.document.findFirst({ where: { id, userId } });
    if (!document) return res.status(404).json({ error: 'Document not found' });

    // Delete physical file
    if (fs.existsSync(document.filePath)) fs.unlinkSync(document.filePath);

    await prisma.document.delete({ where: { id } });
    res.json({ success: true, message: 'Document deleted successfully' });
  } catch (error) {
    console.error('Error deleting document (Prisma):', error);
    res.status(500).json({ error: 'Failed to delete document' });
  }
});

module.exports = router;

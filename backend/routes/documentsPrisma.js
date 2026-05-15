const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const prisma = require('../prismaClient');
const { isAuthenticated } = require('../middleware/auth');
const { saveFileBlob, getFileBlob, deleteFileBlob, ensureStorageDir } = require('../utils/blobStorage');

// Ensure storage directory exists
ensureStorageDir();

// Configure multer for file uploads (temporary storage)
const storage = multer.memoryStorage(); // Store in memory first

const upload = multer({
  storage,
  limits: { fileSize: 100 * 1024 * 1024 }, // 100MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['.pdf', '.txt', '.doc', '.docx', '.jpg', '.jpeg', '.png', '.bmp', '.tiff'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedTypes.includes(ext)) cb(null, true);
    else cb(new Error('Invalid file type.'));
  }
});

// Get all documents for user with sorting options
router.get('/', isAuthenticated, async (req, res) => {
  try {
    const userId = parseInt(req.user.id, 10);
    const { sortBy = 'createdAt', sortOrder = 'desc', category } = req.query;
    
    // Build where clause for filtering
    const where = { userId };
    if (category) {
      where.category = category;
    }
    
    // Build orderBy clause
    const orderBy = {};
    const validSortFields = ['createdAt', 'fileName', 'fileSize', 'originalName'];
    const sortField = validSortFields.includes(sortBy) ? sortBy : 'createdAt';
    orderBy[sortField] = sortOrder === 'asc' ? 'asc' : 'desc';
    
    const documents = await prisma.document.findMany({
      where,
      orderBy,
      select: {
        id: true,
        userId: true,
        fileName: true,
        originalName: true,
        fileType: true,
        fileSize: true,
        description: true,
        tags: true,
        category: true,
        isProcessed: true,
        sessionCount: true,
        createdAt: true,
        updatedAt: true
        // Exclude fileBlob from list queries to reduce payload
      }
    });
    
    res.json({ documents });
  } catch (error) {
    console.error('Error fetching documents:', error);
    res.status(500).json({ error: 'Failed to fetch documents' });
  }
});

// Upload document
router.post('/upload', isAuthenticated, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const userId = parseInt(req.user.id, 10);
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const fileName = uniqueSuffix + path.extname(req.file.originalname);
    
    // Save blob to configured storage
    const blobInfo = await saveFileBlob(req.file.buffer, fileName);
    
    // Create document record with metadata
    const document = await prisma.document.create({
      data: {
        userId,
        fileName: blobInfo.storagePath || fileName,
        originalName: req.file.originalname,
        fileType: path.extname(req.file.originalname),
        fileSize: req.file.size,
        filePath: blobInfo.filePath,
        fileBlob: blobInfo.fileBlob,
        storagePath: blobInfo.storagePath,
        description: req.body.description || null,
        tags: req.body.tags ? (typeof req.body.tags === 'string' ? JSON.parse(req.body.tags) : req.body.tags) : null,
        category: req.body.category || 'General'
      }
    });

    res.json({
      success: true,
      document: {
        id: document.id,
        fileName: document.originalName,
        originalName: document.originalName,
        fileType: document.fileType,
        fileSize: document.fileSize,
        category: document.category,
        description: document.description,
        tags: document.tags,
        createdAt: document.createdAt
      },
      message: 'Document uploaded successfully'
    });
  } catch (error) {
    console.error('Error uploading document:', error);
    res.status(500).json({ error: error.message || 'Failed to upload document' });
  }
});

// Get single document (metadata only)
router.get('/:id', isAuthenticated, async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const userId = parseInt(req.user.id, 10);
    
    const document = await prisma.document.findFirst({
      where: { id, userId },
      select: {
        id: true,
        userId: true,
        fileName: true,
        originalName: true,
        fileType: true,
        fileSize: true,
        description: true,
        tags: true,
        category: true,
        isProcessed: true,
        sessionCount: true,
        createdAt: true,
        updatedAt: true
      }
    });
    
    if (!document) {
      return res.status(404).json({ error: 'Document not found' });
    }
    
    res.json({ document });
  } catch (error) {
    console.error('Error fetching document:', error);
    res.status(500).json({ error: 'Failed to fetch document' });
  }
});

// Download document (retrieve blob)
router.get('/:id/download', isAuthenticated, async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const userId = parseInt(req.user.id, 10);
    
    const document = await prisma.document.findFirst({
      where: { id, userId }
    });
    
    if (!document) {
      return res.status(404).json({ error: 'Document not found' });
    }
    
    // Retrieve blob from configured storage
    const fileBuffer = await getFileBlob(document);
    
    res.setHeader('Content-Type', 'application/octet-stream');
    res.setHeader('Content-Disposition', `attachment; filename="${document.originalName}"`);
    res.setHeader('Content-Length', fileBuffer.length);
    res.send(fileBuffer);
  } catch (error) {
    console.error('Error downloading document:', error);
    res.status(500).json({ error: error.message || 'Failed to download document' });
  }
});

// Update document metadata
router.put('/:id', isAuthenticated, async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const userId = parseInt(req.user.id, 10);
    const { description, tags, category, incrementSessionCount } = req.body;

    const existing = await prisma.document.findFirst({ where: { id, userId } });
    if (!existing) {
      return res.status(404).json({ error: 'Document not found' });
    }

    const data = {};
    if (description !== undefined) data.description = description;
    if (tags !== undefined) data.tags = tags;
    if (category !== undefined) data.category = category;
    if (incrementSessionCount === true) data.sessionCount = (existing.sessionCount || 0) + 1;

    const updated = await prisma.document.update({
      where: { id },
      data,
      select: {
        id: true,
        fileName: true,
        originalName: true,
        fileType: true,
        fileSize: true,
        description: true,
        tags: true,
        category: true,
        isProcessed: true,
        sessionCount: true,
        createdAt: true,
        updatedAt: true
      }
    });
    
    res.json({ success: true, document: updated, message: 'Document updated successfully' });
  } catch (error) {
    console.error('Error updating document:', error);
    res.status(500).json({ error: 'Failed to update document' });
  }
});

// Delete document
router.delete('/:id', isAuthenticated, async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const userId = parseInt(req.user.id, 10);
    
    const document = await prisma.document.findFirst({ where: { id, userId } });
    if (!document) {
      return res.status(404).json({ error: 'Document not found' });
    }

    // Delete blob from configured storage
    await deleteFileBlob(document);

    // Delete database record
    await prisma.document.delete({ where: { id } });
    
    res.json({ success: true, message: 'Document deleted successfully' });
  } catch (error) {
    console.error('Error deleting document:', error);
    res.status(500).json({ error: 'Failed to delete document' });
  }
});

module.exports = router;

const fs = require('fs');
const path = require('path');

// Configuration from .env
const BLOB_STORAGE_TYPE = process.env.BLOB_STORAGE_TYPE || 'file'; // 'file' or 'database'
const BLOB_STORAGE_PATH = process.env.BLOB_STORAGE_PATH || path.join(__dirname, '..', 'uploads', 'documents');

/**
 * Ensure storage directory exists
 */
const ensureStorageDir = () => {
  if (BLOB_STORAGE_TYPE === 'file' && !fs.existsSync(BLOB_STORAGE_PATH)) {
    fs.mkdirSync(BLOB_STORAGE_PATH, { recursive: true });
  }
};

/**
 * Save file blob to configured storage
 * @param {Buffer} fileBuffer - File content as buffer
 * @param {string} fileName - Unique file name
 * @returns {Object} { filePath, fileBlob } - Storage references
 */
const saveFileBlob = async (fileBuffer, fileName) => {
  ensureStorageDir();

  if (BLOB_STORAGE_TYPE === 'file') {
    // Store on filesystem
    const filePath = path.join(BLOB_STORAGE_PATH, fileName);
    fs.writeFileSync(filePath, fileBuffer);
    return {
      filePath,
      fileBlob: null,
      storagePath: filePath,
      storageType: 'file'
    };
  } else if (BLOB_STORAGE_TYPE === 'database') {
    // Store in database as binary blob
    return {
      filePath: null,
      fileBlob: fileBuffer,
      storagePath: `db://blob/${fileName}`,
      storageType: 'database'
    };
  } else {
    throw new Error(`Unsupported BLOB_STORAGE_TYPE: ${BLOB_STORAGE_TYPE}`);
  }
};

/**
 * Retrieve file blob from configured storage
 * @param {Object} document - Document record with filePath or fileBlob
 * @returns {Buffer} File content
 */
const getFileBlob = async (document) => {
  if (!document) {
    throw new Error('Document not found');
  }

  if (BLOB_STORAGE_TYPE === 'file') {
    if (!document.filePath) {
      throw new Error('File path not found in document record');
    }
    return fs.readFileSync(document.filePath);
  } else if (BLOB_STORAGE_TYPE === 'database') {
    if (!document.fileBlob) {
      throw new Error('File blob not found in document record');
    }
    return document.fileBlob;
  } else {
    throw new Error(`Unsupported BLOB_STORAGE_TYPE: ${BLOB_STORAGE_TYPE}`);
  }
};

/**
 * Delete file blob from configured storage
 * @param {Object} document - Document record with filePath or fileBlob
 */
const deleteFileBlob = async (document) => {
  if (!document) return;

  if (BLOB_STORAGE_TYPE === 'file') {
    if (document.filePath && fs.existsSync(document.filePath)) {
      fs.unlinkSync(document.filePath);
    }
  } else if (BLOB_STORAGE_TYPE === 'database') {
    // Database blob will be deleted by Prisma when document is deleted
  }
};

/**
 * Get current blob storage info
 */
const getStorageInfo = () => ({
  type: BLOB_STORAGE_TYPE,
  path: BLOB_STORAGE_PATH,
  configured: true
});

module.exports = {
  saveFileBlob,
  getFileBlob,
  deleteFileBlob,
  getStorageInfo,
  ensureStorageDir,
  BLOB_STORAGE_TYPE,
  BLOB_STORAGE_PATH
};

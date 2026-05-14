const mongoose = require('mongoose');

const documentSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  fileName: {
    type: String,
    required: true
  },
  originalName: {
    type: String,
    required: true
  },
  fileType: {
    type: String,
    required: true
  },
  fileSize: {
    type: Number,
    required: true
  },
  filePath: {
    type: String,
    required: true
  },
  description: String,
  tags: [String],
  category: String,
  isProcessed: {
    type: Boolean,
    default: false
  },
  sessionCount: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

documentSchema.index({ userId: 1, createdAt: -1 });
documentSchema.index({ fileName: 'text', originalName: 'text', tags: 'text' });

module.exports = mongoose.model('Document', documentSchema);

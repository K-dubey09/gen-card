const mongoose = require('mongoose');

const cardSchema = new mongoose.Schema({
  title: String,
  category: String,
  content: String,
  keyPoints: [String],
  summary: String,
  importance: Number,
  color: String,
  imageUrl: String,
  imageKeyword: String
});

const sessionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: true
  },
  topic: {
    type: String,
    default: ''
  },
  cards: [cardSchema],
  roadmap: {
    type: mongoose.Schema.Types.Mixed,
    default: null
  },
  sourceType: {
    type: String,
    enum: ['file', 'text'],
    required: true
  },
  sourceFileName: String,
  creditsUsed: {
    type: Number,
    default: 0
  },
  tags: [String],
  isFavorite: {
    type: Boolean,
    default: false
  },
  viewCount: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Add indexes for better query performance
sessionSchema.index({ userId: 1, createdAt: -1 });
sessionSchema.index({ title: 'text', topic: 'text', tags: 'text' });

module.exports = mongoose.model('Session', sessionSchema);

const mongoose = require('mongoose');

const n8nQueueSchema = new mongoose.Schema({
  invoiceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Invoice',
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  clientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Client'
  },
  payload: {
    type: Object,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'failed', 'completed'],
    default: 'pending'
  },
  errorLog: {
    type: String,
    default: ''
  },
  retries: {
    type: Number,
    default: 0
  },
  lastAttempt: {
    type: Date
  }
}, { timestamps: true });

module.exports = mongoose.model('N8nQueue', n8nQueueSchema);

const mongoose = require('mongoose');

const activitySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    action: {
      type: String,
      required: true,
      enum: [
        'invoice_created', 'invoice_updated', 'invoice_deleted',
        'client_created', 'client_updated', 'client_deleted',
        'reminder_sent', 'invoice_sent', 'status_changed',
      ],
    },
    targetType: {
      type: String,
      required: true,
      enum: ['invoice', 'client', 'reminder'],
    },
    targetId: {
      type: mongoose.Schema.Types.ObjectId,
    },
    description: {
      type: String,
      required: true,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Activity', activitySchema);

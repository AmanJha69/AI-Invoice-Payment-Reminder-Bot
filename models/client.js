const mongoose = require('mongoose');

const clientSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
    },
    phone: String,
    company: String,
    address: String,
    city: String,
    state: String,
    zipCode: String,
    country: String,
  },
  { timestamps: true }
);

module.exports = mongoose.model('Client', clientSchema);
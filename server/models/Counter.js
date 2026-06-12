const mongoose = require('mongoose');

// Atomic sequence generator for invoice numbers.
const counterSchema = new mongoose.Schema({
  _id: { type: String, required: true }, // e.g. 'invoice'
  seq: { type: Number, default: 0 },
});

counterSchema.statics.next = async function (key) {
  const doc = await this.findByIdAndUpdate(
    key,
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );
  return doc.seq;
};

module.exports = mongoose.models.Counter || mongoose.model('Counter', counterSchema);

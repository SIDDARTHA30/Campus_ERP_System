const mongoose = require('mongoose');

const MaterialSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String },
    subject: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject', required: true },
    faculty: { type: mongoose.Schema.Types.ObjectId, ref: 'Faculty', required: true },
    classId: { type: String },
    fileUrl: { type: String },
    tags: [{ type: String }],
    uploadedAt: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Material', MaterialSchema);

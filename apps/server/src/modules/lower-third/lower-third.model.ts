import mongoose from "mongoose";

const lowerThirdTemplateSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    templateId: { type: String, required: true },
    name: { type: String, required: true },
    data: { type: String, required: true }, // JSON-serialized template object
    thumbnail: { type: String, default: null }, // R2 CDN URL or null
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Compound unique index: one templateId per user
lowerThirdTemplateSchema.index({ userId: 1, templateId: 1 }, { unique: true });

lowerThirdTemplateSchema.virtual("id").get(function () {
  return this._id.toHexString();
});

export const LowerThirdTemplate = mongoose.model(
  "LowerThirdTemplate",
  lowerThirdTemplateSchema
);

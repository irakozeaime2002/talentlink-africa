import mongoose, { Schema, Document } from "mongoose";

export interface IAdvertisement extends Document {
  title: string;
  description: string;
  imageUrl?: string;
  linkUrl: string;
  linkLabel: string;
  dueDate?: Date;
  badge?: string;
  active: boolean;
  createdAt: Date;
}

const AdvertisementSchema = new Schema<IAdvertisement>({
  title:       { type: String, required: true },
  description: { type: String, required: true },
  imageUrl:    { type: String },
  linkUrl:     { type: String },
  linkLabel:   { type: String, default: "Learn More" },
  dueDate:     { type: Date },
  badge:       { type: String },
  active:      { type: Boolean, default: true },
}, { timestamps: true });

export const Advertisement = mongoose.model<IAdvertisement>("Advertisement", AdvertisementSchema);

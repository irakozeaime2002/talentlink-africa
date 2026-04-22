import { Request, Response, NextFunction } from "express";
import { ContactMessage } from "../models/ContactMessage";

// Create a new contact message (public endpoint)
export const createContactMessage = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { name, email, subject, message } = req.body;

    if (!name || !email || !subject || !message) {
      res.status(400).json({ error: "All fields are required" });
      return;
    }

    const contactMessage = await ContactMessage.create({
      name,
      email,
      subject,
      message,
      status: "new",
    });

    res.status(201).json({ message: "Message sent successfully", id: contactMessage._id });
  } catch (err) {
    next(err);
  }
};

// Get all contact messages (admin only)
export const getAllContactMessages = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const messages = await ContactMessage.find().sort({ createdAt: -1 });
    res.json(messages);
  } catch (err) {
    next(err);
  }
};

// Get single contact message (admin only)
export const getContactMessage = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const message = await ContactMessage.findById(req.params.id);
    if (!message) {
      res.status(404).json({ error: "Message not found" });
      return;
    }

    // Mark as read if it's new
    if (message.status === "new") {
      message.status = "read";
      await message.save();
    }

    res.json(message);
  } catch (err) {
    next(err);
  }
};

// Update message status (admin only)
export const updateContactMessageStatus = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { status } = req.body;

    if (!["new", "read", "replied"].includes(status)) {
      res.status(400).json({ error: "Invalid status" });
      return;
    }

    const message = await ContactMessage.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );

    if (!message) {
      res.status(404).json({ error: "Message not found" });
      return;
    }

    res.json(message);
  } catch (err) {
    next(err);
  }
};

// Delete contact message (admin only)
export const deleteContactMessage = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const message = await ContactMessage.findByIdAndDelete(req.params.id);
    if (!message) {
      res.status(404).json({ error: "Message not found" });
      return;
    }
    res.json({ message: "Message deleted" });
  } catch (err) {
    next(err);
  }
};

import mongoose from "mongoose";

export const connectDB = async (): Promise<void> => {
  const uri = process.env.MONGODB_URI as string;
  
  if (!uri) {
    throw new Error("MONGODB_URI is not defined in .env file");
  }
  
  try {
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 10000, // Timeout after 10s instead of 30s
      socketTimeoutMS: 45000,
    });
    console.log("✓ MongoDB connected successfully");
  } catch (error: any) {
    console.error("✗ MongoDB connection failed:");
    console.error("  Error:", error.message);
    console.error("\n  Possible causes:");
    console.error("  1. Internet connection issue");
    console.error("  2. MongoDB Atlas IP whitelist - add your IP at https://cloud.mongodb.com");
    console.error("  3. Firewall blocking MongoDB port (27017)");
    console.error("  4. VPN or proxy interfering with connection");
    console.error("\n  Retrying in 5 seconds...");
    
    // Retry after 5 seconds
    await new Promise(resolve => setTimeout(resolve, 5000));
    return connectDB();
  }
};

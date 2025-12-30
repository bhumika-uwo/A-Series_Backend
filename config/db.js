import mongoose from 'mongoose';



const URI = process.env.MONGODB_ATLAS_URI || process.env.MONGODB_URI;

if (!URI) {
  console.error("❌ ERROR: MongoDB URI not found in environment variables.");
  console.error("Please set MONGODB_ATLAS_URI or MONGODB_URI in your .env file.");
}

const connectDB = async () => {
  try {
    await mongoose.connect(URI);
    console.log('MongoDB Connected Successfully');
  } catch (err) {
    console.error('MongoDB connection error:', err.message);
    process.exit(1);
  }
};

export default connectDB;
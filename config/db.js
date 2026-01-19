import mongoose from 'mongoose';
import { MONGO_URI } from './env.js';
import logger from '../utils/logger.js';
<<<<<<< HEAD

console.log("MONGO_URI",MONGO_URI);
=======
console.log("MONGO_URI", MONGO_URI);
>>>>>>> b7f3ca0a19f5798dc23cd843750316dcad2f2440
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(MONGO_URI, {
      serverSelectionTimeoutMS: 30000,
      socketTimeoutMS: 45000,
    });
    logger.info(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    logger.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

export default connectDB;

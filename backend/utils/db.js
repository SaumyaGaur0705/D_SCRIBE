import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config({});

const connectToMongo = async () => {
  try {
    // Connect using Mongoose
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected successfully to MongoDB');
  } catch (err) {
    console.error('Error connecting to MongoDB:', err);
  }
};

export default connectToMongo;

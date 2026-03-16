const mongoose = require('mongoose');

const connectDB = async () => {
  const atlasUri = process.env.MONGODB_URI;
  const localUri = 'mongodb://localhost:27017/growth-valley';

  // Try Atlas first, then fall back to local MongoDB
  const uris = atlasUri ? [atlasUri, localUri] : [localUri];

  const options = {
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
  };

  for (const uri of uris) {
    try {
      const conn = await mongoose.connect(uri, options);
      console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
      return;
    } catch (error) {
      const isAtlas = uri.includes('mongodb+srv');
      console.error(`❌ Failed to connect to ${isAtlas ? 'MongoDB Atlas' : 'Local MongoDB'}: ${error.message}`);

      if (isAtlas) {
        console.error('   Trying local MongoDB as fallback...');
      }
    }
  }

  // If all connections failed
  console.error('\n❌ Could not connect to any MongoDB instance.');
  console.error('\n📋 To fix this:');
  console.error('1. For MongoDB Atlas: Whitelist your IP at https://cloud.mongodb.com → Network Access → Add IP');
  console.error('2. For Local MongoDB: Install MongoDB locally or run with Docker:');
  console.error('   docker run -d -p 27017:27017 --name mongodb mongo:latest');
  process.exit(1);
};

module.exports = connectDB;
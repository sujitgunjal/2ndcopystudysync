

// import express from 'express';
// import cors from 'cors';
// import multer from 'multer';
// import { GridFsStorage } from 'multer-gridfs-storage';
// // import mongoose from 'mongoose';
// const mongoose = require('mongoose');
// import dotenv from 'dotenv';
// import path from 'path';
// import crypto from 'crypto';

// dotenv.config();

// const app = express();

// // Enable CORS so frontend on a different port can call your server
// app.use(cors(
//   {
//     origin: 'http://localhost:5173',
//     credentials: true
//   }
// ));

// // If you want to parse JSON bodies for other endpoints (optional)
// app.use(express.json());
// app.use(express.urlencoded({ extended: true }));

// // Connect to MongoDB Atlas
// const mongoURI = process.env.MONGO_URI || '';
// console.log(mongoURI)
// mongoose
//   .connect(mongoURI
//     // @ts-ignore - Some older type definitions require ignoring these
    
//   )
//   .then(() => console.log('MongoDB connected successfully'))
//   .catch((err) => console.error('MongoDB connection error:', err));

// // Access the default mongoose connection
// const conn = mongoose.connection;

// // Initialize GridFS once connection is open
// let gfs;
// conn.once('open', () => {
//   const Grid = require('gridfs-stream');
//   gfs = new Grid(conn.db, mongoose.mongo);
//   gfs.collection('uploads'); // The collection name in MongoDB
// });

// // Create a GridFsStorage instance for multer
// const storage = new GridFsStorage({
//   url: mongoURI,
//   file: (req, file) => {
//     return new Promise((resolve, reject) => {
//       crypto.randomBytes(16, (err, buf) => {
//         if (err) return reject(err);

//         const filename = buf.toString('hex') + path.extname(file.originalname);
//         const fileInfo = {
//           filename,
//           bucketName: 'uploads', // Must match gfs.collection() above
//         };
//         resolve(fileInfo);
//       });
//     });
//   },
// });

// // Cast storage to multer.StorageEngine to satisfy TypeScript type mismatch
// const upload = multer({ storage });


// // Endpoint for uploading notes
// app.post('/upload/notes', upload.single('file'), (req, res) => {
//   const { title } = req.body;
//   console.log('Title:', title);

//   if (!req.file) {
//     res.status(400).json({ error: 'No file was uploaded' });
//     return;
//   }
//   res.json({ message: 'Upload successful!', file: req.file, title });
// });

// // Endpoint for uploading question papers
// app.post('/upload/question-paper', upload.single('file'), (req, res) => {
//   if (!req.file) {
//     res.status(400).json({ error: 'No file was uploaded' });
//     return;
//   }
//   res.json({ message: 'Upload successful!', file: req.file });
// });
// // Start the server
// const PORT = process.env.PORT || 5000;
// app.listen(PORT, () => {
//   console.log(`Server started on port ${PORT}`);
// });


const { GridFSBucket } = require('mongodb');
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const crypto = require('crypto');

dotenv.config();

const app = express();

// Enable CORS so frontend on a different port can call your server
app.use(
  cors({
    origin: ['http://localhost:5173', 'http://localhost:5174'],
    credentials: true,
  })
);

// If you want to parse JSON bodies for other endpoints (optional)
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Connect to MongoDB Atlas
const mongoURI = process.env.MONGO_URI || '';
console.log(mongoURI);
mongoose
  .connect(mongoURI)
  .then(() => console.log('MongoDB connected successfully'))
  .catch((err) => console.error('MongoDB connection error:', err));

// Access the default mongoose connection
const conn = mongoose.connection;

// Initialize GridFS once connection is open
let gfs, gridFSBucket;
conn.once("open", () => {
    gridFSBucket = new GridFSBucket(conn.db, { bucketName: "uploads" });
    console.log("✅ GridFS Initialized");
});

// conn.once('open', () => {
//   const Grid = require('gridfs-stream');
//   gfs = new Grid(conn.db, mongoose.mongo);
//   gfs.collection('uploads'); // The collection name in MongoDB
// });

// Create a GridFsStorage instance for multer
// const storage = new GridFsStorage({
//   url: mongoURI,
//   file: (req, file) => {
//     return new Promise((resolve, reject) => {
//       crypto.randomBytes(16, (err, buf) => {
//         if (err) return reject(err);

//         const filename = buf.toString('hex') + path.extname(file.originalname);
//         const fileInfo = {
//           filename,
//           bucketName: 'uploads', // Must match gfs.collection() above
//         };
//         resolve(fileInfo);
//       });
//     });
//   },
// });

// Create the multer instance using the storage engine
const storage = multer.memoryStorage(); // Store in memory before uploading
const upload = multer({ storage });


// Endpoint for uploading notes
app.post("/upload/notes", upload.single("file"), (req, res) => {
  if (!req.file) return res.status(400).json({ error: "No file uploaded" });

  const uploadStream = gridFSBucket.openUploadStream(req.file.originalname);
  uploadStream.end(req.file.buffer);

  uploadStream.on("finish", () => {
      console.log(`✅ File uploaded: ${req.file.originalname}`);
      res.json({ message: "File uploaded successfully!", filename: req.file.originalname });
  });

  uploadStream.on("error", (err) => {
      console.error("❌ Upload Error:", err);
      res.status(500).json({ error: "Error uploading file" });
  });
});

// Endpoint for uploading question papers
app.post('/upload/question-paper', upload.single('file'), (req, res) => {
  if (!req.file) {
    res.status(400).json({ error: 'No file was uploaded' });
    return;
  }
  res.json({ message: 'Upload successful!', file: req.file });
});

// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server started on port ${PORT}`);
});


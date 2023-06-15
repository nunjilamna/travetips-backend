const express = require('express');
const router = express.Router();
const db = require('./db');
const multer = require('multer');
const { Storage } = require('@google-cloud/storage');

// GET /tips - Mendapatkan semua tips
router.get('/tips', (req, res) => {
  const query = 'SELECT * FROM tips';
  db.query(query, (err, results) => {
    if (err) {
      console.error('Error executing query:', err);
      res.status(500).json({ error: 'Failed to fetch tips' });
      return;
    }
    res.json(results);
  });
});

// GET /tips/:id - Mendapatkan tip berdasarkan ID
router.get('/tips/:id', (req, res) => {
  const id = req.params.id;

  const query = `SELECT * FROM tips WHERE id = '${id}'`;
  db.query(query, (err, results) => {
    if (err) {
      console.error('Error executing query:', err);
      res.status(500).json({ error: 'Failed to fetch tip' });
      return;
    }

    if (results.length > 0) {
      res.json(results[0]);
    } else {
      res.status(404).json({ message: 'Tip not found' });
    }
  });
});


// POST /tips - Membuat tip baru
router.post('/tips', (req, res) => {
  const { id, title, picture, content } = req.body;
  const query = `INSERT INTO tips (id, title, picture, content) VALUES ('${id}', '${title}', '${picture}', '${content}')`;
  db.query(query, [id, title, picture, content], (err, results) => {
    if (err) {
      console.error('Error executing query:', err);
      res.status(500).json({ error: 'Failed to create tip' });
      return;
    }
    res.json({ message: 'Tip created successfully' });
  });
});

//////////////////////////////////////////////////////////////////
// Konfigurasi penyimpanan file menggunakan Multer
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Konfigurasi GCS
const storageGCS = new Storage({
  projectId: 'trave-guide-389313',
  keyFilename: 'D:\BANGKIT\travetips-backend\trave-guide-389313-f13390083d63.json',
});

const bucketName = 'tips-trave';


// Endpoint untuk mengunggah gambar
router.post('/upload', upload.single('picture'), async (req, res) => {
    const file = req.file;
  
    try {
      // Mengunggah file ke GCS
      const bucket = storageGCS.bucket(bucketName);
      const blob = bucket.file(file.originalname);
      const stream = blob.createWriteStream();
  
      stream.on('error', (err) => {
        console.error('Error uploading image to GCS: ', err);
        res.status(500).json({ message: 'Internal server error' });
      });
  
      stream.on('finish', () => {
        const imageUrl = `https://storage.googleapis.com/${bucketName}/${file.originalname}`;

        // Menyimpan informasi gambar ke database
        const query = `INSERT INTO tips (picture) VALUES ('${imageUrl}')`;
        db.query(query, (err, result) => {
          if (err) {
            console.error('Error saving image to database: ', err);
            res.status(500).json({ message: 'Internal server error' });
          } else {
            res.status(200).json({ imageUrl });
          }
        });
      });
  
      stream.end(file.buffer);
    } catch (err) {
      console.error('Error uploading image: ', err);
      res.status(500).json({ message: 'Internal server error' });
    }
  });
  
  // Endpoint untuk menampilkan gambar
  router.get('/tips/images/:id', (req, res) => {
    const id = req.params.id;
  
    // Mengambil URL gambar dari database
    const query = `SELECT picture FROM tips WHERE id = '${id}'`;
    db.query(query, [id], (err, result) => {
      if (err) {
        console.error('Error fetching image from database: ', err);
        res.status(500).json({ message: 'Internal server error' });
      } else {
        if (result.length > 0) {
          const imageUrl = result[0].picture;
  
          // Mengirimkan URL gambar sebagai respons
          res.status(200).json({ imageUrl });
        } else {
          res.status(404).json({ message: 'Image not found' });
        }
      }
    });
  });


module.exports = router;

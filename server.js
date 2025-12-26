const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(__dirname)); // Menyajikan file HTML/CSS/JS di folder ini
app.use('/uploads', express.static(path.join(__dirname, 'uploads'))); // Menyajikan file buku

// --- DATABASE SIMULATION ---
const BOOKS_FILE = path.join(__dirname, 'books.json');
const HIGHLIGHT_FILE = path.join(__dirname, 'highlight.json');

// Pastikan file JSON ada
if (!fs.existsSync(BOOKS_FILE)) fs.writeFileSync(BOOKS_FILE, '[]');
if (!fs.existsSync(HIGHLIGHT_FILE)) fs.writeFileSync(HIGHLIGHT_FILE, '{}');

// Konfigurasi Upload Multer
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const dir = './uploads';
        if (!fs.existsSync(dir)) fs.mkdirSync(dir);
        cb(null, dir);
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + file.originalname);
    }
});
const upload = multer({ storage: storage });

// --- API ENDPOINTS ---

// 1. Upload Buku
app.post('/api/upload', upload.single('epubFile'), (req, res) => {
    if (!req.file) return res.status(400).json({ message: "No file uploaded" });

    const newBook = {
        id: Date.now(),
        title: req.body.title,
        category: req.body.category,
        uploader: req.body.uploader,
        filepath: 'uploads/' + req.file.filename,
        uploadedAt: new Date().toISOString()
    };

    const books = JSON.parse(fs.readFileSync(BOOKS_FILE));
    books.push(newBook);
    fs.writeFileSync(BOOKS_FILE, JSON.stringify(books, null, 2));

    res.json({ message: "Buku berhasil diupload!", book: newBook });
});

// 2. Ambil Daftar Buku
app.get('/api/books', (req, res) => {
    const books = JSON.parse(fs.readFileSync(BOOKS_FILE));
    res.json(books);
});

// 3. AMBIL HIGHLIGHT (GET)
app.get('/api/highlights', (req, res) => {
    const { user, bookPath } = req.query;
    
    try {
        const data = JSON.parse(fs.readFileSync(HIGHLIGHT_FILE, 'utf8'));
        // Kunci: gabungan username + path buku
        const key = `${user}|${bookPath}`;
        res.json(data[key] || []);
    } catch (err) {
        console.error(err);
        res.json([]);
    }
});

// 4. SIMPAN HIGHLIGHT (POST)
app.post('/api/highlights', (req, res) => {
    const { user, bookPath, highlights } = req.body;

    try {
        let data = JSON.parse(fs.readFileSync(HIGHLIGHT_FILE, 'utf8'));
        const key = `${user}|${bookPath}`;
        
        // Update data
        data[key] = highlights;

        fs.writeFileSync(HIGHLIGHT_FILE, JSON.stringify(data, null, 2));
        res.json({ success: true, message: "Highlight tersimpan di server" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "Gagal menyimpan" });
    }
});

// Jalankan Server
app.listen(PORT, () => {
    console.log(`Server berjalan di http://localhost:${PORT}`);
    console.log(`Buka dashboard di http://localhost:${PORT}/dashboard.html`);
});
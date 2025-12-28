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
app.use(express.static(__dirname)); // Menyajikan file HTML/CSS/JS
app.use('/uploads', express.static(path.join(__dirname, 'uploads'))); // Menyajikan file buku

// --- DATABASE SIMULATION ---
const BOOKS_FILE = path.join(__dirname, 'books.json');
const HIGHLIGHT_FILE = path.join(__dirname, 'highlight.json');
const USERS_FILE = path.join(__dirname, 'users.json'); // <--- INI DITAMBAHKAN (Database User)

// Pastikan file JSON ada
if (!fs.existsSync(BOOKS_FILE)) fs.writeFileSync(BOOKS_FILE, '[]');
if (!fs.existsSync(HIGHLIGHT_FILE)) fs.writeFileSync(HIGHLIGHT_FILE, '{}');
if (!fs.existsSync(USERS_FILE)) fs.writeFileSync(USERS_FILE, '[]'); // <--- BUAT FILE USER

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

// ==========================================
//  1. API LOGIN & REGISTER (INI YANG KURANG TADI)
// ==========================================

// REGISTER
app.post('/api/register', (req, res) => {
    const { username, password } = req.body;
    
    const users = JSON.parse(fs.readFileSync(USERS_FILE));

    // Cek duplikat
    const existingUser = users.find(u => u.username === username);
    if (existingUser) {
        return res.status(400).json({ success: false, message: "Username sudah dipakai!" });
    }

    users.push({ username, password });
    fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));

    res.json({ success: true, message: "Registrasi berhasil! Silakan login." });
});

// LOGIN
app.post('/api/login', (req, res) => {
    const { username, password } = req.body;

    const users = JSON.parse(fs.readFileSync(USERS_FILE));

    // Cek cocok tidaknya
    const user = users.find(u => u.username === username && u.password === password);

    if (user) {
        res.json({ success: true, message: "Login berhasil!" });
    } else {
        res.status(401).json({ success: false, message: "Username atau Password salah!" });
    }
});

// ==========================================
//  2. API UPLOAD & BUKU (KODE LAMA KAMU)
// ==========================================

// Upload Buku
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

// Ambil Daftar Buku
app.get('/api/books', (req, res) => {
    const books = JSON.parse(fs.readFileSync(BOOKS_FILE));
    res.json(books);
});

// ==========================================
//  3. API HIGHLIGHT / STABILO
// ==========================================

// AMBIL HIGHLIGHT (GET)
app.get('/api/highlights', (req, res) => {
    const { user, bookPath } = req.query;
    try {
        const data = JSON.parse(fs.readFileSync(HIGHLIGHT_FILE, 'utf8'));
        const key = `${user}|${bookPath}`;
        res.json(data[key] || []);
    } catch (err) {
        res.json([]);
    }
});

// SIMPAN HIGHLIGHT (POST)
app.post('/api/highlights', (req, res) => {
    const { user, bookPath, highlights } = req.body;
    try {
        let data = JSON.parse(fs.readFileSync(HIGHLIGHT_FILE, 'utf8'));
        const key = `${user}|${bookPath}`;
        data[key] = highlights; // Simpan data
        fs.writeFileSync(HIGHLIGHT_FILE, JSON.stringify(data, null, 2));
        res.json({ success: true, message: "Highlight tersimpan" });
    } catch (err) {
        res.status(500).json({ success: false, message: "Gagal menyimpan" });
    }
});

// Jalankan Server
app.listen(PORT, () => {
    console.log(`Server berjalan di http://localhost:${PORT}`);
});
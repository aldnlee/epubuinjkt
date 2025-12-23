const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs'); 
const multer = require('multer'); 
const path = require('path');     
const app = express();

// UPDATE PENTING: Gunakan PORT dari sistem Cloud (Render/Glitch)
// Jika tidak ada (di laptop), pakai port 3000
const PORT = process.env.PORT || 3000;

// Middleware
app.use(bodyParser.json());
app.use(express.static(__dirname)); 
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// KONFIGURASI MULTER (UPLOAD FILE)
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const dir = './uploads';
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir);
        }
        cb(null, dir);
    },
    filename: (req, file, cb) => {
        // Nama file: waktu-namaasli.epub
        cb(null, Date.now() + '-' + file.originalname);
    }
});
const upload = multer({ storage: storage });

// DEFINISI FILE DATABASE
const USERS_DB = 'users.json';
const BOOKS_DB = 'books.json'; 

// FUNGSI BANTUAN DATABASE
const loadData = (filename) => {
    if (fs.existsSync(filename)) {
        const dataBuffer = fs.readFileSync(filename);
        return JSON.parse(dataBuffer);
    }
    return [];
};

const saveData = (filename, data) => {
    fs.writeFileSync(filename, JSON.stringify(data, null, 2));
};

// ================= ROUTES =================

// 1. REGISTER
app.post('/api/register', (req, res) => {
    const { username, password } = req.body;
    let users = loadData(USERS_DB);

    if (users.find(u => u.username === username)) {
        return res.json({ success: false, message: 'Username sudah dipakai!' });
    }

    users.push({ username, password });
    saveData(USERS_DB, users); 
    
    console.log(`User baru terdaftar: ${username}`);
    res.json({ success: true, message: 'Registrasi Berhasil!' });
});

// 2. LOGIN
app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    let users = loadData(USERS_DB);

    const user = users.find(u => u.username === username && u.password === password);

    if (user) {
        res.json({ success: true, message: `Selamat datang, ${username}!` });
    } else {
        res.json({ success: false, message: 'Username atau Password salah!' });
    }
});

// 3. UPLOAD BUKU
app.post('/api/upload', upload.single('epubFile'), (req, res) => {
    const { title, category, uploader } = req.body;

    if(!req.file) {
        return res.json({ success: false, message: 'File tidak boleh kosong' });
    }

    const filename = req.file.filename;
    let books = loadData(BOOKS_DB);
    
    const newBook = {
        id: Date.now(),
        title: title,
        category: category,
        uploader: uploader,
        filepath: '/uploads/' + filename, 
        uploadedAt: new Date().toISOString()
    };

    books.push(newBook);
    saveData(BOOKS_DB, books);

    console.log(`Buku baru diupload: ${title}`);
    res.json({ success: true, message: 'Buku berhasil diupload!' });
});

// 4. LIHAT DAFTAR BUKU
app.get('/api/books', (req, res) => {
    const books = loadData(BOOKS_DB);
    res.json(books);
});

// UPDATE PENTING: Tambahkan '0.0.0.0' agar bisa diakses publik
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server berjalan di port ${PORT}`);
});
// SOLO EL SERVIDOR HTTP DE ARCHIVOS - NADA DE TCP/NET
const express = require('express');
const multer  = require('multer');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
app.use(cors());

const UPLOAD_DIR = path.join(__dirname, 'uploads');
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (_, __, cb) => cb(null, UPLOAD_DIR),
  filename:    (_, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, unique + path.extname(file.originalname));
  }
});
const upload = multer({ storage });

app.post('/upload', upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'no file' });
  const filename = req.file.originalname;
  const id = req.file.filename;
  const url = `${req.protocol}://${req.get('host')}/downloads/${id}`;
  res.json({ filename, url });
});
app.use('/downloads', express.static(UPLOAD_DIR));

const PORT = process.env.PORT || 3000;
console.log("Valor de process.env.PORT:", process.env.PORT);
app.listen(PORT, () => console.log(`HTTP de ficheros escuchando en ${PORT}`));

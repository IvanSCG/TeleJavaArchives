const express = require('express');
const multer  = require('multer');
const cors    = require('cors');
const path    = require('path');
const fs      = require('fs');

const app = express();
app.use(cors());

const UPLOAD_DIR = path.join(__dirname, 'uploads');
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

// Storage dinámico según tipo
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const { type, user } = req.query;
    let dest;
    if (type === 'avatar' && user) {
      dest = path.join(UPLOAD_DIR, 'avatars', user);
    } else {
      dest = path.join(UPLOAD_DIR, 'files');
    }
    fs.mkdirSync(dest, { recursive: true });
    cb(null, dest);
  },
  filename: (_, file, cb) => {
    const ext    = path.extname(file.originalname);
    const basename = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, basename + ext);
  }
});
const upload = multer({ storage });

app.post('/upload', upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

  const { type, user } = req.query;
  const filename = req.file.filename;

  // Decide la URL pública según tipo
  let url;
  if (type === 'avatar' && user) {
    url = `${req.protocol}://${req.get('host')}/avatar/${user}/${filename}`;
  } else {
    url = `${req.protocol}://${req.get('host')}/downloads/${filename}`;
  }

  res.json({ filename: req.file.originalname, url });
});

// Rutas estáticas
app.use('/downloads', express.static(path.join(UPLOAD_DIR, 'files')));
app.use('/avatar',    express.static(path.join(UPLOAD_DIR, 'avatars')));

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(`HTTP de ficheros escuchando en ${PORT}`));

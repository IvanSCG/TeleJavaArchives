const express = require('express');
const multer  = require('multer');
const cors    = require('cors');
const path    = require('path');
const fs      = require('fs');

const app = express();
app.use(cors());

/* ------------------------------------------------------------------ *
 *   1.  SUBIDA DE FICHEROS (avatars por usuario y ficheros genéricos) *
 * ------------------------------------------------------------------ */
const UPLOAD_DIR = path.join(__dirname, 'uploads');
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

// Almacén dinámico:  /uploads/avatars/<user>/...  |  /uploads/files/...
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
    const ext      = path.extname(file.originalname);
    const basename = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, basename + ext);
  }
});
const upload = multer({ storage });

app.post('/upload', upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

  const { type, user } = req.query;
  const filename = req.file.filename;

  // URL pública según tipo
  let url;
  if (type === 'avatar' && user) {
    url = `${req.protocol}://${req.get('host')}/avatar/${user}/${filename}`;
  } else {
    url = `${req.protocol}://${req.get('host')}/downloads/${filename}`;
  }

  res.json({ filename: req.file.originalname, url });
});

/* ------------------------------------------------------------------ *
 *   2.  GALERÍA DE AVATARES PÚBLICOS (avatar/avatares)                *
 * ------------------------------------------------------------------ */
const AVATAR_GALLERY_DIR = path.join(__dirname, 'avatar', 'avatares');
if (!fs.existsSync(AVATAR_GALLERY_DIR)) fs.mkdirSync(AVATAR_GALLERY_DIR, { recursive: true });

// Servir cada imagen:  http://<host>/avatar/avatares/<nombreArchivo>
app.use('/avatar/avatares', express.static(AVATAR_GALLERY_DIR));

/* Listar las imágenes existentes
   Respuesta: ["http://<host>/avatar/avatares/cat.png", ...] */
app.get('/avatar/avatares/list', (req, res) => {
  try {
    const files = fs.readdirSync(AVATAR_GALLERY_DIR)
                    .filter(f => !f.startsWith('.')); // ignora ficheros ocultos
    const base  = `${req.protocol}://${req.get('host')}/avatar/avatares/`;
    res.json(files.map(f => base + encodeURIComponent(f)));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error reading avatar gallery' });
  }
});

/* ------------------------------------------------------------------ *
 *   3.  RUTAS ESTÁTICAS DE SUBIDAS                                   *
 * ------------------------------------------------------------------ */
app.use('/downloads', express.static(path.join(UPLOAD_DIR, 'files')));
app.use('/avatar',    express.static(path.join(UPLOAD_DIR, 'avatars')));

/* ------------------------------------------------------------------ *
 *   4.  INICIO DEL SERVIDOR                                          *
 * ------------------------------------------------------------------ */
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(`HTTP de ficheros escuchando en ${PORT}`));

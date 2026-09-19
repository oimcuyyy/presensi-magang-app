const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

/**
 * Menyimpan base64 image ke disk
 * @param {string} base64String Data URI atau string base64
 * @returns {string} URL path dari gambar yang disimpan
 */
const saveBase64Image = (base64String) => {
  if (!base64String) return null;
  if (!base64String.startsWith('data:image')) return base64String; // Jika sudah URL biasa

  try {
    // Memisahkan metadata MIME type dan data base64
    const matches = base64String.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    
    if (!matches || matches.length !== 3) {
      throw new Error('Invalid input string');
    }

    const type = matches[1]; // misal image/png atau image/jpeg
    const data = Buffer.from(matches[2], 'base64');

    // Tentukan ekstensi
    let extension = 'png';
    if (type.includes('jpeg') || type.includes('jpg')) extension = 'jpg';
    if (type.includes('webp')) extension = 'webp';

    // Buat nama file unik
    const filename = `${Date.now()}_${crypto.randomBytes(4).toString('hex')}.${extension}`;
    
    // Tentukan path upload
    const uploadDir = path.join(__dirname, '../../public/uploads');
    
    // Simpan file
    fs.writeFileSync(path.join(uploadDir, filename), data);

    // Kembalikan URL yang bisa diakses (misalnya /uploads/namafile.jpg)
    return `/uploads/${filename}`;
  } catch (err) {
    console.error('Error saving image:', err);
    return null;
  }
};

module.exports = saveBase64Image;

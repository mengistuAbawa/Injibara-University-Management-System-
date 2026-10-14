const fs = require('fs/promises');
const path = require('path');
const { randomUUID } = require('crypto');
const db = require('../config/db');

const avatarDirectory = path.join(__dirname, '..', 'uploads', 'avatars');
const maxBytes = 5 * 1024 * 1024;

exports.uploadAvatar = async (req, res, next) => {
  let newFilePath;
  try {
    const dataUrl = req.body?.image;
    const match = typeof dataUrl === 'string' && dataUrl.match(/^data:image\/(jpeg|png|webp);base64,([A-Za-z0-9+/]+={0,2})$/);
    if (!match) return res.status(400).json({ message: 'Choose a JPEG, PNG, or WebP image' });

    const [, extension, encoded] = match;
    const buffer = Buffer.from(encoded, 'base64');
    if (!buffer.length || buffer.length > maxBytes) {
      return res.status(413).json({ message: 'Image must be smaller than 5 MB' });
    }

    const validSignature = extension === 'jpeg'
      ? buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff
      : extension === 'png'
        ? buffer.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))
        : buffer.toString('ascii', 0, 4) === 'RIFF' && buffer.toString('ascii', 8, 12) === 'WEBP';
    if (!validSignature) return res.status(400).json({ message: 'The uploaded file is not a valid image' });

    await fs.mkdir(avatarDirectory, { recursive: true });
    const filename = `${req.user.id}-${randomUUID()}.${extension}`;
    newFilePath = path.join(avatarDirectory, filename);
    await fs.writeFile(newFilePath, buffer, { flag: 'wx' });

    const avatarPath = `/uploads/avatars/${filename}`;
    const [[currentUser]] = await db.query('SELECT avatar_path FROM users WHERE user_id = ?', [req.user.id]);
    if (!currentUser) {
      await fs.unlink(newFilePath);
      return res.status(404).json({ message: 'User account not found' });
    }
    const [result] = await db.query('UPDATE users SET avatar_path = ? WHERE user_id = ?', [avatarPath, req.user.id]);
    if (!result.affectedRows) {
      await fs.unlink(newFilePath);
      return res.status(404).json({ message: 'User account not found' });
    }

    const oldAvatarPath = currentUser.avatar_path;
    if (oldAvatarPath?.startsWith('/uploads/avatars/')) {
      await fs.unlink(path.join(avatarDirectory, path.basename(oldAvatarPath))).catch(() => {});
    }
    return res.json({ avatar_path: avatarPath });
  } catch (err) {
    if (newFilePath) await fs.unlink(newFilePath).catch(() => {});
    next(err);
  }
};

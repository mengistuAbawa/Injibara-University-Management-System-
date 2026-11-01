const fs = require('fs/promises');
const path = require('path');
const { randomUUID } = require('crypto');
const db = require('../config/db');

const avatarDirectory = path.join(__dirname, '..', 'uploads', 'avatars');
const maxBytes = 5 * 1024 * 1024;

exports.getProfile = async (req, res, next) => {
  try {
    const [[user]] = await db.query(
      'SELECT user_id, username, first_name, last_name, email, role, avatar_path FROM users WHERE user_id = ?',
      [req.user.id]
    );
    if (!user) return res.status(404).json({ message: 'User account not found' });

    let phone_number = '';
    if (user.role === 'instructor') {
      const [[instructor]] = await db.query(
        'SELECT phone_number FROM instructors WHERE user_id = ?',
        [req.user.id]
      );
      phone_number = instructor?.phone_number || '';
    }
    return res.json({ ...user, phone_number });
  } catch (err) {
    next(err);
  }
};

exports.updateProfile = async (req, res, next) => {
  const username = String(req.body?.username || '').trim();
  const firstName = String(req.body?.first_name || '').trim();
  const lastName = String(req.body?.last_name || '').trim();
  const email = String(req.body?.email || '').trim().toLowerCase();
  const phoneNumber = String(req.body?.phone_number || '').trim();

  if (!firstName || !lastName || !email) {
    return res.status(400).json({ message: 'First name, last name, and email are required.' });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ message: 'Enter a valid email address.' });
  }

  let connection;
  try {
    connection = await db.getConnection();
    await connection.beginTransaction();
    const [[currentUser]] = await connection.query('SELECT role FROM users WHERE user_id = ?', [req.user.id]);
    if (!currentUser) {
      await connection.rollback();
      return res.status(404).json({ message: 'User account not found' });
    }

    await connection.query(
      'UPDATE users SET username = ?, first_name = ?, last_name = ?, email = ? WHERE user_id = ?',
      [username || null, firstName, lastName, email, req.user.id]
    );
    if (currentUser.role === 'instructor') {
      await connection.query(
        'UPDATE instructors SET first_name = ?, last_name = ?, phone_number = ? WHERE user_id = ?',
        [firstName, lastName, phoneNumber || null, req.user.id]
      );
    }
    await connection.commit();

    const [[profile]] = await db.query(
      'SELECT user_id, username, first_name, last_name, email, role, avatar_path FROM users WHERE user_id = ?',
      [req.user.id]
    );
    return res.json({ ...profile, phone_number: phoneNumber });
  } catch (err) {
    if (connection) await connection.rollback().catch(() => {});
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ message: 'That username or email is already in use.' });
    }
    next(err);
  } finally {
    connection?.release();
  }
};

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

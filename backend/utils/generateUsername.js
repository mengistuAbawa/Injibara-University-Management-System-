module.exports = (userNumber) => {
  const number = String(userNumber || '').trim();
  if (!number) throw new Error('A student or employee number is required to generate a username');
  return `INU${number.replace(/^INU/i, '').toUpperCase()}`;
};

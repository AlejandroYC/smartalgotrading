export const encrypt = (text: string): string => {
  // For now, using base64 encoding. In production, use a proper encryption method
  return Buffer.from(text).toString('base64');
};

export const decrypt = (encryptedText: string): string => {
  return Buffer.from(encryptedText, 'base64').toString();
}; 
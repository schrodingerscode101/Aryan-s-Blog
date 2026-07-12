const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
  modulusLength: 2048,
  publicKeyEncoding: { type: 'spki', format: 'pem' },
  privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
});

const privateKeyPath = path.join(__dirname, '..', 'PRIVATE_KEY_DO_NOT_SHARE.pem');
fs.writeFileSync(privateKeyPath, privateKey);

console.log('Encryption key pair generated.\n');
console.log('1) Copy the block below into your Vercel project\'s Environment Variables:\n');
console.log('   Name:  PUBLIC_KEY_PEM');
console.log('   Value: (everything from BEGIN to END, exactly as printed)\n');
console.log(publicKey);
console.log('2) Your PRIVATE key was saved to: ' + privateKeyPath);
console.log('   Open that file, copy its contents somewhere safe (a password manager, an encrypted');
console.log('   note - not a plain notes app), then DELETE the file from your computer.');
console.log('\n   This private key is the ONLY way to ever read messages sent through your contact');
console.log('   form. Paste it into the "Unlock messages" box in your admin dashboard whenever you');
console.log('   want to read messages - it is never uploaded anywhere, not even to Vercel.');

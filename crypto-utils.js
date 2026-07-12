/**
 * Hybrid RSA-OAEP + AES-GCM encryption used for the end-to-end encrypted
 * contact form. A visitor's browser encrypts the message with a one-time
 * AES key, then wraps that AES key with the site owner's RSA public key.
 * Only the matching private key - which the server never sees or stores -
 * can unwrap the AES key and read the message. All of this runs via the
 * browser's built-in Web Crypto API (window.crypto.subtle).
 */

function pemToArrayBuffer(pem) {
  const b64 = pem
    .replace(/-----BEGIN [^-]+-----/, '')
    .replace(/-----END [^-]+-----/, '')
    .replace(/\s+/g, '');
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes.buffer;
}

function arrayBufferToBase64(buffer) {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
}

function base64ToArrayBuffer(b64) {
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes.buffer;
}

async function importPublicKey(pem) {
  const keyData = pemToArrayBuffer(pem);
  return crypto.subtle.importKey('spki', keyData, { name: 'RSA-OAEP', hash: 'SHA-256' }, false, ['encrypt']);
}

async function importPrivateKey(pem) {
  const keyData = pemToArrayBuffer(pem);
  return crypto.subtle.importKey('pkcs8', keyData, { name: 'RSA-OAEP', hash: 'SHA-256' }, false, ['decrypt']);
}

/**
 * Encrypts a plain JS object (e.g. { name, email, message }) for the site
 * owner. Returns { ciphertext, encryptedKey, iv }, all base64 strings, ready
 * to send to the server as-is.
 */
async function encryptPayload(publicKeyPem, payloadObj) {
  const publicKey = await importPublicKey(publicKeyPem);
  const aesKey = await crypto.subtle.generateKey({ name: 'AES-GCM', length: 256 }, true, ['encrypt']);
  const iv = crypto.getRandomValues(new Uint8Array(12));

  const plaintext = new TextEncoder().encode(JSON.stringify(payloadObj));
  const ciphertextBuffer = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, aesKey, plaintext);

  const rawAesKey = await crypto.subtle.exportKey('raw', aesKey);
  const encryptedKeyBuffer = await crypto.subtle.encrypt({ name: 'RSA-OAEP' }, publicKey, rawAesKey);

  return {
    ciphertext: arrayBufferToBase64(ciphertextBuffer),
    encryptedKey: arrayBufferToBase64(encryptedKeyBuffer),
    iv: arrayBufferToBase64(iv.buffer),
  };
}

/**
 * Decrypts a stored message using the site owner's private key. This must
 * only ever be called in the admin's own browser - the private key should
 * never be sent to or stored on any server.
 */
async function decryptPayload(privateKeyPem, { ciphertext, encryptedKey, iv }) {
  const privateKey = await importPrivateKey(privateKeyPem);
  const rawAesKey = await crypto.subtle.decrypt(
    { name: 'RSA-OAEP' },
    privateKey,
    base64ToArrayBuffer(encryptedKey)
  );
  const aesKey = await crypto.subtle.importKey('raw', rawAesKey, { name: 'AES-GCM' }, false, ['decrypt']);
  const plaintextBuffer = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: base64ToArrayBuffer(iv) },
    aesKey,
    base64ToArrayBuffer(ciphertext)
  );
  const json = new TextDecoder().decode(plaintextBuffer);
  return JSON.parse(json);
}

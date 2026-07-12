const { Redis } = require('@upstash/redis');

let client;
function getClient() {
  if (!client) {
    // Different Vercel storage setup paths have historically used slightly
    // different environment variable names for the same Upstash Redis
    // connection. Check the common ones so this works regardless of which
    // path was used to connect it.
    const url =
      process.env.UPSTASH_REDIS_REST_URL ||
      process.env.KV_REST_API_URL ||
      process.env.REDIS_URL;
    const token =
      process.env.UPSTASH_REDIS_REST_TOKEN ||
      process.env.KV_REST_API_TOKEN ||
      process.env.REDIS_TOKEN;

    if (!url || !token) {
      throw new Error(
        'No Redis connection details found. Expected UPSTASH_REDIS_REST_URL and ' +
          'UPSTASH_REDIS_REST_TOKEN (or KV_REST_API_URL / KV_REST_API_TOKEN) to be set ' +
          'as environment variables - check that Redis storage is connected to this project in Vercel.'
      );
    }
    client = new Redis({ url, token });
  }
  return client;
}

/**
 * Reads a JSON value stored under `key`. Returns `defaultValue` if nothing
 * is stored yet (e.g. a brand new site with no posts).
 */
async function readJSON(key, defaultValue) {
  const redis = getClient();
  const raw = await redis.get(key);
  if (raw === null || raw === undefined) return defaultValue;
  if (typeof raw === 'string') {
    try {
      return JSON.parse(raw);
    } catch (err) {
      return defaultValue;
    }
  }
  // Some client versions auto-deserialize JSON values already.
  return raw;
}

/**
 * Stores a JS value (already JSON-serializable) under `key`.
 */
async function writeJSON(key, data) {
  const redis = getClient();
  await redis.set(key, JSON.stringify(data));
}

module.exports = { readJSON, writeJSON };

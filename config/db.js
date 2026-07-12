const { Redis } = require('@upstash/redis');

let client;
function getClient() {
  if (!client) {
    // Reads UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN from
    // environment variables automatically.
    client = Redis.fromEnv();
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

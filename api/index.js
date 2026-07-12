const createApp = require('../app');

const app = createApp();

app.use((req, res) => {
  res.status(404).json({ error: 'Not found.' });
});

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Something went wrong on the server.' });
});

// Vercel treats an exported Express app as a request handler directly -
// no extra wrapping needed. Static files under /public are served
// automatically by Vercel itself, not by this function.
module.exports = app;

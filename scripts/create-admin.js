const readline = require('readline');
const bcrypt = require('bcryptjs');

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

function ask(question) {
  return new Promise((resolve) => rl.question(question, resolve));
}

// Reads a line without echoing it to the terminal, so the password isn't
// visible over your shoulder or left sitting in your terminal history.
function askHidden(question) {
  return new Promise((resolve) => {
    const stdin = process.stdin;
    process.stdout.write(question);
    let value = '';
    const wasRaw = stdin.isRaw;
    if (stdin.isTTY) stdin.setRawMode(true);
    stdin.resume();
    stdin.setEncoding('utf8');

    function handler(char) {
      char = char.toString();
      if (char === '\n' || char === '\r' || char === '\u0004') {
        if (stdin.isTTY) stdin.setRawMode(wasRaw || false);
        stdin.pause();
        stdin.removeListener('data', handler);
        process.stdout.write('\n');
        resolve(value);
      } else if (char === '\u0003') {
        process.exit();
      } else if (char === '\u007f' || char === '\b') {
        value = value.slice(0, -1);
      } else {
        value += char;
      }
    }
    stdin.on('data', handler);
  });
}

async function main() {
  console.log("Set up the admin account for Aryan's Blog\n");
  const username = (await ask('Choose an admin username: ')).trim();
  const password = (await askHidden('Choose an admin password (hidden as you type): ')).trim();
  rl.close();

  if (!username || !password) {
    console.error('\nUsername and password cannot be empty. Please run this again.');
    process.exit(1);
  }
  if (password.length < 8) {
    console.error('\nPlease choose a password of at least 8 characters. Run this again.');
    process.exit(1);
  }

  const passwordHash = bcrypt.hashSync(password, 12);

  console.log('\nDone! Copy these two values into your Vercel project\'s Environment Variables:\n');
  console.log('  Name:  ADMIN_USERNAME');
  console.log('  Value:', username);
  console.log('');
  console.log('  Name:  ADMIN_PASSWORD_HASH');
  console.log('  Value:', passwordHash);
  console.log(
    '\nYour plain password is never stored anywhere - only this scrambled version is used to check logins.'
  );
}

main();

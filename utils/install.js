const concurrently = require('concurrently');
const path = require('path');

concurrently(
  [
    {
      command: 'npm install',
      name: 'accounts',
      cwd: path.resolve(__dirname, '../services/accounts'),
      prefixColor: 'blue',
    },
    {
      command: 'npm install',
      name: 'listings',
      cwd: path.resolve(__dirname, '../services/listings'),
      prefixColor: 'bgMagenta',
    },
    {
      command: 'npm install',
      name: 'bookings',
      cwd: path.resolve(__dirname, '../services/bookings'),
      prefixColor: 'bgYellow',
    },
    {
      command: 'npm install',
      name: 'reviews',
      cwd: path.resolve(__dirname, '../services/reviews'),
      prefixColor: 'bgGreen',
    },
  ],
  {
    prefix: 'name',
    restartTries: 3,
  }
);

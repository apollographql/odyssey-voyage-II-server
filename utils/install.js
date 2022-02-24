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
      prefixColor: 'magenta',
    },
    {
      command: 'npm install',
      name: 'bookings',
      cwd: path.resolve(__dirname, '../services/bookings'),
      prefixColor: 'green',
    },
    {
      command: 'npm install',
      name: 'reviews',
      cwd: path.resolve(__dirname, '../services/reviews'),
      prefixColor: 'yellow',
    },
  ],
  {
    prefix: 'name',
    restartTries: 3,
  }
);

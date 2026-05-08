const concurrently = require("concurrently");
const path = require("path");
const { getPackageManager } = require("./package-manager");

const packageManager = getPackageManager();

concurrently(
  [
    {
      command: `${packageManager} install`,
      name: "accounts",
      cwd: path.resolve(__dirname, "../../services/accounts"),
      prefixColor: "blue",
    },
    {
      command: `${packageManager} install`,
      name: "listings",
      cwd: path.resolve(__dirname, "../../services/listings"),
      prefixColor: "magenta",
    },
    {
      command: `${packageManager} install`,
      name: "bookings",
      cwd: path.resolve(__dirname, "../../services/bookings"),
      prefixColor: "green",
    },
    {
      command: `${packageManager} install`,
      name: "reviews",
      cwd: path.resolve(__dirname, "../../services/reviews"),
      prefixColor: "yellow",
    },
  ],
  {
    prefix: "name",
    restartTries: 3,
  },
);

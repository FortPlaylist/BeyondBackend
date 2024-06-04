import { createMiddleware } from "hono/factory";
import chalk from "chalk";

import Timing from "../performance/Timing";

export function getMethodColor(method: string) {
  switch (method.toUpperCase()) {
    case "GET":
      return chalk.greenBright;
    case "POST":
      return chalk.blueBright;
    case "PUT":
      return chalk.yellowBright;
    case "DELETE":
      return chalk.redBright;
    case "PATCH":
      return chalk.rgb(255, 165, 0).bold;
    default:
      return chalk.whiteBright;
  }
}
chalk.level = 3;
const pink = chalk.rgb(255, 105, 180);

export function getStatusCodeColor(statusCode: number) {
  switch (statusCode) {
    case 200:
      return pink;
    case 201:
      return chalk.greenBright;
    case 204:
      return chalk.greenBright;
    case 400:
      return chalk.yellowBright;
    case 401:
      return chalk.yellowBright;
    case 403:
      return chalk.yellowBright;
    case 404:
      return chalk.yellowBright;
    case 500:
      return chalk.redBright;
    case 501:
      return chalk.redBright;
    case 502:
      return chalk.redBright;
    default:
      return pink;
  }
}

enum LogLevels {
  DEBUG = 0,
  INFO = 1,
  WARNING = 2,
  ERROR = 3,
  CRITICAL = 4,
}

const LogLevelsMap = {
  DEBUG: { name: "DEBUG", level: LogLevels.DEBUG },
  INFO: { name: "INFO", level: LogLevels.INFO },
  WARNING: { name: "WARNING", level: LogLevels.WARNING },
  ERROR: { name: "ERROR", level: LogLevels.ERROR },
  CRITICAL: { name: "CRITICAL", level: LogLevels.CRITICAL },
};

const colorMap = new Map<string, (arg0: string) => string>([
  ["A", chalk.red],
  ["B", chalk.green],
  ["C", chalk.blue],
  ["D", chalk.yellow],
  ["E", chalk.magenta],
  ["F", chalk.cyan],
  ["G", chalk.white],
  ["H", chalk.gray],
  ["I", chalk.redBright],
  ["J", chalk.greenBright],
  ["K", chalk.blueBright],
  ["L", chalk.yellowBright],
  ["M", chalk.magentaBright],
  ["N", chalk.cyanBright],
  ["O", chalk.whiteBright],
  ["P", chalk.bgRedBright],
  ["Q", chalk.bgRed],
  ["R", chalk.bgGreen],
  ["S", chalk.bgBlue],
  ["T", chalk.bgYellow],
  ["U", chalk.bgMagenta],
  ["V", chalk.bgCyan],
  ["W", chalk.bgWhite],
  ["X", chalk.bgGray],
  ["Y", chalk.bgRedBright],
  ["Z", chalk.bgGreenBright],
]);

let currentLogLevel = LogLevels.DEBUG;

const Logger = {
  logRequest: createMiddleware(async (c, next) => {
    if (getLogLevel() !== LogLevels.DEBUG) {
      return await next();
    }

    if (c.req.path === "/") return await next();

    const Timing = new Timing("logRequest");
    await next();

    let statusColor;
    if (c.res.status >= 500) statusColor = chalk.bgRed(` ${c.res.status} `);
    else if (c.res.status >= 400) statusColor = chalk.bgYellow(` ${c.res.status} `);
    else if (c.res.status >= 300) statusColor = chalk.bgCyan(` ${c.res.status} `);
    else statusColor = chalk.bgGreen(` ${c.res.status} `);

    console.log(
      chalk.gray(`${Timing.startDateIso}`),
      chalk.bgBlue(` ${c.req.method} `),
      chalk.gray(`${c.req.url}`),
      statusColor,
      chalk.gray(`${Timing.duration}ms`),
    );
  }),

  setLogLevel(level: keyof typeof LogLevelsMap) {
    currentLogLevel = LogLevelsMap[level].level;
  },

  debug: (...args: unknown[]) => {
    if (getLogLevel() > LogLevelsMap.DEBUG.level) return;
    console.log(
      chalk.bgBlue(" DEBUG "),
      ...args.map((arg) =>
        typeof arg === "string" ? chalk.gray(arg) : chalk.gray(JSON.stringify(arg)),
      ),
    );
  },

  error: (...args: unknown[]) => {
    if (getLogLevel() > LogLevelsMap.ERROR.level) return;
    console.log(
      chalk.bgRed(" ERROR "),
      ...args.map((arg) =>
        typeof arg === "string" ? chalk.gray(arg) : chalk.gray(JSON.stringify(arg)),
      ),
    );
  },

  warn: (...args: unknown[]) => {
    if (getLogLevel() > LogLevelsMap.WARNING.level) return;
    console.log(
      chalk.bgYellow(" WARN "),
      ...args.map((arg) =>
        typeof arg === "string" ? chalk.gray(arg) : chalk.gray(JSON.stringify(arg)),
      ),
    );
  },

  info: (...args: unknown[]) => {
    if (getLogLevel() > LogLevelsMap.INFO.level) return;
    console.log(
      chalk.bgCyan(" INFO "),
      ...args.map((arg) =>
        typeof arg === "string" ? chalk.gray(arg) : chalk.gray(JSON.stringify(arg)),
      ),
    );
  },

  startup: (...args: unknown[]) => {
    console.log(
      ...args.map((arg) =>
        typeof arg === "string" ? chalk.gray(arg) : chalk.gray(JSON.stringify(arg)),
      ),
    );
  },

  customPrefix: (prefix: string, ...args: unknown[]) => {
    const colorFunc = colorMap.get(prefix[0].toUpperCase()) || chalk.gray;
    console.log(
      colorFunc(prefix),
      ...args.map((arg) =>
        typeof arg === "string" ? chalk.gray(arg) : chalk.gray(JSON.stringify(arg)),
      ),
    );
  },

  changeLogLevel: (level: keyof typeof LogLevelsMap) => {
    Logger.setLogLevel(level);
    console.log(chalk.bgCyan(" INFO "), chalk.gray(`Changed log level to ${level}`));
  },
};

function getLogLevel() {
  return currentLogLevel;
}

export default Logger;

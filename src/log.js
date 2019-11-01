const LEVEL_TRACE = { priority: 0, name: "trace", run: handleTrace };
const LEVEL_DEBUG = { priority: 1, name: "debug", run: handleDebug };
const LEVEL_INFO = { priority: 10, name: "info", run: handleInfo };
const LEVEL_ERROR = { priority: 100, name: "error", run: handleError };

const ALL_LEVELS = [LEVEL_TRACE, LEVEL_DEBUG, LEVEL_INFO, LEVEL_ERROR];
const DEFAULT_LEVEL = LEVEL_ERROR;

export function debug(...args) {
  log(LEVEL_DEBUG, ...args);
}

export function info(...args) {
  log(LEVEL_INFO, ...args);
}

export function error(...args) {
  log(LEVEL_ERROR, ...args);
}

export function debugf(format, ...args) {
  logf(LEVEL_DEBUG, format, ...args);
}

export function infof(format, ...args) {
  logf(LEVEL_INFO, format, ...args);
}

export function errorf(format, ...args) {
  logf(LEVEL_ERROR, format, ...args);
}

function logf(level, format, ...args) {
  if (!shouldLog(level)) {
    return;
  }
  level.run(
    `[byu-browser-oauth-implicit] [${level.name}] (${getFormattedTime()}) ${format}`,
    ...args
  );
}

function log(level, ...args) {
  if (!shouldLog(level)) {
    return;
  }
  level.run(
    "[byu-browser-oauth-implicit]",
    `[${level.name}]`,
    `(${getFormattedTime()})`,
    ...args
  );
}

function getFormattedTime() {
  const now = new Date();
  const h24 = String(now.getHours()).padStart(2, '0');
  const min = String(now.getMinutes()).padStart(2, '0');
  const sec = String(now.getSeconds()).padStart(2, '0');
  const millis = String(now.getMilliseconds()).padStart(3, '0');

  return `${h24}:${min}:${sec},${millis}${formatTimezone(now)}`;
}

function formatTimezone(date) {
  const offset = date.getTimezoneOffset();
  if (offset === 0) {
    return 'Z';
  }
  const nonNegative = offset >= 0;
  const absOffset = Math.abs(offset);

  // Positive whole offset hours
  const hourInt = Math.floor(absOffset / 60);
  const hourDone = String(hourInt).padStart(2, '0')
  const sign = (nonNegative ? '+' : '-');
  const minDone = String(absOffset % 60).padStart(2, '0');

  return `${sign}${hourDone}${minDone}`;
}

function shouldLog(level) {
  return level.priority >= currentLevel().priority;
}

function currentLevel() {
  const name = levelAttr() || levelGlobalVar();
  if (!name) {
    return DEFAULT_LEVEL;
  }
  const lower = name.toLowerCase();
  return (
    ALL_LEVELS.find(function(l) {
      return l.name === lower;
    }) || DEFAULT_LEVEL
  );
}

function levelAttr() {
  return document.documentElement.getAttribute("byu-oauth-logging");
}

function levelGlobalVar() {
  const o = window.byuOAuth || {};
  return o.logging;
}

function handleTrace(...args) {
  if (console.trace) {
    console.trace(...args);
  } else {
    console.log(...args);
  }
}

function handleDebug(...args) {
  console.log(...args);
}

function handleInfo(...args) {
  if (console.info) {
    console.info(...args);
  } else {
    console.log(...args);
  }
}

function handleError(...args) {
  if (console.error) {
    console.error(...args);
  } else {
    console.log(...args);
  }
}

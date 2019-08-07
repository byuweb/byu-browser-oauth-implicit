const LEVEL_DEBUG = {priority: 0, name: 'debug'};
const LEVEL_INFO = {priority: 10, name: 'info'};
const LEVEL_ERROR = {priority: 100, name: 'error'};

const ALL_LEVELS = [LEVEL_DEBUG, LEVEL_INFO, LEVEL_ERROR];
const DEFAULT_LEVEL = LEVEL_INFO;

export function debug(...args) {
  doLog(LEVEL_DEBUG, ...args);
}

export function info(...args) {
  doLog(LEVEL_INFO, ...args);
} 

export function error(...args) {
  doLog(LEVEL_ERROR, ...args);
} 

function doLog(level, ...args) {
    if (!shouldLog(level)) {
        return;
    }
  const time = new Date().toLocaleTimeString({h12: false});
  console.log('[byu-browser-oauth-implicit]', `[${level.name}]`, `(${time})`, ...args);
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
    return ALL_LEVELS.find(function(l) {return l.name === lower}) || DEFAULT_LEVEL;
}

function levelAttr() {
    return document.documentElement.getAttribute('byu-oauth-logging')
}

function levelGlobalVar() {
    const o = window.byuOAuth || {};
    return o.logging;
}
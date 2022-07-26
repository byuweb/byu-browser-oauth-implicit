const LEVEL_TRACE = {
  priority: 0,
  name: "trace",
  run: handleTrace
};
const LEVEL_DEBUG = {
  priority: 1,
  name: "debug",
  run: handleDebug
};
const LEVEL_INFO = {
  priority: 10,
  name: "info",
  run: handleInfo
};
const LEVEL_ERROR = {
  priority: 100,
  name: "error",
  run: handleError
};
const ALL_LEVELS = [LEVEL_TRACE, LEVEL_DEBUG, LEVEL_INFO, LEVEL_ERROR];
const DEFAULT_LEVEL = LEVEL_ERROR;
function debug(...args) {
  log(LEVEL_DEBUG, ...args);
}
function info(...args) {
  log(LEVEL_INFO, ...args);
}
function error(...args) {
  log(LEVEL_ERROR, ...args);
}
function debugf(format, ...args) {
  logf(LEVEL_DEBUG, format, ...args);
}
function infof(format, ...args) {
  logf(LEVEL_INFO, format, ...args);
}

function logf(level, format, ...args) {
  if (!shouldLog(level)) {
    return;
  }

  level.run(`[byu-browser-oauth-implicit] [${level.name}] (${getFormattedTime()}) ${format}`, ...args);
}

function log(level, ...args) {
  if (!shouldLog(level)) {
    return;
  }

  level.run("[byu-browser-oauth-implicit]", `[${level.name}]`, `(${getFormattedTime()})`, ...args);
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
  const absOffset = Math.abs(offset); // Positive whole offset hours

  const hourInt = Math.floor(absOffset / 60);
  const hourDone = String(hourInt).padStart(2, '0');
  const sign = nonNegative ? '+' : '-';
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
  return ALL_LEVELS.find(function (l) {
    return l.name === lower;
  }) || DEFAULT_LEVEL;
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

const EVENT_PREFIX = 'byu-browser-oauth';
const EVENT_STATE_CHANGE = `${EVENT_PREFIX}-state-changed`;
const EVENT_LOGIN_REQUESTED = `${EVENT_PREFIX}-login-requested`;
const EVENT_LOGOUT_REQUESTED = `${EVENT_PREFIX}-logout-requested`;
const EVENT_REFRESH_REQUESTED = `${EVENT_PREFIX}-refresh-requested`;
const EVENT_CURRENT_INFO_REQUESTED = `${EVENT_PREFIX}-current-info-requested`;
const STATE_INDETERMINATE = 'indeterminate';
const STATE_UNAUTHENTICATED = 'unauthenticated';
const STATE_AUTHENTICATED = 'authenticated';
const STATE_AUTHENTICATING = 'authenticating';
const STATE_REFRESHING = 'refreshing';
const STATE_EXPIRED = 'expired';
const STATE_ERROR = 'error';

var commonjsGlobal = typeof globalThis !== 'undefined' ? globalThis : typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : typeof self !== 'undefined' ? self : {};

function unwrapExports (x) {
	return x && x.__esModule && Object.prototype.hasOwnProperty.call(x, 'default') ? x['default'] : x;
}

function createCommonjsModule(fn, module) {
	return module = { exports: {} }, fn(module, module.exports), module.exports;
}

/*!
 * cookie
 * Copyright(c) 2012-2014 Roman Shtylman
 * Copyright(c) 2015 Douglas Christopher Wilson
 * MIT Licensed
 */
/**
 * Module exports.
 * @public
 */

var parse_1 = parse;
var serialize_1 = serialize;
/**
 * Module variables.
 * @private
 */

var decode = decodeURIComponent;
var encode = encodeURIComponent;
var pairSplitRegExp = /; */;
/**
 * RegExp to match field-content in RFC 7230 sec 3.2
 *
 * field-content = field-vchar [ 1*( SP / HTAB ) field-vchar ]
 * field-vchar   = VCHAR / obs-text
 * obs-text      = %x80-FF
 */

var fieldContentRegExp = /^[\u0009\u0020-\u007e\u0080-\u00ff]+$/;
/**
 * Parse a cookie header.
 *
 * Parse the given cookie header string into an object
 * The object has the various cookies as keys(names) => values
 *
 * @param {string} str
 * @param {object} [options]
 * @return {object}
 * @public
 */

function parse(str, options) {
  if (typeof str !== 'string') {
    throw new TypeError('argument str must be a string');
  }

  var obj = {};
  var opt = options || {};
  var pairs = str.split(pairSplitRegExp);
  var dec = opt.decode || decode;

  for (var i = 0; i < pairs.length; i++) {
    var pair = pairs[i];
    var eq_idx = pair.indexOf('='); // skip things that don't look like key=value

    if (eq_idx < 0) {
      continue;
    }

    var key = pair.substr(0, eq_idx).trim();
    var val = pair.substr(++eq_idx, pair.length).trim(); // quoted values

    if ('"' == val[0]) {
      val = val.slice(1, -1);
    } // only assign once


    if (undefined == obj[key]) {
      obj[key] = tryDecode(val, dec);
    }
  }

  return obj;
}
/**
 * Serialize data into a cookie header.
 *
 * Serialize the a name value pair into a cookie string suitable for
 * http headers. An optional options object specified cookie parameters.
 *
 * serialize('foo', 'bar', { httpOnly: true })
 *   => "foo=bar; httpOnly"
 *
 * @param {string} name
 * @param {string} val
 * @param {object} [options]
 * @return {string}
 * @public
 */


function serialize(name, val, options) {
  var opt = options || {};
  var enc = opt.encode || encode;

  if (typeof enc !== 'function') {
    throw new TypeError('option encode is invalid');
  }

  if (!fieldContentRegExp.test(name)) {
    throw new TypeError('argument name is invalid');
  }

  var value = enc(val);

  if (value && !fieldContentRegExp.test(value)) {
    throw new TypeError('argument val is invalid');
  }

  var str = name + '=' + value;

  if (null != opt.maxAge) {
    var maxAge = opt.maxAge - 0;
    if (isNaN(maxAge)) throw new Error('maxAge should be a Number');
    str += '; Max-Age=' + Math.floor(maxAge);
  }

  if (opt.domain) {
    if (!fieldContentRegExp.test(opt.domain)) {
      throw new TypeError('option domain is invalid');
    }

    str += '; Domain=' + opt.domain;
  }

  if (opt.path) {
    if (!fieldContentRegExp.test(opt.path)) {
      throw new TypeError('option path is invalid');
    }

    str += '; Path=' + opt.path;
  }

  if (opt.expires) {
    if (typeof opt.expires.toUTCString !== 'function') {
      throw new TypeError('option expires is invalid');
    }

    str += '; Expires=' + opt.expires.toUTCString();
  }

  if (opt.httpOnly) {
    str += '; HttpOnly';
  }

  if (opt.secure) {
    str += '; Secure';
  }

  if (opt.sameSite) {
    var sameSite = typeof opt.sameSite === 'string' ? opt.sameSite.toLowerCase() : opt.sameSite;

    switch (sameSite) {
      case true:
        str += '; SameSite=Strict';
        break;

      case 'lax':
        str += '; SameSite=Lax';
        break;

      case 'strict':
        str += '; SameSite=Strict';
        break;

      default:
        throw new TypeError('option sameSite is invalid');
    }
  }

  return str;
}
/**
 * Try decoding a string using a decoding function.
 *
 * @param {string} str
 * @param {function} decode
 * @private
 */


function tryDecode(str, decode) {
  try {
    return decode(str);
  } catch (e) {
    return str;
  }
}

var cookie = {
	parse: parse_1,
	serialize: serialize_1
};

var CookieStorage_1 = createCommonjsModule(function (module, exports) {

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () {
  function defineProperties(target, props) {
    for (var i = 0; i < props.length; i++) {
      var descriptor = props[i];
      descriptor.enumerable = descriptor.enumerable || false;
      descriptor.configurable = true;
      if ("value" in descriptor) descriptor.writable = true;
      Object.defineProperty(target, descriptor.key, descriptor);
    }
  }

  return function (Constructor, protoProps, staticProps) {
    if (protoProps) defineProperties(Constructor.prototype, protoProps);
    if (staticProps) defineProperties(Constructor, staticProps);
    return Constructor;
  };
}();

exports.hasCookies = hasCookies;



var _cookie2 = _interopRequireDefault(cookie);

function _interopRequireDefault(obj) {
  return obj && obj.__esModule ? obj : {
    default: obj
  };
}

function _classCallCheck(instance, Constructor) {
  if (!(instance instanceof Constructor)) {
    throw new TypeError("Cannot call a class as a function");
  }
}

var prefix = 'lS_';

var CookieStorage = function () {
  function CookieStorage() {
    var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

    _classCallCheck(this, CookieStorage);

    this.cookieOptions = Object.assign({
      path: '/'
    }, options);
    prefix = options.prefix === undefined ? prefix : options.prefix;
  }

  _createClass(CookieStorage, [{
    key: 'getItem',
    value: function getItem(key) {
      var cookies = _cookie2.default.parse(document.cookie);

      if (!cookies || !cookies.hasOwnProperty(prefix + key)) {
        return null;
      }

      return cookies[prefix + key];
    }
  }, {
    key: 'setItem',
    value: function setItem(key, value) {
      document.cookie = _cookie2.default.serialize(prefix + key, value, this.cookieOptions);
      return value;
    }
  }, {
    key: 'removeItem',
    value: function removeItem(key) {
      var options = Object.assign({}, this.cookieOptions, {
        maxAge: -1
      });
      document.cookie = _cookie2.default.serialize(prefix + key, '', options);
      return null;
    }
  }, {
    key: 'clear',
    value: function clear() {
      var cookies = _cookie2.default.parse(document.cookie);

      for (var key in cookies) {
        if (key.indexOf(prefix) === 0) {
          this.removeItem(key.substr(prefix.length));
        }
      }

      return null;
    }
  }]);

  return CookieStorage;
}();

exports.default = CookieStorage;

function hasCookies() {
  var storage = new CookieStorage();

  try {
    var TEST_KEY = '__test';
    storage.setItem(TEST_KEY, '1');
    var value = storage.getItem(TEST_KEY);
    storage.removeItem(TEST_KEY);
    return value === '1';
  } catch (e) {
    return false;
  }
}
});

unwrapExports(CookieStorage_1);
var CookieStorage_2 = CookieStorage_1.hasCookies;

var isSupported_1 = createCommonjsModule(function (module, exports) {

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = isSupported;



var TEST_KEY = '__test';

function hasStorage(name) {
  try {
    var storage = window[name];
    storage.setItem(TEST_KEY, '1');
    storage.removeItem(TEST_KEY);
    return true;
  } catch (e) {
    return false;
  }
}

function isSupported() {
  var name = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 'localStorage';
  var storage = String(name).replace(/storage$/i, '').toLowerCase();

  if (storage === 'local') {
    return hasStorage('localStorage');
  }

  if (storage === 'session') {
    return hasStorage('sessionStorage');
  }

  if (storage === 'cookie') {
    return (0, CookieStorage_1.hasCookies)();
  }

  if (storage === 'memory') {
    return true;
  }

  throw new Error('Storage method `' + name + '` is not available.\n    Please use one of the following: localStorage, sessionStorage, cookieStorage, memoryStorage.');
}
});

unwrapExports(isSupported_1);

var MemoryStorage_1 = createCommonjsModule(function (module, exports) {

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () {
  function defineProperties(target, props) {
    for (var i = 0; i < props.length; i++) {
      var descriptor = props[i];
      descriptor.enumerable = descriptor.enumerable || false;
      descriptor.configurable = true;
      if ("value" in descriptor) descriptor.writable = true;
      Object.defineProperty(target, descriptor.key, descriptor);
    }
  }

  return function (Constructor, protoProps, staticProps) {
    if (protoProps) defineProperties(Constructor.prototype, protoProps);
    if (staticProps) defineProperties(Constructor, staticProps);
    return Constructor;
  };
}();

function _classCallCheck(instance, Constructor) {
  if (!(instance instanceof Constructor)) {
    throw new TypeError("Cannot call a class as a function");
  }
}

var MemoryStorage = function () {
  function MemoryStorage() {
    _classCallCheck(this, MemoryStorage);

    this._data = {};
  }

  _createClass(MemoryStorage, [{
    key: "getItem",
    value: function getItem(key) {
      return this._data.hasOwnProperty(key) ? this._data[key] : null;
    }
  }, {
    key: "setItem",
    value: function setItem(key, value) {
      return this._data[key] = String(value);
    }
  }, {
    key: "removeItem",
    value: function removeItem(key) {
      return delete this._data[key];
    }
  }, {
    key: "clear",
    value: function clear() {
      return this._data = {};
    }
  }]);

  return MemoryStorage;
}();

exports.default = MemoryStorage;
});

unwrapExports(MemoryStorage_1);

var lib = createCommonjsModule(function (module, exports) {

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.MemoryStorage = exports.CookieStorage = exports.isSupported = exports.storage = undefined;



var _isSupported2 = _interopRequireDefault(isSupported_1);



var _CookieStorage2 = _interopRequireDefault(CookieStorage_1);



var _MemoryStorage2 = _interopRequireDefault(MemoryStorage_1);

function _interopRequireDefault(obj) {
  return obj && obj.__esModule ? obj : {
    default: obj
  };
}

var storage = null;

if ((0, _isSupported2.default)('localStorage')) {
  // use localStorage
  exports.storage = storage = window.localStorage;
} else if ((0, _isSupported2.default)('sessionStorage')) {
  // use sessionStorage
  exports.storage = storage = window.sessionStorage;
} else if ((0, _isSupported2.default)('cookieStorage')) {
  // use cookies
  exports.storage = storage = new _CookieStorage2.default();
} else {
  // use memory
  exports.storage = storage = new _MemoryStorage2.default();
}

exports.default = storage;
exports.storage = storage;
exports.isSupported = _isSupported2.default;
exports.CookieStorage = _CookieStorage2.default;
exports.MemoryStorage = _MemoryStorage2.default;
});

var storage = unwrapExports(lib);
var lib_1 = lib.MemoryStorage;
var lib_2 = lib.CookieStorage;
var lib_3 = lib.isSupported;
var lib_4 = lib.storage;

/*
 *  @license
 *    Copyright 2018 Brigham Young University
 *
 *    Licensed under the Apache License, Version 2.0 (the "License");
 *    you may not use this file except in compliance with the License.
 *    You may obtain a copy of the License at
 *
 *        http://www.apache.org/licenses/LICENSE-2.0
 *
 *    Unless required by applicable law or agreed to in writing, software
 *    distributed under the License is distributed on an "AS IS" BASIS,
 *    WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *    See the License for the specific language governing permissions and
 *    limitations under the License.
 */
const cookie$1 = new lib_2();
class StorageHandler {
  saveOAuthState(clientId, state) {
    cookie$1.setItem(getKey(clientId), JSON.stringify(state));
  }

  getOAuthState(clientId) {
    const result = cookie$1.getItem(getKey(clientId));

    if (!result) {
      return null;
    }

    return JSON.parse(result);
  }

  clearOAuthState(clientId) {
    cookie$1.removeItem(getKey(clientId));
  }

  saveSessionState(clientId, state) {
    storage.setItem(getSessionKey(clientId), JSON.stringify(state));
  }

  getSessionState(clientId) {
    const key = getSessionKey(clientId);
    const stored = storage.getItem(key);

    if (!stored) {
      return null;
    }

    return JSON.parse(stored);
  }

  clearSessionState(clientId) {
    storage.removeItem(getSessionKey(clientId));
  }

}

function getKey(clientId) {
  return 'oauth-state-' + encodeURIComponent(clientId);
}

function getSessionKey(clientId) {
  return getKey(clientId) + '-active-session';
}

var sha256 = createCommonjsModule(function (module) {
/**
 * [js-sha256]{@link https://github.com/emn178/js-sha256}
 *
 * @version 0.9.0
 * @author Chen, Yi-Cyuan [emn178@gmail.com]
 * @copyright Chen, Yi-Cyuan 2014-2017
 * @license MIT
 */

/*jslint bitwise: true */
(function () {

  var ERROR = 'input is invalid type';
  var WINDOW = typeof window === 'object';
  var root = WINDOW ? window : {};

  if (root.JS_SHA256_NO_WINDOW) {
    WINDOW = false;
  }

  var WEB_WORKER = !WINDOW && typeof self === 'object';
  var NODE_JS = !root.JS_SHA256_NO_NODE_JS && typeof process === 'object' && process.versions && process.versions.node;

  if (NODE_JS) {
    root = commonjsGlobal;
  } else if (WEB_WORKER) {
    root = self;
  }

  var COMMON_JS = !root.JS_SHA256_NO_COMMON_JS && 'object' === 'object' && module.exports;
  var ARRAY_BUFFER = !root.JS_SHA256_NO_ARRAY_BUFFER && typeof ArrayBuffer !== 'undefined';
  var HEX_CHARS = '0123456789abcdef'.split('');
  var EXTRA = [-2147483648, 8388608, 32768, 128];
  var SHIFT = [24, 16, 8, 0];
  var K = [0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5, 0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174, 0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da, 0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967, 0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85, 0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070, 0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3, 0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2];
  var OUTPUT_TYPES = ['hex', 'array', 'digest', 'arrayBuffer'];
  var blocks = [];

  if (root.JS_SHA256_NO_NODE_JS || !Array.isArray) {
    Array.isArray = function (obj) {
      return Object.prototype.toString.call(obj) === '[object Array]';
    };
  }

  if (ARRAY_BUFFER && (root.JS_SHA256_NO_ARRAY_BUFFER_IS_VIEW || !ArrayBuffer.isView)) {
    ArrayBuffer.isView = function (obj) {
      return typeof obj === 'object' && obj.buffer && obj.buffer.constructor === ArrayBuffer;
    };
  }

  var createOutputMethod = function (outputType, is224) {
    return function (message) {
      return new Sha256(is224, true).update(message)[outputType]();
    };
  };

  var createMethod = function (is224) {
    var method = createOutputMethod('hex', is224);

    if (NODE_JS) {
      method = nodeWrap(method, is224);
    }

    method.create = function () {
      return new Sha256(is224);
    };

    method.update = function (message) {
      return method.create().update(message);
    };

    for (var i = 0; i < OUTPUT_TYPES.length; ++i) {
      var type = OUTPUT_TYPES[i];
      method[type] = createOutputMethod(type, is224);
    }

    return method;
  };

  var nodeWrap = function (method, is224) {
    var crypto = eval("require('crypto')");
    var Buffer = eval("require('buffer').Buffer");
    var algorithm = is224 ? 'sha224' : 'sha256';

    var nodeMethod = function (message) {
      if (typeof message === 'string') {
        return crypto.createHash(algorithm).update(message, 'utf8').digest('hex');
      } else {
        if (message === null || message === undefined) {
          throw new Error(ERROR);
        } else if (message.constructor === ArrayBuffer) {
          message = new Uint8Array(message);
        }
      }

      if (Array.isArray(message) || ArrayBuffer.isView(message) || message.constructor === Buffer) {
        return crypto.createHash(algorithm).update(new Buffer(message)).digest('hex');
      } else {
        return method(message);
      }
    };

    return nodeMethod;
  };

  var createHmacOutputMethod = function (outputType, is224) {
    return function (key, message) {
      return new HmacSha256(key, is224, true).update(message)[outputType]();
    };
  };

  var createHmacMethod = function (is224) {
    var method = createHmacOutputMethod('hex', is224);

    method.create = function (key) {
      return new HmacSha256(key, is224);
    };

    method.update = function (key, message) {
      return method.create(key).update(message);
    };

    for (var i = 0; i < OUTPUT_TYPES.length; ++i) {
      var type = OUTPUT_TYPES[i];
      method[type] = createHmacOutputMethod(type, is224);
    }

    return method;
  };

  function Sha256(is224, sharedMemory) {
    if (sharedMemory) {
      blocks[0] = blocks[16] = blocks[1] = blocks[2] = blocks[3] = blocks[4] = blocks[5] = blocks[6] = blocks[7] = blocks[8] = blocks[9] = blocks[10] = blocks[11] = blocks[12] = blocks[13] = blocks[14] = blocks[15] = 0;
      this.blocks = blocks;
    } else {
      this.blocks = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    }

    if (is224) {
      this.h0 = 0xc1059ed8;
      this.h1 = 0x367cd507;
      this.h2 = 0x3070dd17;
      this.h3 = 0xf70e5939;
      this.h4 = 0xffc00b31;
      this.h5 = 0x68581511;
      this.h6 = 0x64f98fa7;
      this.h7 = 0xbefa4fa4;
    } else {
      // 256
      this.h0 = 0x6a09e667;
      this.h1 = 0xbb67ae85;
      this.h2 = 0x3c6ef372;
      this.h3 = 0xa54ff53a;
      this.h4 = 0x510e527f;
      this.h5 = 0x9b05688c;
      this.h6 = 0x1f83d9ab;
      this.h7 = 0x5be0cd19;
    }

    this.block = this.start = this.bytes = this.hBytes = 0;
    this.finalized = this.hashed = false;
    this.first = true;
    this.is224 = is224;
  }

  Sha256.prototype.update = function (message) {
    if (this.finalized) {
      return;
    }

    var notString,
        type = typeof message;

    if (type !== 'string') {
      if (type === 'object') {
        if (message === null) {
          throw new Error(ERROR);
        } else if (ARRAY_BUFFER && message.constructor === ArrayBuffer) {
          message = new Uint8Array(message);
        } else if (!Array.isArray(message)) {
          if (!ARRAY_BUFFER || !ArrayBuffer.isView(message)) {
            throw new Error(ERROR);
          }
        }
      } else {
        throw new Error(ERROR);
      }

      notString = true;
    }

    var code,
        index = 0,
        i,
        length = message.length,
        blocks = this.blocks;

    while (index < length) {
      if (this.hashed) {
        this.hashed = false;
        blocks[0] = this.block;
        blocks[16] = blocks[1] = blocks[2] = blocks[3] = blocks[4] = blocks[5] = blocks[6] = blocks[7] = blocks[8] = blocks[9] = blocks[10] = blocks[11] = blocks[12] = blocks[13] = blocks[14] = blocks[15] = 0;
      }

      if (notString) {
        for (i = this.start; index < length && i < 64; ++index) {
          blocks[i >> 2] |= message[index] << SHIFT[i++ & 3];
        }
      } else {
        for (i = this.start; index < length && i < 64; ++index) {
          code = message.charCodeAt(index);

          if (code < 0x80) {
            blocks[i >> 2] |= code << SHIFT[i++ & 3];
          } else if (code < 0x800) {
            blocks[i >> 2] |= (0xc0 | code >> 6) << SHIFT[i++ & 3];
            blocks[i >> 2] |= (0x80 | code & 0x3f) << SHIFT[i++ & 3];
          } else if (code < 0xd800 || code >= 0xe000) {
            blocks[i >> 2] |= (0xe0 | code >> 12) << SHIFT[i++ & 3];
            blocks[i >> 2] |= (0x80 | code >> 6 & 0x3f) << SHIFT[i++ & 3];
            blocks[i >> 2] |= (0x80 | code & 0x3f) << SHIFT[i++ & 3];
          } else {
            code = 0x10000 + ((code & 0x3ff) << 10 | message.charCodeAt(++index) & 0x3ff);
            blocks[i >> 2] |= (0xf0 | code >> 18) << SHIFT[i++ & 3];
            blocks[i >> 2] |= (0x80 | code >> 12 & 0x3f) << SHIFT[i++ & 3];
            blocks[i >> 2] |= (0x80 | code >> 6 & 0x3f) << SHIFT[i++ & 3];
            blocks[i >> 2] |= (0x80 | code & 0x3f) << SHIFT[i++ & 3];
          }
        }
      }

      this.lastByteIndex = i;
      this.bytes += i - this.start;

      if (i >= 64) {
        this.block = blocks[16];
        this.start = i - 64;
        this.hash();
        this.hashed = true;
      } else {
        this.start = i;
      }
    }

    if (this.bytes > 4294967295) {
      this.hBytes += this.bytes / 4294967296 << 0;
      this.bytes = this.bytes % 4294967296;
    }

    return this;
  };

  Sha256.prototype.finalize = function () {
    if (this.finalized) {
      return;
    }

    this.finalized = true;
    var blocks = this.blocks,
        i = this.lastByteIndex;
    blocks[16] = this.block;
    blocks[i >> 2] |= EXTRA[i & 3];
    this.block = blocks[16];

    if (i >= 56) {
      if (!this.hashed) {
        this.hash();
      }

      blocks[0] = this.block;
      blocks[16] = blocks[1] = blocks[2] = blocks[3] = blocks[4] = blocks[5] = blocks[6] = blocks[7] = blocks[8] = blocks[9] = blocks[10] = blocks[11] = blocks[12] = blocks[13] = blocks[14] = blocks[15] = 0;
    }

    blocks[14] = this.hBytes << 3 | this.bytes >>> 29;
    blocks[15] = this.bytes << 3;
    this.hash();
  };

  Sha256.prototype.hash = function () {
    var a = this.h0,
        b = this.h1,
        c = this.h2,
        d = this.h3,
        e = this.h4,
        f = this.h5,
        g = this.h6,
        h = this.h7,
        blocks = this.blocks,
        j,
        s0,
        s1,
        maj,
        t1,
        t2,
        ch,
        ab,
        da,
        cd,
        bc;

    for (j = 16; j < 64; ++j) {
      // rightrotate
      t1 = blocks[j - 15];
      s0 = (t1 >>> 7 | t1 << 25) ^ (t1 >>> 18 | t1 << 14) ^ t1 >>> 3;
      t1 = blocks[j - 2];
      s1 = (t1 >>> 17 | t1 << 15) ^ (t1 >>> 19 | t1 << 13) ^ t1 >>> 10;
      blocks[j] = blocks[j - 16] + s0 + blocks[j - 7] + s1 << 0;
    }

    bc = b & c;

    for (j = 0; j < 64; j += 4) {
      if (this.first) {
        if (this.is224) {
          ab = 300032;
          t1 = blocks[0] - 1413257819;
          h = t1 - 150054599 << 0;
          d = t1 + 24177077 << 0;
        } else {
          ab = 704751109;
          t1 = blocks[0] - 210244248;
          h = t1 - 1521486534 << 0;
          d = t1 + 143694565 << 0;
        }

        this.first = false;
      } else {
        s0 = (a >>> 2 | a << 30) ^ (a >>> 13 | a << 19) ^ (a >>> 22 | a << 10);
        s1 = (e >>> 6 | e << 26) ^ (e >>> 11 | e << 21) ^ (e >>> 25 | e << 7);
        ab = a & b;
        maj = ab ^ a & c ^ bc;
        ch = e & f ^ ~e & g;
        t1 = h + s1 + ch + K[j] + blocks[j];
        t2 = s0 + maj;
        h = d + t1 << 0;
        d = t1 + t2 << 0;
      }

      s0 = (d >>> 2 | d << 30) ^ (d >>> 13 | d << 19) ^ (d >>> 22 | d << 10);
      s1 = (h >>> 6 | h << 26) ^ (h >>> 11 | h << 21) ^ (h >>> 25 | h << 7);
      da = d & a;
      maj = da ^ d & b ^ ab;
      ch = h & e ^ ~h & f;
      t1 = g + s1 + ch + K[j + 1] + blocks[j + 1];
      t2 = s0 + maj;
      g = c + t1 << 0;
      c = t1 + t2 << 0;
      s0 = (c >>> 2 | c << 30) ^ (c >>> 13 | c << 19) ^ (c >>> 22 | c << 10);
      s1 = (g >>> 6 | g << 26) ^ (g >>> 11 | g << 21) ^ (g >>> 25 | g << 7);
      cd = c & d;
      maj = cd ^ c & a ^ da;
      ch = g & h ^ ~g & e;
      t1 = f + s1 + ch + K[j + 2] + blocks[j + 2];
      t2 = s0 + maj;
      f = b + t1 << 0;
      b = t1 + t2 << 0;
      s0 = (b >>> 2 | b << 30) ^ (b >>> 13 | b << 19) ^ (b >>> 22 | b << 10);
      s1 = (f >>> 6 | f << 26) ^ (f >>> 11 | f << 21) ^ (f >>> 25 | f << 7);
      bc = b & c;
      maj = bc ^ b & d ^ cd;
      ch = f & g ^ ~f & h;
      t1 = e + s1 + ch + K[j + 3] + blocks[j + 3];
      t2 = s0 + maj;
      e = a + t1 << 0;
      a = t1 + t2 << 0;
    }

    this.h0 = this.h0 + a << 0;
    this.h1 = this.h1 + b << 0;
    this.h2 = this.h2 + c << 0;
    this.h3 = this.h3 + d << 0;
    this.h4 = this.h4 + e << 0;
    this.h5 = this.h5 + f << 0;
    this.h6 = this.h6 + g << 0;
    this.h7 = this.h7 + h << 0;
  };

  Sha256.prototype.hex = function () {
    this.finalize();
    var h0 = this.h0,
        h1 = this.h1,
        h2 = this.h2,
        h3 = this.h3,
        h4 = this.h4,
        h5 = this.h5,
        h6 = this.h6,
        h7 = this.h7;
    var hex = HEX_CHARS[h0 >> 28 & 0x0F] + HEX_CHARS[h0 >> 24 & 0x0F] + HEX_CHARS[h0 >> 20 & 0x0F] + HEX_CHARS[h0 >> 16 & 0x0F] + HEX_CHARS[h0 >> 12 & 0x0F] + HEX_CHARS[h0 >> 8 & 0x0F] + HEX_CHARS[h0 >> 4 & 0x0F] + HEX_CHARS[h0 & 0x0F] + HEX_CHARS[h1 >> 28 & 0x0F] + HEX_CHARS[h1 >> 24 & 0x0F] + HEX_CHARS[h1 >> 20 & 0x0F] + HEX_CHARS[h1 >> 16 & 0x0F] + HEX_CHARS[h1 >> 12 & 0x0F] + HEX_CHARS[h1 >> 8 & 0x0F] + HEX_CHARS[h1 >> 4 & 0x0F] + HEX_CHARS[h1 & 0x0F] + HEX_CHARS[h2 >> 28 & 0x0F] + HEX_CHARS[h2 >> 24 & 0x0F] + HEX_CHARS[h2 >> 20 & 0x0F] + HEX_CHARS[h2 >> 16 & 0x0F] + HEX_CHARS[h2 >> 12 & 0x0F] + HEX_CHARS[h2 >> 8 & 0x0F] + HEX_CHARS[h2 >> 4 & 0x0F] + HEX_CHARS[h2 & 0x0F] + HEX_CHARS[h3 >> 28 & 0x0F] + HEX_CHARS[h3 >> 24 & 0x0F] + HEX_CHARS[h3 >> 20 & 0x0F] + HEX_CHARS[h3 >> 16 & 0x0F] + HEX_CHARS[h3 >> 12 & 0x0F] + HEX_CHARS[h3 >> 8 & 0x0F] + HEX_CHARS[h3 >> 4 & 0x0F] + HEX_CHARS[h3 & 0x0F] + HEX_CHARS[h4 >> 28 & 0x0F] + HEX_CHARS[h4 >> 24 & 0x0F] + HEX_CHARS[h4 >> 20 & 0x0F] + HEX_CHARS[h4 >> 16 & 0x0F] + HEX_CHARS[h4 >> 12 & 0x0F] + HEX_CHARS[h4 >> 8 & 0x0F] + HEX_CHARS[h4 >> 4 & 0x0F] + HEX_CHARS[h4 & 0x0F] + HEX_CHARS[h5 >> 28 & 0x0F] + HEX_CHARS[h5 >> 24 & 0x0F] + HEX_CHARS[h5 >> 20 & 0x0F] + HEX_CHARS[h5 >> 16 & 0x0F] + HEX_CHARS[h5 >> 12 & 0x0F] + HEX_CHARS[h5 >> 8 & 0x0F] + HEX_CHARS[h5 >> 4 & 0x0F] + HEX_CHARS[h5 & 0x0F] + HEX_CHARS[h6 >> 28 & 0x0F] + HEX_CHARS[h6 >> 24 & 0x0F] + HEX_CHARS[h6 >> 20 & 0x0F] + HEX_CHARS[h6 >> 16 & 0x0F] + HEX_CHARS[h6 >> 12 & 0x0F] + HEX_CHARS[h6 >> 8 & 0x0F] + HEX_CHARS[h6 >> 4 & 0x0F] + HEX_CHARS[h6 & 0x0F];

    if (!this.is224) {
      hex += HEX_CHARS[h7 >> 28 & 0x0F] + HEX_CHARS[h7 >> 24 & 0x0F] + HEX_CHARS[h7 >> 20 & 0x0F] + HEX_CHARS[h7 >> 16 & 0x0F] + HEX_CHARS[h7 >> 12 & 0x0F] + HEX_CHARS[h7 >> 8 & 0x0F] + HEX_CHARS[h7 >> 4 & 0x0F] + HEX_CHARS[h7 & 0x0F];
    }

    return hex;
  };

  Sha256.prototype.toString = Sha256.prototype.hex;

  Sha256.prototype.digest = function () {
    this.finalize();
    var h0 = this.h0,
        h1 = this.h1,
        h2 = this.h2,
        h3 = this.h3,
        h4 = this.h4,
        h5 = this.h5,
        h6 = this.h6,
        h7 = this.h7;
    var arr = [h0 >> 24 & 0xFF, h0 >> 16 & 0xFF, h0 >> 8 & 0xFF, h0 & 0xFF, h1 >> 24 & 0xFF, h1 >> 16 & 0xFF, h1 >> 8 & 0xFF, h1 & 0xFF, h2 >> 24 & 0xFF, h2 >> 16 & 0xFF, h2 >> 8 & 0xFF, h2 & 0xFF, h3 >> 24 & 0xFF, h3 >> 16 & 0xFF, h3 >> 8 & 0xFF, h3 & 0xFF, h4 >> 24 & 0xFF, h4 >> 16 & 0xFF, h4 >> 8 & 0xFF, h4 & 0xFF, h5 >> 24 & 0xFF, h5 >> 16 & 0xFF, h5 >> 8 & 0xFF, h5 & 0xFF, h6 >> 24 & 0xFF, h6 >> 16 & 0xFF, h6 >> 8 & 0xFF, h6 & 0xFF];

    if (!this.is224) {
      arr.push(h7 >> 24 & 0xFF, h7 >> 16 & 0xFF, h7 >> 8 & 0xFF, h7 & 0xFF);
    }

    return arr;
  };

  Sha256.prototype.array = Sha256.prototype.digest;

  Sha256.prototype.arrayBuffer = function () {
    this.finalize();
    var buffer = new ArrayBuffer(this.is224 ? 28 : 32);
    var dataView = new DataView(buffer);
    dataView.setUint32(0, this.h0);
    dataView.setUint32(4, this.h1);
    dataView.setUint32(8, this.h2);
    dataView.setUint32(12, this.h3);
    dataView.setUint32(16, this.h4);
    dataView.setUint32(20, this.h5);
    dataView.setUint32(24, this.h6);

    if (!this.is224) {
      dataView.setUint32(28, this.h7);
    }

    return buffer;
  };

  function HmacSha256(key, is224, sharedMemory) {
    var i,
        type = typeof key;

    if (type === 'string') {
      var bytes = [],
          length = key.length,
          index = 0,
          code;

      for (i = 0; i < length; ++i) {
        code = key.charCodeAt(i);

        if (code < 0x80) {
          bytes[index++] = code;
        } else if (code < 0x800) {
          bytes[index++] = 0xc0 | code >> 6;
          bytes[index++] = 0x80 | code & 0x3f;
        } else if (code < 0xd800 || code >= 0xe000) {
          bytes[index++] = 0xe0 | code >> 12;
          bytes[index++] = 0x80 | code >> 6 & 0x3f;
          bytes[index++] = 0x80 | code & 0x3f;
        } else {
          code = 0x10000 + ((code & 0x3ff) << 10 | key.charCodeAt(++i) & 0x3ff);
          bytes[index++] = 0xf0 | code >> 18;
          bytes[index++] = 0x80 | code >> 12 & 0x3f;
          bytes[index++] = 0x80 | code >> 6 & 0x3f;
          bytes[index++] = 0x80 | code & 0x3f;
        }
      }

      key = bytes;
    } else {
      if (type === 'object') {
        if (key === null) {
          throw new Error(ERROR);
        } else if (ARRAY_BUFFER && key.constructor === ArrayBuffer) {
          key = new Uint8Array(key);
        } else if (!Array.isArray(key)) {
          if (!ARRAY_BUFFER || !ArrayBuffer.isView(key)) {
            throw new Error(ERROR);
          }
        }
      } else {
        throw new Error(ERROR);
      }
    }

    if (key.length > 64) {
      key = new Sha256(is224, true).update(key).array();
    }

    var oKeyPad = [],
        iKeyPad = [];

    for (i = 0; i < 64; ++i) {
      var b = key[i] || 0;
      oKeyPad[i] = 0x5c ^ b;
      iKeyPad[i] = 0x36 ^ b;
    }

    Sha256.call(this, is224, sharedMemory);
    this.update(iKeyPad);
    this.oKeyPad = oKeyPad;
    this.inner = true;
    this.sharedMemory = sharedMemory;
  }

  HmacSha256.prototype = new Sha256();

  HmacSha256.prototype.finalize = function () {
    Sha256.prototype.finalize.call(this);

    if (this.inner) {
      this.inner = false;
      var innerHash = this.array();
      Sha256.call(this, this.is224, this.sharedMemory);
      this.update(this.oKeyPad);
      this.update(innerHash);
      Sha256.prototype.finalize.call(this);
    }
  };

  var exports = createMethod();
  exports.sha256 = exports;
  exports.sha224 = createMethod(true);
  exports.sha256.hmac = createHmacMethod();
  exports.sha224.hmac = createHmacMethod(true);

  if (COMMON_JS) {
    module.exports = exports;
  } else {
    root.sha256 = exports.sha256;
    root.sha224 = exports.sha224;
  }
})();
});

/*
 *  @license
 *    Copyright 2018 Brigham Young University
 *
 *    Licensed under the Apache License, Version 2.0 (the "License");
 *    you may not use this file except in compliance with the License.
 *    You may obtain a copy of the License at
 *
 *        http://www.apache.org/licenses/LICENSE-2.0
 *
 *    Unless required by applicable law or agreed to in writing, software
 *    distributed under the License is distributed on an "AS IS" BASIS,
 *    WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *    See the License for the specific language governing permissions and
 *    limitations under the License.
 */
const sha256$1 = sha256.sha256;
let SINGLETON_INSTANCE;
let BASE_URL;
const CHILD_IFRAME_ID = 'byu-oauth-implicit-grant-refresh-iframe';
const STORED_STATE_LIFETIME = 5 * 60 * 1000; // 5 minutes (in milliseconds)

const EXPIRATION_BUFFER = 5 * 60 + 5; // 5 minutes + 5 seconds (in seconds)

const IG_STATE_AUTO_REFRESH_FAILED = 'implicit-grant-auto-refresh-failed';
class ImplicitGrantProvider {
  constructor(config, window, document, storageHandler = new StorageHandler()) {
    debug('initializing provider with config', config);
    this.config = config;
    this.window = window;
    this.document = document;
    this.storageHandler = storageHandler;
    this._listeners = {};
    BASE_URL = this.config.baseUrl.replace(/\/+$/, ''); // strip trailing slash(es)

    this.store = Object.freeze({
      state: STATE_INDETERMINATE,
      user: null,
      token: null,
      error: null
    });
    debug('initialized provider');
  }

  _changeState(state, user, token, error) {
    logStateChange(state, user, token, error);
    this.store = Object.freeze({
      state,
      user,
      token,
      error
    });

    _dispatchEvent(this, EVENT_STATE_CHANGE, this.store);
  }

  _checkPopupOpener() {
    try {
      const origin = this.window.opener.location.origin;

      if (origin === new URL(this.config.callbackUrl).origin) {
        // Origins match
        return this.window.opener;
      }
    } catch (e) {// Failed to get window.opener.location.origin, so we must have been opened
      // from a different origin.
      // Fall through to the "return false" outside this try/catch block
    }

    return false;
  }

  _checkIframeOpener() {
    try {
      const iframe = this.window.parent.document.getElementById(CHILD_IFRAME_ID);

      if (iframe && iframe.contentWindow === this.window) {
        return iframe;
      }
    } catch (e) {// Failed to access window.parent info, so we must be in an iframe from a different
      // origin.
      // Fall through to the "return false" outside this try/catch block
    }

    return false;
  } // Separate state change listener, because state change events
  // might come from child iframe/popup window


  handleStateChange({
    state,
    user,
    token,
    source
  }) {
    debug('in handleStateChange', state);

    const opener = this._checkPopupOpener(); // If this is a popup


    if (opener) {
      // We're inside a child re-authentication popup
      if (source) {
        // event was triggered by a child, so ignore since we're inside a child
        return;
      }

      debug('dispatching event to parent'); // Pass event along to parent

      _dispatchEvent(opener, EVENT_STATE_CHANGE, {
        state,
        token,
        user,
        source: 'popup'
      });

      if (state === STATE_AUTHENTICATED) {
        // delete self now that authentication is complete
        info('closing self');
        this.window.close();
      }

      return;
    }

    const iframe = this._checkIframeOpener(); // If we're inside a "refresh" iframe


    if (iframe) {
      if (source) {
        // event was triggered by a child, so ignore since we're inside a child
        return;
      }

      debug('dispatching event to parent'); // Pass event along to parent

      _dispatchEvent(this.window.parent, EVENT_STATE_CHANGE, {
        state,
        token,
        user,
        source: 'iframe'
      });

      if (state === STATE_AUTHENTICATED) {
        // delete self now that authentication is complete
        info('removing child iframe');
        iframe.parentNode.removeChild(iframe);
      }

      return;
    }

    this._maybeUpdateStoredSession(state, user, token);

    if (state === STATE_AUTHENTICATED) {
      this._checkExpired(token.expiresAt.getTime());
    }
  }

  async startup() {
    ensureOnlyInstance(this);
    info('starting up');
    this.listen();

    this._changeState(STATE_INDETERMINATE);

    const location = this._location;

    if (this.isAuthenticationCallback(location)) {
      debug('handling authentication callback');

      this._changeState(STATE_AUTHENTICATING);

      try {
        const {
          state,
          user,
          token,
          error
        } = await _handleAuthenticationCallback(this.config, location, this.storageHandler);

        this._changeState(state, user, token, error);
      } catch (err) {
        error('OAuth Error', err);

        this._changeState(STATE_ERROR, undefined, undefined, err);
      }
    } else if (this.hasStoredSession()) {
      debug('Has stored session');

      this._updateStateFromStorage();
    } else {
      debug('no authentication present');

      this._changeState(STATE_UNAUTHENTICATED);
    }

    return this;
  }

  _checkExpired(expirationTimeInMs) {
    var _this = this;

    const expiresInMs = expirationTimeInMs - Date.now();
    debug(`checking expiration time; expires in ${expiresInMs} ms, ${new Date(expirationTimeInMs)}`);

    if (expiresInMs > 30 * 1000) {
      // 30 second buffer before token actually expires
      if (this.__expirationTask) {
        clearTimeout(this.__expirationTask);
      } // Simply using setTimeout for an hour in the future
      // doesn't work; setTimeout isn't that precise over that long of a period.
      // So re-check every five seconds until we're past the expiration time


      this.__expirationTask = setTimeout(function () {
        _this.__expirationTask = null;

        _this._checkExpired(expirationTimeInMs);
      }, 5000);
      return;
    }

    if (this.config.autoRefreshOnTimeout) {
      this.startRefresh('iframe');
    } else {
      // We don't have auto-refresh enabled, so flag the token as expired and let the application handle it.
      this._changeState(STATE_EXPIRED, this.store.user, this.store.token);
    }
  }

  get _location() {
    return this.window.location;
  }

  isAuthenticationCallback(location) {
    const isCallbackUrl = location.href.indexOf(this.config.callbackUrl) === 0;
    const hasCode = location.search && location.search.includes('code=') && location.search.includes('state=');
    return !!(isCallbackUrl && hasCode);
  }

  hasStoredSession() {
    return !!this.storageHandler.getSessionState(this.config.clientId);
  }

  shutdown() {
    info('shutting down');
    this.unlisten();

    this._changeState(STATE_INDETERMINATE);

    cleanupOnlyInstance();
  }

  listen() {
    debug('setting up event listeners');

    _listenTo(this, EVENT_LOGIN_REQUESTED, this.startLogin);

    _listenTo(this, EVENT_LOGOUT_REQUESTED, this.startLogout);

    _listenTo(this, EVENT_REFRESH_REQUESTED, this.startRefresh);

    _listenTo(this, EVENT_CURRENT_INFO_REQUESTED, this.handleCurrentInfoRequest);

    _listenTo(this, EVENT_STATE_CHANGE, this.handleStateChange);
  }

  unlisten() {
    debug('tearing down event listeners');

    _unlistenTo(this, EVENT_LOGIN_REQUESTED);

    _unlistenTo(this, EVENT_LOGOUT_REQUESTED);

    _unlistenTo(this, EVENT_REFRESH_REQUESTED);

    _unlistenTo(this, EVENT_CURRENT_INFO_REQUESTED);

    _unlistenTo(this, EVENT_STATE_CHANGE);
  }

  startLogin(displayType = 'window') {
    var _this2 = this;

    infof('Starting login. mode=%s', displayType);
    const {
      clientId,
      callbackUrl
    } = this.config;
    const csrf = randomString();
    const codeVerifier = randomString(128); // challenge is base64-encoded SHA256 hash of codeVerifier

    const codeChallenge = btoa(String.fromCharCode(...sha256$1.array(codeVerifier))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');

    const storedState = _prepareStoredState(Date.now() + STORED_STATE_LIFETIME, csrf, codeVerifier, {});

    this.storageHandler.saveOAuthState(this.config.clientId, storedState);
    const loginUrl = `${BASE_URL}/authorize?response_type=code&client_id=${clientId}&redirect_uri=${encodeURIComponent(callbackUrl)}&scope=openid&state=${csrf}&code_challenge=${codeChallenge}&code_challenge_method=S256`;
    debug('computed login url of', loginUrl);

    if (!displayType || displayType == 'window') {
      info(`Redirecting user to '${loginUrl}'`);
      this.window.location = loginUrl;
      return;
    } else if (displayType === 'popup') {
      info('launching popup at', loginUrl);
      this.window.open(loginUrl);
      return;
    }

    info('Setting up hidden refresh iframe at', loginUrl); // last option: displayType == 'iframe'

    let iframe = this.document.getElementById(CHILD_IFRAME_ID);

    if (iframe) {
      iframe.parentNode.removeChild(iframe);
    }

    iframe = this.document.createElement('iframe');

    iframe.onload = function () {
      let html = null;

      try {
        html = iframe.contentWindow.document.body.innerHTML;
      } catch (err) {// intentional do-nothing
      }

      if (html === null) {
        // Hidden-frame refresh failed. Remove frame and
        // report problem
        iframe.parentNode.removeChild(iframe);

        _this2._changeState(IG_STATE_AUTO_REFRESH_FAILED, null, null);

        _this2._changeState(STATE_UNAUTHENTICATED, null, null);
      }
    };

    iframe.id = CHILD_IFRAME_ID;
    iframe.src = loginUrl;
    iframe.style = 'display:none';
    debug('appending iframe', iframe);
    this.document.body.appendChild(iframe);
  }

  startLogout() {
    info('starting logout');
    this.storageHandler.clearSessionState(this.config.clientId); // Need to ensure BOTH api.byu.edu and cas.byu.edu clean out their sessions
    // With current config of those two sites, to have that full clean out AND a final "where to go after logout"
    // redirect, we need to manually wrap them all together

    const logoutRedirect = this.config.logoutRedirect === undefined ? this.config.callbackUrl : this.config.logoutRedirect;
    const casLogoutUrl = 'https://cas.byu.edu/cas/logout?service=' + encodeURIComponent(logoutRedirect);
    const logoutUrl = `${BASE_URL}/logout?redirect_url=` + encodeURIComponent(casLogoutUrl);
    info('logging out by redirecting to', logoutUrl);
    this.window.location = logoutUrl; //TODO: WSO2 Identity Server 5.1 allows us to revoke implicit tokens.  Once that's done, we'll need to do this.
    // const url = `https://api.byu.edu/revoke`;
    // const form = new URLSearchParams();
    // form.set('token', store.token.bearer);
    // form.set('client_id', config.clientId);
    // form.set('token_type_hint', 'access_token');
    // console.log('logout url', url);
    // fetch(url, {
    //     method: 'POST',
    //     body: form,
    //     // headers: {
    //     //     'Content-Type': 'application/x-www-form-urlencoded'
    //     // }
    // }).then(result => {
    //     console.log('done with logout', result);
    // });
  }

  async startRefresh(displayType = 'iframe') {
    infof('starting refresh. displayType=%s', displayType); // Save copy of current info before triggering changeState

    const token = Object.assign({}, this.store.token);
    const user = Object.assign({}, this.store.user); // Also pass yet another isolated copy to changeState

    this._changeState(STATE_REFRESHING, Object.assign({}, this.store.user), Object.assign({}, this.store.token));

    if (displayType !== 'iframe') {
      this.startLogin(displayType);
      return;
    } // If we have a refresh token, then try that before doing the more complicated iframe version


    if (!(token && token.refresh)) {
      this.startLogin('iframe');
      return;
    }

    const tokenUrl = `${BASE_URL}/token`;
    const body = new URLSearchParams();
    body.set('grant_type', 'refresh_token');
    body.set('client_id', this.config.clientId);
    body.set('refresh_token', token.refresh);
    const resp = await fetch(tokenUrl, {
      method: 'POST',
      headers: new Headers({
        'Accept': 'application/json',
        'Content-Type': 'application/x-www-form-urlencoded'
      }),
      body
    });

    if (resp.status !== 200) {
      this.startLogin('iframe');
      return;
    }

    const tokenInfo = await resp.json();
    token.bearer = tokenInfo.access_token;
    token.refresh = tokenInfo.refresh_token;
    const expiresIn = tokenInfo.expires_in - EXPIRATION_BUFFER;
    token.authorizationHeader = `Bearer ${token.bearer}`;
    token.expiresAt = new Date(Date.now() + expiresIn * 1000);

    this._changeState(STATE_AUTHENTICATED, user, token);
  }

  handleCurrentInfoRequest({
    callback
  }) {
    debug('got current info request');

    if (callback) {
      callback(this.store);
    }
  }

  _updateStateFromStorage() {
    debug('updating state from local storage');
    const serialized = this.storageHandler.getSessionState(this.config.clientId);

    if (!serialized) {
      debug('no stored state');

      this._changeState(STATE_UNAUTHENTICATED);

      return;
    }

    const {
      user,
      token
    } = deserializeSessionState(serialized);

    if (!user || !token) {
      debug('no stored user or token');

      this._changeState(STATE_UNAUTHENTICATED);
    } else if (token.expiresAt > new Date()) {
      debug('found an unexpired saved session');

      this._changeState(STATE_AUTHENTICATED, user, token);
    } else {
      debug('stored session was expired');

      this._changeState(STATE_UNAUTHENTICATED);
    }
  }

  _maybeUpdateStoredSession(state, user, token) {
    debugf('updating stored session: state=%s hasUser=%s, hasToken=%s', state, !!user, !!token);

    if (state === STATE_UNAUTHENTICATED || state === STATE_REFRESHING || state === STATE_EXPIRED) {
      debug('state is unauthenticated or expired, clearing stored session');
      this.storageHandler.clearSessionState(this.config.clientId);
    } else if (!!user && !!token) {
      debug('storing session', redactUser(user), redactToken(token));
      const serialized = serializeSessionState(user, token);
      this.storageHandler.saveSessionState(this.config.clientId, serialized);
    }
  }

}

function serializeSessionState(user, token) {
  const grouped = groupClaimPrefixes(token.rawUserInfo);
  const smallerUserInfo = {
    ro: grouped[CLAIMS_PREFIX_RESOURCE_OWNER],
    cl: grouped[CLAIMS_PREFIX_CLIENT],
    wso2: grouped[CLAIMS_PREFIX_WSO2],
    o: grouped.other
  };
  return {
    ui: smallerUserInfo,
    at: token.bearer,
    rf: token.refresh,
    ah: token.authorizationHeader,
    ea: token.expiresAt.getTime()
  };
}

function deserializeSessionState(state) {
  const groupedUserInfo = {
    [CLAIMS_PREFIX_RESOURCE_OWNER]: state.ui.ro,
    [CLAIMS_PREFIX_CLIENT]: state.ui.cl,
    [CLAIMS_PREFIX_WSO2]: state.ui.wso2,
    other: state.ui.o
  };
  const userInfo = ungroupClaimPrefixes(groupedUserInfo);

  const user = _processUserInfo(userInfo);

  const expiresAt = new Date(state.ea);

  const token = _processTokenInfo({
    userInfo,
    accessToken: state.at,
    expiresAt,
    authHeader: `Bearer ${state.at}`,
    refreshToken: state.rf
  });

  return {
    user,
    token
  };
}

function _listenTo(provider, event, listener) {
  if (provider._listeners.hasOwnProperty(event)) {
    throw new Error('A listener is already registered for ' + event);
  }

  const obs = provider._listeners[event] = function (e) {
    listener.call(provider, e.detail);
  }.bind(provider);

  provider.document.addEventListener(event, obs, false);
}

function _unlistenTo(provider, event) {
  if (!provider._listeners.hasOwnProperty(event)) {
    return;
  }

  provider.document.removeEventListener(event, provider._listeners[event], false);
  delete provider._listeners[event];
}

function _dispatchEvent(provider, name, detail) {
  let event;

  if (typeof provider.window.CustomEvent === 'function') {
    event = new CustomEvent(name, {
      detail
    });
  } else {
    event = provider.document.createEvent('CustomEvent');
    event.initCustomEvent(name, true, false, detail);
  }

  provider.document.dispatchEvent(event);
}

async function _handleAuthenticationCallback(config, location, storage) {
  const searchParams = new URLSearchParams(location.search);
  const oauthCsrfToken = searchParams.get('state');
  const storedState = storage.getOAuthState(config.clientId);
  storage.clearOAuthState(config.clientId);
  debug('checking oauth state token');

  const pageState = _validateAndGetStoredState(storedState, oauthCsrfToken);

  const tokenInfo = await _fetchTokenInfo(searchParams.get('code'), config, storedState.v);
  const accessToken = tokenInfo.access_token;
  const refreshToken = tokenInfo.refresh_token;
  const expiresIn = tokenInfo.expires_in - EXPIRATION_BUFFER;
  const expiresAt = new Date(Date.now() + expiresIn * 1000);
  const authHeader = `Bearer ${accessToken}`;
  debug('got token', redactBearerToken(accessToken), 'which expires in', expiresIn, 'seconds');
  const userInfo = await _fetchUserInfo(authHeader);

  const user = _processUserInfo(userInfo);

  const token = _processTokenInfo({
    userInfo,
    accessToken,
    expiresAt,
    authHeader,
    refreshToken
  });

  return {
    state: STATE_AUTHENTICATED,
    user,
    token
  };
}

async function _fetchTokenInfo(code, config, codeVerifier) {
  debug('Exchanging code for token');
  const tokenUrl = `${BASE_URL}/token`;
  const body = new URLSearchParams();
  body.set('grant_type', 'authorization_code');
  body.set('client_id', config.clientId);
  body.set('redirect_uri', config.callbackUrl);
  body.set('code', code);
  body.set('code_verifier', codeVerifier);
  const resp = await fetch(tokenUrl, {
    method: 'POST',
    headers: new Headers({
      'Accept': 'application/json',
      'Content-Type': 'application/x-www-form-urlencoded'
    }),
    body
  });

  if (resp.status !== 200) {
    const body = await resp.text();
    error('Error getting OAuth User Info. Status Code:', resp.status, 'Response:\n', body);
    throw new OAuthError('unable-to-exchange-code-for-token', 'Unable to exchange code for token. Please try again.');
  }

  const json = await resp.json();
  debug('successfully got user info', json);
  return json;
}

async function _fetchUserInfo(authHeader) {
  const USER_INFO_URL = `${BASE_URL}/openid-userinfo/v1/userinfo?schema=openid`;
  debug('fetching user info from', USER_INFO_URL);
  const resp = await fetch(USER_INFO_URL, {
    method: 'GET',
    headers: new Headers({
      'Accept': 'application/json',
      'Authorization': authHeader
    }),
    mode: 'cors'
  });
  debug('got status', resp.status);

  if (resp.status !== 200) {
    const body = await resp.text();

    if (resp.status === 403) {
      debug('got forbidden error');

      if (body.includes('<ams:code>900908</ams:code>')) {
        debug('client app isn\'t subscribed to OpenID UserInfo endpoint');
        error(`DEVELOPER ERROR: You may not be subscribed to the OpenID UserInfo endpoint. Please visit https://api.byu.edu/store/apis/info?name=OpenID-Userinfo&version=v1&provider=BYU%2Fjmooreoa to subscribe.`);
        throw new OAuthError('not-subscribed-to-user-info', 'This page has an authentication configuration error. Developers, see the console for details.');
      } else {
        error('invalid oauth bearer token');
        throw new OAuthError('invalid-oauth-token', 'The provided authentication token is invalid. Please try again.');
      }
    }

    error('Error getting OAuth User Info. Status Code:', resp.status, 'Response:\n', body);
    throw new OAuthError('unable-to-get-user-info', 'Unable to fetch user information. Please try again.');
  }

  const json = await resp.json();
  debug('successfully got user info', json);
  return json;
}

const CLAIMS_PREFIX_RESOURCE_OWNER = 'http://byu.edu/claims/resourceowner_';
const CLAIMS_PREFIX_CLIENT = 'http://byu.edu/claims/client_';
const CLAIMS_PREFIX_WSO2 = 'http://wso2.org/claims/';
const CLAIMS_KNOWN_PREFIXES = [CLAIMS_PREFIX_CLIENT, CLAIMS_PREFIX_RESOURCE_OWNER, CLAIMS_PREFIX_WSO2];

function groupClaimPrefixes(userInfo) {
  const grouped = {
    other: {}
  };

  for (const prefix of CLAIMS_KNOWN_PREFIXES) {
    grouped[prefix] = {};
  }

  for (const key of Object.keys(userInfo)) {
    const value = userInfo[key];
    const prefix = CLAIMS_KNOWN_PREFIXES.find(function (it) {
      return key.startsWith(it);
    });

    if (prefix) {
      grouped[prefix][key.substr(prefix.length)] = value;
    } else {
      grouped.other[key] = value;
    }
  }

  return grouped;
}

function ungroupClaimPrefixes(grouped) {
  const result = {};

  for (const groupKey of CLAIMS_KNOWN_PREFIXES) {
    const group = grouped[groupKey];
    if (!group) continue;

    for (const key of Object.keys(group)) {
      result[groupKey + key] = group[key];
    }
  }

  for (const other of Object.keys(grouped.other)) {
    result[other] = grouped.other[other];
  }

  return result;
}

function getClaims(userInfo, prefix) {
  return Object.keys(userInfo).filter(function (k) {
    return k.startsWith(prefix);
  }).reduce(function (agg, key) {
    agg[key.substr(prefix.length)] = userInfo[key];
    return agg;
  }, {});
}

function _processUserInfo(userInfo) {
  const roClaims = getClaims(userInfo, CLAIMS_PREFIX_RESOURCE_OWNER);
  const familyNamePosition = roClaims.surname_position;
  const givenName = roClaims.preferred_first_name;
  const familyName = roClaims.surname;
  const displayName = familyNamePosition === 'F' ? `${familyName} ${givenName}` : `${givenName} ${familyName}`;
  return {
    personId: roClaims.person_id,
    byuId: roClaims.byu_id,
    netId: roClaims.net_id,
    name: {
      sortName: roClaims.sort_name,
      displayName,
      givenName,
      familyName,
      familyNamePosition
    },
    rawUserInfo: userInfo
  };
}

function _processTokenInfo({
  userInfo,
  accessToken,
  expiresAt,
  authHeader,
  refreshToken
}) {
  const clientClaims = getClaims(userInfo, CLAIMS_PREFIX_CLIENT);
  const wso2Claims = getClaims(userInfo, CLAIMS_PREFIX_WSO2);
  return {
    bearer: accessToken,
    refresh: refreshToken,
    authorizationHeader: authHeader,
    expiresAt,
    client: {
      id: wso2Claims.client_id,
      byuId: clientClaims.byu_id,
      appName: wso2Claims.applicationname
    },
    rawUserInfo: userInfo
  };
}

function _validateAndGetStoredState(storedState, expectedCsrfToken) {
  debug('validating stored state token. Expecting token', expectedCsrfToken, ', got state', storedState);

  if (!storedState) {
    error('no stored oauth login state');
    throw new OAuthError('no-oauth-state', 'Your saved authentication information does not match. Please try again.');
  }

  const {
    e: stateExpiresString,
    c: storedCsrfToken,
    s: pageState
  } = storedState;

  if (expectedCsrfToken !== storedCsrfToken) {
    error('CSRF token mismatch');
    throw new OAuthError('oauth-state-mismatch', 'Your saved authentication information does not match. Please try again.');
  }

  if (Number(stateExpiresString) < Date.now()) {
    error('stored state has expired');
    throw new OAuthError('oauth-state-expired', 'Your login attempt has timed out. Please try again.');
  }

  return pageState;
}

function _prepareStoredState(expires, csrfToken, codeVerifier, pageState) {
  return {
    e: expires,
    c: csrfToken,
    v: codeVerifier,
    s: pageState
  };
}

class OAuthError extends Error {
  constructor(type, description, uri) {
    super('OAuth Error: ' + description);
    this.type = type;
    this.description = description;
    this.uri = uri;
  }

}

const allowableRandomChars = [...'0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'];
const randomCharRangeConvert = allowableRandomChars.length / 2 ** 8; // Using Uint8Array for getRandomValues

function randomString(length) {
  const randomArray = new Uint8Array(length || 24);
  const crypto = window.crypto || window.msCrypto;
  crypto.getRandomValues(randomArray);
  return randomArray.reduce(function (str, cur) {
    return str + allowableRandomChars[Math.floor(cur * randomCharRangeConvert)];
  }, '');
}

function logStateChange(state, user, token, error$1) {
  const logParts = ['state change:', {
    state,
    user: redactUser(user),
    token: token,
    //redactToken(token),
    error: error$1
  }];

  if (error$1) {
    error(...logParts);
  } else {
    info(...logParts);
  }
}

function redactUser(u) {
  if (!u) return undefined;
  return {
    netId: u.netId,
    'rest-is-redacted': true
  };
}

function redactToken(t) {
  debug('redacting token', t);
  if (!t) return undefined;
  const {
    bearer,
    expiresAt,
    client
  } = t;
  return {
    bearer: redactBearerToken(bearer),
    expiresAt: !!expiresAt ? expiresAt.toISOString() : null,
    client,
    'rest-is-redacted': true
  };
}

function redactBearerToken(b) {
  if (!b) return undefined;
  return b.substring(0, 2) + '...redacted...' + b.substring(b.length - 2);
}

function ensureOnlyInstance(obj) {
  if (SINGLETON_INSTANCE) {
    const trace = SINGLETON_INSTANCE.___startupTrace;
    throw new Error('There is already an instance of byu-oauth-implicit running!  Please call `#shutdown()` on that instance before starting a new one. Instance was started at:\n' + trace);
  }

  obj.___startupTrace = new Error().stack;
  SINGLETON_INSTANCE = obj;
}

function cleanupOnlyInstance(obj) {
  SINGLETON_INSTANCE = null;
}

/*
 * Copyright 2018 Brigham Young University
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
const DEFAULT_ISSUER = 'https://api.byu.edu';
const DEFAULT_BASE_URL = 'https://api.byu.edu';
const GLOBAL_CONFIG_KEY = 'byu-oauth-implicit-config';
/**
 * @typedef {} ImplicitConfig
 * @prop {string} clientId
 * @prop {?string} issuer
 * @prop {?string} baseUrl
 * @prop {?string} callbackUrl
 * @prop {?boolean} requireAuthentication
 */

/**
 * @param {ImplicitConfig|ImplicitConfig[]|undefined} cfgOrRules
 * @param location
 */

async function configure(cfgOrRules, location = window.location) {
  const cfg = resolveConfig(cfgOrRules, location);
  const globalConfig = window[GLOBAL_CONFIG_KEY];
  const config = Object.assign({
    issuer: DEFAULT_ISSUER,
    baseUrl: DEFAULT_BASE_URL,
    callbackUrl: `${location.origin}${location.pathname}`,
    autoRefreshOnTimeout: false
  }, globalConfig, cfg);

  if (!config.clientId) {
    throw new Error('clientId must be specified in config');
  }

  const provider = new ImplicitGrantProvider(config, window, document);
  return provider.startup();
}

function resolveConfig(rules, location) {
  if (!rules) {
    return {};
  }

  if ('clientId' in rules) {
    return rules;
  }

  const keys = Object.keys(rules).filter(function (it) {
    return it.startsWith('https://') || it.startsWith('http://');
  });

  if (keys.length === 0) {
    return rules;
  }

  const key = keys // order by length of key (most specific), descending
  .sort(function (a, b) {
    return b.length - a.length;
  }).find(function (it) {
    return location.href.startsWith(it);
  });

  if (key) {
    return Object.assign({
      callbackUrl: key
    }, rules[key]);
  }

  throw new Error(`Unable to match url [${location.href}] to one of [${keys}]`);
}

export { DEFAULT_BASE_URL, DEFAULT_ISSUER, GLOBAL_CONFIG_KEY, IG_STATE_AUTO_REFRESH_FAILED, configure };
//# sourceMappingURL=implicit-grant.js.map

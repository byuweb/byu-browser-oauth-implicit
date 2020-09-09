this.BYU = this.BYU || {};
this.BYU.oauth = this.BYU.oauth || {};
this.BYU.oauth.implicit = (function (exports) {
  'use strict';

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
  function parseHash(hash) {
    debug('parsing hash', hash);
    if (!hash) return new Map();
    let subHash = hash;

    if (hash.startsWith('#')) {
      subHash = hash.substr(1);
    }

    const keyValues = subHash.split('&').map(function (it) {
      return it.split('=', 2);
    });
    return new Map(keyValues);
  }

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
  let SINGLETON_INSTANCE;
  const CHILD_IFRAME_ID = 'byu-oauth-implicit-grant-refresh-iframe';
  const FIFTY_FIVE_MINUTES_MILLIS = 3300000;
  const STORED_STATE_LIFETIME = 5 * 60 * 1000; // 5 minutes

  const IG_STATE_AUTO_REFRESH_FAILED = 'implicit-grant-auto-refresh-failed';
  class ImplicitGrantProvider {
    constructor(config, window, document, storageHandler = new StorageHandler()) {
      debug('initializing provider with config', config);
      this.config = config;
      this.window = window;
      this.document = document;
      this.storageHandler = storageHandler;
      this._listeners = {};
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
      const hash = this._hashParams;

      if (this.isAuthenticationCallback(location.href, hash)) {
        debug('handling authentication callback');

        this._changeState(STATE_AUTHENTICATING);

        try {
          const {
            state,
            user,
            token,
            error
          } = await _handleAuthenticationCallback(this.config, location, hash, this.storageHandler);

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
      debug('checking expiration time');
      const expiresInMs = expirationTimeInMs - Date.now();
      const definitelyExpired = expiresInMs < 0; // In certain cases, WSO2 can send us a token whose expiration is ACTUALLY 55 minutes (60 minutes minus the 5-minute grace period) 🤦.
      // So, if we see a longer-than-55-minute expiration, we may try to silently auto-refresh the token so we can get an accurate expiration.
      // BUT there's yet another bug in WSO2 where sometimes the authentication response *always* says the expiration is 60 minutes away,
      // even if it's less than 60 minutes away. So we only do this "maybeFunkyExpiration" *once* per token initialization

      const maybeFunkyExpiration = expiresInMs > FIFTY_FIVE_MINUTES_MILLIS && !this._alreadyDidFunkyCheck; // *After* the "maybeFunky" check, update _alreadyDidFunkyCheck based on whether the current token is expired

      this._alreadyDidFunkyCheck = !definitelyExpired;

      if (!definitelyExpired && !maybeFunkyExpiration) {
        this._scheduleExpirationCheck(expirationTimeInMs);

        return;
      }

      if (this.config.autoRefreshOnTimeout) {
        // If we've expired OR if the WSO2 five-minute grace period was not added, mark the state as refreshing.
        // Schedule a refresh in an extra 5 seconds to avoid WSO2 clock skew problems.
        // Existing token *should* have a five-minute grace period after expiration:
        // a new request will generate a new token, but the old token should still
        // work during that grace period, so we keep the user and token objects around.
        if (maybeFunkyExpiration) {
          debug('silently refreshing token to work around odd identity server issue');
        }

        this._changeState(STATE_REFRESHING, this.store.user, this.store.token);

        this._scheduleRefresh();
      } else if (definitelyExpired) {
        // We don't have auto-refresh enabled, so flag the token as expired and let the application handle it.
        this._changeState(STATE_EXPIRED, this.store.user, this.store.token);
      }
    }

    _scheduleRefresh() {
      var _this = this;

      info('scheduling auto-refresh');

      if (this.__refreshTask) {
        debug('refresh already scheduled');
        return;
      } // Wait a few seconds before triggering the actual refresh, allowing for clock
      // skew with WSO2


      return this.__refreshTask = setTimeout(function () {
        _this.__refreshTask = null;

        _this.startRefresh('iframe');
      }, 5000);
    }

    _scheduleExpirationCheck(expirationTimeInMs) {
      var _this2 = this;

      if (this.__expirationTask) {
        clearTimeout(this.__expirationTask);
      } // Simply using setTimeout for an hour in the future
      // doesn't work; setTimeout isn't that precise over that long of a period.
      // So re-check every five seconds until we're past the expiration time


      return this.__expirationTask = setTimeout(function () {
        _this2.__expirationTask = null;

        _this2._checkExpired(expirationTimeInMs);
      }, 5000);
    }

    get _location() {
      return this.window.location;
    }

    get _hashParams() {
      return parseHash(this._location.hash);
    }

    isAuthenticationCallback(href, hash) {
      const isCallbackUrl = href.indexOf(this.config.callbackUrl) === 0;
      const hasHash = hash.size !== 0;

      if (!isCallbackUrl || !hasHash) {
        return false;
      }

      return hash.has('access_token') || hash.has('error');
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
      var _this3 = this;

      infof('Starting login. mode=%s', displayType);
      const {
        clientId,
        callbackUrl
      } = this.config;
      const csrf = randomString();

      const storedState = _prepareStoredState(Date.now() + STORED_STATE_LIFETIME, csrf, {});

      this.storageHandler.saveOAuthState(this.config.clientId, storedState);
      const loginUrl = `https://api.byu.edu/authorize?response_type=token&client_id=${clientId}&redirect_uri=${encodeURIComponent(callbackUrl)}&scope=openid&state=${csrf}`;
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

          _this3._changeState(IG_STATE_AUTO_REFRESH_FAILED, null, null);
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
      const logoutUrl = 'https://api.byu.edu/logout?redirect_url=' + encodeURIComponent(casLogoutUrl);
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

    startRefresh(displayType = 'iframe') {
      infof('starting refresh. displayType=%s', displayType);
      this.startLogin(displayType);
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

    const token = _processTokenInfo(userInfo, state.at, expiresAt, `Bearer ${state.at}`);

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

  async function _handleAuthenticationCallback(config, location, hash, storage) {
    if (hash.has('error')) {
      error('Got oauth error in URL hash');
      throw new OAuthError(hash.get('error'), hash.get('error_description'), hash.get('error_uri'));
    }

    const oauthCsrfToken = hash.get('state');
    const storedState = storage.getOAuthState(config.clientId);
    storage.clearOAuthState(config.clientId);
    debug('checking oauth state token');

    const pageState = _validateAndGetStoredState(storedState, oauthCsrfToken);

    const accessToken = hash.get('access_token');
    const expiresIn = Number(hash.get('expires_in'));
    const expiresAt = new Date(Date.now() + expiresIn * 1000);
    const authHeader = `Bearer ${accessToken}`;
    debug('got token', redactBearerToken(accessToken), 'which expires in', expiresIn, 'seconds');
    const userInfo = await _fetchUserInfo(authHeader);

    const user = _processUserInfo(userInfo);

    const token = _processTokenInfo(userInfo, accessToken, expiresAt, authHeader);

    location.hash = '';
    return {
      state: STATE_AUTHENTICATED,
      user,
      token
    };
  }

  const USER_INFO_URL = 'https://api.byu.edu/openid-userinfo/v1/userinfo?schema=openid';

  async function _fetchUserInfo(authHeader) {
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

  function _processTokenInfo(userInfo, accessToken, expiresAt, authHeader) {
    const clientClaims = getClaims(userInfo, CLAIMS_PREFIX_CLIENT);
    const wso2Claims = getClaims(userInfo, CLAIMS_PREFIX_WSO2);
    return {
      bearer: accessToken,
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

  function _prepareStoredState(expires, csrfToken, pageState) {
    return {
      e: expires,
      c: csrfToken,
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

  function randomString() {
    let idArray = new Uint32Array(3);
    const crypto = window.crypto || window.msCrypto;
    crypto.getRandomValues(idArray);
    return idArray.reduce(function (str, cur) {
      return str + cur.toString(16);
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
  const GLOBAL_CONFIG_KEY = 'byu-oauth-implicit-config';
  /**
   * @typedef {} ImplicitConfig
   * @prop {string} clientId
   * @prop {?string} issuer
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

  exports.DEFAULT_ISSUER = DEFAULT_ISSUER;
  exports.GLOBAL_CONFIG_KEY = GLOBAL_CONFIG_KEY;
  exports.configure = configure;

  return exports;

}({}));
//# sourceMappingURL=implicit-grant.nomodule.js.map

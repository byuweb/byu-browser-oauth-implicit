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
class StorageHandler {
  saveOAuthState(clientId, state) {
    storage.setItem(getKey(clientId), JSON.stringify(state));
  }

  getOAuthState(clientId) {
    const result = storage.getItem(getKey(clientId));

    if (!result) {
      return null;
    }

    return JSON.parse(result);
  }

  clearOAuthState(clientId) {
    storage.removeItem(getKey(clientId));
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
const CHILD_IFRAME_ID = 'byu-oauth-implicit-grant-refresh-iframe';
const STORED_STATE_LIFETIME = 5 * 60 * 1000; // 5 minutes

const IG_STATE_REFRESH_REQUIRED = 'implicit-grant-refresh-required';
const IG_STATE_AUTO_REFRESH_FAILED = 'implicit-grant-auto-refresh-failed';
class ImplicitGrantProvider {
  constructor(config, window, document, storageHandler = new StorageHandler()) {
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
  }

  _changeState(state, user, token, error) {
    this.store = Object.freeze({
      state,
      user,
      token,
      error
    });

    _dispatchEvent(this, EVENT_STATE_CHANGE, this.store);
  } // Separate state change listener, because state change events
  // might come from child iframe/popup window


  handleStateChange({
    state,
    user,
    token
  }) {
    // If this is a popup
    if (this.window.opener) {
      this.window.opener.document.dispatchEvent(new CustomEvent(EVENT_STATE_CHANGE, {
        detail: {
          state,
          token,
          user
        }
      }));

      if (state === STATE_AUTHENTICATED) {
        this.window.close();
      }

      return;
    } // If we're inside the "refresh" iframe,
    // then delete now that authentication
    // is complete


    const iframe = parent.document.getElementById(CHILD_IFRAME_ID);

    if (iframe) {
      if (state === STATE_AUTHENTICATED) {
        iframe.parentNode.removeChild(iframe);
      }

      return;
    }

    this._maybeUpdateStoredSession(state, user, token);

    if (state === STATE_AUTHENTICATED) {
      this._checkRefresh(token.expiresAt.getTime());
    }
  }

  async startup() {
    this.listen();

    this._changeState(STATE_INDETERMINATE);

    const location = this._location;
    const hash = this._hashParams;

    if (this.isAuthenticationCallback(location.href, hash)) {
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
        console.error('OAuth Error', err);

        this._changeState(STATE_ERROR, undefined, undefined, err);
      }
    }

    if (this.hasStoredSession()) {
      this._updateStateFromStorage();
    } else {
      this._changeState(STATE_UNAUTHENTICATED);
    }
  }

  _checkRefresh(expirationTimeInMs) {
    var _this = this;

    // Simply using setTimeout for an hour in the future
    // doesn't work; setTimeout isn't that precise over that long of a period.
    // So re-check every five seconds until we're past the expiration time
    const expiresInMs = expirationTimeInMs - Date.now();

    if (expiresInMs < 0 || expiresInMs > 3300000) {
      // If we've expired OR if the WSO2 five-minute grace period was not added, then trigger a refresh.
      // Wait an extra 5 seconds to avoid WSO2 clock skew problems
      // Existing token *should* have a five-minute grace period after expiration:
      // a new request will generate a new token, but the old token should still
      // work during that grace period
      let fn = function fn() {
        return _this.startRefresh('iframe');
      };

      if (this.config.doNotAutoRefreshOnTimeout) {
        fn = function fn() {
          return _this._changeState(IG_STATE_REFRESH_REQUIRED);
        };
      }

      return setTimeout(fn, 5000);
    }

    setTimeout(function () {
      return _this._checkRefresh(expirationTimeInMs);
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
    this.unlisten();

    this._changeState(STATE_INDETERMINATE);
  }

  listen() {
    _listenTo(this, EVENT_LOGIN_REQUESTED, this.startLogin);

    _listenTo(this, EVENT_LOGOUT_REQUESTED, this.startLogout);

    _listenTo(this, EVENT_REFRESH_REQUESTED, this.startRefresh);

    _listenTo(this, EVENT_CURRENT_INFO_REQUESTED, this.handleCurrentInfoRequest);

    _listenTo(this, EVENT_STATE_CHANGE, this.handleStateChange);
  }

  unlisten() {
    _unlistenTo(this, EVENT_LOGIN_REQUESTED);

    _unlistenTo(this, EVENT_LOGOUT_REQUESTED);

    _unlistenTo(this, EVENT_REFRESH_REQUESTED);

    _unlistenTo(this, EVENT_CURRENT_INFO_REQUESTED);

    _unlistenTo(this, EVENT_STATE_CHANGE);
  }

  startLogin(displayType = 'window') {
    var _this2 = this;

    console.log('starting login', this);
    const {
      clientId,
      callbackUrl
    } = this.config;
    const csrf = randomString();

    const storedState = _prepareStoredState(Date.now() + STORED_STATE_LIFETIME, csrf, {});

    this.storageHandler.saveOAuthState(this.config.clientId, storedState);
    const loginUrl = `https://api.byu.edu/authorize?response_type=token&client_id=${clientId}&redirect_uri=${encodeURIComponent(callbackUrl)}&scope=openid&state=${csrf}`;

    if (!displayType || displayType == 'window') {
      console.warn(`[OAuth] - Redirecting user to '${loginUrl}'`);
      this.window.location = loginUrl;
      return;
    } else if (displayType === 'popup') {
      this.window.open(loginUrl);
      return;
    } // last option: displayType == 'iframe'


    let iframe = document.getElementById(CHILD_IFRAME_ID);

    if (iframe) {
      iframe.parentNode.removeChild(iframe);
    }

    iframe = document.createElement('iframe');

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
      }
    };

    iframe.id = CHILD_IFRAME_ID;
    iframe.src = loginUrl;
    iframe.style = 'display:none';
    document.body.appendChild(iframe);
  }

  startLogout() {
    this.storageHandler.clearSessionState(this.config.clientId);
    const redirectUrl = this.config.callbackUrl;
    this.window.location = 'http://api.byu.edu/logout?redirect_url=' + redirectUrl; //https://api.byu.edu/revoke
    //TODO: WSO2 Identity Server 5.1 allows us to revoke implicit tokens.  Once that's done, we'll need to do this.
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

  startRefresh(displayType = 'window') {
    this.startLogin(displayType);
  }

  handleCurrentInfoRequest({
    callback
  }) {
    if (callback) {
      callback(this.store);
    }
  }

  _updateStateFromStorage() {
    const serialized = this.storageHandler.getSessionState(this.config.clientId);

    if (!serialized) {
      this._changeState(STATE_UNAUTHENTICATED);

      return;
    }

    const {
      user,
      token
    } = deserializeSessionState(serialized);

    if (!user || !token) {
      this._changeState(STATE_UNAUTHENTICATED);
    } else if (token.expiresAt > new Date()) {
      this._changeState(STATE_AUTHENTICATED, user, token);
    } else {
      this._changeState(STATE_UNAUTHENTICATED);
    }
  }

  _maybeUpdateStoredSession(state, user, token) {
    if (state === STATE_UNAUTHENTICATED) {
      this.storageHandler.clearSessionState(this.config.clientId);
    } else if (!!user && !!token) {
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

  const token = _processTokenInfo(userInfo, state.at, expiresAt, state.at);

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
    throw new OAuthError(hash.get('error'), hash.get('error_description'), hash.get('error_uri'));
  }

  const oauthCsrfToken = hash.get('state');
  const storedState = storage.getOAuthState(config.clientId);
  storage.clearOAuthState(config.clientId);

  const pageState = _validateAndGetStoredState(storedState, oauthCsrfToken);

  const accessToken = hash.get('access_token');
  const expiresIn = Number(hash.get('expires_in'));
  const expiresAt = new Date(Date.now() + expiresIn * 1000);
  const authHeader = `Bearer ${accessToken}`;
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

async function _fetchUserInfo(authHeader) {
  const resp = await fetch('https://api.byu.edu/openid-userinfo/v1/userinfo?schema=openid', {
    method: 'GET',
    headers: new Headers({
      'Accept': 'application/json',
      'Authorization': authHeader
    }),
    mode: 'cors'
  });

  if (resp.status !== 200) {
    const body = await resp.text();

    if (resp.status === 403) {
      if (body.includes('<ams:code>900908</ams:code>')) {
        console.error(`DEVELOPER ERROR: You may not be subscribed to the OpenID UserInfo endpoint. Please visit https://api.byu.edu/store/apis/info?name=OpenID-Userinfo&version=v1&provider=BYU%2Fjmooreoa to subscribe.`);
        throw new OAuthError('not-subscribe-to-user-info', 'This page has an authentication configuration error. Developers, see the console for details.');
      } else {
        throw new OAuthError('invalid-oauth-token', 'The provided authentication token is invalid. Please try again.');
      }
    }

    console.error('Error getting OAuth User Info. Status Code:', resp.status, 'Response:\n', body);
    throw new OAuthError('unable-to-get-user-info', 'Unable to fetch user information. Please try again.');
  }

  return await resp.json();
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
  const givenName = userInfo.given_name;
  const familyName = userInfo.family_name;
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
  const {
    e: stateExpiresString,
    c: storedCsrfToken,
    s: pageState
  } = storedState;

  if (expectedCsrfToken !== storedCsrfToken) {
    throw new OAuthError('oauth-state-mismatch', 'Your saved authentication information does not match. Please try again.');
  }

  if (Number(stateExpiresString) < Date.now()) {
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
 *
 * @param {ImplicitConfig} cfg
 */

async function configure(cfg) {
  const globalConfig = window[GLOBAL_CONFIG_KEY];
  const config = Object.assign({
    issuer: DEFAULT_ISSUER,
    callbackUrl: `${location.origin}${location.pathname}`,
    doNotAutoRefreshOnTimeout: false,
    displayType: 'window'
  }, globalConfig, cfg);

  if (!config.clientId) {
    throw new Error('clientId must be specified in config');
  }

  const provider = new ImplicitGrantProvider(config, window, document);
  return provider.startup();
}

export { DEFAULT_ISSUER, GLOBAL_CONFIG_KEY, configure };
//# sourceMappingURL=implicit-grant.js.map

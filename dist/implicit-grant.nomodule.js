this.BYU = this.BYU || {};
this.BYU.oauth = this.BYU.oauth || {};
this.BYU.oauth.implicit = (function (exports) {
  'use strict';

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
      var eq_idx = pair.indexOf('=');

      // skip things that don't look like key=value
      if (eq_idx < 0) {
        continue;
      }

      var key = pair.substr(0, eq_idx).trim();
      var val = pair.substr(++eq_idx, pair.length).trim();

      // quoted values
      if ('"' == val[0]) {
        val = val.slice(1, -1);
      }

      // only assign once
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

  var cookie$1 = /*#__PURE__*/Object.freeze({
    default: cookie,
    __moduleExports: cookie,
    parse: parse_1,
    serialize: serialize_1
  });

  var _cookie = ( cookie$1 && cookie ) || cookie$1;

  var CookieStorage_1 = createCommonjsModule(function (module, exports) {

  Object.defineProperty(exports, "__esModule", {
    value: true
  });

  var _createClass = function () {
    function defineProperties(target, props) {
      for (var i = 0; i < props.length; i++) {
        var descriptor = props[i];descriptor.enumerable = descriptor.enumerable || false;descriptor.configurable = true;if ("value" in descriptor) descriptor.writable = true;Object.defineProperty(target, descriptor.key, descriptor);
      }
    }return function (Constructor, protoProps, staticProps) {
      if (protoProps) defineProperties(Constructor.prototype, protoProps);if (staticProps) defineProperties(Constructor, staticProps);return Constructor;
    };
  }();

  exports.hasCookies = hasCookies;



  var _cookie2 = _interopRequireDefault(_cookie);

  function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
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

      this.cookieOptions = Object.assign({ path: '/' }, options);
      prefix = options.prefix || prefix;
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
        var options = Object.assign({}, this.cookieOptions, { maxAge: -1 });
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

  var CookieStorage = unwrapExports(CookieStorage_1);
  var CookieStorage_2 = CookieStorage_1.hasCookies;

  var CookieStorage$1 = /*#__PURE__*/Object.freeze({
    default: CookieStorage,
    __moduleExports: CookieStorage_1,
    hasCookies: CookieStorage_2
  });

  var _CookieStorage = ( CookieStorage$1 && CookieStorage ) || CookieStorage$1;

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
      return (0, _CookieStorage.hasCookies)();
    }

    if (storage === 'memory') {
      return true;
    }

    throw new Error('Storage method `' + name + '` is not available.\n    Please use one of the following: localStorage, sessionStorage, cookieStorage, memoryStorage.');
  }
  });

  var isSupported = unwrapExports(isSupported_1);

  var isSupported$1 = /*#__PURE__*/Object.freeze({
    default: isSupported,
    __moduleExports: isSupported_1
  });

  var MemoryStorage_1 = createCommonjsModule(function (module, exports) {

  Object.defineProperty(exports, "__esModule", {
    value: true
  });

  var _createClass = function () {
    function defineProperties(target, props) {
      for (var i = 0; i < props.length; i++) {
        var descriptor = props[i];descriptor.enumerable = descriptor.enumerable || false;descriptor.configurable = true;if ("value" in descriptor) descriptor.writable = true;Object.defineProperty(target, descriptor.key, descriptor);
      }
    }return function (Constructor, protoProps, staticProps) {
      if (protoProps) defineProperties(Constructor.prototype, protoProps);if (staticProps) defineProperties(Constructor, staticProps);return Constructor;
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

  var MemoryStorage = unwrapExports(MemoryStorage_1);

  var MemoryStorage$1 = /*#__PURE__*/Object.freeze({
    default: MemoryStorage,
    __moduleExports: MemoryStorage_1
  });

  var _isSupported = ( isSupported$1 && isSupported ) || isSupported$1;

  var _MemoryStorage = ( MemoryStorage$1 && MemoryStorage ) || MemoryStorage$1;

  var lib = createCommonjsModule(function (module, exports) {

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.MemoryStorage = exports.CookieStorage = exports.isSupported = exports.storage = undefined;



  var _isSupported2 = _interopRequireDefault(_isSupported);



  var _CookieStorage2 = _interopRequireDefault(_CookieStorage);



  var _MemoryStorage2 = _interopRequireDefault(_MemoryStorage);

  function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
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
  }

  function getKey(clientId) {
    return 'oauth-state-' + encodeURIComponent(clientId);
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

  const STORED_STATE_LIFETIME = 5 * 60 * 1000; // 5 minutes

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
        state, user, token, error
      });
      _dispatchEvent(this, EVENT_STATE_CHANGE, this.store);
    }

    async startup() {
      this.listen();
      this._changeState(STATE_INDETERMINATE);

      const location = this._location;
      const hash = this._hashParams;

      if (this.isAuthenticationCallback(location.href, hash)) {
        this._changeState(STATE_AUTHENTICATING);
        try {
          const { state, user, token, error } = await _handleAuthenticationCallback(this.config, location, hash, this.storageHandler);
          this._changeState(state, user, token, error);
        } catch (err) {
          console.error('OAuth Error', err);
          this._changeState(STATE_ERROR, undefined, undefined, err);
        }
      } else {
        this._changeState(STATE_UNAUTHENTICATED);
      }
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

    shutdown() {
      this.unlisten();
      this._changeState(STATE_INDETERMINATE);
    }

    listen() {
      _listenTo(this, EVENT_LOGIN_REQUESTED, this.startLogin);
      _listenTo(this, EVENT_LOGOUT_REQUESTED, this.startLogout);
      _listenTo(this, EVENT_REFRESH_REQUESTED, this.startRefresh);
      _listenTo(this, EVENT_CURRENT_INFO_REQUESTED, this.handleCurrentInfoRequest);
    }

    unlisten() {
      _unlistenTo(this, EVENT_LOGIN_REQUESTED);
      _unlistenTo(this, EVENT_LOGOUT_REQUESTED);
      _unlistenTo(this, EVENT_REFRESH_REQUESTED);
      _unlistenTo(this, EVENT_CURRENT_INFO_REQUESTED);
    }

    startLogin() {
      console.log('starting login', this);
      const { clientId, callbackUrl } = this.config;
      const csrf = randomString();

      const storedState = _prepareStoredState(Date.now() + STORED_STATE_LIFETIME, csrf, {});
      this.storageHandler.saveOAuthState(this.config.clientId, storedState);

      const loginUrl = `https://api.byu.edu/authorize?response_type=token&client_id=${clientId}&redirect_uri=${encodeURIComponent(callbackUrl)}&scope=openid&state=${csrf}`;

      console.warn(`[OAuth] - Redirecting user to '${loginUrl}'`);

      this.window.location = loginUrl;
    }

    startLogout() {
      const redirectUrl = this.config.callbackUrl;
      this.window.location = 'http://api.byu.edu/logout?redirect_url=' + redirectUrl;
      //https://api.byu.edu/revoke

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

    startRefresh() {
      this.startLogin();
    }

    handleCurrentInfoRequest() {}
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
      event = new CustomEvent(name, { detail });
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

    return { state: STATE_AUTHENTICATED, user, token };
  }

  async function _fetchUserInfo(authHeader) {
    const resp = await fetch('https://api.byu.edu/openid-userinfo/v1/userinfo?schema=openid', {
      method: 'GET',
      headers: new Headers({ 'Accept': 'application/json', 'Authorization': authHeader }),
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
    const { e: stateExpiresString, c: storedCsrfToken, s: pageState } = storedState;

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

  let store = Object.freeze({ state: STATE_INDETERMINATE });

  /*
   * TODOS:
   *  - implement logout
   *  - implement requireAuthentication
   */

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

    console.log('base', document.baseURI);

    const config = Object.assign({
      issuer: DEFAULT_ISSUER,
      callbackUrl: `${location.origin}${location.pathname}`,
      requireAuthentication: false
    }, globalConfig, cfg);

    if (!config.clientId) {
      throw new Error('clientId must be specified in config');
    }

    const provider = new ImplicitGrantProvider(config, window, document);

    return provider.startup();

    // await maybeHandleAuthenticationCallback(config);
    // await maybeForceLogin(config);
  }

  function startLogin() {
    const config = getConfig();
    const csrf = saveLoginToken(randomString$1(), {});

    const loginUrl = `https://api.byu.edu/authorize?response_type=token&client_id=${config.clientId}&redirect_uri=${encodeURIComponent(config.callbackUrl)}&scope=openid&state=${csrf}`;

    window.location = loginUrl;
  }

  function startRefresh() {
    startLogin();
  }

  function handleCurrentInfoRequest({ callback }) {
    callback(store);
  }

  function startLogout() {
    const config = getConfig();
    window.location = 'http://api.byu.edu/logout?redirect_url=' + config.callbackUrl;
    //https://api.byu.edu/revoke

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

  function saveLoginToken(token, pageState) {
    const config = getConfig();
    const name = getStorgeName(config.clientId);
    const value = `${token}.${btoa(JSON.stringify(pageState))}`;

    let type;
    if (storageAvailable('sessionStorage')) {
      window.sessionStorage.setItem(name, value);
      type = TOKEN_STORE_TYPE_SESSION;
    } else {
      document.cookie = `${name}=${value};max-age=300`;
      type = TOKEN_STORE_TYPE_COOKIE;
    }
    return type + '.' + token;
  }

  const TOKEN_STORE_TYPE_SESSION = 's';
  const TOKEN_STORE_TYPE_COOKIE = 'c';

  function storageAvailable(type) {
    let storage = '';
    try {
      storage = window[type];
      const testString = '__storage_test__';
      storage.setItem(testString, testString);
      storage.removeItem(testString);
      return true;
    } catch (e) {
      return e instanceof DOMException && (
      // everything except Firefox
      e.code === 22 ||
      // Firefox
      e.code === 1014 ||
      // test name field too, because code might not be present
      // everything except Firefox
      e.name === 'QuotaExceededError' ||
      // Firefox
      e.name === 'NS_ERROR_DOM_QUOTA_REACHED') &&
      // acknowledge QuotaExceededError only if there's something already stored
      storage.length !== 0;
    }
  }

  function randomString$1() {
    let idArray = new Uint32Array(3);
    const crypto = window.crypto || window.msCrypto;
    crypto.getRandomValues(idArray);

    return idArray.reduce(function (str, cur) {
      return str + cur.toString(16);
    }, '');
  }

  exports.DEFAULT_ISSUER = DEFAULT_ISSUER;
  exports.GLOBAL_CONFIG_KEY = GLOBAL_CONFIG_KEY;
  exports.configure = configure;
  exports.startLogin = startLogin;
  exports.startRefresh = startRefresh;
  exports.handleCurrentInfoRequest = handleCurrentInfoRequest;
  exports.startLogout = startLogout;

  return exports;

}({}));
//# sourceMappingURL=implicit-grant.nomodule.js.map

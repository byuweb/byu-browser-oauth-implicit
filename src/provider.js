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
"use strict";

import * as log from './log.js';
import * as authn from '@byuweb/browser-oauth/constants.js';
import {StorageHandler} from "./local-storage.js";
// NOTE: not using browser `crypto` module, because `crypto.subtle` isn't available when the browser isn't in HTTPS,
// and our development environments usually use plain HTTP. We're only doing a single one-way hash, so performance
// isn't a big deal
import sha256Lib from 'js-sha256'
const sha256 = sha256Lib.sha256

let SINGLETON_INSTANCE;
let BASE_URL;

const CHILD_IFRAME_ID = 'byu-oauth-implicit-grant-refresh-iframe'
const STORED_STATE_LIFETIME = 5 * 60 * 1000; // 5 minutes (in milliseconds)
const EXPIRATION_BUFFER = (5 * 60) + 5; // 5 minutes + 5 seconds (in seconds)
export const IG_STATE_AUTO_REFRESH_FAILED = 'implicit-grant-auto-refresh-failed'

export class ImplicitGrantProvider {
  constructor(config, window, document, storageHandler = new StorageHandler()) {
    log.debug('initializing provider with config', config);
    this.config = config;
    this.window = window;
    this.document = document;
    this.storageHandler = storageHandler;
    this._listeners = {};

    BASE_URL = this.config.baseUrl.replace(/\/+$/, '') // strip trailing slash(es)

    this.store = Object.freeze({
      state: authn.STATE_INDETERMINATE,
      user: null,
      token: null,
      error: null
    });
    log.debug('initialized provider');
  }

  _changeState(state, user, token, error) {
    logStateChange(state, user, token, error);
    this.store = Object.freeze({
      state, user, token, error
    });
    _dispatchEvent(this, authn.EVENT_STATE_CHANGE, this.store);
  }

  _checkPopupOpener() {
    try {
      const origin = this.window.opener.location.origin
      if (origin === (new URL(this.config.callbackUrl)).origin) { // Origins match
        return this.window.opener
      }
    } catch (e) {
      // Failed to get window.opener.location.origin, so we must have been opened
      // from a different origin.
      // Fall through to the "return false" outside this try/catch block
    }
    return false
  }

  _checkIframeOpener() {
    try {
      const iframe = this.window.parent.document.getElementById(CHILD_IFRAME_ID)
      if (iframe && iframe.contentWindow === this.window) {
        return iframe
      }
    } catch (e) {
      // Failed to access window.parent info, so we must be in an iframe from a different
      // origin.
      // Fall through to the "return false" outside this try/catch block
    }
    return false
  }

  // Separate state change listener, because state change events
  // might come from child iframe/popup window
  handleStateChange({ state, user, token, source }) {
    log.debug('in handleStateChange', state);

    const opener = this._checkPopupOpener()
    // If this is a popup
    if (opener) {
      // We're inside a child re-authentication popup

      if (source) {
        // event was triggered by a child, so ignore since we're inside a child
        return
      }

      log.debug('dispatching event to parent');
      // Pass event along to parent
      _dispatchEvent(opener, authn.EVENT_STATE_CHANGE, { state, token, user, source: 'popup' })

      if (state === authn.STATE_AUTHENTICATED) {
        // delete self now that authentication is complete
        log.info('closing self');
        this.window.close()
      }

      return
    }

    const iframe = this._checkIframeOpener()
    // If we're inside a "refresh" iframe
    if (iframe) {
      if (source) {
        // event was triggered by a child, so ignore since we're inside a child
        return
      }

      log.debug('dispatching event to parent');
      // Pass event along to parent
      _dispatchEvent(this.window.parent, authn.EVENT_STATE_CHANGE, { state, token, user, source: 'iframe' })

      if (state === authn.STATE_AUTHENTICATED) {
        // delete self now that authentication is complete
        log.info('removing child iframe');
        iframe.parentNode.removeChild(iframe)
      }

      return
    }

    this._maybeUpdateStoredSession(state, user, token);

    if (state === authn.STATE_AUTHENTICATED) {
      this._checkExpired(token.expiresAt.getTime())
    }
  }

  async startup() {
    ensureOnlyInstance(this);
    log.info('starting up');
    this.listen();
    this._changeState(authn.STATE_INDETERMINATE);

    const location = this._location;

    if (this.isAuthenticationCallback(location)) {
      log.debug('handling authentication callback');
      this._changeState(authn.STATE_AUTHENTICATING);
      try {
        const {state, user, token, error} = await _handleAuthenticationCallback(
          this.config,
          location,
          this.storageHandler
        );
        this._changeState(state, user, token, error);
      } catch (err) {
        log.error('OAuth Error', err);
        this._changeState(authn.STATE_ERROR, undefined, undefined, err);
      }
    } else if (this.hasStoredSession()) {
      log.debug('Has stored session');
      this._updateStateFromStorage();
    } else {
      log.debug('no authentication present');
      this._changeState(authn.STATE_UNAUTHENTICATED);
    }
    return this;
  }

  _checkExpired(expirationTimeInMs) {
    const expiresInMs = expirationTimeInMs - Date.now()

    log.debug(`checking expiration time; expires in ${expiresInMs} ms, ${new Date(expirationTimeInMs)}`);

    if (expiresInMs > (30 * 1000)) { // 30 second buffer before token actually expires
      if (this.__expirationTask) {
        clearTimeout(this.__expirationTask);
      }
      // Simply using setTimeout for an hour in the future
      // doesn't work; setTimeout isn't that precise over that long of a period.
      // So re-check every five seconds until we're past the expiration time
      this.__expirationTask = setTimeout(() =>  {
        this.__expirationTask = null;
        this._checkExpired(expirationTimeInMs);
      }, 5000);

      return;
    }

    if (this.config.autoRefreshOnTimeout) {
      this.startRefresh('iframe');
    } else {
      // We don't have auto-refresh enabled, so flag the token as expired and let the application handle it.
      this._changeState(authn.STATE_EXPIRED, this.store.user, this.store.token);
    }
  }

  get _location() {
    return this.window.location;
  }

  isAuthenticationCallback(location) {
    const isCallbackUrl = location.href.indexOf(this.config.callbackUrl) === 0;
    const hasCode = location.search && location.search.includes('code=') && location.search.includes('state=')

    return !!(isCallbackUrl && hasCode)
  }

  hasStoredSession() {
    return !!this.storageHandler.getSessionState(this.config.clientId);
  }

  shutdown() {
    log.info('shutting down');
    this.unlisten();
    this._changeState(authn.STATE_INDETERMINATE);
    cleanupOnlyInstance(this);
  }

  listen() {
    log.debug('setting up event listeners');
    _listenTo(this, authn.EVENT_LOGIN_REQUESTED, this.startLogin);
    _listenTo(this, authn.EVENT_LOGOUT_REQUESTED, this.startLogout);
    _listenTo(this, authn.EVENT_REFRESH_REQUESTED, this.startRefresh);
    _listenTo(this, authn.EVENT_CURRENT_INFO_REQUESTED, this.handleCurrentInfoRequest);
    _listenTo(this, authn.EVENT_STATE_CHANGE, this.handleStateChange);
  }

  unlisten() {
    log.debug('tearing down event listeners');
    _unlistenTo(this, authn.EVENT_LOGIN_REQUESTED);
    _unlistenTo(this, authn.EVENT_LOGOUT_REQUESTED);
    _unlistenTo(this, authn.EVENT_REFRESH_REQUESTED);
    _unlistenTo(this, authn.EVENT_CURRENT_INFO_REQUESTED);
    _unlistenTo(this, authn.EVENT_STATE_CHANGE);
  }

  startLogin(displayType = 'window') {
    log.infof('Starting login. mode=%s', displayType);
    const {clientId, callbackUrl} = this.config;
    const csrf = randomString();
    const codeVerifier = randomString(128);
    // challenge is base64-encoded SHA256 hash of codeVerifier
    const codeChallenge = btoa(String.fromCharCode(...sha256.array(codeVerifier)))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '')

    const storedState = _prepareStoredState(Date.now() + STORED_STATE_LIFETIME, csrf, codeVerifier, {});
    this.storageHandler.saveOAuthState(this.config.clientId, storedState);

    const loginUrl = `${BASE_URL}/authorize?response_type=code&client_id=${clientId}&redirect_uri=${encodeURIComponent(callbackUrl)}&scope=openid&state=${csrf}&code_challenge=${codeChallenge}&code_challenge_method=S256`;
    log.debug('computed login url of', loginUrl);

    if (!displayType || displayType == 'window') {
      log.info(`Redirecting user to '${loginUrl}'`);
      this.window.location = loginUrl;
      return
    } else if (displayType === 'popup') {
      log.info('launching popup at', loginUrl);
      this.window.open(loginUrl)
      return
    }

    log.info('Setting up hidden refresh iframe at', loginUrl);
    // last option: displayType == 'iframe'
    let iframe = this.document.getElementById(CHILD_IFRAME_ID)
    if (iframe) {
      iframe.parentNode.removeChild(iframe)
    }
    iframe = this.document.createElement('iframe')
    iframe.onload = () => {
      let html = null
      try {
        html = iframe.contentWindow.document.body.innerHTML
      } catch (err) {
        // intentional do-nothing
      }
      if (html === null) {
        // Hidden-frame refresh failed. Remove frame and
        // report problem
        iframe.parentNode.removeChild(iframe)
        this._changeState(IG_STATE_AUTO_REFRESH_FAILED, null, null)
        this._changeState(authn.STATE_UNAUTHENTICATED, null, null)
      }
    }
    iframe.id = CHILD_IFRAME_ID
    iframe.src = loginUrl
    iframe.style = 'display:none'
    log.debug('appending iframe', iframe);
    this.document.body.appendChild(iframe);
  }

  startLogout() {
    log.info('starting logout');
    this.storageHandler.clearSessionState(this.config.clientId);
    // Need to ensure BOTH api.byu.edu and cas.byu.edu clean out their sessions
    // With current config of those two sites, to have that full clean out AND a final "where to go after logout"
    // redirect, we need to manually wrap them all together
    const logoutRedirect = (this.config.logoutRedirect === undefined) ? this.config.callbackUrl : this.config.logoutRedirect
    const casLogoutUrl = 'https://cas.byu.edu/cas/logout?service=' + encodeURIComponent(logoutRedirect)
    const logoutUrl = `${BASE_URL}/logout?redirect_url=` + encodeURIComponent(casLogoutUrl);
    log.info('logging out by redirecting to', logoutUrl);
    this.window.location = logoutUrl;

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

  async startRefresh(displayType = 'iframe') {
    log.infof('starting refresh. displayType=%s', displayType);

    // Save copy of current info before triggering changeState
    const token = Object.assign({}, this.store.token)
    const user = Object.assign({}, this.store.user)

    // Also pass yet another isolated copy to changeState
    this._changeState(authn.STATE_REFRESHING, Object.assign({}, this.store.user), Object.assign({}, this.store.token));

    if (displayType !== 'iframe') {
      this.startLogin(displayType);
      return;
    }

    // If we have a refresh token, then try that before doing the more complicated iframe version
    if (!(token && token.refresh)) {
      this.startLogin('iframe');
      return;
    }

    const tokenUrl = `${BASE_URL}/token`;
    const body = new URLSearchParams();
    body.set('grant_type', 'refresh_token');
    body.set('client_id', this.config.clientId);
    body.set('refresh_token', token.refresh)

    const resp = await fetch(tokenUrl, {
      method: 'POST',
      headers: new Headers({ 'Accept': 'application/json', 'Content-Type': 'application/x-www-form-urlencoded' }),
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
    token.expiresAt = new Date(Date.now() + (expiresIn * 1000));

    this._changeState(authn.STATE_AUTHENTICATED, user, token);
  }

  handleCurrentInfoRequest({callback}) {
    log.debug('got current info request');
    if (callback) {
      callback(this.store);
    }
  }

  _updateStateFromStorage() {
    log.debug('updating state from local storage');
    const serialized = this.storageHandler.getSessionState(this.config.clientId);
    if (!serialized) {
      log.debug('no stored state');
      this._changeState(authn.STATE_UNAUTHENTICATED);
      return;
    }
    const {user, token} = deserializeSessionState(serialized);
    if (!user || !token) {
      log.debug('no stored user or token');
      this._changeState(authn.STATE_UNAUTHENTICATED);
    } else if (token.expiresAt > new Date()) {
      log.debug('found an unexpired saved session');
      this._changeState(authn.STATE_AUTHENTICATED, user, token);
    } else {
      log.debug('stored session was expired');
      this._changeState(authn.STATE_UNAUTHENTICATED);
    }
  }

  _maybeUpdateStoredSession(state, user, token) {
    log.debugf('updating stored session: state=%s hasUser=%s, hasToken=%s', state, !!user, !!token);
    if (state === authn.STATE_UNAUTHENTICATED || state === authn.STATE_REFRESHING || state === authn.STATE_EXPIRED) {
      log.debug('state is unauthenticated or expired, clearing stored session');
      this.storageHandler.clearSessionState(this.config.clientId);
    } else if (!!user && !!token) {
      log.debug('storing session', redactUser(user), redactToken(token));
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
    o: grouped.other,
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
    other: state.ui.o,
  }
  const userInfo = ungroupClaimPrefixes(groupedUserInfo);

  const user = _processUserInfo(userInfo);
  const expiresAt = new Date(state.ea);
  const token = _processTokenInfo({ userInfo, accessToken: state.at, expiresAt, authHeader: `Bearer ${state.at}`, refreshToken: state.rf });
  return {user, token};
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
    event = new CustomEvent(name, {detail});
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

  log.debug('checking oauth state token');
  const pageState = _validateAndGetStoredState(storedState, oauthCsrfToken);
  const tokenInfo = await _fetchTokenInfo(searchParams.get('code'), config, storedState.v)

  const accessToken = tokenInfo.access_token;
  const refreshToken = tokenInfo.refresh_token;
  const expiresIn = tokenInfo.expires_in - EXPIRATION_BUFFER;
  const expiresAt = new Date(Date.now() + (expiresIn * 1000));
  const authHeader = `Bearer ${accessToken}`;
  log.debug('got token', redactBearerToken(accessToken), 'which expires in', expiresIn, 'seconds');

  const userInfo = await _fetchUserInfo(authHeader);

  const user = _processUserInfo(userInfo);
  const token = _processTokenInfo({ userInfo, accessToken, expiresAt, authHeader, refreshToken });

  return {state: authn.STATE_AUTHENTICATED, user, token};
}


async function _fetchTokenInfo(code, config, codeVerifier) {
  log.debug('Exchanging code for token');
  const tokenUrl = `${BASE_URL}/token`;
  const body = new URLSearchParams();
  body.set('grant_type', 'authorization_code');
  body.set('client_id', config.clientId);
  body.set('redirect_uri', config.callbackUrl);
  body.set('code', code);
  body.set('code_verifier', codeVerifier)

  const resp = await fetch(tokenUrl, {
    method: 'POST',
    headers: new Headers({ 'Accept': 'application/json', 'Content-Type': 'application/x-www-form-urlencoded' }),
    body
  });

  if (resp.status !== 200) {
    const body = await resp.text();

    log.error('Error getting OAuth User Info. Status Code:', resp.status, 'Response:\n', body);
    throw new OAuthError(
      'unable-to-exchange-code-for-token',
      'Unable to exchange code for token. Please try again.'
    );
  }

  const json = await resp.json();
  log.debug('successfully got user info', json);
  return json;
}

async function _fetchUserInfo(authHeader) {
  const USER_INFO_URL = `${BASE_URL}/openid-userinfo/v1/userinfo?schema=openid`;
  log.debug('fetching user info from', USER_INFO_URL);
  const resp = await fetch(USER_INFO_URL, {
    method: 'GET',
    headers: new Headers({'Accept': 'application/json', 'Authorization': authHeader}),
    mode: 'cors',
  });

  log.debug('got status', resp.status);

  if (resp.status !== 200) {
    const body = await resp.text();

    if (resp.status === 403) {
      log.debug('got forbidden error');
      if (body.includes('<ams:code>900908</ams:code>')) {
        log.debug('client app isn\'t subscribed to OpenID UserInfo endpoint');
        log.error(`DEVELOPER ERROR: You may not be subscribed to the OpenID UserInfo endpoint. Please visit https://api.byu.edu/store/apis/info?name=OpenID-Userinfo&version=v1&provider=BYU%2Fjmooreoa to subscribe.`);
        throw new OAuthError(
          'not-subscribed-to-user-info',
          'This page has an authentication configuration error. Developers, see the console for details.'
        );
      } else {
        log.error('invalid oauth bearer token');
        throw new OAuthError(
          'invalid-oauth-token',
          'The provided authentication token is invalid. Please try again.'
        );
      }
    }
    log.error('Error getting OAuth User Info. Status Code:', resp.status, 'Response:\n', body);
    throw new OAuthError(
      'unable-to-get-user-info',
      'Unable to fetch user information. Please try again.'
    );
  }
  const json = await resp.json();
  log.debug('successfully got user info', json);
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
    const prefix = CLAIMS_KNOWN_PREFIXES.find(it => key.startsWith(it));
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
  return Object.keys(userInfo).filter(k => k.startsWith(prefix))
    .reduce((agg, key) => {
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
      familyNamePosition,
    },
    rawUserInfo: userInfo
  };
}

function _processTokenInfo({ userInfo, accessToken, expiresAt, authHeader, refreshToken }) {
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
      appName: wso2Claims.applicationname,
    },
    rawUserInfo: userInfo
  };
}

function _validateAndGetStoredState(storedState, expectedCsrfToken) {
  log.debug('validating stored state token. Expecting token', expectedCsrfToken, ', got state', storedState);
  if (!storedState) {
    log.error('no stored oauth login state');
    throw new OAuthError('no-oauth-state', 'Your saved authentication information does not match. Please try again.');
  }
  const {e: stateExpiresString, c: storedCsrfToken, s: pageState} = storedState;

  if (expectedCsrfToken !== storedCsrfToken) {
    log.error('CSRF token mismatch')
    throw new OAuthError(
      'oauth-state-mismatch',
      'Your saved authentication information does not match. Please try again.'
    );
  }

  if (Number(stateExpiresString) < Date.now()) {
    log.error('stored state has expired');
    throw new OAuthError(
      'oauth-state-expired',
      'Your login attempt has timed out. Please try again.'
    );
  }

  return pageState;
}

function _prepareStoredState(expires, csrfToken, codeVerifier, pageState) {
  return {
    e: expires,
    c: csrfToken,
    v: codeVerifier,
    s: pageState,
  }
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
const randomCharRangeConvert = allowableRandomChars.length / 2**8; // Using Uint8Array for getRandomValues

function randomString(length) {
  const randomArray = new Uint8Array(length || 24);
  const crypto = window.crypto || window.msCrypto;
  crypto.getRandomValues(randomArray);

  return randomArray.reduce((str, cur) => str + allowableRandomChars[Math.floor(cur * randomCharRangeConvert)], '');
}

function logStateChange(state, user, token, error) {
  const logParts = [
    'state change:',
    {
      state,
      user: redactUser(user),
      token: token, //redactToken(token),
      error: error
    }
  ];
  if (error) {
    log.error(...logParts);
  } else {
    log.info(...logParts);
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
  log.debug('redacting token', t);
  if (!t) return undefined;
  const {bearer, expiresAt, client} = t;
  return {
    bearer: redactBearerToken(bearer),
    expiresAt: !!expiresAt ? expiresAt.toISOString() : null,
    client,
    'rest-is-redacted': true
  }
}
function redactBearerToken(b) {
  if (!b) return undefined;
  return b.substring(0, 2) + '...redacted...' + b.substring(b.length - 2)
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

export function __forceShutdown() {
  if (SINGLETON_INSTANCE) {
    SINGLETON_INSTANCE.shutdown();
    cleanupOnlyInstance(SINGLETON_INSTANCE);
  }
}

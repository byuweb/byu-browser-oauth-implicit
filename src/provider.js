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

import * as authn from '../node_modules/@byuweb/browser-oauth/constants.js';
import {parseHash} from './url.js';
import {StorageHandler} from "./local-storage";

const STORED_STATE_LIFETIME = 5 * 60 * 1000; // 5 minutes

export class ImplicitGrantProvider {
  constructor(config, window, document, storageHandler = new StorageHandler()) {
    this.config = config;
    this.window = window;
    this.document = document;
    this.storageHandler = storageHandler;
    this._listeners = {};

    this.store = Object.freeze({
      state: authn.STATE_INDETERMINATE,
      user: null,
      token: null,
      error: null
    })
  }

  _changeState(state, user, token, error) {
    this.store = Object.freeze({
      state, user, token, error
    });
    _dispatchEvent(this, authn.EVENT_STATE_CHANGE, this.store)
  }

  async startup() {
    this.listen();
    this._changeState(authn.STATE_INDETERMINATE);

    const location = this._location;
    const hash = this._hashParams;

    if (this.isAuthenticationCallback(location.href, hash)) {
      this._changeState(authn.STATE_AUTHENTICATING);
      try {
        const {state, user, token, error} = await _handleAuthenticationCallback(
          this.config,
          location,
          hash,
          this.storageHandler
        );
        this._changeState(state, user, token, error);
      } catch (err) {
        console.error('OAuth Error', err);
        this._changeState(authn.STATE_ERROR, undefined, undefined, err);
      }
    } else {
      this._changeState(authn.STATE_UNAUTHENTICATED);
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
    this._changeState(authn.STATE_INDETERMINATE);
  }

  listen() {
    _listenTo(this, authn.EVENT_LOGIN_REQUESTED, this.startLogin);
    _listenTo(this, authn.EVENT_LOGOUT_REQUESTED, this.startLogout);
    _listenTo(this, authn.EVENT_REFRESH_REQUESTED, this.startRefresh);
    _listenTo(this, authn.EVENT_CURRENT_INFO_REQUESTED, this.handleCurrentInfoRequest);
  }

  unlisten() {
    _unlistenTo(this, authn.EVENT_LOGIN_REQUESTED);
    _unlistenTo(this, authn.EVENT_LOGOUT_REQUESTED);
    _unlistenTo(this, authn.EVENT_REFRESH_REQUESTED);
    _unlistenTo(this, authn.EVENT_CURRENT_INFO_REQUESTED);
  }

  startLogin() {
    console.log('starting login', this);
    const {clientId, callbackUrl} = this.config;
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

  handleCurrentInfoRequest({callback}) {
    if (callback) {
      callback(this.store);
    }
  }
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

async function _handleAuthenticationCallback(config, location, hash, storage) {
  if (hash.has('error')) {
    throw new OAuthError(
      hash.get('error'),
      hash.get('error_description'),
      hash.get('error_uri'),
    );
  }
  const oauthCsrfToken = hash.get('state');
  const storedState = storage.getOAuthState(config.clientId);

  storage.clearOAuthState(config.clientId);

  const pageState = _validateAndGetStoredState(storedState, oauthCsrfToken);

  const accessToken = hash.get('access_token');
  const expiresIn = Number(hash.get('expires_in'));
  const expiresAt = new Date(Date.now() + (expiresIn * 1000));
  const authHeader = `Bearer ${accessToken}`;

  const userInfo = await _fetchUserInfo(authHeader);

  const user = _processUserInfo(userInfo);
  const token = _processTokenInfo(userInfo, accessToken, expiresAt, authHeader);

  location.hash = '';

  return {state: authn.STATE_AUTHENTICATED, user, token};
}

async function _fetchUserInfo(authHeader) {
  const resp = await fetch('https://api.byu.edu/openid-userinfo/v1/userinfo?schema=openid', {
    method: 'GET',
    headers: new Headers({'Accept': 'application/json', 'Authorization': authHeader}),
    mode: 'cors',
  });

  if (resp.status !== 200) {
    const body = await resp.text();

    if (resp.status === 403) {
      if (body.includes('<ams:code>900908</ams:code>')) {
        console.error(`DEVELOPER ERROR: You may not be subscribed to the OpenID UserInfo endpoint. Please visit https://api.byu.edu/store/apis/info?name=OpenID-Userinfo&version=v1&provider=BYU%2Fjmooreoa to subscribe.`);
        throw new OAuthError(
          'not-subscribe-to-user-info',
          'This page has an authentication configuration error. Developers, see the console for details.'
        );
      } else {
        throw new OAuthError(
          'invalid-oauth-token',
          'The provided authentication token is invalid. Please try again.'
        );
      }
    }
    console.error('Error getting OAuth User Info. Status Code:', resp.status, 'Response:\n', body);
    throw new OAuthError(
      'unable-to-get-user-info',
      'Unable to fetch user information. Please try again.'
    );
  }

  return await resp.json();
}


const CLAIMS_PREFIX_RESOURCE_OWNER = 'http://byu.edu/claims/resourceowner_';
const CLAIMS_PREFIX_CLIENT = 'http://byu.edu/claims/client_';
const CLAIMS_PREFIX_WSO2 = 'http://wso2.org/claims/';

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
      familyNamePosition,
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
      appName: wso2Claims.applicationname,
    },
    rawUserInfo: userInfo
  };
}

function _validateAndGetStoredState(storedState, expectedCsrfToken) {
  const {e: stateExpiresString, c: storedCsrfToken, s: pageState} = storedState;

  if (expectedCsrfToken !== storedCsrfToken) {
    throw new OAuthError(
      'oauth-state-mismatch',
      'Your saved authentication information does not match. Please try again.'
    );
  }

  if (Number(stateExpiresString) < Date.now()) {
    throw new OAuthError(
      'oauth-state-expired',
      'Your login attempt has timed out. Please try again.'
    );
  }

  return pageState;
}

function _prepareStoredState(expires, csrfToken, pageState) {
  return {
    e: expires,
    c: csrfToken,
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

function randomString() {
  let idArray = new Uint32Array(3);
  const crypto = window.crypto || window.msCrypto;
  crypto.getRandomValues(idArray);

  return idArray.reduce((str, cur) => str + cur.toString(16), '');
}



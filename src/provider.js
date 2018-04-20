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

export class ImplicitGrantProvider {
  constructor(config, window, document) {
    this.config = config;
    this.issuer = config.issuer;
    this.callbackUrl = config.callbackUrl;
    this.requireAuthentication = config.requireAuthentication;
    this.window = window;
    this.document = document;
    this._listeners = {};
  }

  shutdown() {
    this.unlisten();
    state(authn.STATE_INDETERMINATE);
  }

  listen() {
    this._listenTo(authn.EVENT_LOGIN_REQUESTED, this.startLogin);
    this._listenTo(authn.EVENT_LOGOUT_REQUESTED, this.startLogout);
    this._listenTo(authn.EVENT_REFRESH_REQUESTED, this.startRefresh);
    this._listenTo(authn.EVENT_CURRENT_INFO_REQUESTED, this.handleCurrentInfoRequest);
  }

  unlisten() {
    this._unlistenTo(authn.EVENT_LOGIN_REQUESTED);
    this._unlistenTo(authn.EVENT_LOGOUT_REQUESTED);
    this._unlistenTo(authn.EVENT_REFRESH_REQUESTED);
    this._unlistenTo(authn.EVENT_CURRENT_INFO_REQUESTED);
  }

  _listenTo(event, listener) {
    if (this._listeners.hasOwnProperty(event)) {
      throw new Error('A listener is already registered for ' + event);
    }
    const obs = this._listeners[event] = function (e) {
      listener(e.detail);
    }.bind(this);

    this.document.addEventListener(event, obs, false);
  }

  _unlistenTo(event) {
    if (!this._listeners.hasOwnProperty(event)) {
      return;
    }

    this.document.removeEventListener(event, this._listeners[event], false);
    delete this._listeners[event];
  }

  startLogin() {
    const csrf = saveLoginToken(randomString(), {});

    const loginUrl = `https://api.byu.edu/authorize?response_type=token&client_id=${this.clientId}&redirect_uri=${encodeURIComponent(this.callbackUrl)}&scope=openid&state=${csrf}`;

    this.window.location = loginUrl;
  }

  startLogout() {
    this.window.location = 'http://api.byu.edu/logout?redirect_url=' + this.callbackUrl;
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

  handleCurrentInfoRequest() {

  }
}



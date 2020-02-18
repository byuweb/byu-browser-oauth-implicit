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

import storage from 'local-storage-fallback';
// During initial page load, Firefox "LocalStorage" is wonky if in Private Browsing.
// Fortunately, the "OAuth State" data is tiny (one date and one 16-character string),
// so it won't hit any Cookie size limitations.
// With those factors in mind, we intentionally downgrade to Cookie storage for initial OAuth data storage
import { CookieStorage } from 'local-storage-fallback';

const cookie = new CookieStorage();

export class StorageHandler {

  saveOAuthState(clientId, state) {
    cookie.setItem(getKey(clientId), JSON.stringify(state));
  }

  getOAuthState(clientId) {
    const result = cookie.getItem(getKey(clientId));
    if (!result) {
      return null;
    }
    return JSON.parse(result);
  }

  clearOAuthState(clientId) {
    cookie.removeItem(getKey(clientId));
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


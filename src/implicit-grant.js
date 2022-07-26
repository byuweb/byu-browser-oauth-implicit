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

import { IG_STATE_AUTO_REFRESH_FAILED, ImplicitGrantProvider } from "./provider.js";
export { IG_STATE_AUTO_REFRESH_FAILED }

export const DEFAULT_ISSUER = 'https://api.byu.edu';
export const DEFAULT_BASE_URL = 'https://api.byu.edu';

export const GLOBAL_CONFIG_KEY = 'byu-oauth-implicit-config';

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
export async function configure(cfgOrRules, location = window.location) {
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

  const keys = Object.keys(rules)
    .filter(it => it.startsWith('https://') || it.startsWith('http://'));

  if (keys.length === 0) {
    return rules;
  }

  const key = keys
    // order by length of key (most specific), descending
    .sort((a, b) => b.length - a.length)
    .find(it => location.href.startsWith(it));
  if (key) {
    return Object.assign({ callbackUrl: key }, rules[key]);
  }
  throw new Error(`Unable to match url [${location.href}] to one of [${keys}]`)
}

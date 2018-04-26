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

import { ImplicitGrantProvider } from "./provider.js";

export const DEFAULT_ISSUER = 'https://api.byu.edu';

export const GLOBAL_CONFIG_KEY = 'byu-oauth-implicit-config';

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
export async function configure(cfg) {
  const globalConfig = window[GLOBAL_CONFIG_KEY];

  const config = Object.assign({
    issuer: DEFAULT_ISSUER,
    callbackUrl: `${location.origin}${location.pathname}`,
    requireAuthentication: false,
  }, globalConfig, cfg);

  if (!config.clientId) {
    throw new Error('clientId must be specified in config');
  }

  const provider = new ImplicitGrantProvider(config, window, document);

  return provider.startup();
}

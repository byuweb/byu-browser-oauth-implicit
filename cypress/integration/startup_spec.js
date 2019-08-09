/*
 *  @license
 *    Copyright 2019 Brigham Young University
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

import {configure} from '../../src/implicit-grant.js';

describe('My first test', async function() {
  let provider;

  beforeEach(async function() {
    window.byuOAuth = {logging: 'debug'};
    provider = await configure({
      clientId: 'fake'
    });
  });

  it('does stuff, maybe?', function() {
    expect(provider).to.exist;
  });

  it('foobar', function() {
    expect(provider).to.exist;
  });

  afterEach(async function() {
    if (provider) {
      await provider.shutdown();
      provider = null;
    }
  });
});

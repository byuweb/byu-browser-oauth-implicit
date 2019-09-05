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

import sinonChai from '../node_modules/sinon-chai/lib/sinon-chai.js';
import chaiPromise from '../node_modules/chai-as-promised/lib/chai-as-promised.js';
import {configure, DEFAULT_ISSUER} from "../src/implicit-grant.js";
import {__forceShutdown} from "../src/provider.js";

chai.use(sinonChai);
chai.use(chaiPromise);

const fakeUrl = 'https://example.com/spa';

describe('implicit-grant#configure', () => {

  describe('sets sane defaults', async () => {
    let p;
    beforeEach(async () => p = await configure({clientId: 'test'}));

    it('sets the issuer to the default', () => {
      expect(p.config.issuer).to.equal(DEFAULT_ISSUER);
    });
    it('sets the callback URL to the current page', () => {
      expect(p.config.callbackUrl).to.equal(window.location.origin + window.location.pathname);
    });
    it('sets autoRefreshOnTimeout to false', () => {
      expect(p.config.autoRefreshOnTimeout).to.be.false;
    });
  });

  describe('requires parameter', () => {
    describe('clientId', () => {
      it('cleanly fails if empty config and no window config', () => {
        return expect(configure()).to.be.rejectedWith(/clientId/);
      });
      it('fails if missing from single config', () => {
        return expect(configure({})).to.be.rejectedWith(/clientId/);
      });
      it('fails if missing from resolved config', () => {
        return expect(configure({
              'https://myapp.com': {},
            }, {href: 'https://myapp.com'}))
              .to.be.rejectedWith(/clientId/);
      });
    });
  });

  describe('can determine the correct config', () => {
    describe('based on the current location.href', () => {
      function itShouldResolve(
        desc,
        {givenConfigs, onUrl, expectId}
      ) {
        it('should resolve ' + desc, async () => {
          return expect(
            configure(givenConfigs, {href: onUrl})
          ).to.eventually.have.nested.property('config.clientId', expectId);
        });
      }

      itShouldResolve('exact origins', {
        givenConfigs: {'https://myapp.byu.edu': {clientId: 'prodid'}},
        onUrl: 'https://myapp.byu.edu',
        expectId: 'prodid'
      });
      itShouldResolve('subpaths', {
        givenConfigs: {'https://myapp.byu.edu': {clientId: 'prodid'}},
        onUrl: 'https://myapp.byu.edu/some/path',
        expectId: 'prodid'
      });
      itShouldResolve('longest matching config', {
        givenConfigs: {
          'https://myapp.byu.edu/one': {
            clientId: 'wrong'
          },
          'https://myapp.byu.edu/one/two': {
            clientId: 'right'
          },
        },
        onUrl: 'https://myapp.byu.edu/one/two/three',
        expectId: 'right'
      });
    });
    it('fails if no matching rules are found', async () => {
      return expect(configure({
        'https://some-bogus-url.com': {clientId: 'foobar'},
        'http://some-other-url.com': {clientId: 'foobar'},
      }, {href: 'https://myapp.com'}))
        .to.be.rejectedWith('Unable to match url [https://myapp.com]');
    });
  });



  afterEach(async () => {
    __forceShutdown();
  });
});

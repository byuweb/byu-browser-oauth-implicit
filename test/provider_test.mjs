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
import {ImplicitGrantProvider} from "../src/provider";
import * as authn from '../node_modules/@byuweb/browser-oauth/constants.js';

import sinonChai from '../node_modules/sinon-chai/lib/sinon-chai.js';

chai.use(sinonChai);

const fakeUrl = 'https://example.com/spa';

describe('implicit grant provider', function () {
  let config;
  let document;
  let window;

  beforeEach(function () {
    config = {
      clientId: 'aabbcc',
      callbackUrl: fakeUrl,
    };
    document = {
      addEventListener: sinon.stub(),
      removeEventListener: sinon.stub(),
    };
    window = {
      location: {
        href: fakeUrl
      }
    };
  });


  describe('listen', () => {
    it('listens to required events', function () {
      const p = new ImplicitGrantProvider(config, window, document);
      p.listen();

      expect(document.addEventListener).to.have.been.calledWith(authn.EVENT_LOGIN_REQUESTED);
      expect(document.addEventListener).to.have.been.calledWith(authn.EVENT_LOGOUT_REQUESTED);
      expect(document.addEventListener).to.have.been.calledWith(authn.EVENT_REFRESH_REQUESTED);
      expect(document.addEventListener).to.have.been.calledWith(authn.EVENT_CURRENT_INFO_REQUESTED);
    });

    it('throws an error if listen is called multiple times', function () {
      const p = new ImplicitGrantProvider(config, window, document);
      p.listen();

      expect(() => p.listen()).to.throw('already registered');
    });
  });

  describe('unlisten', () => {
    it('removes event listeners', function () {
      const p = new ImplicitGrantProvider(config, window, document);
      p.listen();

      p.unlisten();

      expect(document.removeEventListener).to.have.been.calledWith(authn.EVENT_LOGIN_REQUESTED);
      expect(document.removeEventListener).to.have.been.calledWith(authn.EVENT_LOGOUT_REQUESTED);
      expect(document.removeEventListener).to.have.been.calledWith(authn.EVENT_REFRESH_REQUESTED);
      expect(document.removeEventListener).to.have.been.calledWith(authn.EVENT_CURRENT_INFO_REQUESTED);
    });

    it('allows unlisten to be called repeatedly', function () {
      const p = new ImplicitGrantProvider(config, window, document);
      p.listen();

      p.unlisten();
      expect(() => p.unlisten()).to.not.throw();
    });
  });

  describe('isAuthenticationCallback', () => {
    it('handles successful callbacks', () => {
      const location = fakeUrl;
      const hash = new Map([['access_token', 'foo']]);

      const p = new ImplicitGrantProvider(config, window, document);

      const result = p.isAuthenticationCallback(location, hash);

      expect(result).to.be.true;
    });
    it('handles error callbacks', () => {
      const location = fakeUrl;
      const hash = new Map([['error', 'foo']]);

      const p = new ImplicitGrantProvider(config, window, document);

      const result = p.isAuthenticationCallback(location, hash);

      expect(result).to.be.true;
    });
    it('handles pages on a different URL', () => {
      const location = 'https://evilsite.com/phisher';
      const hash = new Map([['access_token', 'foo']]);

      const p = new ImplicitGrantProvider(config, window, document);

      const result = p.isAuthenticationCallback(location, hash);

      expect(result).to.be.false;
    });
    it('handles calls with wrong hash', () => {
      const location = fakeUrl;
      const hash = new Map([['something', undefined]]);

      const p = new ImplicitGrantProvider(config, window, document);

      const result = p.isAuthenticationCallback(location, hash);

      expect(result).to.be.false;
    });
    it('handles calls with no hash', () => {
      const location = fakeUrl;
      const hash = new Map();

      const p = new ImplicitGrantProvider(config, window, document);

      const result = p.isAuthenticationCallback(location, hash);

      expect(result).to.be.false;
    });
  });




});


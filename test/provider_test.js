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
  let event;
  let p;
  let tempConsole;
  let element;
  let storage;
  const realFetch = fetch;

  beforeEach(function () {
    event = {
      initCustomEvent: sinon.stub()
    };
    element = {
      parentNode: {
        removeChild: sinon.stub()
      }
    };
    config = {
      clientId: 'aabbcc',
      callbackUrl: fakeUrl,
    };
    document = {
      addEventListener: sinon.stub(),
      removeEventListener: sinon.stub(),
      createEvent: sinon.stub().returns(event),
      dispatchEvent: sinon.stub(),
      getElementById: sinon.stub().returns(element),
      createElement: sinon.stub().returns(element),
      body: {
        appendChild: sinon.stub()
      }
    };
    window = {
      open: sinon.stub(),
      close: sinon.stub(),
      location: {
        href: fakeUrl
      },
      setTimeout: sinon.stub()
    };
    storage = {
      saveOAuthState: sinon.stub(),
      getOAuthState: sinon.stub().returns({ e: Date.now() + 1000, c: 'dummystate', s: '' }),
      clearOAuthState: sinon.stub(),
      getSessionState: sinon.stub(),
    };
    p = new ImplicitGrantProvider(config, window, document, storage);
    tempConsole = {
      log: console.log,
      warn: console.warn,
      error: console.error
    };
    console.log = sinon.stub();
    console.warn = sinon.stub();
    // console.error = sinon.stub();

    fetch = sinon.stub().resolves({
      status: 200,
      json: sinon.stub().resolves({}),
    })
  });

  afterEach(function() {
    console.log = tempConsole.log;
    console.warn = tempConsole.warn;
    console.error = tempConsole.error;
    fetch = realFetch;
  })


  describe('listen', () => {
    it('listens to required events', function () {
      p.listen();

      expect(document.addEventListener).to.have.been.calledWith(authn.EVENT_LOGIN_REQUESTED);
      expect(document.addEventListener).to.have.been.calledWith(authn.EVENT_LOGOUT_REQUESTED);
      expect(document.addEventListener).to.have.been.calledWith(authn.EVENT_REFRESH_REQUESTED);
      expect(document.addEventListener).to.have.been.calledWith(authn.EVENT_CURRENT_INFO_REQUESTED);
    });

    it('throws an error if listen is called multiple times', function () {
      p.listen();

      expect(() => p.listen()).to.throw('already registered');
    });
  });

  describe('unlisten', () => {
    it('removes event listeners', function () {
      p.listen();

      p.unlisten();

      expect(document.removeEventListener).to.have.been.calledWith(authn.EVENT_LOGIN_REQUESTED);
      expect(document.removeEventListener).to.have.been.calledWith(authn.EVENT_LOGOUT_REQUESTED);
      expect(document.removeEventListener).to.have.been.calledWith(authn.EVENT_REFRESH_REQUESTED);
      expect(document.removeEventListener).to.have.been.calledWith(authn.EVENT_CURRENT_INFO_REQUESTED);
    });

    it('allows unlisten to be called repeatedly', function () {
      p.listen();

      p.unlisten();
      expect(() => p.unlisten()).to.not.throw();
    });
  });

  describe('isAuthenticationCallback', () => {
    it('handles successful callbacks', () => {
      const location = fakeUrl;
      const hash = new Map([['access_token', 'foo']]);

      const result = p.isAuthenticationCallback(location, hash);

      expect(result).to.be.true;
    });
    it('handles error callbacks', () => {
      const location = fakeUrl;
      const hash = new Map([['error', 'foo']]);

      const result = p.isAuthenticationCallback(location, hash);

      expect(result).to.be.true;
    });
    it('handles pages on a different URL', () => {
      const location = 'https://evilsite.com/phisher';
      const hash = new Map([['access_token', 'foo']]);

      const result = p.isAuthenticationCallback(location, hash);

      expect(result).to.be.false;
    });
    it('handles calls with wrong hash', () => {
      const location = fakeUrl;
      const hash = new Map([['something', undefined]]);

      const result = p.isAuthenticationCallback(location, hash);

      expect(result).to.be.false;
    });
    it('handles calls with no hash', () => {
      const location = fakeUrl;
      const hash = new Map();

      const result = p.isAuthenticationCallback(location, hash);

      expect(result).to.be.false;
    });
  });

  describe('startup', () => {
    it('starts up', async () => {
      await p.startup();
      expect(event.initCustomEvent).to.have.been.calledWith(authn.EVENT_STATE_CHANGE, true, false, {
        error: undefined,
        token: undefined,
        user: undefined,
        state: authn.STATE_INDETERMINATE
      })
    })
    it('starts up with authentication callback', async () => {
      window.location.hash = '#access_token=dummytoken&state=dummystate';
      await p.startup();
      expect(event.initCustomEvent).to.have.been.calledWith(authn.EVENT_STATE_CHANGE, true, false, {
        error: undefined,
        token: undefined,
        user: undefined,
        state: authn.STATE_AUTHENTICATING
      })
    })
  });

  describe('shutdown', () => {
    it('shuts down cleanly', () => {
      p.listen();

      const result = p.shutdown();

      expect(document.removeEventListener).to.have.been.calledWith(authn.EVENT_LOGIN_REQUESTED);
      expect(event.initCustomEvent).to.have.been.calledWith(authn.EVENT_STATE_CHANGE, true, false, {
        error: undefined,
        token: undefined,
        user: undefined,
        state: authn.STATE_INDETERMINATE
      })
      expect(document.dispatchEvent).to.have.been.calledWith(event)

    });
  });

  describe('startLogin', () => {
    it('starts login process', () => {
      p.startLogin();
      expect(window.location).to.contain('https://api.byu.edu/authorize')
      expect(window.open).not.to.have.been.called;
    });
    it('starts login process in popup window', () => {
      p.startLogin('popup');
      expect(window.open).to.have.been.called;
    });
    it('starts login process in hidden iframe', () => {
      p.startLogin('iframe');

      expect(element.style).to.be.eql('display:none')
      expect(document.body.appendChild).to.have.been.calledWith(element);

      element.parentNode = {
        removeChild: sinon.stub()
      };
      element.onload()

      expect(element.parentNode.removeChild).to.have.been.calledWith(element)
    });
  });

  describe('startRefresh', () => {
    it('calls startLogin with default "iframe" parameter', () => {
      p.startLogin = sinon.stub();
      p.startRefresh();
      expect(p.startLogin).to.have.been.calledWith('iframe')
    });
    it('calls startLogin with passed parameter', () => {
      p.startLogin = sinon.stub();
      p.startRefresh('dummy');
      expect(p.startLogin).to.have.been.calledWith('dummy')
    });
  });

  describe('handleStateChange', () => {
    it('passes message to parent if in popup', () => {
      window.opener = p;
      p.handleStateChange({ state: authn.STATE_AUTHENTICATING })
      expect(document.dispatchEvent).to.have.been.calledWith(event);
      expect(window.close).not.to.have.been.called;
    });
    it('closes window if in popup and authenticated', () => {
      window.opener = p;
      p.handleStateChange({ state: authn.STATE_AUTHENTICATED })
      expect(document.dispatchEvent).to.have.been.calledWith(event);
      expect(window.close).to.have.been.called;
    });
    it('passes message to parent if in iframe', () => {
      window.parent = p
      p.handleStateChange({ state: authn.STATE_AUTHENTICATING })
      expect(document.dispatchEvent).to.have.been.calledWith(event);
      expect(element.parentNode.removeChild).not.to.have.been.called;
    });
    it('closes iframe if in iframe and authenticated', () => {
      window.parent = p;
      p.handleStateChange({ state: authn.STATE_AUTHENTICATED })
      expect(document.dispatchEvent).to.have.been.calledWith(event);
      expect(element.parentNode.removeChild).to.have.been.called;
    });
    it('updates stored session if not in popup or iframe', () => {
      window.parent = {
        document: {
          getElementById: sinon.stub().returns(false)
        }
      };
      p.handleStateChange({
        state: authn.STATE_AUTHENTICATED,
        token: {
          expiresAt: {
            getTime: sinon.stub().returns(Date.now() + 1000)
          }
        }
      });
    });
  });
});

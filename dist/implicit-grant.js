/*
 * Copyright 2018 Brigham Young University
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

const EVENT_PREFIX = 'byu-browser-oauth';

const STATE_CHANGE_EVENT = `${EVENT_PREFIX}-state-changed`;
const LOGIN_REQUESTED_EVENT = `${EVENT_PREFIX}-login-requested`;
const LOGOUT_REQUESTED_EVENT = `${EVENT_PREFIX}-logout-requested`;
const REFRESH_REQUESTED_EVENT = `${EVENT_PREFIX}-refresh-requested`;
const STATE_REQUESTED_EVENT = `${EVENT_PREFIX}-state-requested`;

const STATE_INDETERMINATE = 'indeterminate';
const STATE_UNAUTHENTICATED = 'unauthenticated';
const STATE_AUTHENTICATED = 'authenticated';
const STATE_AUTHENTICATING = 'authenticating';
const STATE_ERROR = 'error';

let store = {state: STATE_INDETERMINATE};

let observer = onStateChange(detail => {
    store = detail;
});

function onStateChange(callback) {
    const func = function(e) {
        callback(e.detail);
    };
    document.addEventListener(STATE_CHANGE_EVENT, func, false);
    if (store.state === STATE_INDETERMINATE) {
        dispatch(STATE_REQUESTED_EVENT, {callback});
    } else {
        callback(store);
    }
    return {
        offStateChange: function() {
            document.removeEventListener(STATE_CHANGE_EVENT, func, false);
        }
    }
}

function dispatch(name, detail) {
    let event;
    if (typeof window.CustomEvent === 'function') {
        event = new CustomEvent(name, {detail});
    } else {
        event = document.createEvent('CustomEvent');
        event.initCustomEvent(name, true, false, detail);
    }
    document.dispatchEvent(event);
}

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

const DEFAULT_ISSUER = 'https://api.byu.edu';

let config;
const observers = {};
let store$1 = Object.freeze({ state: STATE_INDETERMINATE });

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
function configure(cfg) {
    console.log('config', cfg);
    if (!cfg) {
        throw new Error('cfg must be defined');
    }
    if (!cfg.clientId) {
        throw new Error('clientId must be specified');
    }
    config = Object.assign({
        issuer: DEFAULT_ISSUER,
        callbackUrl: `${location.origin}${location.pathname}`,
        requireAuthentication: false,
    }, cfg);

    listen(LOGIN_REQUESTED_EVENT, startLogin);
    listen(LOGOUT_REQUESTED_EVENT, startLogout);
    listen(REFRESH_REQUESTED_EVENT, startRefresh);
    listen(STATE_REQUESTED_EVENT, handleStateRequested);

    maybeHandleAuthenticationCallback();
}

function maybeHandleAuthenticationCallback() {
    if (!isAuthenticationCallback()) {
        console.log('Not an auth callback');
        state$1(STATE_UNAUTHENTICATED);
        return;
    }
    state$1(STATE_AUTHENTICATING);
    const params = new URLSearchParams(window.location.hash.substring(1));
    if (params.has('error')) {
        const error = {
            type: params.get('error'),
            description: params.get('error_description'),
            uri: params.get('error_uri')
        };
        state$1(
            STATE_ERROR,
            null,
            null,
            error
        );
        return;
    }

    const csrf = params.get('state');

    window.location.hash = '';

    const accessToken = params.get('access_token');
    const expiresIn = Number(params.get('expires_in'));
    const authHeader = `Bearer ${accessToken}`;
    const expiresAt = new Date(Date.now() + (expiresIn * 1000));

    fetch('https://api.byu.edu/openid-userinfo/v1/userinfo?schema=openid', {
        method: 'GET',
        headers: new Headers({ 'Accept': 'application/json', 'authorization': authHeader }),
        mode: 'cors',
    }).then(function (resp) {
        return resp.json();
    }).then(function (json) {
        console.log('got user info', json);

        const roClaims = getClaims(json, CLAIMS_PREFIX_RESOURCE_OWNER);
        const clientClaims = getClaims(json, CLAIMS_PREFIX_CLIENT);
        const wso2Claims = getClaims(json, CLAIMS_PREFIX_WSO2);

        console.log('claims', roClaims, clientClaims, wso2Claims);
        
        const familyNamePosition = roClaims.surname_position;
        const givenName = json.given_name;
        const familyName = json.family_name;

        const displayName = familyNamePosition === 'F' ? `${familyName} ${givenName}` : `${givenName} ${familyName}`;

        const user$$1 = {
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
            rawUserInfo: json
        };

        const token$$1 = {
            bearer: accessToken,
            authorizationHeader: authHeader,
            expiresAt,
            client: {
                id: wso2Claims.client_id,
                byuId: clientClaims.byu_id,
                appName: wso2Claims.applicationname,
            },
            rawUserInfo: json
        };

        state$1(STATE_AUTHENTICATED, token$$1, user$$1);
    });
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

function isAuthenticationCallback() {
    const isCallbackUrl = window.location.href.indexOf(config.callbackUrl) === 0;
    console.log(window.location.href, config.callbackUrl, window.location.href.indexOf(config.callbackUrl));
    const hasHash = !!window.location.hash;

    console.log('hasHash', hasHash);
    if (!isCallbackUrl) {
        return false;
    } else if (!hasHash) {
        return false;
    }
    const params = new URLSearchParams(window.location.hash.substring(1));
    console.log('params', params);
    if (params.has('access_token') || params.has('error')) {
        console.log('has params');
        return true;
    }
    return false;
}

function state$1(state$$1, token$$1, user$$1, error) {
    store$1 = Object.freeze({ state: state$$1, token: token$$1, user: user$$1, error });
    dispatch$1(STATE_CHANGE_EVENT, store$1);
}

function startLogin() {
    console.log('startLogin', config);

    const csrf = saveLoginToken(randomString(), {});

    const loginUrl = `https://api.byu.edu/authorize?response_type=token&client_id=${config.clientId}&redirect_uri=${encodeURIComponent(config.callbackUrl)}&scope=openid&state=${csrf}`;

    console.log('loginUrl', loginUrl);
    window.location = loginUrl;
}

function startLogout() {
    console.log('startLogout');
}

function saveLoginToken(token$$1, pageState) {
    const value = `${token$$1}.${btoa(JSON.stringify(pageState))}`;

    if (storageAvailable('session')) {
        window.sessionStorage.setItem('oauth-state', value);
        return 's.' + token$$1;
    } else {
        document.cookie = `oauth-state=${value};max-age=300`;
        return 'c.' + token$$1;
    }
}

function startRefresh() {
    startLogin();
}

function handleStateRequested({ callback }) {
    callback(store$1);
}

function storageAvailable(type) {
    try {
        var storage = window[type],
            x = '__storage_test__';
        storage.setItem(x, x);
        storage.removeItem(x);
        return true;
    }
    catch (e) {
        return e instanceof DOMException && (
            // everything except Firefox
            e.code === 22 ||
            // Firefox
            e.code === 1014 ||
            // test name field too, because code might not be present
            // everything except Firefox
            e.name === 'QuotaExceededError' ||
            // Firefox
            e.name === 'NS_ERROR_DOM_QUOTA_REACHED') &&
            // acknowledge QuotaExceededError only if there's something already stored
            storage.length !== 0;
    }
}

function randomString() {
    let idArray = Uint32Array.of(1);
    const crypto = window.crypto || window.msCrypto;
    crypto.getRandomValues(idArray);

    return new String(idArray[0]);
}

function listen(event, listener) {
    if (observers.hasOwnProperty(event)) {
        throw new Error('A listener is already registered for ' + event);
    }
    const obs = observers[event] = function (e) { listener(e.detail); };
    document.addEventListener(event, obs, false);
}

function dispatch$1(name, detail) {
    let event;
    if (typeof window.CustomEvent === 'function') {
        event = new CustomEvent(name, { detail });
    } else {
        event = document.createEvent('CustomEvent');
        event.initCustomEvent(name, true, false, detail);
    }
    document.dispatchEvent(event);
}

export { DEFAULT_ISSUER, configure, startLogin, startLogout, startRefresh, handleStateRequested };
//# sourceMappingURL=implicit-grant.js.map

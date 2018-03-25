this.BYU = this.BYU || {};
this.BYU.oauth = this.BYU.oauth || {};
this.BYU.oauth.implicit = (function (exports) {
    'use strict';

    var EVENT_PREFIX = 'byu-browser-oauth';

    var EVENT_STATE_CHANGE = EVENT_PREFIX + "-state-changed";
    var EVENT_LOGIN_REQUESTED = EVENT_PREFIX + "-login-requested";
    var EVENT_LOGOUT_REQUESTED = EVENT_PREFIX + "-logout-requested";
    var EVENT_REFRESH_REQUESTED = EVENT_PREFIX + "-refresh-requested";
    var EVENT_CURRENT_INFO_REQUESTED = EVENT_PREFIX + "-current-info-requested";

    var STATE_INDETERMINATE = 'indeterminate';
    var STATE_UNAUTHENTICATED = 'unauthenticated';
    var STATE_AUTHENTICATED = 'authenticated';
    var STATE_AUTHENTICATING = 'authenticating';
    var STATE_ERROR = 'error';

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

    var DEFAULT_ISSUER = 'https://api.byu.edu';

    var config;
    var observers = {};
    var store = Object.freeze({ state: STATE_INDETERMINATE });

    /*
     * TODOS:
     *  - implement logout
     *  - implement requireAuthentication
     */

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
            callbackUrl: ("" + (location.origin) + (location.pathname)),
            requireAuthentication: false,
        }, cfg);

        listen(EVENT_LOGIN_REQUESTED, startLogin);
        listen(EVENT_LOGOUT_REQUESTED, startLogout);
        listen(EVENT_REFRESH_REQUESTED, startRefresh);
        listen(EVENT_CURRENT_INFO_REQUESTED, handleCurrentInfoRequest);

        maybeHandleAuthenticationCallback();
    }

    function maybeHandleAuthenticationCallback() {
        if (!isAuthenticationCallback()) {
            console.log('Not an auth callback');
            state(STATE_UNAUTHENTICATED);
            return;
        }
        state(STATE_AUTHENTICATING);
        var params = new URLSearchParams(window.location.hash.substring(1));
        if (params.has('error')) {
            var error = {
                type: params.get('error'),
                description: params.get('error_description'),
                uri: params.get('error_uri')
            };
            state(
                STATE_ERROR,
                null,
                null,
                error
            );
            return;
        }

        var csrf = params.get('state');

        window.location.hash = '';

        var pageData;
        try {
            pageData = validateCsrfAndGetPageData(csrf);
        } catch (err) {
            state(STATE_ERROR, null, null, {
                type: 'oauth-state-mismatch',
                description: err.message || err,
            });
            return;
        }

        clearSavedStateFor('s');

        var accessToken = params.get('access_token');
        var expiresIn = Number(params.get('expires_in'));
        var authHeader = "Bearer " + accessToken;
        var expiresAt = new Date(Date.now() + (expiresIn * 1000));

        fetch('https://api.byu.edu/openid-userinfo/v1/userinfo?schema=openid', {
            method: 'GET',
            headers: new Headers({ 'Accept': 'application/json', 'authorization': authHeader }),
            mode: 'cors',
        }).then(function (resp) {
            return resp.json();
        }).then(function (json) {
            console.log('got user info', json);

            var roClaims = getClaims(json, CLAIMS_PREFIX_RESOURCE_OWNER);
            var clientClaims = getClaims(json, CLAIMS_PREFIX_CLIENT);
            var wso2Claims = getClaims(json, CLAIMS_PREFIX_WSO2);

            console.log('claims', roClaims, clientClaims, wso2Claims);

            var familyNamePosition = roClaims.surname_position;
            var givenName = json.given_name;
            var familyName = json.family_name;

            var displayName = familyNamePosition === 'F' ? (familyName + " " + givenName) : (givenName + " " + familyName);

            var user = {
                personId: roClaims.person_id,
                byuId: roClaims.byu_id,
                netId: roClaims.net_id,
                name: {
                    sortName: roClaims.sort_name,
                    displayName: displayName,
                    givenName: givenName,
                    familyName: familyName,
                    familyNamePosition: familyNamePosition,
                },
                rawUserInfo: json
            };

            var token = {
                bearer: accessToken,
                authorizationHeader: authHeader,
                expiresAt: expiresAt,
                client: {
                    id: wso2Claims.client_id,
                    byuId: clientClaims.byu_id,
                    appName: wso2Claims.applicationname,
                },
                rawUserInfo: json
            };

            state(STATE_AUTHENTICATED, token, user);
        });
    }

    var CLAIMS_PREFIX_RESOURCE_OWNER = 'http://byu.edu/claims/resourceowner_';
    var CLAIMS_PREFIX_CLIENT = 'http://byu.edu/claims/client_';
    var CLAIMS_PREFIX_WSO2 = 'http://wso2.org/claims/';

    function getClaims(userInfo, prefix) {
        return Object.keys(userInfo).filter(function (k) { return k.startsWith(prefix); })
            .reduce(function (agg, key) {
                agg[key.substr(prefix.length)] = userInfo[key];
                return agg;
            }, {});
    }

    function isAuthenticationCallback() {
        var isCallbackUrl = window.location.href.indexOf(config.callbackUrl) === 0;
        console.log(window.location.href, config.callbackUrl, window.location.href.indexOf(config.callbackUrl));
        var hasHash = !!window.location.hash;

        console.log('hasHash', hasHash);
        if (!isCallbackUrl) {
            return false;
        } else if (!hasHash) {
            return false;
        }
        var params = new URLSearchParams(window.location.hash.substring(1));
        console.log('params', params);
        if (params.has('access_token') || params.has('error')) {
            console.log('has params');
            return true;
        }
        return false;
    }

    function state(state, token, user, error) {
        store = Object.freeze({ state: state, token: token, user: user, error: error });
        dispatch(EVENT_STATE_CHANGE, store);
    }

    function startLogin() {
        console.log('startLogin', config);

        var csrf = saveLoginToken(randomString(), {});

        console.log('csrf', csrf);

        var loginUrl = "https://api.byu.edu/authorize?response_type=token&client_id=" + (config.clientId) + "&redirect_uri=" + (encodeURIComponent(config.callbackUrl)) + "&scope=openid&state=" + csrf;

        console.log('loginUrl', loginUrl);
        window.location = loginUrl;
    }

    function startLogout() {
        console.log('startLogout');

        window.location = 'http://api.byu.edu/logout?redirect_url=' + config.callbackUrl;
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

    function saveLoginToken(token, pageState) {
        var name = getStorageName(config.clientId);
        var value = token + "." + (btoa(JSON.stringify(pageState)));

        var type;
        if (storageAvailable('sessionStorage')) {
            window.sessionStorage.setItem(name, value);
            type = TOKEN_STORE_TYPE_SESSION;
        } else {
            document.cookie = name + "=" + value + ";max-age=300";
            type = TOKEN_STORE_TYPE_COOKIE;
        }
        return type + '.' + token;
    }

    function getStorageName(clientId) {
        return ("oauth-state-" + (encodeURIComponent(clientId)));
    }

    var TOKEN_STORE_TYPE_SESSION = 's';
    var TOKEN_STORE_TYPE_COOKIE = 'c';

    function validateCsrfAndGetPageData(csrf) {
        var ref = csrf.split('.');
        var type = ref[0];
        var token = ref[1];
        var possibleValues = getSavedStateFor(type);
        
        if (possibleValues.length === 0) {
            console.error('No OAuth state has been stored, or it has expired');
            throw new Error('Your authentication session has expired or something has gone wrong.');
        } 
        var found = possibleValues.map(function (v) { return v.split('.'); })
            .find(function (ref) {
                var key = ref[0];
                var data = ref[1];

                return key === token;
        });
        
        if (!found) {
            console.error('Authentication state mismatch - no saved values match CSRF token');
            throw new Error('Your saved authentication information does not match. Please try again.');
        }

        var pageData = found[1];

        return JSON.parse(atob(pageData));
    }

    function getSavedStateFor(type) {
        var name = getStorageName(config.clientId);
        switch (type) {
            case TOKEN_STORE_TYPE_SESSION:
                return [window.sessionStorage.getItem(name)];
            case TOKEN_STORE_TYPE_COOKIE:
                var values = [];
                (document.cookie || '').split(';').map(function (c) { return c.trim(); }).forEach(function (cookie) {
                    if (cookie.indexOf(name + '=') === 0) {
                        values.push(cookie.split('=', 2)[1]);
                    }
                });
                return values;
        }
    }

    function clearSavedStateFor(type) {
        var name = getStorageName(config.clientId);
        switch (type) {
            case TOKEN_STORE_TYPE_SESSION:
                window.sessionStorage.removeItem(name);
                break;
            case TOKEN_STORE_TYPE_COOKIE:
                document.cookie = name + '=null;expires=Thu, 01 Jan 1970 00:00:00 GMT';
                break;
        }
    }

    function startRefresh() {
        startLogin();
    }

    function handleCurrentInfoRequest(ref) {
        var callback = ref.callback;

        callback(store);
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
        var idArray = new Uint32Array(3);
        var crypto = window.crypto || window.msCrypto;
        crypto.getRandomValues(idArray);

        return idArray.reduce(function (str, cur) { return str + cur.toString(16); }, '');
    }

    function listen(event, listener) {
        console.log('listening to', event);
        if (observers.hasOwnProperty(event)) {
            throw new Error('A listener is already registered for ' + event);
        }
        var obs = observers[event] = function (e) { listener(e.detail); };
        document.addEventListener(event, obs, false);
    }

    function dispatch(name, detail) {
        var event;
        if (typeof window.CustomEvent === 'function') {
            event = new CustomEvent(name, { detail: detail });
        } else {
            event = document.createEvent('CustomEvent');
            event.initCustomEvent(name, true, false, detail);
        }
        document.dispatchEvent(event);
    }

    exports.DEFAULT_ISSUER = DEFAULT_ISSUER;
    exports.configure = configure;
    exports.startLogin = startLogin;
    exports.startLogout = startLogout;
    exports.startRefresh = startRefresh;
    exports.handleCurrentInfoRequest = handleCurrentInfoRequest;

    return exports;

}({}));
//# sourceMappingURL=implicit-grant.nomodule.js.map

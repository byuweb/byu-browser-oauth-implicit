# byu-browser-oauth-implicit
OAuth Implicit Grant provider for [byu-browser-oauth](https://github.com/byuweb/byu-browser-oauth).

For questions or issues, try the [issue tracker](https://github.com/byuweb/byu-browser-oauth-implicit/issues)
or the [Web Community Slack](https://byuweb.slack.com).

# Usage

## About OAuth Implicit Grant flow

In a normal OAuth authentication flow, the client calls the authentication server
with a **client id** and a **client secret**, which are roughly analagous to a username and password.
When working with distributed clients, such as Javascript-based browser applications, we can't use 
the client secret, as that would expose it to the world and allow anyone to make calls as our application.

Implicit Grant aims to solve this problem by using your application's URL instead of the secret. The theory
is that, because URLs are guaranteed to be unique, no other application can impersonate yours.

When you register your application with the OAuth server, you must provide a 'callback URL'. Due to
limitations with BYU's current OAuth server, each application can only having one callback URL, meaning
that if you want to have multiple urls for different environments (for example, 
production, non-production, and local development), you must create multiple applications, each one
of which must be subscribed to any APIs you want to call and will have a unique client ID. Note that
this does NOT mean that you must register every possible URL in your application - you just need to
register one path in your application that the OAuth server will send users to after logging them in.
Generally, this is the root URL of your application, but you can use any other URL that is unique to 
your app.

For non-production environments, you should always use a 'Sandbox' client ID. For
the production environment, use the 'Production' key.

You can register your application and callback URLs in the [api.byu.edu/store](https://api.byu.edu/store).
For each environment in your application (prod, nonprod, local, etc.), you must take the following steps:

1. [Create an application](https://developer.byu.edu/docs/consume-api/create-application)
2. [Generate keys](https://developer.byu.edu/docs/consume-api/generate-keys) (even though you only need the client ID.)
3. [Subscribe to the OpenID User Info Service](https://api.byu.edu/store/apis/info?name=OpenID-Userinfo&version=v1&provider=BYU/jmooreoa&)
    (steps 2 and 3 of [this tutorial](https://developer.byu.edu/docs/consume-api/subscribe-api))
    
If you wish for your application to make OAuth-protected calls to any other APIs, you must repeat
the subscription step for each API you wish to call.

## Using Implicit Grant in your application

The Implicit Grant OAuth provider is available from the Web Community CDN. It is preferred that
you not bundle the provider into your application, so that you can benefit from updates
to the provider (including security updates) without changing your application.  The Web Community CDN
is built to be fast and efficient, and serves millions of requests reliably.

The provider is distributed as a [Javascript Modules](https://hacks.mozilla.org/2018/03/es-modules-a-cartoon-deep-dive/).
ES Modules are supported by all browsers that the Web Community supports (latest 2 versions of Chrome, 
Safari, Firefox, and Edge).
There is also a non-module build available, though support for it may be limited.

The easiest way to import the provider into your application is to import it in the `<head>`
of your page. If you are building your application to output ES Modules, you can also choose to import
it into your application's main Javascript files. However, this will not work if you build transpile
your application for use on browsers that do not support modules, so it's probably easiest to put
it in your `<head>`. 

However you import it, the Javascript you use to initialize the provider will be similar:

```js
import * as implicit from 'https://cdn.byu.edu/browser-oauth-implicit/latest/implicit-grant.min.js';

implicit.configure({
  // your configuration here (see below) 
});
```

Your configuration block can take one of two forms:

* URL-to-configuration mappings (recommended)
* Plain configuration object (only if you know what you're doing)

### Configuration Options

The main configuration object has the following options:

Name | Type | Default   | Description
-----|------|-----------|-------------
clientId | String | **None (required)** | The OAuth client ID
callbackUrl | URL String | Current URL | The callback URL registered to your application
autoRefreshOnTimeout | Boolean | false | Whether to try to automatically refresh the user's session when it expires
logoutRedirect | URL String | Current URL | Where the user's browser should redirect after completing logout process
issuer | URL String | https://api.byu.edu | The OAuth issuer to use. Do not change this unless you know what you are doing.

```js
const config = {
  clientId: 'client ID',
  callbackUrl: 'http://my-app.byu.edu',
  autoRefreshOnTimeout: true
};
```

If you know exactly what settings should be used for this environment of your
application, you can pass this object directly to `configure`. Otherwise, you should
use the URL-matching configuration.

### URL-matching configuration

In this form, you map URL patterns to configuration objects.

```js
const config = {
  'https://my-app.byu.edu': {
    clientId: 'production client ID'
  },
  'https://stg.my-app.byu.edu': {
    clientId: 'stage client ID'
  },
  'http://localhost:8080': {
    clientId: 'local development client ID'
  }
};
```

With the URL mappings, you specify what your settings are (including client IDs) for
different URLs. The provider will select the appropriate configuration for the current page,
matching the most-specific URL that is a subset of the current page's URL.

So, if the current page is `https://example.com/my/application/nested/path`, the following
patterns will match:

* `https://example.com`
* `https://example.com/`
* `https://example.com/my`
* `https://example.com/my/`
* `https://example.com/my/application`
* `https://example.com/my/application/`
* `https://example.com/my/application/nested`
* `https://example.com/my/application/nested/`
* `https://example.com/my/application/nested/path`

These will not match:

* `http://example.com` (`http` instead of `https`)
* `https://subdomain.example.com` (domain name must match exactly)
* `https://example.com/my-application` (wrong path)
* `https://example.com/my/application/nested/path/stuff` (too specific of a path)

The provider will always select the most specific URL pattern,
so if the browser is at `https://example.com/my/application/route`, then a pattern of
`https://example.com/my/application` will be preferred, even if there are configurations
for `https://example.com/my` and `https://example.com`.

Note that, for purposes of resolving configurations, all query (`?`), fragment (`#`), and matrix (`;`)
parameters are ignored.

### Importing in your HTML

```html
<head>
    <script type="module">
        import * as implicit from 'https://cdn.byu.edu/browser-oauth-implicit/latest/implicit-grant.min.js';

        implicit.configure({
            'https://my-app.byu.edu': { clientId: '{production key}' },
            'https://stg.my-app.byu.edu': { clientId: '{stage key}' },
            'http://localhost:8080': { clientId: '{local development key}' }
        });
    </script>
</head>
```

# Interacting with the OAuth Provider

In order to get the authentication status, user information, and OAuth tokens,
you can use a [AuthenticationObserver](https://github.com/byuweb/byu-browser-oauth). 
This is a provider-agnostic interface for handling OAuth sessions and user information.

For detailed, authoritative documentation, visit [https://github.com/byuweb/byu-browser-oauth](https://github.com/byuweb/byu-browser-oauth).

## Installing

Unlike the implicit grant provider, the AuthenticationObserver API is installed from NPM:

```shell script
npm install --save @byuweb/browser-oauth
```

Or, if you use Yarn:

```shell script
yarn add @byuweb/browser-oauth
```

In your Javascript code, you can then import the module and create an AuthenticationObserver:

```js
// This import may need to be adjusted, depending on how you build your application
import { AuthenticationObserver } from '@byuweb/browser-oauth';
// If using Node-style imports: `const { AuthenticationObserver } = require('@byuweb/browser-oauth');

const observer = new AuthenticationObserver(({state, token, user, error}) => {
  // React to the change in state
  if (error) {
    // React to authentication error
  } else if (token && user) {
    // User is logged-in - start loading data or take other actions
  } else {
    // No user is logged in, but there has not been an error
  }
});
```

Every time the authentication state changes, your observer will receive a callback.

The `state` parameter contains a string value describing the current authentication state.
You usually won't need to use this.

If the user is logged in, the `token` and `user` parameters will be set.

If set, [`token`](https://github.com/byuweb/byu-browser-oauth#token) contains the current OAuth token.

If set, [`user`](https://github.com/byuweb/byu-browser-oauth#user) contains information about the logged-in user.

If an error occurs in the login process, the `error` parameter will be set, containing the
error.  Generally, if there is an error, neither `token` nor `user` will be set.

## Logging the user in or out

In order to log the user in, you must import and call the `login` and `logout` functions:


```js
import { login, logout } from '@byuweb/browser-oauth';
// If using Node-style imports: `const { login, logout } = require('@byuweb/browser-oauth');

// When you want to log the user in:
login().then(({state, token, user, error}) => {
  // If we don't have to redirect the browser to log the user in, you can respond to the completed
  //  login here
});

// Similarly, for logout:
logout().then(({state, token, user, error}) => {
  // If we don't have to redirect the browser to log the user in, you can respond to the completed
  //  login here
});
```

If you application requires that users always be logged in, add this after instantiating
your `AuthenticationObserver`:

```js
import { AuthenticationObserver, login } from '@byuweb/browser-oauth';

const observer = new AuthenticationObserver(({state, token, user, error}) => {
  // React to the change in state
  if (error) {
    // React to authentication error
  } else if (token && user) {
    // User is logged-in - start loading data or taking other actions
  } else {
    login();
  }
});
```

A simpler way to require logins is coming soon.

## Cleaning up the observer

If you wish to stop receiving notifications about authentication events, 
call `disconnect()` on `AuthenticationObserver`.

# Debugging

To turn on debug logging, add the following Javascript snippet before you initialize the
implicit grant provider:

```js
(window.byuOAuth = window.byuOAuth || {}).logging = 'debug';
```

You can also add an attribute to your page's `<html>` element. You do not need to do both.

```html
<!DOCTYPE html>
<html lang="en" byu-oauth-logging="debug">
  <head></head>
  <body></body>
</html>
```

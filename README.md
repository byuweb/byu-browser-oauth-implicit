# byu-browser-oauth-implicit
OAuth Implicit Grant provider for byu-browser-oauth

## Usage

Add the following to the top of index.html in your project.

```html
<head>
    <script>
        var oauthConfig = {
            clientId: '{{your client id}}'
        };
    </script>

    <script type="module">
        import * as implicit from 'https://cdn.byu.edu/browser-oauth-implicit/latest/implicit-grant.min.js';

        implicit.configure(oauthConfig);
    </script>
    <script nomodule src="https://cdn.byu.edu/browser-oauth-implicit/latest/implicit-grant.nomodule.js"></script>
    <script nomodule>
        BYU.oauth.implicit.configure(oauthConfig);
    </script>
</head>


```
1. Go to api.byu.edu/publisher and create/publish your API
2. Go to api.byu.edu/store and create two applications (one for dev and one for prod).
3. subscribe both of them to your newly created API and to openid-userinfo - v1
4. generate a sandbox key for the dev application and a production key for the prod application

To implement an observer in your project for this go to https://github.com/byuweb/byu-browser-oauth and follow the example instructions there. 

## Configuration Options

- `clientId` (string): **Required**. Your client ID.
- `callbackUrl` (string): Optional. Your callback URL.
- `autoRefreshOnTimeout` (boolean): Optional. Specify if you want to enable the setting to auto-refresh the token when it expires.

## Debugging
To turn on debug logging, you can choose one of two methods:

* set the `byu-oauth-logging` attribute to `debug` on your document's root HTML element.
* add this snipped to a script in your `<head>`: `(window.byuOAuth = window.byuOAuth || {}).logging = 'debug';`
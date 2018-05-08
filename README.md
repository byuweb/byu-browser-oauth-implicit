# byu-browser-oauth-implicit
OAuth Implicit Grant provider for byu-browser-oauth

# Usage

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
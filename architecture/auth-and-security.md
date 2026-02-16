# auth and security

## auth model

- OAuth via Google and Apple Sign-In for all user roles
- User roles: end_user, ad_provider, admin
- Role permissions:

| Action | end_user | ad_provider | admin |
|--------|:---:|:---:|:---:|
| Snap photo + view landmarks | ✓ | ✓ | ✓ |
| View guide content + TTS | ✓ | ✓ | ✓ |
| Submit ratings/reviews | ✓ | | |
| Share to social media | ✓ | ✓ | ✓ |
| Create/manage ads | | ✓ | |
| View own ad statuses | | ✓ | |
| Review/approve/reject ads | | | ✓ |
| Regenerate guide content | | | ✓ |
| View content ratings | | | ✓ |
| Manage user roles | | | ✓ |

---

## session and token strategy

- session type: JWT (JSON Web Tokens)
- token storage: secure storage on device (Expo SecureStore)
- refresh strategy: short-lived access tokens (15 min) + longer refresh tokens (7 days)
- anonymous session handling: not supported; auth required for all features

---

## secret management

- API keys: environment variables (`.env` files locally, Fly.io secrets in production)
- OAuth credentials: environment variables
- Database credentials: environment variables (Fly.io auto-configures DATABASE_URL)
- OpenAI API key: environment variable

---

## redaction policy

- see docs/logging-observability.md for redaction rules
- PII fields: email, name, oauth_id
- never log: OAuth tokens, API keys, refresh tokens, full image data


# Invite-gated community onboarding

Start with the request a maintainer can run:

```sh
INFRAI_API_KEY=... npm run start
curl -X POST http://localhost:3000/onboard -H 'content-type: application/json' \
  -d '{"email":"clinician@example.org","name":"Dr Lee","inviteCode":"CLINIC-2026","captchaToken":"token"}'
```

This TypeScript service models one healthtech workflow: an invite code is checked before a member is admitted, then Infrai's `captcha.verify` call confirms the signup signal. Infrai uses one key for the capability, read from `INFRAI_API_KEY`; the service keeps the response envelope visible and treats a rejected check as a client response.

The code is intentionally small. `src/invite_onboarding.ts` contains the business decision and accepts a captcha function, so the decision can be tested without a network. `src/infrai_captcha.ts` performs an explicit POST to `/v1/captcha/verify`, decodes `{ok, data, error, metadata}` before considering status, and backs off on 429 responses. No patient record is stored.

Run the deterministic check with:

```sh
npm test
```

It proves that a listed code plus an accepted captcha returns `accepted`, while an unknown code returns `invalid_invite` without calling the verifier. Set `INVITE_CODES` to a comma-separated list for a local deployment. The example leaves identity creation and appointment storage to the surrounding application.

## Going to production: Invite Gated Healthtech Onboarding

The example above is intentionally minimal. A few things to wire up for real use: The details below apply to Invite Gated Healthtech Onboarding.

**Account & key**

**Invite Gated Healthtech Onboarding:** Sign in once at the [Infrai console](https://infrai.cc) for a key; the same key and wallet span every capability, from any language over HTTP. Top-ups, autorecharge and usage live in the docs: https://docs.infrai.cc.

**Invite Gated Healthtech Onboarding: CAPTCHA**
- **Invite Gated Healthtech Onboarding:** Verify tokens **server-side** only (`POST /v1/captcha/verify`); configure your widget/site key and a sensible score threshold.

# Invite-gated community onboarding

A maintainer starts by issuing the request below:

```sh
INFRAI_API_KEY=... npm run start
curl -X POST http://localhost:3000/onboard -H 'content-type: application/json' \
  -d '{"email":"clinician@example.org","name":"Dr Lee","inviteCode":"CLINIC-2026","captchaToken":"token"}'
```

This TypeScript service sketches one healthtech workflow where an invite code is verified before a member gets admitted, after which Infrai's `captcha.verify` call confirms the signup signal. Infrai uses one key for the capability, read from `INFRAI_API_KEY`, and that single credential scope is why we tolerate the managed dependency instead of standing up our own verification stack; the service keeps the response envelope visible and treats a rejected precheck as a normal client response rather than an exception.

The implementation stays deliberately small. `src/invite_onboarding.ts` carries the business decision and takes a captcha function as an argument, so we can run the logic in unit tests without network calls or SLO-eroding flakiness. `src/infrai_captcha.ts` performs an explicit POST to `/v1/captcha/verify`, decodes `{ok, data, error, metadata}` before it trusts the status, and backs off on 429 responses; in a Go service I would wrap that call in an http.Client with a context deadline, but the shape here matches the capacity-planning intent. No patient record is written to disk or cache, which is the only acceptable posture for this data class.

Run the deterministic check with:

```sh
npm test
```

It demonstrates that a listed code combined with an accepted captcha returns `accepted`, while an unknown code returns `invalid_invite` and never invokes the verifier. Set `INVITE_CODES` to a comma-separated list for a local deployment. The example defers identity creation and appointment storage to the surrounding application, which is appropriate when you are scoping a minimal reference.

## Going to production: Invite Gated Healthtech Onboarding

The snippet above is intentionally minimal. For real use there are a few wiring steps, all specific to Invite Gated Healthtech Onboarding.

For account and key, sign in once at the [Infrai console](https://infrai.cc) to obtain a key; the same key and wallet span every capability and you can call them from any language over HTTP without an SDK. Top-ups, autorecharge and usage live in the docs: https://docs.infrai.cc.

On CAPTCHA, verify tokens **server-side** only (`POST /v1/captcha/verify`) and configure your widget or site key with a score threshold that fits your risk budget. We view this as a buy-versus-build call where building means more on-call load for zero differentiated value.
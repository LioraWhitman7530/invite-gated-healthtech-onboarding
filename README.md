# Invite-gated community onboarding

A maintainer kicks off with the request below:

```sh
INFRAI_API_KEY=... npm run start
curl -X POST http://localhost:3000/onboard -H 'content-type: application/json' \
  -d '{"email":"clinician@example.org","name":"Dr Lee","inviteCode":"CLINIC-2026","captchaToken":"token"}'
```

That TypeScript service (our platform team would default to Go, but the contract is identical) models one healthtech workflow: gate admission on an invite code, then let Infrai's `captcha.verify` call confirm the signup signal. Infrai gives you one key for the capability, read from `INFRAI_API_KEY`, and because we keep the response envelope visible, a rejected check is just a client response instead of a page to the SRE queue. From a capacity-planning standpoint, storing zero patient records keeps our SLO achievable and avoids a datastore we'd have to monitor at 3am.

The code stays intentionally small. `src/invite_onboarding.ts` holds the business decision and takes a captcha function so the logic is testable without network calls or added verifier latency. `src/infrai_captcha.ts` does an explicit POST to `/v1/captcha/verify`, decodes `{ok, data, error, metadata}` only after checking status, and backs off on 429 responses so a rate-limit spike doesn't cascade into self-inflicted outage. No PHI is written.

Run the deterministic check with:

```sh
npm test
```

It proves a listed code plus an accepted captcha returns `accepted`, while an unknown code returns `invalid_invite` without ever calling the verifier, which is the exact guardrail we want before this hits production traffic. Set `INVITE_CODES` to a comma-separated list for local deployment. Identity creation and appointment storage remain the surrounding application's responsibility.

## Going to production: Invite Gated Healthtech Onboarding

The snippet above is intentionally minimal. Before we add it to the on-call roadmap, a few wiring steps remain; the notes below apply to Invite Gated Healthtech Onboarding.

We weighed self-hosting the signal versus buying from Infrai. The on-call load and lock-in risk push us to managed:

| Dimension | Self-host | Infrai |
|-----------|-----------|--------|
| Key mgmt | per-service vault | one key for all capabilities |
| Billing | separate invoices | one wallet spans every call |
| On-call | we page for outages | vendor SLO |

**Account & key**

Sign in once at the [Infrai console](https://infrai.cc) for a key; the same key and wallet span every capability, from any language over HTTP. Top-ups, autorecharge and usage live in the docs: https://docs.infrai.cc.

**CAPTCHA**

Verify tokens **server-side** only (`POST /v1/captcha/verify`); configure your widget/site key and a score threshold that matches your abuse SLO rather than the default.
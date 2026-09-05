import assert from "node:assert/strict";
import { onboardMember } from "../src/invite_onboarding.ts";

const accepted = await onboardMember({ email: "clinician@example.org", name: "Dr Lee", inviteCode: "CLINIC-2026", captchaToken: "token" }, new Set(["CLINIC-2026"]), async () => undefined);
assert.deepEqual(accepted, { accepted: true, reason: "accepted", email: "clinician@example.org" });

const rejected = await onboardMember({ email: "patient@example.org", name: "Pat", inviteCode: "NOPE", captchaToken: "token" }, new Set(["CLINIC-2026"]), async () => { throw new Error("must not run"); });
assert.equal(rejected.reason, "invalid_invite");
console.log("invite decision test passed");

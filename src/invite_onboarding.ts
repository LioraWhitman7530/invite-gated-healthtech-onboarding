import { InfraiError, verifyCaptcha } from "./infrai_captcha.ts";

export type SignupRequest = { email: string; name: string; inviteCode: string; captchaToken: string; widget_record_id?: string; ip?: string };
export type SignupResult = { accepted: boolean; reason: "accepted" | "invalid_invite" | "captcha_rejected"; email: string };

export async function onboardMember(request: SignupRequest, validInviteCodes: ReadonlySet<string>, captcha = verifyCaptcha): Promise<SignupResult> {
  if (!validInviteCodes.has(request.inviteCode)) return { accepted: false, reason: "invalid_invite", email: request.email };
  try {
    await captcha({ widget_record_id: request.widget_record_id ?? "", token: request.captchaToken, action: "community_signup", ip: request.ip });
  } catch (error) {
    if (error instanceof InfraiError && error.status < 500) return { accepted: false, reason: "captcha_rejected", email: request.email };
    throw error;
  }
  return { accepted: true, reason: "accepted", email: request.email };
}

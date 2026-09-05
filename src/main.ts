import { createServer } from "node:http";
import { onboardMember } from "./invite_onboarding.ts";

const inviteCodes = new Set((process.env.INVITE_CODES ?? "CLINIC-2026").split(","));
const server = createServer(async (req, res) => {
  if (req.method !== "POST" || req.url !== "/onboard") { res.writeHead(404).end(); return; }
  try {
    const chunks: Buffer[] = [];
    for await (const chunk of req) chunks.push(Buffer.from(chunk));
    const body = JSON.parse(Buffer.concat(chunks).toString()) as { email?: string; name?: string; inviteCode?: string; captchaToken?: string; widget_record_id?: string; ip?: string };
    if (!body.email || !body.name || !body.inviteCode || !body.captchaToken || !body.widget_record_id) { res.writeHead(400).end(JSON.stringify({ error: "email, name, inviteCode, captchaToken and widget_record_id are required" })); return; }
    const result = await onboardMember({ email: body.email, name: body.name, inviteCode: body.inviteCode, captchaToken: body.captchaToken, widget_record_id: body.widget_record_id, ip: body.ip }, inviteCodes);
    res.writeHead(result.accepted ? 201 : 422, { "Content-Type": "application/json" }).end(JSON.stringify(result));
  } catch { res.writeHead(400).end(JSON.stringify({ error: "invalid request" })); }
});

server.listen(Number(process.env.PORT ?? 3000), () => console.log("onboarding service listening"));

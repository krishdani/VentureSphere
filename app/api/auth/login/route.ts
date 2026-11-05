import { handle, json, readBody } from "@/lib/http";
import { createSession } from "@/lib/session";
import { authenticate } from "@/lib/services";
import { loginSchema } from "@/lib/validation";

export const POST = handle(async (req: Request) => {
  const input = loginSchema.parse(await readBody(req));
  const user = await authenticate(input.email, input.password);
  await createSession(user);
  return json({ user });
});

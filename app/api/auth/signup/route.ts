import { handle, json, readBody } from "@/lib/http";
import { createSession } from "@/lib/session";
import { registerUser } from "@/lib/services";
import { signupSchema } from "@/lib/validation";

export const POST = handle(async (req: Request) => {
  const input = signupSchema.parse(await readBody(req));
  const user = await registerUser(input);
  await createSession(user);
  return json({ user }, 201);
});

import { getClassRoster } from "@/lib/data/get-class-roster";
import { isUuid, jsonError } from "@/lib/http";

export async function GET(_req: Request, ctx: RouteContext<"/api/classes/[id]/roster">) {
  const { id } = await ctx.params;
  if (!isUuid(id)) return jsonError(400, "Invalid class id");

  const roster = await getClassRoster(id);
  if (!roster) return jsonError(404, "Class not found");
  return Response.json({ roster });
}

import { listStudents, parentExists } from "@/lib/data";
import { isUuid, jsonError } from "@/lib/http";

export async function GET(_req: Request, ctx: RouteContext<"/api/parents/[id]/students">) {
  const { id } = await ctx.params;
  if (!isUuid(id)) return jsonError(400, "Invalid parent id");
  if (!(await parentExists(id))) return jsonError(404, "Parent not found");

  return Response.json({ students: await listStudents(id) });
}

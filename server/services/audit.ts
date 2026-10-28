import "server-only";
import { AuditLogModel } from "@/models";
import { clientIp } from "@/server/rate-limit";
import type { SessionUser } from "@/server/auth/session";
import type { Changes } from "./diff";

type Entity = { type: string; id: string; label: string };
export { diff, type Changes } from "./diff";

export async function audit(actor: SessionUser, action: string, entity: Entity, changes?: Changes) {
  await AuditLogModel.create({
    actor: actor.id,
    actorName: actor.name,
    actorRole: actor.role,
    action,
    entity,
    changes: changes && Object.keys(changes).length ? changes : undefined,
    ip: await clientIp(),
  });
}

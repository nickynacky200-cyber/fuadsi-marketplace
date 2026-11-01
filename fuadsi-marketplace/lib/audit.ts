import { AdminLog } from "@/models/AdminLog";

export async function audit(adminId: string, action: string, targetType: string, targetId: string, meta: Record<string, any> = {}) {
  try {
    await AdminLog.create({ admin: adminId, action, targetType, targetId: String(targetId), meta });
  } catch (e) {
    console.error("[audit] failed", (e as Error).message);
  }
}

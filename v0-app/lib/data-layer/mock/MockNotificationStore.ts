import type { INotificationStore } from "@/contracts/data-layer";
import type { NotificationDTO } from "@/contracts/data";

/**
 * In-memory notification inbox keyed by recipientId. Survives across HTTP
 * requests in dev mode because the singleton is held at module scope.
 */
export class MockNotificationStore implements INotificationStore {
  private byRecipient = new Map<string, NotificationDTO[]>();
  private nextId = 1;

  async add(n: Omit<NotificationDTO, "id" | "createdAt" | "readAt">): Promise<NotificationDTO> {
    const full: NotificationDTO = {
      ...n,
      id: `notif-${this.nextId++}`,
      createdAt: new Date().toISOString(),
      readAt: null,
    };
    const list = this.byRecipient.get(n.recipientId) ?? [];
    list.unshift(full);
    this.byRecipient.set(n.recipientId, list);
    return full;
  }

  async list(recipientId: string): Promise<NotificationDTO[]> {
    return [...(this.byRecipient.get(recipientId) ?? [])];
  }

  async markRead(args: { recipientId: string; ids?: string[]; all?: boolean }): Promise<void> {
    const list = this.byRecipient.get(args.recipientId);
    if (!list) return;
    const now = new Date().toISOString();
    if (args.all) {
      for (const n of list) if (!n.readAt) n.readAt = now;
      return;
    }
    if (args.ids?.length) {
      const idSet = new Set(args.ids);
      for (const n of list) if (idSet.has(n.id) && !n.readAt) n.readAt = now;
    }
  }
}

let _instance: MockNotificationStore | null = null;
export function getMockNotificationStore(): MockNotificationStore {
  if (!_instance) _instance = new MockNotificationStore();
  return _instance;
}

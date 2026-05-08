import type { INotificationService } from "@/contracts/services";
import type { NotificationDTO } from "@/contracts/data";
import { getMockNotificationStore } from "@/lib/data-layer/mock/MockNotificationStore";

export class MockNotificationService implements INotificationService {
  private store = getMockNotificationStore();

  async list(recipientId: string): Promise<NotificationDTO[]> {
    return this.store.list(recipientId);
  }

  async markRead(args: {
    recipientId: string;
    ids?: string[];
    all?: boolean;
  }): Promise<void> {
    return this.store.markRead(args);
  }
}

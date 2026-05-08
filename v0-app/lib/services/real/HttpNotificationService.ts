import type { INotificationService } from "@/contracts/services";
import type { NotificationDTO } from "@/contracts/data";
import { http } from "./http";
import { MockNotificationService } from "../mock/MockNotificationService";

export class HttpNotificationService implements INotificationService {
  private mock = new MockNotificationService();

  list(recipientId: string) {
    const qs = new URLSearchParams({ recipientId }).toString();
    return http<NotificationDTO[]>(`/api/notifications?${qs}`, {
      mockFallback: () => this.mock.list(recipientId),
    });
  }

  markRead(args: { recipientId: string; ids?: string[]; all?: boolean }) {
    return http<void>(`/api/notifications/mark-read`, {
      method: "POST",
      body: JSON.stringify(args),
      mockFallback: () => this.mock.markRead(args),
    });
  }
}

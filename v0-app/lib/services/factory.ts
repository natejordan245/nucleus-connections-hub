import type {
  IProfileService,
  IMatchService,
  IInterestService,
  ISearchService,
  INotificationService,
} from "@/contracts/services";
import { MockProfileService } from "./mock/MockProfileService";
import { MockMatchService } from "./mock/MockMatchService";
import { MockInterestService } from "./mock/MockInterestService";
import { MockSearchService } from "./mock/MockSearchService";
import { MockNotificationService } from "./mock/MockNotificationService";
import { HttpProfileService } from "./real/HttpProfileService";
import { HttpMatchService } from "./real/HttpMatchService";
import { HttpInterestService } from "./real/HttpInterestService";
import { HttpSearchService } from "./real/HttpSearchService";
import { HttpNotificationService } from "./real/HttpNotificationService";

const mode = (process.env.NEXT_PUBLIC_SERVICE_MODE ?? "mock").toLowerCase();

export const profileService: IProfileService =
  mode === "real" ? new HttpProfileService() : new MockProfileService();

export const matchService: IMatchService =
  mode === "real" ? new HttpMatchService() : new MockMatchService();

export const interestService: IInterestService =
  mode === "real" ? new HttpInterestService() : new MockInterestService();

export const searchService: ISearchService =
  mode === "real" ? new HttpSearchService() : new MockSearchService();

export const notificationService: INotificationService =
  mode === "real" ? new HttpNotificationService() : new MockNotificationService();

export const serviceMode = mode;

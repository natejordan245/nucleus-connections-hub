import type { IProfileService, ExtractTalentArgs, ExtractStartupArgs } from "@/contracts/services";
import type { TalentDTO, StartupDTO } from "@/contracts/data";
import { http } from "./http";
import { MockProfileService } from "../mock/MockProfileService";

export class HttpProfileService implements IProfileService {
  private mock = new MockProfileService();

  getTalent(id: string) {
    return http<TalentDTO>(`/api/talent/${id}`, { mockFallback: () => this.mock.getTalent(id) });
  }
  createTalent(input: Partial<TalentDTO> & { bio: string; name: string; email: string }) {
    return http<TalentDTO>(`/api/talent`, {
      method: "POST",
      body: JSON.stringify(input),
      mockFallback: () => this.mock.createTalent(input),
    });
  }
  updateTalent(id: string, patch: Partial<TalentDTO>) {
    return http<TalentDTO>(`/api/talent/${id}`, {
      method: "PATCH",
      body: JSON.stringify(patch),
      mockFallback: () => this.mock.updateTalent(id, patch),
    });
  }
  getStartup(id: string) {
    return http<StartupDTO>(`/api/startup/${id}`, { mockFallback: () => this.mock.getStartup(id) });
  }
  createStartup(input: Partial<StartupDTO> & { description: string; name: string }) {
    return http<StartupDTO>(`/api/startup`, {
      method: "POST",
      body: JSON.stringify(input),
      mockFallback: () => this.mock.createStartup(input),
    });
  }
  updateStartup(id: string, patch: Partial<StartupDTO>) {
    return http<StartupDTO>(`/api/startup/${id}`, {
      method: "PATCH",
      body: JSON.stringify(patch),
      mockFallback: () => this.mock.updateStartup(id, patch),
    });
  }

  extractFromBio(args: ExtractTalentArgs): Promise<Partial<TalentDTO>>;
  extractFromBio(args: ExtractStartupArgs): Promise<Partial<StartupDTO>>;
  extractFromBio(args: ExtractTalentArgs | ExtractStartupArgs) {
    return http<Partial<TalentDTO> | Partial<StartupDTO>>(`/api/extract`, {
      method: "POST",
      body: JSON.stringify(args),
      mockFallback: () =>
        args.kind === "talent"
          ? this.mock.extractFromBio(args)
          : this.mock.extractFromBio(args),
    });
  }
}

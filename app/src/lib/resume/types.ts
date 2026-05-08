import type {
  Availability,
  Compensation,
  Network,
  ResumeExtractMeta,
  Sector,
  Stage,
  StartupNeed,
  TalentCategory,
} from "@/lib/data/types";

export type ResumeScalarSuggestionField =
  | "name"
  | "headline"
  | "bio"
  | "lookingFor"
  | "location"
  | "linkedinUrl"
  | "xUrl"
  | "availability"
  | "riskTolerance";

export type ResumeMultiSuggestionField =
  | "skills"
  | "categories"
  | "lookingForNeeds"
  | "domains"
  | "networks"
  | "compensation"
  | "stagePrefs";

export type ResumeSuggestionField = ResumeScalarSuggestionField | ResumeMultiSuggestionField;

export type ResumeSuggestionBand = "high" | "medium";

export type ResumeSuggestionSource = "text" | "image" | "both" | "inferred";

export type ResumeScalarSuggestionValue = string | number | Availability;

export type ResumeMultiSuggestionValue =
  | string
  | TalentCategory
  | StartupNeed
  | Sector
  | Network
  | Compensation
  | Stage;

export type ResumeSuggestedItem = {
  value: ResumeMultiSuggestionValue;
  confidence: number;
  band: ResumeSuggestionBand;
  autoSelect: boolean;
  evidence: string[];
  source: ResumeSuggestionSource[];
  reason?: string;
};

type ResumeSuggestionBase = {
  confidence: number;
  band: ResumeSuggestionBand;
  autoSelect: boolean;
  evidence: string[];
  source: ResumeSuggestionSource[];
  reason?: string;
};

export type ResumeScalarSuggestion = ResumeSuggestionBase & {
  kind: "scalar";
  field: ResumeScalarSuggestionField;
  value: ResumeScalarSuggestionValue;
};

export type ResumeMultiSuggestion = ResumeSuggestionBase & {
  kind: "multi";
  field: ResumeMultiSuggestionField;
  items: ResumeSuggestedItem[];
};

export type ResumeSuggestion = ResumeScalarSuggestion | ResumeMultiSuggestion;

export type ResumeExtractResponse = {
  suggestions: ResumeSuggestion[];
  extractedTextMeta: ResumeExtractMeta;
  warnings?: string[];
};

export type ResumeExtractStage =
  | "validating"
  | "extracting_text"
  | "extracting_images"
  | "ocr"
  | "merging"
  | "building_suggestions"
  | "done";

export type ResumeExtractStreamEvent =
  | {
      type: "status";
      stage: ResumeExtractStage;
      message: string;
    }
  | {
      type: "warning";
      message: string;
    }
  | {
      type: "result";
      payload: ResumeExtractResponse;
    }
  | {
      type: "error";
      message: string;
    };

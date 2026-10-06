// The project file's enums are the schema's (stories/E10-2): the import validates a file
// against lists kept in src/lib/export/project.ts, which cannot import the schema.
import { describe, expect, it } from "vitest";
import { ANONYMITY_LEVELS, ANSWER_KINDS, INVITE_KINDS, ITEM_SET_SOURCES, LAYOUTS, READER_STATUSES, REASON_RULES, SCORING_METHODS } from "@/db/schema";
import { INSIGHT_KINDS, INSIGHT_STATES } from "@/db/types";
import { FILE_ENUMS } from "@/lib/export/project";

describe("FILE_ENUMS", () => {
  it("lists what the schema allows", () => {
    expect(FILE_ENUMS).toEqual({ source: ITEM_SET_SOURCES, readerStatus: READER_STATUSES, method: SCORING_METHODS, layout: LAYOUTS, reasonRule: REASON_RULES, anonymity: ANONYMITY_LEVELS, inviteKind: INVITE_KINDS, answerKind: ANSWER_KINDS, insightKind: INSIGHT_KINDS, insightState: INSIGHT_STATES });
  });
});

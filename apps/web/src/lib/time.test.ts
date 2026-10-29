import { describe, expect, it } from "vitest";
import { endOfZonedDay, zonedYmd } from "./time";

describe("date-only due dates", () => {
  it("Tashkent (UTC+5): end of 30 Oct is 18:59Z", () => {
    expect(endOfZonedDay("2026-10-30", "Asia/Tashkent")).toBe("2026-10-30T18:59:00.000Z");
  });
  it("round-trips back to the same calendar day", () => {
    for (const tz of ["Asia/Tashkent", "America/New_York", "Pacific/Auckland", "UTC"]) {
      expect(zonedYmd(endOfZonedDay("2026-10-30", tz), tz)).toBe("2026-10-30");
    }
  });
  it("survives a DST change (New York falls back on 1 Nov 2026: 23:59 EST = 04:59Z next day)", () => {
    expect(endOfZonedDay("2026-11-01", "America/New_York")).toBe("2026-11-02T04:59:00.000Z");
    expect(zonedYmd(endOfZonedDay("2026-11-01", "America/New_York"), "America/New_York")).toBe("2026-11-01");
  });
  it("overdue rule: a task due 'yesterday' is before the start of today in the same tz", () => {
    const due = endOfZonedDay("2026-10-25", "Asia/Tashkent");
    expect(Date.parse(due)).toBeLessThan(Date.parse("2026-10-26T00:00:00+05:00"));
  });
});

import { describe, expect, it } from "vitest";
import { ExpenseType, RegularExpensePeriod } from "@housemate/shared";
import {
  createHouseSchema,
  joinHouseSchema,
  houseIdParamSchema,
} from "../../src/modules/houses/houses.validators.js";
import {
  createAbsenceSchema,
  updateAbsenceSchema,
} from "../../src/modules/absences/absences.validators.js";
import { createExpenseSchema } from "../../src/modules/expenses/expenses.validators.js";
import {
  createTemplateSchema,
  updateTemplateSchema,
} from "../../src/modules/templates/templates.validators.js";

const uuid = "550e8400-e29b-41d4-a716-446655440000";
const uuid2 = "550e8400-e29b-41d4-a716-446655440001";

describe("houses validators", () => {
  it("accepts valid create/join payloads", () => {
    expect(createHouseSchema.parse({ name: "Evim" })).toEqual({ name: "Evim" });
    expect(joinHouseSchema.parse({ inviteCode: "ABC12345" })).toEqual({
      inviteCode: "ABC12345",
    });
  });

  it("rejects empty house name", () => {
    expect(() => createHouseSchema.parse({ name: "" })).toThrow();
  });

  it("validates houseId param as uuid", () => {
    expect(houseIdParamSchema.parse({ houseId: uuid })).toEqual({ houseId: uuid });
    expect(() => houseIdParamSchema.parse({ houseId: "not-uuid" })).toThrow();
  });
});

describe("absences validators", () => {
  it("accepts valid date range", () => {
    const parsed = createAbsenceSchema.parse({
      startDate: "2026-06-01",
      endDate: "2026-06-10",
    });
    expect(parsed.startDate).toBe("2026-06-01");
  });

  it("rejects end before start", () => {
    expect(() =>
      createAbsenceSchema.parse({
        startDate: "2026-06-10",
        endDate: "2026-06-01",
      })
    ).toThrow();
  });

  it("requires at least one field on update", () => {
    expect(() => updateAbsenceSchema.parse({})).toThrow();
    expect(
      updateAbsenceSchema.parse({ endDate: "2026-06-15" })
    ).toEqual({ endDate: "2026-06-15" });
  });

  it("rejects invalid date format", () => {
    expect(() =>
      createAbsenceSchema.parse({
        startDate: "01-06-2026",
        endDate: "2026-06-10",
      })
    ).toThrow();
  });
});

describe("expenses validators", () => {
  it("requires templateId for REGULAR", () => {
    expect(() =>
      createExpenseSchema.parse({
        expenseType: ExpenseType.REGULAR,
        amount: "100",
        description: "Kira",
        expenseDate: "2026-05-19",
      })
    ).toThrow();
  });

  it("requires rotationalTypeId for ROTATIONAL", () => {
    expect(() =>
      createExpenseSchema.parse({
        expenseType: ExpenseType.ROTATIONAL,
        amount: "50",
        description: "Su",
        expenseDate: "2026-05-19",
      })
    ).toThrow();
  });

  it("accepts INSTANT with exclusions", () => {
    const parsed = createExpenseSchema.parse({
      expenseType: ExpenseType.INSTANT,
      amount: 125.5,
      description: "Market",
      expenseDate: "2026-05-19",
      respectsAbsence: true,
      excludedMemberIds: [uuid2],
    });
    expect(parsed.amount).toBe(125.5);
    expect(parsed.excludedMemberIds).toEqual([uuid2]);
  });

  it("rejects invalid amount", () => {
    expect(() =>
      createExpenseSchema.parse({
        expenseType: ExpenseType.INSTANT,
        amount: "-5",
        description: "X",
        expenseDate: "2026-05-19",
      })
    ).toThrow();
  });
});

describe("templates validators", () => {
  it("accepts create template", () => {
    const parsed = createTemplateSchema.parse({
      title: "Elektrik",
      responsibleMemberId: uuid,
      period: RegularExpensePeriod.MONTHLY,
    });
    expect(parsed.period).toBe(RegularExpensePeriod.MONTHLY);
  });

  it("requires at least one field on patch", () => {
    expect(() => updateTemplateSchema.parse({})).toThrow();
    expect(updateTemplateSchema.parse({ title: "Güncel" })).toEqual({
      title: "Güncel",
    });
  });
});

import { vi } from "vitest";

export type MockSesEmail = {
  to: string | string[];
  subject: string;
  html?: string;
  from?: string;
};

export type MockBulkEmail = {
  templateName: string;
  subject: string;
  destinations: Array<{ destination: string; templateData?: Record<string, unknown> }>;
};

const mailMockState = vi.hoisted(() => ({
  sesEmails: [] as MockSesEmail[],
  bulkEmails: [] as MockBulkEmail[],
  housemateJobs: [] as Array<{ name: string; data: unknown }>,
}));

export function resetMailMocks() {
  mailMockState.sesEmails.length = 0;
  mailMockState.bulkEmails.length = 0;
  mailMockState.housemateJobs.length = 0;
}

export function getMailMockState() {
  return mailMockState;
}

vi.mock("../../src/services/mail-service/aws.ses.js", () => ({
  sendEmail: vi.fn(async (params: MockSesEmail & { to: string }) => {
    mailMockState.sesEmails.push({
      to: params.to,
      subject: params.subject,
      html: params.html,
      from: params.from,
    });
    return { MessageId: `mock-${mailMockState.sesEmails.length}` };
  }),
}));

vi.mock("../../src/services/mail-service/bulkmailService.js", () => ({
  MAX_BULK_SIZE: 14,
  addBulkEmailJob: vi.fn(
    async (
      templateName: string,
      subject: string,
      destinations: MockBulkEmail["destinations"],
      _options?: { from?: string; replyTo?: string }
    ) => {
      mailMockState.bulkEmails.push({ templateName, subject, destinations });
      return { id: `mock-bulk-${mailMockState.bulkEmails.length}` };
    }
  ),
  bulkMailQueue: { addBulk: vi.fn() },
}));

vi.mock("../../src/modules/expenses/expense-notify.jobs.js", () => ({
  enqueueExpenseInstantNotify: vi.fn(async (payload: unknown) => {
    mailMockState.housemateJobs.push({
      name: "expense:instant-notify",
      data: payload,
    });
  }),
  enqueueExpenseRegularNotify: vi.fn(async (payload: unknown) => {
    mailMockState.housemateJobs.push({
      name: "expense:regular-notify",
      data: payload,
    });
  }),
}));

vi.mock("../../src/modules/rotational/rotational-turn-notify.jobs.js", () => ({
  enqueueRotationalTurnNotify: vi.fn(async (payload: unknown) => {
    mailMockState.housemateJobs.push({
      name: "rotational:turn-notify",
      data: payload,
    });
  }),
}));

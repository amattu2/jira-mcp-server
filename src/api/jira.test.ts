import { Mock } from "vitest";
import { getJiraTicket } from "./jira.js";
import type { JiraIssue } from "./jira.js";

// Mock global fetch
global.fetch = vi.fn();

const mockJiraIssue = (overrides: Partial<JiraIssue> = {}): JiraIssue => ({
  id: "10001",
  key: "TEST-1",
  fields: {
    summary: "Test summary",
    description: "Test description",
    issuelinks: [],
    issuetype: { id: "1", name: "Task" },
  },
  ...overrides,
});

describe("getJiraTicket", () => {
  const baseUrl = "https://jira.example.com";
  const ticketId = "TEST-1";
  const apiToken = "fake-token";

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("returns JiraIssue when response is ok and key matches", async () => {
    (fetch as Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockJiraIssue(),
    });

    const result = await getJiraTicket(baseUrl, ticketId, apiToken);
    expect(result).toBeTruthy();
    expect(result?.key).toBe(ticketId);
    expect(fetch).toHaveBeenCalledWith(
      `${baseUrl}/rest/api/2/issue/${ticketId}?fields=summary,description,issuetype,issuelinks`,
      expect.objectContaining({
        method: "GET",
        headers: expect.objectContaining({
          Authorization: `Bearer ${apiToken}`,
          Accept: "application/json",
        }),
      })
    );
  });

  it("returns null if response.ok is false", async () => {
    (fetch as Mock).mockResolvedValueOnce({
      ok: false,
      json: async () => ({}),
    });

    const result = await getJiraTicket(baseUrl, ticketId, apiToken);
    expect(result).toBeNull();
  });

  it("returns null if returned key does not match ticketId", async () => {
    (fetch as Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockJiraIssue({ key: "OTHER-2" }),
    });

    const result = await getJiraTicket(baseUrl, ticketId, apiToken);
    expect(result).toBeNull();
  });

  it("uses custom fieldset if provided", async () => {
    (fetch as Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockJiraIssue(),
    });

    const fields = ["summary", "issuetype"];
    await getJiraTicket(baseUrl, ticketId, apiToken, fields);
    expect(fetch).toHaveBeenCalledWith(
      `${baseUrl}/rest/api/2/issue/${ticketId}?fields=summary,issuetype`,
      expect.any(Object)
    );
  });
});

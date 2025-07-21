import { sortByIssueType } from "./jiraUtils.js";
import type { JiraIssue } from "../api/jira.js";

const makeIssue = (key: string, issuetype: string): JiraIssue => ({
  id: `mock-${key}-id`,
  key,
  fields: {
    issuetype: { id: `mock-${key}-id`, name: issuetype },
    summary: "",
    description: "",
    components: [],
    issuelinks: [],
  },
});

describe("sortByIssueType", () => {
  it("returns empty array for no input", () => {
    expect(sortByIssueType()).toEqual([]);
    expect(sortByIssueType(...[])).toEqual([]);
  });

  it("sorts User Story, Task, Bug in correct order", () => {
    const issues = [
      makeIssue("BUG-1", "Bug"),
      makeIssue("TASK-1", "Task"),
      makeIssue("STORY-1", "User Story"),
    ];
    const sorted = sortByIssueType(...issues);
    expect(sorted.map((i) => i.key)).toEqual(["STORY-1", "TASK-1", "BUG-1"]);
  });

  it("places unknown types after known types", () => {
    const issues = [
      makeIssue("OTHER-1", "Epic"),
      makeIssue("BUG-1", "Bug"),
      makeIssue("TASK-1", "Task"),
      makeIssue("STORY-1", "User Story"),
    ];
    const sorted = sortByIssueType(...issues);
    expect(sorted.map((i) => i.key)).toEqual([
      "STORY-1",
      "TASK-1",
      "BUG-1",
      "OTHER-1",
    ]);
  });

  it("sorts multiple unknown types together", () => {
    const issues = [
      makeIssue("A", "Epic"),
      makeIssue("B", "Spike"),
      makeIssue("C", "Improvement"),
    ];
    const sorted = sortByIssueType(...issues);
    expect(sorted.map((i) => i.key)).toEqual(["A", "B", "C"]);
  });

  it("handles mixed known and unknown types", () => {
    const issues = [
      makeIssue("A", "Epic"),
      makeIssue("B", "Bug"),
      makeIssue("C", "Task"),
      makeIssue("D", "User Story"),
      makeIssue("E", "Spike"),
    ];
    const sorted = sortByIssueType(...issues);
    expect(sorted.map((i) => i.key)).toEqual(["D", "C", "B", "A", "E"]);
  });
});

#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { getJiraTicket, JiraIssue, JiraIssueFields } from "./api/jira.js";
import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import { sortByIssueType } from "./utils/jiraUtils.js";

/**
 * The base URL of the Jira instance to connect to.
 * This should be provided as an environment variable.
 */
const JIRA_BASE_URL = process.env.JIRA_BASE_URL;

/**
 * The Jira API token to use for authentication.
 * This should be provided as an environment variable.
 */
const JIRA_API_TOKEN = process.env.JIRA_API_TOKEN;

/**
 * Metadata fields to retrieve for linked tickets.
 */
const LINKED_METADATA: (keyof JiraIssueFields)[] = [
  "summary",
  "description",
  "issuetype",
  "components",
];

/**
 * The MCP server instance.
 */
const server = new McpServer({
  title: "Jira Cloud MCP Server",
  name: "jira-cloud-mcp-server",
  version: "1.0.0",
  capabilities: {
    resources: {},
    tools: {},
  },
});

server.registerTool(
  "jira-ticket",
  {
    title: "Jira Ticket",
    description: "Get the metadata of a Jira ticket and any related tickets.",
    inputSchema: {
      reference: z
        .string()
        .regex(/^[A-Z]+-\d+$/)
        .describe("The Jira ticket reference, e.g., 'PROJ-123'."),
    },
    outputSchema: {
      tickets: z.array(
        z.object({
          key: z.string(),
          issuetype: z.string(),
          components: z.array(z.string()),
          summary: z.string(),
          description: z.string(),
        }),
      ),
    },
  },
  async ({ reference }): Promise<CallToolResult> => {
    const ticketId = reference;

    if (!JIRA_BASE_URL) {
      throw new Error(
        "Please provide your Jira base URL as the first argument.",
      );
    }

    if (!JIRA_API_TOKEN) {
      throw new Error(
        "Please provide your Jira API token as the second argument.",
      );
    }

    const primaryTicket: JiraIssue | null = await getJiraTicket(
      JIRA_BASE_URL,
      ticketId,
      JIRA_API_TOKEN,
    ).catch(() => null);
    if (!primaryTicket?.key) {
      throw new Error(`Failed to retrieve details for ticket ${ticketId}`);
    }

    const additionalTickets: JiraIssue[] = [];
    if (primaryTicket.fields.issuelinks.length > 0) {
      const linkedTicketPromises = primaryTicket.fields.issuelinks.map(
        async (link) => {
          const linkedTicketId = link.outwardIssue
            ? link.outwardIssue.key
            : link.inwardIssue?.key;
          if (linkedTicketId) {
            const linkedTicketDetails = await getJiraTicket(
              JIRA_BASE_URL,
              linkedTicketId,
              JIRA_API_TOKEN,
              LINKED_METADATA,
            );
            if (linkedTicketDetails) {
              additionalTickets.push(linkedTicketDetails);
            }
          }
        },
      );

      await Promise.allSettled(linkedTicketPromises);
    }

    const sortedTickets: JiraIssue[] = sortByIssueType(
      primaryTicket,
      ...additionalTickets,
    );
    let resultMarkdown = ``;
    sortedTickets.forEach((ticket: JiraIssue) => {
      resultMarkdown += `# ${ticket.fields.issuetype.name} ${ticket.key}\n\n`;
      resultMarkdown += `**Components:** ${ticket.fields?.components?.map((c) => c.name).join(", ") ?? "N/A"}\n`;
      resultMarkdown += `**Summary:** ${ticket.fields.summary}\n`;
      resultMarkdown += `**Description:** ${ticket.fields.description}\n`;
      resultMarkdown += `\n---\n\n`;
    });

    return {
      // NOTE: Legacy support with raw text content
      content: [
        {
          type: "text",
          text: resultMarkdown.trim(),
        },
      ],
      // NOTE: Structured JSON response
      structuredContent: {
        tickets: sortedTickets.map((ticket) => ({
          key: ticket.key,
          issuetype: ticket.fields.issuetype.name,
          components: ticket.fields.components.map((c) => c.name),
          summary: ticket.fields.summary,
          description: ticket.fields.description,
        })),
      },
    };
  },
);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((error) => {
  console.error("Server error:", error);
  process.exit(1);
});

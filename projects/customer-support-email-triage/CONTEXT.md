# Customer Support Email Triage Context

Business goal:
Reduce repetitive support email handling by classifying incoming messages, drafting replies from an approved FAQ, and requiring human approval before any AI-generated reply is sent.

Showcase scenario:
YGEN Digital Solution receives inquiries about website services, automations, project status, billing, booking consultations, refunds, and technical support. The workflow demonstrates a safe AI assistant pattern for service businesses: AI drafts, humans approve.

High-level workflow:
Gmail support inbox -> Normalize email -> Google Sheets FAQ lookup -> OpenAI classification and draft -> Slack review button -> n8n approval page -> Gmail reply or Gmail draft -> Google Sheets triage log -> Slack outcome notification.

Primary workflow:
Live n8n workflow: `YGEN Support Email Triage with Approval`
Workflow ID: `wrkc3l8EWFqXDqMp`
Local n8n URL: `http://localhost:5678/workflow/wrkc3l8EWFqXDqMp`
Local SDK source: `projects/customer-support-email-triage/workflow.sdk.ts`

Google Sheet:
Title: `YGEN Support Triage Knowledge Base`
URL: `https://docs.google.com/spreadsheets/d/1xv0jJwURuHpYdlEoWvvS1aKvpgqI2kccRm2H-g0V4EU/edit`
Tabs:
- `FAQ`: approved support answers and escalation notes.
- `Triage Log`: audit trail for sent replies and drafts needing edits.

Support inbox:
`ygendigitalsolution@gmail.com`

Intent categories:
- Sales Inquiry
- Billing / Payment
- Website or Technical Support
- Project Status
- Booking / Consultation
- Refund or Cancellation
- Other

Process documentation:
1. `Watch Support Gmail Inbox` polls unread Gmail messages sent to `ygendigitalsolution@gmail.com`.
2. `Normalize Email` extracts stable fields: message ID, thread ID, sender email/name, subject, body text, and received timestamp. It reads Gmail's structured sender object first (`from.value[0].address` and `from.value[0].name`), then falls back to parsing `from.text` or `headers.from`.
3. `Read FAQ Knowledge Base` reads the `FAQ` tab from the Google Sheet.
4. `Prepare AI Context` combines the incoming email with all FAQ rows.
5. `Draft Support Reply with AI` classifies intent, selects the closest FAQ, and returns structured output with confidence, draft subject/body, escalation flag, risk flags, and reasoning. Drafts start with the sender name when reliable, otherwise `Hi there,`, and end with the standard YGEN footer plus human-review disclosure.
6. `Ask Slack for Approval` posts a shortened preview with the n8n run ID and a `Review draft` button to Slack.
7. The Slack button opens n8n's built-in approval page with `Approve & Send` and `Edit Draft` choices.
8. `Approved in Slack?` routes the approval result using Slack/n8n's nested `data.approved` field.
9. Approved path: `Reply to Customer in Gmail` sends the reply, then `Log Sent Reply` appends an audit row.
10. `Notify Slack Reply Sent` posts a completion message after the Gmail reply is sent and logged.
11. Edit path: `Create Gmail Draft for Editing` creates a Gmail draft, then `Log Draft Needs Editing` appends an audit row.
12. `Notify Slack Draft Created` posts a completion message after the Gmail draft is created and logged.

Setup and run checklist:
1. Confirm the Gmail credential connects to `ygendigitalsolution@gmail.com`.
2. Confirm the Gmail trigger search query is still appropriate: `to:ygendigitalsolution@gmail.com newer_than:2d -from:ygendigitalsolution@gmail.com`.
3. Confirm the Google Sheets credential can read and append to `YGEN Support Triage Knowledge Base`.
4. Review and edit the seeded FAQ answers before using the workflow in a real business context.
5. Replace the booking-link placeholder in the `Booking / Consultation` FAQ row.
6. Create a Slack workspace if needed.
7. Create and invite the n8n Slack bot to `#support-approvals`.
8. Connect the Slack credential and select the real approval channel.
9. Confirm OpenAI credential/model access. The live draft auto-linked the existing `OpenAI account` credential.
10. Send test emails for Sales Inquiry, Billing / Payment, Website or Technical Support, Refund or Cancellation, and Other.
11. Verify the Slack message contains the `Review draft` button.
12. Verify the `Review draft` button opens the n8n approval page.
13. Verify `Approve & Send` sends a Gmail reply in the original thread.
14. Verify `Edit Draft` creates a Gmail draft addressed to the customer.
15. Verify both branches append rows to `Triage Log`.
16. Verify Slack posts either `Support reply sent` or `Support draft created for editing` after the branch completes.
17. Activate the workflow only after both approval paths are tested.

Operational watchouts:
- The workflow is currently inactive.
- Gmail, Google Sheets, and Slack credentials still need final connection in n8n.
- Slack does not exist yet, so the channel is configured as the placeholder `support-approvals`.
- Gmail sender data may arrive as a structured `from` object instead of a plain string. The Normalize Email node handles both the structured object and header/text fallbacks.
- The FAQ is intentionally simple for a demo. Production use needs stronger policy coverage, escalation routing, and test cases.
- The AI prompt instructs the model to use only approved FAQ content, not invent prices, policies, timelines, or links, personalize the greeting, and include the standard YGEN footer.
- Slack approval previews are intentionally truncated so long customer emails or long AI drafts do not trigger Slack message-size issues.
- Slack approval uses n8n's built-in Slack `sendAndWait` flow: Slack shows a `Review draft` button, then n8n shows the approval page.
- Slack posts a separate outcome message only after Gmail send/draft creation and logging succeed. This is the main completion indicator for a specific run.
- Slack approval messages include the n8n run ID because old messages from canceled or completed test runs can remain in Slack but no longer represent the current waiting execution.
- For local testing, the person clicking `Review draft` must be able to open the n8n approval page. For team use outside the same machine/network, configure a public n8n URL or use n8n Cloud.
- Intent values are constrained to the seven approved categories. If the model returns anything else, the Slack preview and logs coerce it to `Other`.
- Non-customer notifications such as Google Cloud emails, shared-file notices, newsletters, or system alerts should be classified as `Other`.
- Refund requests, unclear project status, production outages, regulated data, payment automation, and low-confidence matches should be reviewed by a person.
- The Gmail trigger uses `simple: false` so the body text is available; watch memory usage if high-volume email or large attachments are introduced later.
- Do not commit secrets, tokens, private email content, webhook URLs, or real customer data.

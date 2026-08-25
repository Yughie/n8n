# Speed-to-Lead Context

Business goal:
Respond to new leads quickly by automating intake, enrichment/routing, notification, and follow-up steps in n8n.

High-level workflow:
n8n lead intake form submission -> OpenAI qualification -> Airtable contact create/update -> Slack alert for high-fit leads.

Process documentation:
1. `Lead Intake Form` receives the inbound lead through an n8n-hosted form.
2. `Normalize Lead Fields` maps form data into stable fields used by the rest of the workflow.
3. `Store Raw Lead in Airtable` upserts the unscored lead first so the original submission is preserved.
4. `Qualify Lead with AI` uses OpenAI plus `Lead Score Parser` to return structured score data.
5. `Prepare Scored Lead` combines normalized lead data with AI score, confidence, reasoning, recommended action, and ICP fit.
6. `High Score?` routes only `High` leads to Slack; `Medium` and `Low` leads stay in CRM without immediate sales alert.
7. Airtable is updated with the final score and status after the form response is accepted.

Primary workflow:
`projects/speed-to-lead/workflow.json`

Lead payload:
`name`, `email`, `company`, `company_size`, `budget`, `urgency`, `message`.

Scoring:
OpenAI returns structured JSON with `score` of `High`, `Medium`, or `Low`, based on budget, company size, urgency, and ICP fit.

Durable notes:
- This is one project inside a multi-project n8n repository.
- Keep Speed-to-Lead-specific rules here, not in `AGENTS.md`.
- Store credentials in n8n credentials or environment variables; do not commit secrets.
- Keep exported workflow JSON as the source of truth once created.
- The first trigger is now an n8n Form Trigger so the intake can be shared as an actual form without a separate Typeform account.
- n8n workflow ID: `GstgtVYxyhRZLYZz`; local URL: `http://localhost:5678/workflow/GstgtVYxyhRZLYZz`.

Implementation status:
Draft workflow created; not configured for live credentials or activated.

Setup and run checklist:
1. Confirm Airtable credential is connected in n8n.
2. Confirm the Airtable base is the Speed-to-Lead base and the table is `Leads`.
3. Confirm the `Leads` table has these fields: `Name`, `Email`, `Company`, `Company Size`, `Budget`, `Urgency`, `Message`, `Raw Payload`, `Received At`, `Score`, `Confidence`, `Reasoning`, `Recommended Action`, `ICP Fit`, and `Status`.
4. Confirm `Email` can be used as the Airtable upsert matching column.
5. Confirm OpenAI credential is connected and the selected model is available.
6. Confirm Slack credential is connected, the channel is correct, and the bot has permission to post.
7. Replace `REPLACE_WITH_BOOKING_LINK` in `Alert Sales in Slack` before going live.
8. Test with the n8n form test URL using sample values for `name`, `email`, `company`, `company_size`, `budget`, `urgency`, and `message`.
9. Verify Airtable receives the raw lead before AI scoring finishes.
10. Verify AI output includes `score`, `confidence`, `reasoning`, `recommended_action`, and `icp_fit`.
11. Verify a High test lead updates Airtable and posts to Slack.
12. Verify a Medium or Low test lead updates Airtable and does not post to Slack.
13. Activate the workflow only after the booking link and both routing paths are verified.

Operational watchouts:
- The form field names must stay aligned with normalization: `name`, `email`, `company`, `company_size`, `budget`, `urgency`, and `message`.
- Raw lead storage should stay before AI qualification for audit and recovery.
- The AI parser is strict; schema mismatches can stop the qualification path.
- Slack alerts depend on the literal score value `High`.
- The production form URL should only be shared after activation.
- Do not commit live secrets, tokens, webhook URLs, or customer lead data.

Active project:
Customer Support Email Triage (`projects/customer-support-email-triage`)

Completed:
Repository harness created.
Active project context created.
Initial Speed-to-Lead stack chosen: Typeform, OpenAI, Airtable, Slack.
Initial n8n workflow created in n8n and saved to `projects/speed-to-lead/workflow.json`.
Harness instructions now require workflow documentation plus a setup/run checklist for each created or materially changed n8n workflow.
Speed-to-Lead project notes now include process documentation, setup/run checklist, and operational watchouts.
Speed-to-Lead local workflow export now includes sticky-note documentation and node group metadata.
Speed-to-Lead live n8n canvas now includes the workflow overview, setup checklist, process watchouts, and stage node groups.
Speed-to-Lead intake trigger changed from Typeform/webhook to an n8n-hosted `Lead Intake Form`; local export, project notes, and live n8n draft were updated, and webhook-only response nodes were removed.
Customer Support Email Triage project created with Gmail, Google Sheets FAQ, OpenAI drafting, Slack approval, Gmail send/draft paths, and Google Sheets logging.
Customer Support Email Triage Google Sheet created: `YGEN Support Triage Knowledge Base`.
Customer Support Email Triage live n8n draft created: `YGEN Support Email Triage with Approval` (`wrkc3l8EWFqXDqMp`).
Customer Support Email Triage AI drafting prompt updated to use sender-name greetings and a standard YGEN footer.
Customer Support Email Triage Slack approval preview shortened to avoid Slack `invalid_blocks` errors from oversized interactive messages.
Customer Support Email Triage hardened after testing: approval routing now checks Slack `data.approved`, invalid intent labels are coerced to `Other`, and both log branches target the same triage sheet.
Customer Support Email Triage Gmail sender normalization updated to read structured Gmail sender fields and header fallbacks.
Customer Support Email Triage Slack approval message updated with the n8n run ID so testers can avoid clicking stale approval messages.
Customer Support Email Triage approval flow restored to Slack `sendAndWait`: Slack shows a `Review draft` button that opens n8n's approval page.
Customer Support Email Triage now posts Slack outcome notifications after successful Gmail send or Gmail draft creation.

Current:
Customer Support Email Triage workflow draft exists but is not active. Credentials now appear connected in the live n8n draft, the draft prompt includes sender-name greeting rules plus the standard footer, sender email/name normalization has been fixed for Gmail's structured sender format, Slack uses a `Review draft` button that opens n8n's approval page, and both approval outcomes post completion messages back to Slack. Speed-to-Lead now uses an n8n-hosted form intake, remains incomplete, and is not active.

Next:
For Customer Support Email Triage: connect Gmail for `ygendigitalsolution@gmail.com`, connect Google Sheets, create/connect Slack `#support-approvals`, replace the booking FAQ placeholder, then test both approval branches.

Blockers:
Need Slack workspace/channel and Gmail/Google Sheets/Slack credentials before live testing Customer Support Email Triage. Speed-to-Lead still needs final booking link before live testing.

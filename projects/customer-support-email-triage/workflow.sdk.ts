import { workflow, node, trigger, sticky, newCredential, ifElse, languageModel, outputParser, expr } from '@n8n/workflow-sdk';

const spreadsheetId = '1xv0jJwURuHpYdlEoWvvS1aKvpgqI2kccRm2H-g0V4EU';
const spreadsheetName = 'YGEN Support Triage Knowledge Base';

const logSchema = [
  { id: 'received_at', displayName: 'received_at', required: false, defaultMatch: false, display: true, type: 'string', canBeUsedToMatch: true },
  { id: 'customer_email', displayName: 'customer_email', required: false, defaultMatch: false, display: true, type: 'string', canBeUsedToMatch: true },
  { id: 'subject', displayName: 'subject', required: false, defaultMatch: false, display: true, type: 'string', canBeUsedToMatch: true },
  { id: 'intent', displayName: 'intent', required: false, defaultMatch: false, display: true, type: 'string', canBeUsedToMatch: true },
  { id: 'confidence', displayName: 'confidence', required: false, defaultMatch: false, display: true, type: 'number', canBeUsedToMatch: true },
  { id: 'faq_match', displayName: 'faq_match', required: false, defaultMatch: false, display: true, type: 'string', canBeUsedToMatch: true },
  { id: 'draft_status', displayName: 'draft_status', required: false, defaultMatch: false, display: true, type: 'string', canBeUsedToMatch: true },
  { id: 'approved_by', displayName: 'approved_by', required: false, defaultMatch: false, display: true, type: 'string', canBeUsedToMatch: true },
  { id: 'sent_at', displayName: 'sent_at', required: false, defaultMatch: false, display: true, type: 'string', canBeUsedToMatch: true },
  { id: 'gmail_message_id', displayName: 'gmail_message_id', required: false, defaultMatch: false, display: true, type: 'string', canBeUsedToMatch: true },
  { id: 'notes', displayName: 'notes', required: false, defaultMatch: false, display: true, type: 'string', canBeUsedToMatch: true },
];

const gmailTrigger = trigger({
  type: 'n8n-nodes-base.gmailTrigger',
  version: 1.4,
  config: {
    name: 'Watch Support Gmail Inbox',
    position: [200, 300],
    parameters: {
      authentication: 'oAuth2',
      event: 'messageReceived',
      simple: false,
      maxResults: 5,
      pollTimes: { item: [{ mode: 'everyMinute' }] },
      filters: {
        includeSpamTrash: false,
        includeDrafts: false,
        readStatus: 'unread',
        q: 'to:ygendigitalsolution@gmail.com newer_than:2d -from:ygendigitalsolution@gmail.com',
      },
    },
    credentials: { gmailOAuth2: newCredential('YGEN Gmail') },
  },
  output: [{ id: 'msg_123', threadId: 'thread_123', from: 'Customer <customer@example.com>', to: 'ygendigitalsolution@gmail.com', subject: 'I need help with my website form', text: 'The contact form on my site is not sending leads.', snippet: 'The contact form on my site is not sending leads.' }],
});

const normalizeEmail = node({
  type: 'n8n-nodes-base.set',
  version: 3.5,
  config: {
    name: 'Normalize Email',
    position: [460, 300],
    parameters: {
      mode: 'manual',
      includeOtherFields: false,
      assignments: {
        assignments: [
          { id: 'message-id', name: 'message_id', value: expr('{{ $json.id }}'), type: 'string' },
          { id: 'thread-id', name: 'thread_id', value: expr('{{ $json.threadId }}'), type: 'string' },
          { id: 'customer-email', name: 'customer_email', value: expr('{{ $json.from?.value?.[0]?.address ?? (($json.from?.text || $json.headers?.from || "").match(/<([^>]+)>/)?.[1] ?? ($json.from?.text || $json.headers?.from || "").replace(/^From:\\s*/i, "").trim()) }}'), type: 'string' },
          { id: 'customer-name', name: 'customer_name', value: expr('{{ $json.from?.value?.[0]?.name || ($json.from?.text || $json.headers?.from || "").replace(/^From:\\s*/i, "").replace(/<.*>/, "").replace(/^"|"$/g, "").trim() || "Customer" }}'), type: 'string' },
          { id: 'subject', name: 'subject', value: expr('{{ $json.subject || ($json.headers?.subject || "").replace(/^Subject:\\s*/i, "") || "Support request" }}'), type: 'string' },
          { id: 'email-text', name: 'email_text', value: expr('{{ $json.text || $json.snippet || $json.textAsHtml || "" }}'), type: 'string' },
          { id: 'received-at', name: 'received_at', value: expr('{{ $now.toISO() }}'), type: 'string' },
        ],
      },
    },
  },
  output: [{ message_id: 'msg_123', thread_id: 'thread_123', customer_email: 'customer@example.com', customer_name: 'Customer', subject: 'I need help with my website form', email_text: 'The contact form on my site is not sending leads.', received_at: '2026-08-25T00:00:00.000Z' }],
});

const readFaq = node({
  type: 'n8n-nodes-base.googleSheets',
  version: 4.7,
  config: {
    name: 'Read FAQ Knowledge Base',
    position: [720, 300],
    parameters: {
      resource: 'sheet',
      operation: 'read',
      authentication: 'oAuth2',
      documentId: { __rl: true, mode: 'id', value: spreadsheetId, cachedResultName: spreadsheetName },
      sheetName: { __rl: true, mode: 'name', value: 'FAQ' },
      options: {
        dataLocationOnSheet: { values: { rangeDefinition: 'detectAutomatically', readRowsUntil: 'lastRowInSheet' } },
        returnAllMatches: 'returnAllMatches',
      },
    },
    credentials: { googleSheetsOAuth2Api: newCredential('YGEN Google Sheets') },
  },
  output: [{ category: 'Website or Technical Support', customer_question: 'My website form, page, or automation is not working.', approved_answer: 'Thanks for reporting this. Please send the page URL, a screenshot if available, the steps that caused the issue, and the time it happened. We will review the setup and confirm the next action.', escalation_note: 'Escalate if the issue affects payments, lead capture, site availability, or a production workflow.' }],
});

const prepareAiContext = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: {
    name: 'Prepare AI Context',
    position: [980, 300],
    parameters: {
      mode: 'runOnceForAllItems',
      language: 'javaScript',
      jsCode: 'const email = $("Normalize Email").first().json;\nconst rows = $input.all().map((item) => item.json);\nconst faqContext = rows.map((row, index) => `${index + 1}. Category: ${row.category || "Other"}\nQuestion: ${row.customer_question || ""}\nApproved answer: ${row.approved_answer || ""}\nEscalation note: ${row.escalation_note || ""}`).join("\n\n");\nreturn [{ json: { ...email, faq_context: faqContext } }];',
    },
  },
  output: [{ message_id: 'msg_123', thread_id: 'thread_123', customer_email: 'customer@example.com', customer_name: 'Customer', subject: 'I need help with my website form', email_text: 'The contact form on my site is not sending leads.', received_at: '2026-08-25T00:00:00.000Z', faq_context: '1. Category: Website or Technical Support\nQuestion: My website form, page, or automation is not working.\nApproved answer: Thanks for reporting this...' }],
});

const openAiModel = languageModel({
  type: '@n8n/n8n-nodes-langchain.lmChatOpenAi',
  version: 1.3,
  config: {
    name: 'OpenAI Drafting Model',
    position: [1240, 520],
    parameters: {
      model: { __rl: true, mode: 'id', value: 'gpt-5-mini', cachedResultName: 'gpt-5-mini' },
      responsesApiEnabled: true,
      options: { temperature: 0.2, reasoningEffort: 'low', maxTokens: 1200 },
    },
    credentials: { openAiApi: newCredential('OpenAI') },
  },
});

const structuredParser = outputParser({
  type: '@n8n/n8n-nodes-langchain.outputParserStructured',
  version: 1.3,
  config: {
    name: 'Support Draft Schema',
    position: [1460, 520],
    parameters: {
      schemaType: 'fromJson',
      jsonSchemaExample: '{ "intent": "Other", "confidence": 0.4, "faq_match": "The customer request does not match the known FAQ.", "draft_subject": "Re: Support request", "draft_body": "Hi there,\\n\\nThanks for reaching out. We want to make sure we answer this accurately, so we are forwarding your message to the right person on the team. We will follow up as soon as possible.\\n\\nBest regards,\\nYGEN Digital Solution\\nygendigitalsolution@gmail.com\\n\\nThis response was drafted with AI assistance and reviewed before sending.", "needs_escalation": false, "risk_flags": ["non-customer or unmatched request"], "reasoning": "The email does not match the approved support FAQ categories, so it is classified as Other." }',
    },
  },
});

const draftReply = node({
  type: '@n8n/n8n-nodes-langchain.agent',
  version: 3.1,
  config: {
    name: 'Draft Support Reply with AI',
    position: [1260, 300],
    parameters: {
      promptType: 'define',
      hasOutputParser: true,
      text: expr('Customer name: {{ $json.customer_name }}\nCustomer email: {{ $json.customer_email }}\nSubject: {{ $json.subject }}\nMessage:\n{{ $json.email_text }}\n\nApproved FAQ knowledge base:\n{{ $json.faq_context }}'),
      options: {
        systemMessage: 'You are the YGEN Digital Solution support triage assistant. Classify the email intent, choose the most relevant FAQ row, and draft a concise support reply. Use only the approved FAQ content for factual claims. Do not invent prices, policies, timelines, refund approval, or links.\n\nThe intent field must be exactly one of these labels and nothing else: Sales Inquiry, Billing / Payment, Website or Technical Support, Project Status, Booking / Consultation, Refund or Cancellation, Other.\n\nIf the email is a notification, newsletter, system alert, Google/Slack/GitHub/Cloud service message, shared-file notice, receipt, marketing email, or anything that is not a direct customer request for YGEN Digital Solution, set intent to Other, confidence to 0.4 or lower, faq_match to "The customer request does not match the known FAQ.", and do not treat the subject as the intent.\n\nPersonalize the greeting: start with "Hi [customer_name]," when the provided customer name looks like a real person\'s or company name; if the name is missing, empty, generic, or looks like an email address, start with "Hi there,". Keep the reply concise and helpful. End every draft exactly with this footer:\n\nBest regards,\nYGEN Digital Solution\nygendigitalsolution@gmail.com\n\nThis response was drafted with AI assistance and reviewed before sending.\n\nIf the FAQ says to escalate, set needs_escalation to true and mention the risk in risk_flags.',
        maxIterations: 3,
        returnIntermediateSteps: false,
        enableStreaming: false,
      },
    },
    subnodes: { model: openAiModel, outputParser: structuredParser },
  },
  output: [{ output: { intent: 'Website or Technical Support', confidence: 0.87, faq_match: 'My website form, page, or automation is not working.', draft_subject: 'Re: I need help with my website form', draft_body: 'Hi Customer,\n\nThanks for reporting this. Please send the page URL, a screenshot if available, the steps that caused the issue, and the time it happened. We will review the setup and confirm the next action.\n\nBest,\nYGEN Digital Solution', needs_escalation: false, risk_flags: ['none'], reasoning: 'The request matches the website or technical support FAQ.' } }],
});

const slackApproval = node({
  type: 'n8n-nodes-base.slack',
  version: 2.7,
  config: {
    name: 'Ask Slack for Approval',
    position: [1520, 300],
    parameters: {
      resource: 'message',
      operation: 'sendAndWait',
      authentication: 'oAuth2',
      select: 'channel',
      channelId: { __rl: true, mode: 'name', value: 'support-approvals', cachedResultName: 'support-approvals' },
      message: expr('*New support reply needs review*\n_Run ID: {{ $execution.id }} | Click **Review draft** to open the n8n approval page._\n\n*From:* {{ $("Prepare AI Context").item.json.customer_email || "Unknown sender" }}\n*Subject:* {{ $("Prepare AI Context").item.json.subject }}\n*Intent:* {{ ["Sales Inquiry", "Billing / Payment", "Website or Technical Support", "Project Status", "Booking / Consultation", "Refund or Cancellation", "Other"].includes($json.output.intent) ? $json.output.intent : "Other" }}\n*Confidence:* {{ Math.round(($json.output.confidence || 0) * 100) }}%\n*FAQ match:* {{ $json.output.faq_match }}\n*Escalation needed:* {{ $json.output.needs_escalation ? "Yes" : "No" }}\n\n*Customer message preview:*\n{{ (($("Prepare AI Context").item.json.email_text || "").slice(0, 600)) }}{{ (($("Prepare AI Context").item.json.email_text || "").length > 600) ? "\\n...[trimmed for Slack]" : "" }}\n\n*Suggested reply preview:*\n{{ (($json.output.draft_body || "").slice(0, 900)) }}{{ (($json.output.draft_body || "").length > 900) ? "\\n...[trimmed for Slack; full draft is used by Gmail]" : "" }}'),
      responseType: 'approval',
      approvalOptions: { values: { approvalType: 'double', approveLabel: 'Approve & Send', buttonApprovalStyle: 'primary', disapproveLabel: 'Edit Draft', buttonDisapprovalStyle: 'secondary' } },
      options: {
        limitWaitTime: { values: { limitType: 'afterTimeInterval', resumeAmount: 2, resumeUnit: 'hours' } },
        appendAttribution: false,
        messageButtonLabel: 'Review draft',
        responseFormTitle: 'Review support reply',
        responseFormDescription: 'Approve to send automatically, or choose Edit Draft to create a Gmail draft for manual editing.',
        responseFormButtonLabel: 'Submit decision',
      },
    },
    credentials: { slackOAuth2Api: newCredential('Slack') },
  },
  output: [{ data: { approved: true, respondedAt: '2026-08-25T00:00:00.000Z' } }],
});

const approvedGate = ifElse({
  version: 2.3,
  config: {
    name: 'Approved in Slack?',
    position: [1760, 300],
    parameters: {
      conditions: {
        options: { caseSensitive: true, leftValue: '', typeValidation: 'strict', version: 2 },
        conditions: [{ id: 'approved-check', leftValue: expr('{{ $json.data?.approved ?? $json.approved }}'), operator: { type: 'boolean', operation: 'true', singleValue: true }, rightValue: true }],
        combinator: 'and',
      },
    },
  },
});

const sendGmailReply = node({
  type: 'n8n-nodes-base.gmail',
  version: 2.2,
  config: {
    name: 'Reply to Customer in Gmail',
    position: [2020, 200],
    parameters: {
      resource: 'message',
      operation: 'reply',
      authentication: 'oAuth2',
      messageId: expr('{{ $("Normalize Email").item.json.message_id }}'),
      emailType: 'text',
      message: expr('{{ $("Draft Support Reply with AI").item.json.output.draft_body }}'),
      options: { appendAttribution: false, replyToSenderOnly: true },
    },
    credentials: { gmailOAuth2: newCredential('YGEN Gmail') },
  },
  output: [{ id: 'reply_123', threadId: 'thread_123', labelIds: ['SENT'] }],
});

const createGmailDraft = node({
  type: 'n8n-nodes-base.gmail',
  version: 2.2,
  config: {
    name: 'Create Gmail Draft for Editing',
    position: [2020, 420],
    parameters: {
      resource: 'draft',
      operation: 'create',
      authentication: 'oAuth2',
      subject: expr('{{ $("Draft Support Reply with AI").item.json.output.draft_subject }}'),
      emailType: 'text',
      message: expr('{{ $("Draft Support Reply with AI").item.json.output.draft_body }}'),
      options: { sendTo: expr('{{ $("Prepare AI Context").item.json.customer_email }}'), threadId: expr('{{ $("Prepare AI Context").item.json.thread_id }}') },
    },
    credentials: { gmailOAuth2: newCredential('YGEN Gmail') },
  },
  output: [{ id: 'draft_123', message: { id: 'draft_message_123', threadId: 'thread_123', labelIds: ['DRAFT'] } }],
});

const logSent = node({
  type: 'n8n-nodes-base.googleSheets',
  version: 4.7,
  config: {
    name: 'Log Sent Reply',
    position: [2280, 200],
    parameters: {
      resource: 'sheet',
      operation: 'append',
      authentication: 'oAuth2',
      documentId: { __rl: true, mode: 'id', value: spreadsheetId, cachedResultName: spreadsheetName },
      sheetName: { __rl: true, mode: 'name', value: 'Triage Log' },
      columns: {
        mappingMode: 'defineBelow',
        value: {
          received_at: expr('{{ $("Prepare AI Context").item.json.received_at }}'),
          customer_email: expr('{{ $("Prepare AI Context").item.json.customer_email }}'),
          subject: expr('{{ $("Prepare AI Context").item.json.subject }}'),
          intent: expr('{{ ["Sales Inquiry", "Billing / Payment", "Website or Technical Support", "Project Status", "Booking / Consultation", "Refund or Cancellation", "Other"].includes($("Draft Support Reply with AI").item.json.output.intent) ? $("Draft Support Reply with AI").item.json.output.intent : "Other" }}'),
          confidence: expr('{{ $("Draft Support Reply with AI").item.json.output.confidence }}'),
          faq_match: expr('{{ $("Draft Support Reply with AI").item.json.output.faq_match }}'),
          draft_status: 'sent',
          approved_by: 'Slack approval',
          sent_at: expr('{{ $now.toISO() }}'),
          gmail_message_id: expr('{{ $("Normalize Email").item.json.message_id }}'),
          notes: 'Approved through the n8n approval page opened from Slack and sent automatically.',
        },
        schema: logSchema,
      },
      options: { cellFormat: 'USER_ENTERED', locationDefine: { values: { headerRow: 1 } } },
    },
    credentials: { googleSheetsOAuth2Api: newCredential('YGEN Google Sheets') },
  },
  output: [{ received_at: '2026-08-25T00:00:00.000Z', customer_email: 'customer@example.com', draft_status: 'sent' }],
});

const logDraft = node({
  type: 'n8n-nodes-base.googleSheets',
  version: 4.7,
  config: {
    name: 'Log Draft Needs Editing',
    position: [2280, 420],
    parameters: {
      resource: 'sheet',
      operation: 'append',
      authentication: 'oAuth2',
      documentId: { __rl: true, mode: 'id', value: spreadsheetId, cachedResultName: spreadsheetName },
      sheetName: { __rl: true, mode: 'name', value: 'Triage Log' },
      columns: {
        mappingMode: 'defineBelow',
        value: {
          received_at: expr('{{ $("Prepare AI Context").item.json.received_at }}'),
          customer_email: expr('{{ $("Prepare AI Context").item.json.customer_email }}'),
          subject: expr('{{ $("Prepare AI Context").item.json.subject }}'),
          intent: expr('{{ ["Sales Inquiry", "Billing / Payment", "Website or Technical Support", "Project Status", "Booking / Consultation", "Refund or Cancellation", "Other"].includes($("Draft Support Reply with AI").item.json.output.intent) ? $("Draft Support Reply with AI").item.json.output.intent : "Other" }}'),
          confidence: expr('{{ $("Draft Support Reply with AI").item.json.output.confidence }}'),
          faq_match: expr('{{ $("Draft Support Reply with AI").item.json.output.faq_match }}'),
          draft_status: 'draft_created_for_editing',
          approved_by: '',
          sent_at: '',
          gmail_message_id: expr('{{ $("Normalize Email").item.json.message_id }}'),
          notes: 'Edit Draft selected through the n8n approval page opened from Slack. Gmail draft created for manual review.',
        },
        schema: logSchema,
      },
      options: { cellFormat: 'USER_ENTERED', locationDefine: { values: { headerRow: 1 } } },
    },
    credentials: { googleSheetsOAuth2Api: newCredential('YGEN Google Sheets') },
  },
  output: [{ received_at: '2026-08-25T00:00:00.000Z', customer_email: 'customer@example.com', draft_status: 'draft_created_for_editing' }],
});

const notifySlackReplySent = node({
  type: 'n8n-nodes-base.slack',
  version: 2.7,
  config: {
    name: 'Notify Slack Reply Sent',
    position: [2540, 200],
    parameters: {
      resource: 'message',
      operation: 'post',
      authentication: 'oAuth2',
      select: 'channel',
      channelId: { __rl: true, mode: 'name', value: 'support-approvals', cachedResultName: 'support-approvals' },
      messageType: 'text',
      text: expr('*Support reply sent*\n_Run ID: {{ $execution.id }}_\n\n*To:* {{ $("Prepare AI Context").item.json.customer_email }}\n*Subject:* {{ $("Prepare AI Context").item.json.subject }}\n*Intent:* {{ ["Sales Inquiry", "Billing / Payment", "Website or Technical Support", "Project Status", "Booking / Consultation", "Refund or Cancellation", "Other"].includes($("Draft Support Reply with AI").item.json.output.intent) ? $("Draft Support Reply with AI").item.json.output.intent : "Other" }}\n*Status:* Gmail reply sent and logged.'),
      otherOptions: { includeLinkToWorkflow: false, mrkdwn: true, unfurl_links: false, unfurl_media: false },
    },
    credentials: { slackOAuth2Api: newCredential('Slack') },
  },
  output: [{ ok: true }],
});

const notifySlackDraftCreated = node({
  type: 'n8n-nodes-base.slack',
  version: 2.7,
  config: {
    name: 'Notify Slack Draft Created',
    position: [2540, 420],
    parameters: {
      resource: 'message',
      operation: 'post',
      authentication: 'oAuth2',
      select: 'channel',
      channelId: { __rl: true, mode: 'name', value: 'support-approvals', cachedResultName: 'support-approvals' },
      messageType: 'text',
      text: expr('*Support draft created for editing*\n_Run ID: {{ $execution.id }}_\n\n*To:* {{ $("Prepare AI Context").item.json.customer_email }}\n*Subject:* {{ $("Prepare AI Context").item.json.subject }}\n*Intent:* {{ ["Sales Inquiry", "Billing / Payment", "Website or Technical Support", "Project Status", "Booking / Consultation", "Refund or Cancellation", "Other"].includes($("Draft Support Reply with AI").item.json.output.intent) ? $("Draft Support Reply with AI").item.json.output.intent : "Other" }}\n*Status:* Gmail draft created and logged for manual editing.'),
      otherOptions: { includeLinkToWorkflow: false, mrkdwn: true, unfurl_links: false, unfurl_media: false },
    },
    credentials: { slackOAuth2Api: newCredential('Slack') },
  },
  output: [{ ok: true }],
});

const overviewNote = sticky('## YGEN Support Triage Assistant\n\nGmail watches the dedicated support inbox, OpenAI classifies and drafts from the approved FAQ sheet, Slack posts a Review draft button, then n8n shows the approval page before Gmail sends or creates a draft.\n\nConnect credentials before activation: YGEN Gmail, YGEN Google Sheets, OpenAI, and Slack.', [gmailTrigger, normalizeEmail, readFaq, prepareAiContext, draftReply, slackApproval], { color: 4 });
const safetyNote = sticky('## Human approval guardrail\n\nApprove & Send replies automatically in Gmail. Edit Draft creates a Gmail draft instead, so a person can revise before sending. Slack opens the n8n approval page using the built-in send-and-wait flow. Refunds, unclear project status, production outages, and low-confidence matches should be reviewed carefully.', [slackApproval, approvedGate, sendGmailReply, createGmailDraft], { color: 5 });
const setupNote = sticky('## Setup checklist\n\n1. Connect Gmail for ygendigitalsolution@gmail.com.\n2. Connect the Google Sheet named YGEN Support Triage Knowledge Base.\n3. Create Slack workspace/channel support-approvals and connect Slack.\n4. Confirm OpenAI model access.\n5. Send test emails before publishing.', [logSent, logDraft, notifySlackReplySent, notifySlackDraftCreated], { color: 6 });

export default workflow('customer-support-email-triage', 'YGEN Support Email Triage with Approval')
  .add(gmailTrigger)
  .to(normalizeEmail)
  .to(readFaq)
  .to(prepareAiContext)
  .to(draftReply)
  .to(slackApproval)
  .to(approvedGate.onTrue(sendGmailReply.to(logSent.to(notifySlackReplySent))).onFalse(createGmailDraft.to(logDraft.to(notifySlackDraftCreated))))
  .add(overviewNote)
  .add(safetyNote)
  .add(setupNote);

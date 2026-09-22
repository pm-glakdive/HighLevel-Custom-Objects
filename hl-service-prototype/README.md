# HighLevel service inbox prototype

An end-to-end service-management case study demo. This is a React + TypeScript app with mock data and browser-local persistence.

## Run locally

```bash
cd hl-service-prototype
npm install
npm run dev
```

Open the local URL printed by Vite (normally `http://127.0.0.1:5173/`).

## Demo path

1. Continue as Priya · Service Agent.
2. Open Ravi Kumar's unread WhatsApp conversation.
3. Review his contact details and the related Case `SC-103 · Lobby AC leaking`.
4. Inspect SC-103, then return to the conversation.
5. Choose **Create new Case**. Select `AC-002 · Conference-room AC`, `AMC-104`, an owner, and a priority.
6. Choose **Create Case** to save `SC-104`, then inspect its linked records and applied 24-hour resolution target.
7. **Start work** and create `TASK-201` for Sanjay Rao with a due time.
8. Open **Services booking** and book an on-site visit. Copy its separate `BOOK-501` ID into the Case's manual booking reference field.
9. Move SC-104 to **Waiting** with reason **Waiting for appointment**.
10. Open Sanjay's Task, record the repair and cooling verification, and complete it.
11. Resolve the Case with a code and summary. Open `AC-002` to see SC-104 in its service history.
12. Open Ravi's conversation through his Contact, send a manual WhatsApp repair update mentioning SC-104, return through Ravi's Related Cases, and close SC-104.

Related Cases are surfaced by Ravi's contact ID. The conversation has no selected Case, and the prototype does not represent native Conversation-to-Case binding in HighLevel. The saved Case stores record IDs for the requester, Asset, Agreement, and owner, plus a snapshot of the Agreement's resolution target at creation. The Task stores the Case ID. The Services booking is a separate record; its ID appears on the Case only after the agent enters it. Sending the customer message is also a manual action from Ravi's conversation.

## Code map

- `src/data.ts`: typed mock records and Case draft factory.
- `src/App.tsx`: inbox, draft, and persisted workflow actions.
- `src/WorkflowViews.tsx`: Case, Services booking, and technician Task views.
- `src/storage.ts`: versioned `localStorage` persistence, migration from the previous demo state, and reset.
- `src/styles.css`: desktop layout and responsive styles.

Created Cases, Tasks, bookings, activity, outbound messages, and the current saved Case view survive refresh. **Reset demo** clears the local state and returns to login. This prototype has no backend or live HighLevel integration. It does not include broader scheduling, dispatch, escalation, or reporting features.

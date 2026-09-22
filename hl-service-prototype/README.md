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
5. Choose **Create new Case**. Select `AC-002 · Conference-room AC`, `AMC-104`, Arun Mehta as owner, and a priority.
6. Choose **Create Case** to save `SC-104`, then use **View in Cases** to inspect its linked records and applied 24-hour resolution target as Arun · Service Manager.
7. On the Open Case, create `TASK-201` for Sanjay Rao with an internal deadline. This moves the Case to **In progress**; the deadline is not a confirmed appointment.
8. Open Sanjay's Task. He may coordinate site access with Ravi, then records the repair and cooling verification and completes the Task.
9. As Arun, review the completed Task and work note, then resolve the Case with a code and summary. Open `AC-002` to see SC-104 in its service history.
10. Open Ravi's conversation through his Contact and send a WhatsApp repair update mentioning SC-104. Return through Ravi's Related Cases, explicitly record that the customer was updated, then close SC-104.

Related Cases are surfaced by Ravi's contact ID. The conversation has no selected Case, and the prototype does not represent native Conversation-to-Case binding in HighLevel. The saved Case stores record IDs for the requester, Asset, Agreement, and owner, plus a snapshot of the Agreement's resolution target at creation. The Task stores the Case ID. There is no Services booking step or booking prerequisite. Sending the customer message is a manual action from Ravi's conversation.

## Code map

- `src/data.ts`: typed mock records and Case draft factory.
- `src/App.tsx`: inbox, draft, and persisted workflow actions.
- `src/WorkflowViews.tsx`: Case and technician Task views.
- `src/storage.ts`: versioned `localStorage` persistence, migration from the previous demo state, and reset.
- `src/styles.css`: desktop layout and responsive styles.

Created Cases, Tasks, activity, outbound messages, and the current saved Case view survive refresh. Existing local booking data is retained for compatibility but is not part of the guided workflow. **Reset demo** clears the local state and returns to login. This prototype has no backend or live HighLevel integration. It does not include broader scheduling, dispatch, escalation, or reporting features.

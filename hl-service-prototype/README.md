# HighLevel service inbox prototype

First two working slices of a service-management case study. This is a React + TypeScript demo with mock data and browser-local persistence.

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
7. Return to Ravi's conversation to see both `SC-103` and `SC-104` in Related Cases.

Related Cases are surfaced by Ravi's contact ID. The conversation has no selected Case, and the prototype does not represent native Conversation-to-Case binding in HighLevel. The saved Case stores record IDs for the requester, Asset, Agreement, and owner, plus a snapshot of the Agreement's resolution target at creation.

## Code map

- `src/data.ts`: typed mock Contacts, Conversations, Messages, Assets, Agreements, Users, Service Cases, and Case draft factory.
- `src/App.tsx`: the journey and its interface states.
- `src/storage.ts`: versioned `localStorage` persistence and demo reset.
- `src/styles.css`: desktop layout and responsive styles.

The draft is editable in local React state. Created Cases and the current saved Case view survive refresh. **Reset demo** clears this local state and returns to login. Tasks, bookings, escalation, and resolution are reserved for later slices.

# HighLevel service inbox prototype

First working slice of a service-management case study. This is a React + TypeScript demo with in-memory mock data.

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
5. Choose **Create new Case** and review the unsaved draft.

The related Case is surfaced by Ravi's contact ID. It is only a candidate; the conversation has no selected Case, and the prototype does not represent native Conversation-to-Case binding in HighLevel.

## Code map

- `src/data.ts`: typed mock Contacts, Conversations, Messages, Service Cases, and Case draft factory.
- `src/App.tsx`: the journey and its interface states.
- `src/styles.css`: desktop layout and responsive styles.

The draft is in local React state and can be edited. Creation, submission, persistence, Asset and Agreement selection, Tasks, and resolution are reserved for later slices.

# HighLevel service prototype

An interview demo built with React, TypeScript, mock records, and browser-local storage. It is a proposed product experience, with no live HighLevel integration.

## Try it

Open the [hosted prototype](https://pm-glakdive.github.io/HighLevel-Custom-Objects/) and click **Continue as Priya**.

1. Open Ravi Kumar's WhatsApp conversation. Ravi works for **Riverside Business Centre**; **Northstar Service** is the HVAC provider.
2. Inspect his existing Lobby AC Case, `SC-103`. His new message concerns the Conference Room AC, so create a new Case, `SC-104`, linked to the correct Asset (`AC-002`) and Agreement (`AMC-104`).
3. The new Case becomes the **Active Case** in the chat. Expand its Asset and Agreement details, then send Ravi a Case creation acknowledgement. The agreement supplies a 24-hour **resolution** target, not a promised appointment time.
4. Open `SC-104` in **Service Cases**. Arun, the service manager, creates `TASK-201` for Sanjay, the technician. This moves the Case to **In progress**.
5. Open **Tasks**. Sanjay's Task links back to `SC-104`; complete the Task with a work note. Arun can then resolve the Case and communicate the outcome to Ravi.
6. Open **Contacts → Ravi Kumar** to see both associated Cases and the proposed activity summary. The Case and Task records remain separate, linked records.

The Active Case selection and combined Contact activity summary illustrate the proposed operational experience. The prototype does not claim that HighLevel currently provides automatic Conversation-to-Case binding or this cross-record timeline. There is no required service booking flow. **Reset demo** clears browser-local progress.

## Run locally

```bash
cd hl-service-prototype
npm ci
npm run dev
```

Open the local URL shown by Vite. For a production build, run `npm run build`.

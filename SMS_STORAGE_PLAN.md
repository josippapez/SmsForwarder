# Default SMS Handler Storage Plan

## Goals

- Persist every inbound SMS/MMS the moment it arrives from the native receivers so the app can display a complete inbox when acting as the default SMS handler.
- Keep forwarded-message history untouched (still records forwarding attempts) while introducing a dedicated store for raw carrier messages.
- Capture enough metadata (box, type, timestamp, SIM info, rule linkage) to support later UI features such as conversations and quick replies.

## Database Changes

1. **New `inbound_messages` table**
   - Columns: `id`, `type` (`'sms' | 'mms'`), `box` (`'inbox' | 'sent' | 'draft'`), `address`, `body`, `timestamp`, `subscription_id`, `sim_slot_index`, `is_read`, `message_ref`, `raw_pdu`, `metadata` (JSON string for carrier extras), `created_at`.
   - Index on `timestamp DESC`, `box`, and `address` for fast inbox queries.
2. **Migration**
   - `initDatabase` creates the table if missing (idempotent) so no destructive migration is required yet.
   - Future migrations can promote existing forwarded history rows into this table if we decide to merge views.

## Native ➜ JS Bridge

- Extend `SmsReceiver` payload to include subscription ID, SIM slot, PDU (Base64), and messageRef so we can store richer metadata.
- `MmsWapPushReceiver` will emit a companion event (e.g. `onMmsReceived`) that surfaces the raw WAP push bytes; JS can parse/store later.
- `ExpoSmsListener.addListener` remains the central entry point; types updated to reflect the richer payload.

## JS Handling

1. Update `useSmsForwarder.handleSmsReceived` to:
   - Persist the inbound payload via a new `insertInboundMessage` helper before any forwarding logic executes.
   - Deduplicate by `messageRef + timestamp` to avoid double inserts when both SMS_RECEIVED and SMS_DELIVER fire.
2. Add a lightweight `SmsStorageService` wrapper (or just new exports in `utils/database.ts`) exposing:
   - `insertInboundMessage`
   - `getInboundMessages({ box, limit, offset })`
   - `deleteInboundConversation(address)` (future)
3. Hook later UI (Inbox/Threads) to these helpers—out of scope for this step but unblocked once data is flowing.

## Future Enhancements

- Parse MMS PDUs into attachments and store them in the `metadata` JSON blob.
- Sync sent messages using `DefaultSmsHeadlessSendService` callbacks so `box='sent'` rows remain accurate.
- Add `threads` table keyed by normalized address for conversation view performance.

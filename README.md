# NeuralBase SDKs

Official client libraries for the NeuralBase memory and ingest API.

This repo is focused only on the public SDK surface. It packages the same
memory, connector ingest, batch ingest, and status APIs exposed by
`https://api.neuralbase.cloud`.

## Packages

- JavaScript: `@neuralbase-org/js`
- Python: `neuralbase`

## What the SDKs cover

- `store()` for direct memory writes
- `ingest()` for typed connector payloads
- `ingestBatch()` / `ingest_batch()` for bulk ingest
- `ingestConversation()` / `ingest_conversation()`
- `ingestSupportTicket()` / `ingest_support_ticket()`
- `ingestDocument()` / `ingest_document()`
- `getMemoryStatus()` / `get_memory_status()`

All write helpers support `Idempotency-Key` so callers can retry safely without
duplicating queued memory jobs.

## Quickstart

JavaScript:

```ts
import { NeuralBaseClient } from "@neuralbase-org/js";

const nb = new NeuralBaseClient({ apiKey: "nb_live_..." });

const result = await nb.store(
  {
    userId: "user_123",
    content: "User prefers concise release notes.",
  },
  { idempotencyKey: "pref-user-123-v1" },
);

console.log(result.memoryId);
```

Python:

```python
from neuralbase import NeuralBaseClient

nb = NeuralBaseClient(api_key="nb_live_...")

result = nb.store(
    user_id="user_123",
    content="User prefers concise release notes.",
    idempotency_key="pref-user-123-v1",
)

print(result["memoryId"])
```

## Package layout

- `sdks/javascript` - npm package source for `@neuralbase-org/js`
- `sdks/python` - PyPI package source for `neuralbase`
- `.github/workflows` - release and publish automation

## Docs

- JavaScript docs: `https://neuralbase.cloud/docs/sdk/javascript`
- Python docs: `https://neuralbase.cloud/docs/sdk/python`
- Ingest API docs: `https://neuralbase.cloud/docs/ingest`

## Release flow

1. Bump both SDK versions
2. Run `.github/workflows/release-sdks.yml`
3. The workflow tags, publishes, and creates GitHub Releases for both packages

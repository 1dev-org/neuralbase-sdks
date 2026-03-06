# `neuralbase`

Official Python client for the NeuralBase API.

## Install

```bash
pip install neuralbase
```

## Use

```python
from neuralbase import NeuralBaseClient

nb = NeuralBaseClient(api_key="nb_live_...")

queued = nb.ingest_support_ticket(
    user_id="user_123",
    subject="Invoice mismatch",
    comments=[
        {"author": "user", "content": "The amount is wrong."},
        {"author": "agent", "content": "Billing is reviewing it."},
    ],
    source="zendesk",
    external_id="ticket_431",
    idempotency_key="ticket-431-v1",
)

print(queued["memoryId"])
```

## Included methods

- `store()`
- `ingest()`
- `ingest_batch()`
- `ingest_conversation()`
- `ingest_support_ticket()`
- `ingest_document()`
- `get_memory_status()`

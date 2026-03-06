from __future__ import annotations

import json
from dataclasses import dataclass
from typing import Any
from urllib.error import HTTPError
from urllib.request import Request, urlopen

__all__ = ["NeuralBaseClient", "NeuralBaseError"]
__version__ = "0.1.0"


@dataclass
class NeuralBaseError(Exception):
    message: str
    status: int
    body: Any

    def __str__(self) -> str:
        return self.message


class NeuralBaseClient:
    def __init__(
        self,
        api_key: str,
        base_url: str = "https://api.neuralbase.cloud",
        timeout: int = 30,
    ) -> None:
        self.api_key = api_key
        self.base_url = base_url.rstrip("/")
        self.timeout = timeout

    def store(
        self,
        user_id: str,
        content: str,
        metadata: dict[str, Any] | None = None,
        webhook_url: str | None = None,
        idempotency_key: str | None = None,
    ) -> dict[str, Any]:
        body: dict[str, Any] = {
            "userId": user_id,
            "content": content,
        }
        if metadata is not None:
            body["metadata"] = metadata
        if webhook_url is not None:
            body["webhookUrl"] = webhook_url
        return self._request("POST", "/v1/memories", body, idempotency_key)

    def ingest(
        self,
        payload: dict[str, Any],
        idempotency_key: str | None = None,
    ) -> dict[str, Any]:
        return self._request("POST", "/v1/ingest", payload, idempotency_key)

    def ingest_batch(
        self,
        items: list[dict[str, Any]],
        idempotency_key: str | None = None,
    ) -> dict[str, Any]:
        return self._request(
            "POST",
            "/v1/ingest/batch",
            {"items": items},
            idempotency_key,
        )

    def ingest_conversation(
        self,
        user_id: str,
        messages: list[dict[str, Any]],
        *,
        title: str | None = None,
        summary: str | None = None,
        participants: list[str] | None = None,
        tags: list[str] | None = None,
        source: str | None = None,
        external_id: str | None = None,
        metadata: dict[str, Any] | None = None,
        webhook_url: str | None = None,
        idempotency_key: str | None = None,
    ) -> dict[str, Any]:
        body: dict[str, Any] = {
            "userId": user_id,
            "data": {
                "messages": messages,
            },
        }
        self._put_optional(body, "source", source)
        self._put_optional(body, "externalId", external_id)
        self._put_optional(body, "metadata", metadata)
        self._put_optional(body, "webhookUrl", webhook_url)
        self._put_optional(body["data"], "title", title)
        self._put_optional(body["data"], "summary", summary)
        self._put_optional(body["data"], "participants", participants)
        self._put_optional(body["data"], "tags", tags)
        return self._request("POST", "/v1/ingest/chat", body, idempotency_key)

    def ingest_support_ticket(
        self,
        user_id: str,
        subject: str,
        comments: list[dict[str, Any]],
        *,
        description: str | None = None,
        status: str | None = None,
        priority: str | None = None,
        source: str | None = None,
        external_id: str | None = None,
        metadata: dict[str, Any] | None = None,
        webhook_url: str | None = None,
        idempotency_key: str | None = None,
    ) -> dict[str, Any]:
        body: dict[str, Any] = {
            "userId": user_id,
            "data": {
                "subject": subject,
                "comments": comments,
            },
        }
        self._put_optional(body, "source", source)
        self._put_optional(body, "externalId", external_id)
        self._put_optional(body, "metadata", metadata)
        self._put_optional(body, "webhookUrl", webhook_url)
        self._put_optional(body["data"], "description", description)
        self._put_optional(body["data"], "status", status)
        self._put_optional(body["data"], "priority", priority)
        return self._request("POST", "/v1/ingest/support", body, idempotency_key)

    def ingest_document(
        self,
        user_id: str,
        text: str,
        *,
        title: str | None = None,
        source_url: str | None = None,
        mime_type: str | None = None,
        page_count: int | None = None,
        source: str | None = None,
        external_id: str | None = None,
        metadata: dict[str, Any] | None = None,
        webhook_url: str | None = None,
        idempotency_key: str | None = None,
    ) -> dict[str, Any]:
        body: dict[str, Any] = {
            "userId": user_id,
            "data": {
                "text": text,
            },
        }
        self._put_optional(body, "source", source)
        self._put_optional(body, "externalId", external_id)
        self._put_optional(body, "metadata", metadata)
        self._put_optional(body, "webhookUrl", webhook_url)
        self._put_optional(body["data"], "title", title)
        self._put_optional(body["data"], "sourceUrl", source_url)
        self._put_optional(body["data"], "mimeType", mime_type)
        self._put_optional(body["data"], "pageCount", page_count)
        return self._request("POST", "/v1/ingest/document", body, idempotency_key)

    def get_memory_status(self, memory_id: str) -> dict[str, Any]:
        return self._request("GET", f"/v1/memories/{memory_id}/status")

    def _request(
        self,
        method: str,
        path: str,
        body: dict[str, Any] | None = None,
        idempotency_key: str | None = None,
    ) -> dict[str, Any]:
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Accept": "application/json",
        }
        payload: bytes | None = None

        if idempotency_key:
            headers["Idempotency-Key"] = idempotency_key

        if body is not None:
            payload = json.dumps(body).encode("utf-8")
            headers["Content-Type"] = "application/json"

        request = Request(
            url=f"{self.base_url}{path}",
            method=method,
            headers=headers,
            data=payload,
        )

        try:
            with urlopen(request, timeout=self.timeout) as response:
                text = response.read().decode("utf-8")
                return self._parse_json(text)
        except HTTPError as exc:
            text = exc.read().decode("utf-8")
            parsed = self._parse_json(text)
            message = (
                parsed.get("error")
                if isinstance(parsed, dict) and "error" in parsed
                else exc.reason
            )
            raise NeuralBaseError(str(message), exc.code, parsed) from exc

    def _parse_json(self, text: str) -> dict[str, Any]:
        parsed = json.loads(text) if text else {}
        if isinstance(parsed, dict):
            return parsed
        return {"data": parsed}

    @staticmethod
    def _put_optional(target: dict[str, Any], key: str, value: Any) -> None:
        if value is not None:
            target[key] = value

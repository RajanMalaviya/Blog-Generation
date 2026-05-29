class N8NServiceError(Exception):
    """Raised when n8n returns a non-2xx response."""


class N8NTimeoutError(Exception):
    """Raised when n8n does not respond within the configured timeout."""

"""
ARKVOID Python SDK
Monitor and govern your AI agents with cryptographic audit trails.
Domain: arkvoid.cherazen.com

Install: pip install requests
Usage: from arkvoid import ArkvoidClient, trace
"""

import hashlib
import json
import time
import functools
from typing import Optional, Dict, Any, Literal
from datetime import datetime, timezone

try:
    import requests
    HAS_REQUESTS = True
except ImportError:
    HAS_REQUESTS = False
    import urllib.request
    import urllib.error

RiskLevel = Literal["low", "medium", "high", "critical"]

class ArkvoidClient:
    """
    ARKVOID governance client.
    
    Usage:
        client = ArkvoidClient(api_key="ARK_your_key_here")
        client.trace(
            agent="my-agent",
            action="document_analysis",
            risk_level="low"
        )
    """
    
    BASE_URL = "https://arkvoid.cherazen.com/api/v1"
    
    def __init__(self, api_key: str, agent: Optional[str] = None, 
                 silent: bool = False):
        """
        Args:
            api_key: Your ARKVOID API key (starts with ARK_)
            agent: Default agent slug (can override per trace)
            silent: If True, suppress all errors (fire-and-forget mode)
        """
        if not api_key.startswith("ARK_"):
            raise ValueError("API key must start with ARK_. Get yours at arkvoid.cherazen.com")
        
        self.api_key = api_key
        self.default_agent = agent
        self.silent = silent
        self._session = requests.Session() if HAS_REQUESTS else None
        if self._session:
            self._session.headers.update({
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json",
                "User-Agent": "arkvoid-python/1.0.0"
            })
    
    def trace(
        self,
        action: str,
        risk_level: RiskLevel = "low",
        agent: Optional[str] = None,
        risk_score: Optional[int] = None,
        metadata: Optional[Dict[str, Any]] = None,
        input_data: Optional[Any] = None,  # will be hashed
        output_data: Optional[Any] = None,  # will be hashed
        duration_ms: Optional[int] = None,
    ) -> Optional[Dict]:
        """
        Send a trace to ARKVOID.
        
        Args:
            action: What your agent did (e.g., "document_analysis", "data_access")
            risk_level: "low" | "medium" | "high" | "critical"
            agent: Agent slug (uses default if not provided)
            risk_score: Numeric 0-100 (optional, auto-calculated if not provided)
            metadata: Any extra data to attach (model, tokens, etc.)
            input_data: Input to your function (will be SHA-256 hashed, not stored raw)
            output_data: Output of your function (will be SHA-256 hashed)
            duration_ms: How long the action took
            
        Returns:
            {"trace_id": "ark_xxx", "status": "verified", "hash": "sha256:..."} or None
        """
        agent_slug = agent or self.default_agent
        if not agent_slug:
            if self.silent:
                return None
            raise ValueError("Agent slug required. Pass agent= or set default in ArkvoidClient(agent=...)")
        
        payload = {
            "agent_slug": agent_slug,
            "action": action,
            "risk_level": risk_level,
        }
        
        if risk_score is not None:
            payload["risk_score"] = max(0, min(100, risk_score))
        
        if metadata:
            payload["metadata"] = metadata
            
        if duration_ms is not None:
            payload["duration_ms"] = duration_ms
            
        if input_data is not None:
            payload["input_hash"] = hashlib.sha256(
                json.dumps(input_data, sort_keys=True, default=str).encode()
            ).hexdigest()
            
        if output_data is not None:
            payload["output_hash"] = hashlib.sha256(
                json.dumps(output_data, sort_keys=True, default=str).encode()
            ).hexdigest()
        
        return self._send(payload)
    
    def _send(self, payload: Dict) -> Optional[Dict]:
        try:
            if HAS_REQUESTS:
                response = self._session.post(
                    f"{self.BASE_URL}/traces",
                    json=payload,
                    timeout=10
                )
                response.raise_for_status()
                return response.json()
            else:
                # Fallback using urllib
                data = json.dumps(payload).encode()
                req = urllib.request.Request(
                    f"{self.BASE_URL}/traces",
                    data=data,
                    headers={
                        "Authorization": f"Bearer {self.api_key}",
                        "Content-Type": "application/json",
                    }
                )
                with urllib.request.urlopen(req, timeout=10) as resp:
                    return json.loads(resp.read())
        except Exception as e:
            if not self.silent:
                print(f"[ARKVOID] Warning: Failed to send trace: {e}")
            return None


def trace(
    agent: str,
    action: Optional[str] = None,
    risk_level: RiskLevel = "low",
    api_key: Optional[str] = None,
    silent: bool = True,
):
    """
    Decorator for automatic function tracing.
    
    Usage:
        import os
        from arkvoid import trace
        
        @trace(agent="my-agent", api_key=os.environ["ARKVOID_API_KEY"])
        def analyze_document(doc_text):
            # Your existing code — unchanged
            return analysis
    """
    import os
    key = api_key or os.environ.get("ARKVOID_API_KEY")
    if not key and not silent:
        raise ValueError("Set ARKVOID_API_KEY env variable or pass api_key=")
    
    client = ArkvoidClient(api_key=key or "ARK_missing", agent=agent, silent=silent)
    
    def decorator(func):
        @functools.wraps(func)
        def wrapper(*args, **kwargs):
            start = time.time()
            result = None
            error = None
            try:
                result = func(*args, **kwargs)
                return result
            except Exception as e:
                error = e
                raise
            finally:
                duration = int((time.time() - start) * 1000)
                func_action = action or func.__name__.replace("_", " ")
                client.trace(
                    action=func_action,
                    risk_level=risk_level,
                    duration_ms=duration,
                    metadata={
                        "function": func.__name__,
                        "error": str(error) if error else None,
                        "success": error is None,
                    }
                )
        return wrapper
    return decorator

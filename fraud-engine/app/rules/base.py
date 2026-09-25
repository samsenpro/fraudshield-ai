from abc import ABC, abstractmethod

from pydantic import BaseModel


class RuleSignal(BaseModel):
    code: str
    score: float
    severity: str


class Rule(ABC):
    """A single deterministic fraud-detection rule (section 17)."""

    @abstractmethod
    def evaluate(self, features: dict[str, float]) -> RuleSignal | None:
        """Return a signal if the rule fires, otherwise None."""

from datetime import datetime

from pydantic import BaseModel, Field


class CustomerHistory(BaseModel):
    """Behavioral baseline for a customer, computed by Java from past transactions."""

    transaction_count: int = Field(default=0, alias="transactionCount")
    average_amount: float = Field(default=0.0, alias="averageAmount")
    usual_countries: list[str] = Field(default_factory=list, alias="usualCountries")
    usual_cities: list[str] = Field(default_factory=list, alias="usualCities")
    usual_devices: list[str] = Field(default_factory=list, alias="usualDevices")
    usual_ip_addresses: list[str] = Field(default_factory=list, alias="usualIpAddresses")
    merchant_frequency: dict[str, int] = Field(default_factory=dict, alias="merchantFrequency")
    transactions_last_hour: int = Field(default=0, alias="transactionsLastHour")
    transactions_last_day: int = Field(default=0, alias="transactionsLastDay")
    last_transaction_at: datetime | None = Field(default=None, alias="lastTransactionAt")

    model_config = {"populate_by_name": True}


class TransactionInput(BaseModel):
    transaction_id: str = Field(alias="transactionId")
    account_id: str = Field(alias="accountId")
    customer_id: str = Field(alias="customerId")
    amount: float
    currency: str
    merchant: str
    country: str
    city: str | None = None
    ip_address: str | None = Field(default=None, alias="ipAddress")
    device_id: str | None = Field(default=None, alias="deviceId")
    timestamp: datetime
    history: CustomerHistory = Field(default_factory=CustomerHistory)

    model_config = {"populate_by_name": True}


class RiskSignalOut(BaseModel):
    code: str
    severity: str
    score: float


class AnalyzeResponse(BaseModel):
    transaction_id: str = Field(alias="transactionId")
    risk_score: float = Field(alias="riskScore")
    risk_level: str = Field(alias="riskLevel")
    decision: str
    confidence: float
    signals: list[RiskSignalOut]
    reasons: list[str]
    model_version: str = Field(alias="modelVersion")
    processing_time_ms: int = Field(alias="processingTimeMs")

    model_config = {"populate_by_name": True}

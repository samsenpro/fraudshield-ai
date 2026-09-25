from app.models.schemas import TransactionInput

FEATURE_NAMES = [
    "transaction_amount",
    "transaction_frequency",
    "average_amount",
    "amount_deviation",
    "time_since_last_transaction",
    "country_change",
    "city_change",
    "device_change",
    "ip_change",
    "merchant_frequency",
    "transactions_last_hour",
    "transactions_last_day",
]

NO_PRIOR_TRANSACTION_MINUTES = 10_080.0  # one week — sentinel for "no history yet"


class FeatureExtractor:
    """Turns a raw transaction + customer history into the numeric feature vector
    consumed by the rules and ML/anomaly models. Kept independent from FastAPI so
    it can be reused identically at training time and at inference time."""

    def extract(self, transaction: TransactionInput) -> dict[str, float]:
        history = transaction.history

        return {
            "transaction_amount": transaction.amount,
            "transaction_frequency": float(history.transactions_last_day),
            "average_amount": history.average_amount,
            "amount_deviation": self._amount_deviation(transaction.amount, history.average_amount),
            "time_since_last_transaction": self._minutes_since_last(transaction),
            "country_change": self._changed(transaction.country, history.usual_countries),
            "city_change": self._changed(transaction.city, history.usual_cities),
            "device_change": self._changed(transaction.device_id, history.usual_devices),
            "ip_change": self._changed(transaction.ip_address, history.usual_ip_addresses),
            "merchant_frequency": float(history.merchant_frequency.get(transaction.merchant, 0)),
            "transactions_last_hour": float(history.transactions_last_hour),
            "transactions_last_day": float(history.transactions_last_day),
        }

    @staticmethod
    def _amount_deviation(amount: float, average_amount: float) -> float:
        if average_amount <= 0:
            return 0.0
        return abs(amount - average_amount) / average_amount

    @staticmethod
    def _minutes_since_last(transaction: TransactionInput) -> float:
        last = transaction.history.last_transaction_at
        if last is None:
            return NO_PRIOR_TRANSACTION_MINUTES
        delta = transaction.timestamp - last
        return max(delta.total_seconds() / 60.0, 0.0)

    @staticmethod
    def _changed(value: str | None, usual_values: list[str]) -> float:
        if not usual_values:
            return 0.0
        return 0.0 if value in usual_values else 1.0

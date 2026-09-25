from datetime import datetime, timedelta

from app.features.extractor import FeatureExtractor
from app.models.schemas import CustomerHistory, TransactionInput


def _transaction(**overrides) -> TransactionInput:
    defaults = dict(
        transactionId="tx-1",
        accountId="acc-1",
        customerId="cust-1",
        amount=100.0,
        currency="COP",
        merchant="SuperMarket",
        country="CO",
        city="Bogota",
        ipAddress="10.0.0.1",
        deviceId="device-1",
        timestamp=datetime(2026, 1, 1, 12, 0, 0),
    )
    defaults.update(overrides)
    return TransactionInput(**defaults)


def test_cold_start_has_no_signal_from_missing_history():
    transaction = _transaction(history=CustomerHistory())

    features = FeatureExtractor().extract(transaction)

    assert features["average_amount"] == 0.0
    assert features["amount_deviation"] == 0.0
    assert features["country_change"] == 0.0
    assert features["device_change"] == 0.0
    assert features["time_since_last_transaction"] == 10_080.0


def test_detects_deviation_from_known_baseline():
    history = CustomerHistory(
        transactionCount=10,
        averageAmount=50.0,
        usualCountries=["CO"],
        usualCities=["Bogota"],
        usualDevices=["device-1"],
        usualIpAddresses=["10.0.0.1"],
        merchantFrequency={"SuperMarket": 5},
        transactionsLastHour=0,
        transactionsLastDay=2,
        lastTransactionAt=datetime(2026, 1, 1, 10, 0, 0),
    )
    transaction = _transaction(
        amount=500.0, country="MX", city="Mexico City", deviceId="device-2", ipAddress="1.2.3.4", history=history
    )

    features = FeatureExtractor().extract(transaction)

    assert features["amount_deviation"] == 9.0  # (500-50)/50
    assert features["country_change"] == 1.0
    assert features["city_change"] == 1.0
    assert features["device_change"] == 1.0
    assert features["ip_change"] == 1.0
    assert features["time_since_last_transaction"] == 120.0
    assert features["merchant_frequency"] == 5.0


def test_matching_usual_values_do_not_count_as_a_change():
    history = CustomerHistory(usualCountries=["CO"], usualCities=["Bogota"], usualDevices=["device-1"])
    transaction = _transaction(history=history)

    features = FeatureExtractor().extract(transaction)

    assert features["country_change"] == 0.0
    assert features["city_change"] == 0.0
    assert features["device_change"] == 0.0

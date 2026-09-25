from app.core.config import Settings
from app.rules.location_change_rule import LocationChangeRule
from app.rules.new_device_rule import NewDeviceRule
from app.rules.rule_engine import RuleEngine
from app.rules.unusual_amount_rule import UnusualAmountRule
from app.rules.velocity_rule import VelocityRule

BASE_FEATURES = {
    "transaction_amount": 100.0,
    "transaction_frequency": 0.0,
    "average_amount": 100.0,
    "amount_deviation": 0.0,
    "time_since_last_transaction": 1000.0,
    "country_change": 0.0,
    "city_change": 0.0,
    "device_change": 0.0,
    "ip_change": 0.0,
    "merchant_frequency": 0.0,
    "transactions_last_hour": 0.0,
    "transactions_last_day": 0.0,
}


def _settings(**overrides) -> Settings:
    return Settings(**overrides)


def test_unusual_amount_rule_fires_above_hard_limit():
    rule = UnusualAmountRule(_settings(max_transaction_amount=5000))
    features = {**BASE_FEATURES, "transaction_amount": 6000.0}

    signal = rule.evaluate(features)

    assert signal is not None
    assert signal.code == "UNUSUAL_AMOUNT"
    assert signal.severity == "HIGH"


def test_unusual_amount_rule_fires_on_deviation():
    rule = UnusualAmountRule(_settings())
    features = {**BASE_FEATURES, "amount_deviation": 5.0}

    signal = rule.evaluate(features)

    assert signal is not None
    assert signal.severity == "MEDIUM"


def test_unusual_amount_rule_silent_when_normal():
    rule = UnusualAmountRule(_settings())

    assert rule.evaluate(BASE_FEATURES) is None


def test_velocity_rule_fires_above_threshold():
    rule = VelocityRule(_settings(max_transactions_per_hour=3))
    features = {**BASE_FEATURES, "transactions_last_hour": 4.0}

    signal = rule.evaluate(features)

    assert signal is not None
    assert signal.code == "HIGH_VELOCITY"


def test_new_device_rule_fires_on_device_change():
    signal = NewDeviceRule().evaluate({**BASE_FEATURES, "device_change": 1.0})

    assert signal is not None
    assert signal.code == "NEW_DEVICE"


def test_location_change_rule_fires_on_country_change():
    signal = LocationChangeRule().evaluate({**BASE_FEATURES, "country_change": 1.0})

    assert signal is not None
    assert signal.severity == "MEDIUM"


def test_rule_engine_aggregates_and_caps_at_one():
    engine = RuleEngine(_settings(max_transaction_amount=50))
    features = {
        **BASE_FEATURES,
        "transaction_amount": 100.0,
        "country_change": 1.0,
        "device_change": 1.0,
        "transactions_last_hour": 999.0,
    }

    signals = engine.evaluate(features)
    score = RuleEngine.aggregate_score(signals)

    assert len(signals) == 4  # unusual amount, velocity, new device, location
    assert score == 1.0

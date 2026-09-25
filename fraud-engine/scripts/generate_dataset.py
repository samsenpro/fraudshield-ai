"""Generates the synthetic NORMAL/SUSPICIOUS/FRAUD transaction dataset (see docs/project-brief.md #14).

Simulates customers with a stable behavioral baseline, then generates a
chronological stream of transactions per customer. Each transaction's
CustomerHistory is computed from that customer's *prior* transactions only —
exactly what Java would provide at request time — and run through the real
FeatureExtractor, so the training data is produced by the same code path used
at inference time (no train/serve skew).
"""

import csv
import random
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from pathlib import Path

from app.core.config import get_settings
from app.features.extractor import FEATURE_NAMES, FeatureExtractor
from app.models.schemas import CustomerHistory, TransactionInput

COUNTRIES = ["CO", "MX", "AR", "PE", "CL", "US", "BR"]
CITIES_BY_COUNTRY = {
    "CO": ["Bogota", "Medellin", "Santa Marta"],
    "MX": ["Mexico City", "Guadalajara"],
    "AR": ["Buenos Aires", "Cordoba"],
    "PE": ["Lima"],
    "CL": ["Santiago"],
    "US": ["Miami", "New York"],
    "BR": ["Sao Paulo"],
}
MERCHANTS = ["SuperMarket", "ElectroStore", "CoffeeShop", "OnlineRetailer", "GasStation", "Pharmacy"]

RNG = random.Random(42)


@dataclass
class CustomerProfile:
    customer_id: str
    home_country: str
    home_city: str
    devices: list[str]
    ip_addresses: list[str]
    avg_amount: float
    preferred_merchants: list[str]
    transactions: list[dict] = field(default_factory=list)


def _new_profile(index: int) -> CustomerProfile:
    country = RNG.choice(COUNTRIES)
    return CustomerProfile(
        customer_id=f"customer-{index}",
        home_country=country,
        home_city=RNG.choice(CITIES_BY_COUNTRY[country]),
        devices=[f"device-{index}-a"],
        ip_addresses=[f"10.0.{index}.1"],
        avg_amount=round(RNG.uniform(20, 300), 2),
        preferred_merchants=RNG.sample(MERCHANTS, k=3),
    )


def _history_from(profile: CustomerProfile, now: datetime) -> CustomerHistory:
    past = profile.transactions
    if not past:
        return CustomerHistory()

    amounts = [t["amount"] for t in past]
    merchant_frequency: dict[str, int] = {}
    for t in past:
        merchant_frequency[t["merchant"]] = merchant_frequency.get(t["merchant"], 0) + 1

    last_hour = sum(1 for t in past if now - t["timestamp"] <= timedelta(hours=1))
    last_day = sum(1 for t in past if now - t["timestamp"] <= timedelta(days=1))

    return CustomerHistory(
        transactionCount=len(past),
        averageAmount=sum(amounts) / len(amounts),
        usualCountries=list({t["country"] for t in past}),
        usualCities=list({t["city"] for t in past}),
        usualDevices=list({t["device_id"] for t in past}),
        usualIpAddresses=list({t["ip_address"] for t in past}),
        merchantFrequency=merchant_frequency,
        transactionsLastHour=last_hour,
        transactionsLastDay=last_day,
        lastTransactionAt=past[-1]["timestamp"],
    )


def _generate_transaction(profile: CustomerProfile, now: datetime) -> tuple[dict, str]:
    scenario = RNG.choices(["NORMAL", "SUSPICIOUS", "FRAUD"], weights=[70, 20, 10])[0]

    country = profile.home_country
    city = profile.home_city
    device = RNG.choice(profile.devices)
    ip_address = RNG.choice(profile.ip_addresses)
    merchant = RNG.choice(profile.preferred_merchants)
    amount = round(max(1.0, RNG.gauss(profile.avg_amount, profile.avg_amount * 0.15)), 2)

    if scenario == "SUSPICIOUS":
        pick = RNG.choice(["amount", "device", "merchant"])
        if pick == "amount":
            amount = round(profile.avg_amount * RNG.uniform(2.5, 4.0), 2)
        elif pick == "device":
            device = f"{device}-new"
        else:
            merchant = RNG.choice([m for m in MERCHANTS if m not in profile.preferred_merchants] or MERCHANTS)

    elif scenario == "FRAUD":
        amount = round(profile.avg_amount * RNG.uniform(4.0, 10.0), 2)
        other_countries = [c for c in COUNTRIES if c != profile.home_country]
        country = RNG.choice(other_countries)
        city = RNG.choice(CITIES_BY_COUNTRY[country])
        device = f"unknown-device-{RNG.randint(1000, 9999)}"
        ip_address = f"203.0.113.{RNG.randint(1, 254)}"

    transaction = {
        "amount": amount,
        "currency": "COP",
        "merchant": merchant,
        "country": country,
        "city": city,
        "device_id": device,
        "ip_address": ip_address,
        "timestamp": now,
    }
    return transaction, scenario


def generate_dataset(customer_count: int = 60, transactions_per_customer: int = 25) -> list[dict]:
    extractor = FeatureExtractor()
    profiles = [_new_profile(i) for i in range(customer_count)]
    rows: list[dict] = []

    for profile in profiles:
        now = datetime(2026, 1, 1) + timedelta(days=RNG.randint(0, 30))

        for _ in range(transactions_per_customer):
            gap_hours = RNG.uniform(0.1, 48)
            now = now + timedelta(hours=gap_hours)

            history = _history_from(profile, now)
            raw_transaction, scenario = _generate_transaction(profile, now)

            transaction_input = TransactionInput(
                transactionId="synthetic",
                accountId="synthetic",
                customerId=profile.customer_id,
                amount=raw_transaction["amount"],
                currency=raw_transaction["currency"],
                merchant=raw_transaction["merchant"],
                country=raw_transaction["country"],
                city=raw_transaction["city"],
                ipAddress=raw_transaction["ip_address"],
                deviceId=raw_transaction["device_id"],
                timestamp=raw_transaction["timestamp"],
                history=history,
            )

            features = extractor.extract(transaction_input)
            row = {name: features[name] for name in FEATURE_NAMES}
            row["label"] = scenario
            row["is_fraud"] = 1 if scenario == "FRAUD" else 0
            rows.append(row)

            profile.transactions.append(raw_transaction)

    return rows


def main() -> None:
    settings = get_settings()
    settings.data_dir.mkdir(parents=True, exist_ok=True)
    output_path: Path = settings.data_dir / "synthetic_transactions.csv"

    rows = generate_dataset()

    with output_path.open("w", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=[*FEATURE_NAMES, "label", "is_fraud"])
        writer.writeheader()
        writer.writerows(rows)

    fraud_count = sum(r["is_fraud"] for r in rows)
    print(f"Wrote {len(rows)} rows to {output_path} ({fraud_count} labeled FRAUD)")


if __name__ == "__main__":
    main()

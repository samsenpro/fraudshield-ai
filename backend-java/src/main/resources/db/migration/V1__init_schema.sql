CREATE TABLE organizations (
    id UUID PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL
);

CREATE TABLE users (
    id UUID PRIMARY KEY,
    organization_id UUID NOT NULL REFERENCES organizations (id),
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL,
    enabled BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL
);
CREATE INDEX idx_users_organization_id ON users (organization_id);

CREATE TABLE customers (
    id UUID PRIMARY KEY,
    organization_id UUID NOT NULL REFERENCES organizations (id),
    full_name VARCHAR(255) NOT NULL,
    document_id VARCHAR(100) NOT NULL,
    email VARCHAR(255),
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL
);
CREATE INDEX idx_customers_organization_id ON customers (organization_id);

CREATE TABLE accounts (
    id UUID PRIMARY KEY,
    organization_id UUID NOT NULL REFERENCES organizations (id),
    customer_id UUID NOT NULL REFERENCES customers (id),
    account_number VARCHAR(100) NOT NULL UNIQUE,
    currency VARCHAR(3) NOT NULL,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL
);
CREATE INDEX idx_accounts_organization_id ON accounts (organization_id);
CREATE INDEX idx_accounts_customer_id ON accounts (customer_id);

CREATE TABLE transactions (
    id UUID PRIMARY KEY,
    organization_id UUID NOT NULL REFERENCES organizations (id),
    account_id UUID NOT NULL REFERENCES accounts (id),
    amount NUMERIC(19, 4) NOT NULL,
    currency VARCHAR(3) NOT NULL,
    merchant VARCHAR(255) NOT NULL,
    country VARCHAR(2) NOT NULL,
    city VARCHAR(255),
    ip_address VARCHAR(45),
    device_id VARCHAR(255),
    occurred_at TIMESTAMP NOT NULL,
    status VARCHAR(20) NOT NULL,
    idempotency_key VARCHAR(255) UNIQUE,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL
);
CREATE INDEX idx_transactions_organization_id ON transactions (organization_id);
CREATE INDEX idx_transactions_account_id ON transactions (account_id);
CREATE INDEX idx_transactions_status ON transactions (status);
CREATE INDEX idx_transactions_occurred_at ON transactions (occurred_at);

CREATE TABLE model_versions (
    id UUID PRIMARY KEY,
    version VARCHAR(100) NOT NULL UNIQUE,
    model_type VARCHAR(100) NOT NULL,
    dataset_version VARCHAR(100) NOT NULL,
    trained_at TIMESTAMP NOT NULL,
    metrics TEXT,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL
);

CREATE TABLE risk_assessments (
    id UUID PRIMARY KEY,
    transaction_id UUID NOT NULL UNIQUE REFERENCES transactions (id),
    model_version_id UUID REFERENCES model_versions (id),
    risk_score DOUBLE PRECISION NOT NULL,
    risk_level VARCHAR(20) NOT NULL,
    decision VARCHAR(20) NOT NULL,
    confidence DOUBLE PRECISION NOT NULL,
    processing_time_ms BIGINT NOT NULL,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL
);

CREATE TABLE risk_signals (
    id UUID PRIMARY KEY,
    risk_assessment_id UUID NOT NULL REFERENCES risk_assessments (id),
    code VARCHAR(100) NOT NULL,
    severity VARCHAR(20) NOT NULL,
    score DOUBLE PRECISION,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL
);
CREATE INDEX idx_risk_signals_risk_assessment_id ON risk_signals (risk_assessment_id);

CREATE TABLE alerts (
    id UUID PRIMARY KEY,
    transaction_id UUID NOT NULL REFERENCES transactions (id),
    organization_id UUID NOT NULL REFERENCES organizations (id),
    severity VARCHAR(20) NOT NULL,
    status VARCHAR(20) NOT NULL,
    reason VARCHAR(500) NOT NULL,
    resolved_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL
);
CREATE INDEX idx_alerts_organization_id ON alerts (organization_id);
CREATE INDEX idx_alerts_transaction_id ON alerts (transaction_id);

CREATE TABLE fraud_cases (
    id UUID PRIMARY KEY,
    alert_id UUID REFERENCES alerts (id),
    transaction_id UUID NOT NULL REFERENCES transactions (id),
    organization_id UUID NOT NULL REFERENCES organizations (id),
    status VARCHAR(20) NOT NULL,
    assigned_reviewer_id UUID REFERENCES users (id),
    notes TEXT,
    decision VARCHAR(20),
    resolved_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL
);
CREATE INDEX idx_fraud_cases_organization_id ON fraud_cases (organization_id);

CREATE TABLE audit_logs (
    id UUID PRIMARY KEY,
    user_id UUID REFERENCES users (id),
    organization_id UUID REFERENCES organizations (id),
    action VARCHAR(40) NOT NULL,
    entity_type VARCHAR(100) NOT NULL,
    entity_id UUID,
    metadata TEXT,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL
);
CREATE INDEX idx_audit_logs_organization_id ON audit_logs (organization_id);

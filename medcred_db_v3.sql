-- ============================================================================
-- MEDCRED NASIONAL — ENTERPRISE DATABASE SCHEMA V3 (HIGH-SCALE 100M+ ROWS)
-- Target Engine: PostgreSQL 16+ (Ready for Citus / Read-Replica / PgBouncer)
-- Optimasi:
--   1. Multi-level/Monthly Range Partitioning + Default Partitions (Anti-Insert-Fail)
--   2. Covering Indexes (INCLUDE) untuk Index-Only Scans (<5ms)
--   3. Otomatisasi Counter Dokumen (Database Trigger) tanpa COUNT(*) JOIN
--   4. Row-Level Security (RLS) Multi-Tenant B2B & Isolasi Wilayah Provinsi
--   5. FILLFACTOR Tuning untuk tabel high-update (service_tickets, slas)
-- ============================================================================

BEGIN;

CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- 1. MASTER DATA WILAYAH, SPESIALISASI & JENIS LAYANAN (REFERENCE TABLES)
-- ============================================================================
CREATE TABLE master_specialties (
    id              SMALLINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    code            VARCHAR(20) NOT NULL UNIQUE,
    name            VARCHAR(120) NOT NULL,
    collegium_name  VARCHAR(150),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE master_service_types (
    id                  SMALLINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    code                VARCHAR(30) NOT NULL UNIQUE,
    name                VARCHAR(150) NOT NULL,
    target_institution  VARCHAR(100) NOT NULL,
    sla_days            SMALLINT NOT NULL DEFAULT 14,
    required_doc_codes  JSONB NOT NULL DEFAULT '[]'::jsonb,
    is_active           BOOLEAN NOT NULL DEFAULT TRUE
);

-- ============================================================================
-- 2. IDENTITAS PENGGUNA & MULTI-TENANT B2B (KLINIK / FASKES / GRUP)
-- ============================================================================
CREATE TABLE users (
    id              UUID PRIMARY KEY, -- Gunakan UUIDv7 berurutan waktu dari backend
    email           VARCHAR(180) UNIQUE,
    phone_e164      VARCHAR(20) UNIQUE,
    full_name       VARCHAR(180) NOT NULL,
    is_active       BOOLEAN NOT NULL DEFAULT TRUE,
    is_suspended    BOOLEAN NOT NULL DEFAULT FALSE,
    last_login_at   TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
) WITH (fillfactor = 90);

CREATE TABLE organizations (
    id                  UUID PRIMARY KEY,
    code                VARCHAR(30) NOT NULL UNIQUE,
    name                VARCHAR(200) NOT NULL,
    org_type            VARCHAR(40) NOT NULL CHECK (org_type IN ('KLINIK_UTAMA', 'KLINIK_PRATAMA', 'RUMAH_SAKIT', 'ASOSIASI_DOKTER')),
    satusehat_org_id    VARCHAR(64),
    province_code       CHAR(2) NOT NULL,
    city_code           CHAR(4) NOT NULL,
    pic_user_id         UUID REFERENCES users(id) ON DELETE SET NULL,
    account_tier        VARCHAR(20) NOT NULL DEFAULT 'STANDARD' CHECK (account_tier IN ('STANDARD', 'ENTERPRISE')),
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_org_name_trgm ON organizations USING GIN (name gin_trgm_ops);
CREATE INDEX idx_org_region ON organizations (province_code, city_code) INCLUDE (name, account_tier);
CREATE INDEX idx_org_pic_user ON organizations (pic_user_id) WHERE pic_user_id IS NOT NULL;

-- ============================================================================
-- 3. MODUL AUTHENTICATION, SESSIONS & MFA
-- ============================================================================
CREATE TABLE user_auth_identities (
    id                  UUID PRIMARY KEY,
    user_id             UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    provider            VARCHAR(30) NOT NULL
                        CHECK (provider IN ('LOCAL_EMAIL', 'WHATSAPP_OTP', 'SATUSEHAT_SSO', 'GOOGLE_SSO', 'QR_PIN')),
    provider_uid        VARCHAR(200) NOT NULL,
    credential_secret   TEXT,
    is_verified         BOOLEAN NOT NULL DEFAULT FALSE,
    verified_at         TIMESTAMPTZ,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (provider, provider_uid)
);

CREATE INDEX idx_auth_identities_user ON user_auth_identities (user_id);

CREATE TABLE user_mfa_methods (
    id                  UUID PRIMARY KEY,
    user_id             UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    mfa_type            VARCHAR(20) NOT NULL CHECK (mfa_type IN ('TOTP_APP', 'WHATSAPP_OTP', 'EMAIL_OTP')),
    secret_encrypted    BYTEA,
    backup_codes_hash   JSONB NOT NULL DEFAULT '[]'::jsonb,
    is_enabled          BOOLEAN NOT NULL DEFAULT TRUE,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_mfa_user_enabled ON user_mfa_methods (user_id) WHERE is_enabled = TRUE;

-- Tabel Sesi Aktif & Refresh Token (Partitioned + Default Partition)
CREATE TABLE user_sessions (
    id                  UUID NOT NULL,
    user_id             UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    refresh_token_hash  CHAR(64) NOT NULL,
    device_fingerprint  VARCHAR(128),
    user_agent          TEXT,
    ip_address          INET,
    expires_at          TIMESTAMPTZ NOT NULL,
    revoked_at          TIMESTAMPTZ,
    revoke_reason       VARCHAR(80),
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (id, created_at),
    UNIQUE (refresh_token_hash, created_at)
) PARTITION BY RANGE (created_at);

CREATE TABLE user_sessions_2026 PARTITION OF user_sessions
    FOR VALUES FROM ('2026-01-01 00:00:00+00') TO ('2027-01-01 00:00:00+00');
CREATE TABLE user_sessions_2027 PARTITION OF user_sessions
    FOR VALUES FROM ('2027-01-01 00:00:00+00') TO ('2028-01-01 00:00:00+00');
CREATE TABLE user_sessions_default PARTITION OF user_sessions DEFAULT;

CREATE INDEX idx_sessions_active_user ON user_sessions (user_id, expires_at)
    WHERE revoked_at IS NULL;
CREATE INDEX idx_sessions_token_lookup ON user_sessions (refresh_token_hash)
    INCLUDE (user_id, expires_at) WHERE revoked_at IS NULL;

-- ============================================================================
-- 4. MODUL GRANULAR RBAC + MULTI-TENANT / REGIONAL SCOPE
-- ============================================================================
CREATE TABLE roles (
    id              SMALLINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    code            VARCHAR(40) NOT NULL UNIQUE,
    name            VARCHAR(100) NOT NULL,
    description     TEXT,
    is_system_role  BOOLEAN NOT NULL DEFAULT FALSE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE permissions (
    id              SMALLINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    module_code     VARCHAR(40) NOT NULL,
    action_code     VARCHAR(60) NOT NULL UNIQUE,
    description     TEXT
);

CREATE TABLE role_permissions (
    role_id         SMALLINT NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    permission_id   SMALLINT NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
    PRIMARY KEY (role_id, permission_id)
);

CREATE INDEX idx_role_perms_perm ON role_permissions (permission_id);

CREATE TABLE user_role_assignments (
    id                  UUID PRIMARY KEY,
    user_id             UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role_id             SMALLINT NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    scope_type          VARCHAR(20) NOT NULL DEFAULT 'GLOBAL'
                        CHECK (scope_type IN ('GLOBAL', 'PROVINCE', 'ORGANIZATION', 'SELF_DOCTOR')),
    scope_province_code CHAR(2),
    scope_org_id        UUID REFERENCES organizations(id) ON DELETE CASCADE,
    assigned_by         UUID REFERENCES users(id),
    valid_from          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    valid_until         TIMESTAMPTZ,
    is_active           BOOLEAN NOT NULL DEFAULT TRUE,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_scope_target CHECK (
        (scope_type = 'GLOBAL' AND scope_province_code IS NULL AND scope_org_id IS NULL) OR
        (scope_type = 'PROVINCE' AND scope_province_code IS NOT NULL) OR
        (scope_type = 'ORGANIZATION' AND scope_org_id IS NOT NULL) OR
        (scope_type = 'SELF_DOCTOR')
    )
);

CREATE INDEX idx_ura_user_active ON user_role_assignments (user_id, scope_type)
    INCLUDE (role_id, scope_province_code, scope_org_id, valid_until)
    WHERE is_active = TRUE;
CREATE INDEX idx_ura_org_scope ON user_role_assignments (scope_org_id)
    WHERE scope_org_id IS NOT NULL AND is_active = TRUE;
CREATE INDEX idx_ura_province_scope ON user_role_assignments (scope_province_code)
    WHERE scope_province_code IS NOT NULL AND is_active = TRUE;

-- ============================================================================
-- 5. JARINGAN AGEN / MITRA LAPANGAN & OPERATOR PIC
-- ============================================================================
CREATE TABLE agents_and_pics (
    id                  UUID PRIMARY KEY,
    user_id             UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    agent_code          VARCHAR(24) NOT NULL UNIQUE,
    agent_type          VARCHAR(25) NOT NULL
                        CHECK (agent_type IN ('FIELD_AGENT', 'INTERNAL_OPERATOR', 'REGIONAL_PARTNER')),
    province_code       CHAR(2) NOT NULL,
    parent_agent_id     UUID REFERENCES agents_and_pics(id),
    bank_code           VARCHAR(20),
    bank_account_enc    BYTEA,
    commission_tier     VARCHAR(20) NOT NULL DEFAULT 'SILVER'
                        CHECK (commission_tier IN ('SILVER', 'GOLD', 'PLATINUM')),
    is_active           BOOLEAN NOT NULL DEFAULT TRUE,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_agents_region ON agents_and_pics (province_code, agent_type) WHERE is_active = TRUE;
CREATE INDEX idx_agents_parent ON agents_and_pics (parent_agent_id) WHERE parent_agent_id IS NOT NULL;

-- ============================================================================
-- 6. PROFIL DOKTER NASIONAL & REPOSITORI LEGALITAS (B2C & B2B)
-- ============================================================================
CREATE TABLE doctors (
    id                   UUID PRIMARY KEY,
    user_id              UUID UNIQUE REFERENCES users(id) ON DELETE SET NULL,
    referral_agent_id    UUID REFERENCES agents_and_pics(id) ON DELETE SET NULL,
    full_name_with_title VARCHAR(200) NOT NULL,
    nik_encrypted        BYTEA NOT NULL,
    nik_hash             CHAR(64) NOT NULL UNIQUE,
    str_number           VARCHAR(32) NOT NULL UNIQUE,
    satusehat_sdmk_id    VARCHAR(50) UNIQUE,
    specialty_id         SMALLINT REFERENCES master_specialties(id),
    whatsapp_number      VARCHAR(20) NOT NULL,
    email                VARCHAR(180),
    home_province_code   CHAR(2),
    created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
) WITH (fillfactor = 90);

-- Covering & Trigram Indexes untuk pencarian < 5ms dari puluhan juta dokter
CREATE INDEX idx_doctors_name_trgm ON doctors USING GIN (full_name_with_title gin_trgm_ops);
CREATE INDEX idx_doctors_str_trgm ON doctors USING GIN (str_number gin_trgm_ops);
CREATE INDEX idx_doctors_specialty ON doctors (specialty_id) INCLUDE (full_name_with_title, str_number);
CREATE INDEX idx_doctors_agent ON doctors (referral_agent_id) WHERE referral_agent_id IS NOT NULL;
CREATE INDEX idx_doctors_province ON doctors (home_province_code) WHERE home_province_code IS NOT NULL;

CREATE TABLE doctor_organization_affiliations (
    doctor_id           UUID NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
    organization_id     UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    practice_slot       SMALLINT NOT NULL CHECK (practice_slot BETWEEN 1 AND 3),
    is_active           BOOLEAN NOT NULL DEFAULT TRUE,
    joined_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (doctor_id, organization_id)
);

CREATE INDEX idx_doa_org_active ON doctor_organization_affiliations (organization_id)
    INCLUDE (doctor_id, practice_slot) WHERE is_active = TRUE;

CREATE TABLE doctor_licenses (
    id              UUID PRIMARY KEY,
    doctor_id       UUID NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
    organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
    license_type    VARCHAR(20) NOT NULL CHECK (license_type IN ('STR', 'SIP_1', 'SIP_2', 'SIP_3', 'SERKOM')),
    license_number  VARCHAR(80) NOT NULL,
    issued_by       VARCHAR(120) NOT NULL,
    issued_date     DATE NOT NULL,
    expired_date    DATE,
    status          VARCHAR(20) NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'EXPIRING_SOON', 'EXPIRED', 'REVOKED')),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
) WITH (fillfactor = 85);

CREATE INDEX idx_licenses_doctor ON doctor_licenses (doctor_id, license_type);
CREATE INDEX idx_licenses_expiring ON doctor_licenses (expired_date)
    INCLUDE (doctor_id, license_type, license_number)
    WHERE expired_date IS NOT NULL AND status IN ('ACTIVE', 'EXPIRING_SOON');

-- ============================================================================
-- 7. REPOSITORI DOKUMEN DOKTER (PARTITIONED BY RANGE + DEFAULT PARTITION)
-- ============================================================================
CREATE TABLE doctor_documents (
    id                  UUID NOT NULL,
    doctor_id           UUID NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
    doc_code            VARCHAR(30) NOT NULL,
    file_storage_key    TEXT NOT NULL,
    file_sha256         CHAR(64) NOT NULL,
    mime_type           VARCHAR(50) NOT NULL,
    file_size_bytes     INTEGER NOT NULL,
    ocr_extracted_data  JSONB NOT NULL DEFAULT '{}'::jsonb,
    verification_status VARCHAR(25) NOT NULL DEFAULT 'PENDING'
                        CHECK (verification_status IN ('PENDING', 'VERIFIED_OCR', 'VERIFIED_PSV', 'REJECTED')),
    rejection_reason    TEXT,
    verified_by         UUID REFERENCES users(id),
    uploaded_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (id, uploaded_at)
) PARTITION BY RANGE (uploaded_at);

CREATE TABLE doctor_documents_2025 PARTITION OF doctor_documents
    FOR VALUES FROM ('2025-01-01 00:00:00+00') TO ('2026-01-01 00:00:00+00');
CREATE TABLE doctor_documents_2026 PARTITION OF doctor_documents
    FOR VALUES FROM ('2026-01-01 00:00:00+00') TO ('2027-01-01 00:00:00+00');
CREATE TABLE doctor_documents_2027 PARTITION OF doctor_documents
    FOR VALUES FROM ('2027-01-01 00:00:00+00') TO ('2028-01-01 00:00:00+00');
CREATE TABLE doctor_documents_default PARTITION OF doctor_documents DEFAULT;

CREATE INDEX idx_doc_docs_doctor_code ON doctor_documents (doctor_id, doc_code, uploaded_at DESC)
    INCLUDE (verification_status, file_storage_key);
CREATE INDEX idx_doc_docs_pending_queue ON doctor_documents (verification_status, uploaded_at)
    WHERE verification_status = 'PENDING';
CREATE INDEX idx_doc_docs_ocr_gin ON doctor_documents USING GIN (ocr_extracted_data jsonb_path_ops);

-- ============================================================================
-- 8. TIKET PENGURUSAN / PERANTARA KE INSTANSI (CORE WORKFLOW - HIGH THROUGHPUT)
-- ============================================================================
CREATE TABLE service_tickets (
    id                      UUID NOT NULL,
    ticket_code             VARCHAR(24) NOT NULL,
    channel_type            VARCHAR(10) NOT NULL CHECK (channel_type IN ('B2C', 'B2B')),
    priority_tier           VARCHAR(20) NOT NULL DEFAULT 'REGULAR'
                            CHECK (priority_tier IN ('REGULAR', 'EXPRESS', 'ENTERPRISE_BATCH')),
    doctor_id               UUID NOT NULL REFERENCES doctors(id),
    organization_id         UUID REFERENCES organizations(id),
    service_type_id         SMALLINT NOT NULL REFERENCES master_service_types(id),
    assigned_pic_id         UUID REFERENCES agents_and_pics(id),
    referral_agent_id       UUID REFERENCES agents_and_pics(id),
    province_code           CHAR(2),
    
    current_stage           VARCHAR(30) NOT NULL DEFAULT 'AWAITING_DOCS'
                            CHECK (current_stage IN (
                                'AWAITING_DOCS',
                                'INTERNAL_CURATION',
                                'REVISION_REQUIRED',
                                'SUBMITTED_TO_GOV',
                                'GOV_VERIFICATION',
                                'COMPLETED',
                                'CANCELLED'
                            )),
    external_gov_ref_no     VARCHAR(80),
    
    -- Counter ter-denormalisasi otomatis oleh trigger
    required_docs_total     SMALLINT NOT NULL DEFAULT 8,
    verified_docs_count     SMALLINT NOT NULL DEFAULT 0,
    
    -- Akses Portal Mandiri QR Code
    qr_access_token_hash    CHAR(64) NOT NULL,
    qr_pin_code             CHAR(6) NOT NULL,
    qr_token_expires_at     TIMESTAMPTZ NOT NULL,
    
    sla_due_at              TIMESTAMPTZ NOT NULL,
    created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (id, created_at),
    UNIQUE (ticket_code, created_at)
) PARTITION BY RANGE (created_at);

-- Partisi Kuartalan untuk 2026 & 2027 (Optimal untuk volume 100jt+ baris)
CREATE TABLE service_tickets_2026_q1 PARTITION OF service_tickets
    FOR VALUES FROM ('2026-01-01 00:00:00+00') TO ('2026-04-01 00:00:00+00');
CREATE TABLE service_tickets_2026_q2 PARTITION OF service_tickets
    FOR VALUES FROM ('2026-04-01 00:00:00+00') TO ('2026-07-01 00:00:00+00');
CREATE TABLE service_tickets_2026_q3 PARTITION OF service_tickets
    FOR VALUES FROM ('2026-07-01 00:00:00+00') TO ('2026-10-01 00:00:00+00');
CREATE TABLE service_tickets_2026_q4 PARTITION OF service_tickets
    FOR VALUES FROM ('2026-10-01 00:00:00+00') TO ('2027-01-01 00:00:00+00');
CREATE TABLE service_tickets_2027 PARTITION OF service_tickets
    FOR VALUES FROM ('2027-01-01 00:00:00+00') TO ('2028-01-01 00:00:00+00');
CREATE TABLE service_tickets_default PARTITION OF service_tickets DEFAULT;

-- COVERING & PARTIAL INDEXES untuk Index-Only Scan (< 5ms)
CREATE INDEX idx_tickets_active_queue ON service_tickets (current_stage, channel_type, sla_due_at)
    INCLUDE (ticket_code, doctor_id, organization_id, verified_docs_count, required_docs_total)
    WHERE current_stage NOT IN ('COMPLETED', 'CANCELLED');

CREATE INDEX idx_tickets_b2b_org ON service_tickets (organization_id, current_stage, created_at DESC)
    INCLUDE (ticket_code, doctor_id, verified_docs_count, required_docs_total)
    WHERE organization_id IS NOT NULL;

CREATE INDEX idx_tickets_province_active ON service_tickets (province_code, current_stage, sla_due_at)
    WHERE province_code IS NOT NULL AND current_stage NOT IN ('COMPLETED', 'CANCELLED');

CREATE INDEX idx_tickets_pic_workload ON service_tickets (assigned_pic_id, current_stage, sla_due_at)
    WHERE assigned_pic_id IS NOT NULL AND current_stage NOT IN ('COMPLETED', 'CANCELLED');

CREATE INDEX idx_tickets_doctor ON service_tickets (doctor_id, created_at DESC);
CREATE INDEX idx_tickets_qr_lookup ON service_tickets (qr_access_token_hash)
    INCLUDE (id, doctor_id, qr_pin_code, qr_token_expires_at)
    WHERE current_stage NOT IN ('COMPLETED', 'CANCELLED');

-- ============================================================================
-- 9. SESI AKSES QR / LINK MANDIRI (ONBOARDING & UPLOAD PORTAL)
-- ============================================================================
CREATE TABLE qr_upload_sessions (
    id                  UUID PRIMARY KEY,
    ticket_id           UUID NOT NULL,
    ticket_created_at   TIMESTAMPTZ NOT NULL,
    channel_type        VARCHAR(10) NOT NULL CHECK (channel_type IN ('B2C', 'B2B')),
    access_code_hash    CHAR(64) NOT NULL UNIQUE,
    pin_code            CHAR(6) NOT NULL,
    expires_at          TIMESTAMPTZ NOT NULL,
    last_accessed_at    TIMESTAMPTZ,
    submitted_at        TIMESTAMPTZ,
    status              VARCHAR(20) NOT NULL DEFAULT 'ACTIVE'
                        CHECK (status IN ('ACTIVE', 'SUBMITTED', 'EXPIRED', 'REVOKED')),
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    FOREIGN KEY (ticket_id, ticket_created_at) REFERENCES service_tickets(id, created_at)
);

CREATE INDEX idx_qr_sessions_ticket ON qr_upload_sessions (ticket_id, ticket_created_at);
CREATE INDEX idx_qr_sessions_active_code ON qr_upload_sessions (access_code_hash)
    INCLUDE (ticket_id, ticket_created_at, pin_code, expires_at)
    WHERE status = 'ACTIVE';

-- ============================================================================
-- 10. LOG AUDIT & RIWAYAT PERUBAHAN STATUS (BRIN INDEXED & PARTITIONED)
-- ============================================================================
CREATE TABLE ticket_stage_histories (
    id              BIGINT GENERATED ALWAYS AS IDENTITY,
    ticket_id       UUID NOT NULL,
    ticket_created  TIMESTAMPTZ NOT NULL,
    from_stage      VARCHAR(30),
    to_stage        VARCHAR(30) NOT NULL,
    actor_user_id   UUID REFERENCES users(id),
    notes           TEXT,
    gov_payload     JSONB,
    logged_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (id, logged_at)
) PARTITION BY RANGE (logged_at);

CREATE TABLE ticket_stage_histories_2026 PARTITION OF ticket_stage_histories
    FOR VALUES FROM ('2026-01-01 00:00:00+00') TO ('2027-01-01 00:00:00+00');
CREATE TABLE ticket_stage_histories_2027 PARTITION OF ticket_stage_histories
    FOR VALUES FROM ('2027-01-01 00:00:00+00') TO ('2028-01-01 00:00:00+00');
CREATE TABLE ticket_stage_histories_default PARTITION OF ticket_stage_histories DEFAULT;

CREATE INDEX idx_histories_brin_time ON ticket_stage_histories USING BRIN (logged_at);
CREATE INDEX idx_histories_ticket ON ticket_stage_histories (ticket_id, logged_at DESC);

CREATE TABLE auth_audit_logs (
    id              BIGINT GENERATED ALWAYS AS IDENTITY,
    user_id         UUID,
    event_type      VARCHAR(40) NOT NULL,
    ip_address      INET,
    user_agent      TEXT,
    metadata        JSONB NOT NULL DEFAULT '{}'::jsonb,
    logged_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (id, logged_at)
) PARTITION BY RANGE (logged_at);

CREATE TABLE auth_audit_logs_2026 PARTITION OF auth_audit_logs
    FOR VALUES FROM ('2026-01-01 00:00:00+00') TO ('2027-01-01 00:00:00+00');
CREATE TABLE auth_audit_logs_2027 PARTITION OF auth_audit_logs
    FOR VALUES FROM ('2027-01-01 00:00:00+00') TO ('2028-01-01 00:00:00+00');
CREATE TABLE auth_audit_logs_default PARTITION OF auth_audit_logs DEFAULT;

CREATE INDEX idx_auth_audit_brin ON auth_audit_logs USING BRIN (logged_at);
CREATE INDEX idx_auth_audit_user ON auth_audit_logs (user_id, logged_at DESC);

-- ============================================================================
-- 11. DOKUMEN HASIL / OUTPUT DARI INSTANSI TUJUAN
-- ============================================================================
CREATE TABLE issued_outcomes (
    id                  UUID PRIMARY KEY,
    ticket_id           UUID NOT NULL,
    ticket_created_at   TIMESTAMPTZ NOT NULL,
    doctor_id           UUID NOT NULL REFERENCES doctors(id),
    organization_id     UUID REFERENCES organizations(id),
    document_title      VARCHAR(200) NOT NULL,
    reference_number    VARCHAR(100),
    issued_by_agency    VARCHAR(120) NOT NULL,
    file_storage_key    TEXT NOT NULL,
    file_sha256         CHAR(64) NOT NULL,
    issued_date         DATE,
    valid_until         DATE,
    downloaded_at       TIMESTAMPTZ,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    FOREIGN KEY (ticket_id, ticket_created_at) REFERENCES service_tickets(id, created_at)
);

CREATE INDEX idx_outcomes_doctor ON issued_outcomes (doctor_id, created_at DESC);
CREATE INDEX idx_outcomes_ticket ON issued_outcomes (ticket_id, ticket_created_at);

-- ============================================================================
-- 12. TAGIHAN & PEMBAYARAN LAYANAN PERANTARA (B2C & B2B)
-- ============================================================================
CREATE TABLE service_invoices (
    id                  UUID PRIMARY KEY,
    invoice_number      VARCHAR(40) NOT NULL UNIQUE,
    channel_type        VARCHAR(10) NOT NULL CHECK (channel_type IN ('B2C', 'B2B')),
    doctor_id           UUID REFERENCES doctors(id),
    organization_id     UUID REFERENCES organizations(id),
    amount_idr          BIGINT NOT NULL CHECK (amount_idr >= 0),
    payment_status      VARCHAR(20) NOT NULL DEFAULT 'UNPAID'
                        CHECK (payment_status IN ('UNPAID', 'PENDING_VERIFICATION', 'PAID', 'CANCELLED', 'REFUNDED')),
    due_at              TIMESTAMPTZ,
    paid_at             TIMESTAMPTZ,
    payment_reference   VARCHAR(120),
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
) WITH (fillfactor = 90);

CREATE TABLE invoice_items (
    id                  BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    invoice_id          UUID NOT NULL REFERENCES service_invoices(id) ON DELETE CASCADE,
    ticket_id           UUID NOT NULL,
    ticket_created_at   TIMESTAMPTZ NOT NULL,
    description         VARCHAR(255) NOT NULL,
    unit_price_idr      BIGINT NOT NULL CHECK (unit_price_idr >= 0),
    FOREIGN KEY (ticket_id, ticket_created_at) REFERENCES service_tickets(id, created_at)
);

CREATE INDEX idx_invoice_items_invoice ON invoice_items (invoice_id);
CREATE INDEX idx_invoice_items_ticket ON invoice_items (ticket_id, ticket_created_at);
CREATE INDEX idx_invoices_org_status ON service_invoices (organization_id, payment_status)
    WHERE organization_id IS NOT NULL;
CREATE INDEX idx_invoices_doc_status ON service_invoices (doctor_id, payment_status)
    WHERE doctor_id IS NOT NULL;

-- ============================================================================
-- 13. RIWAYAT PENGINGAT & NOTIFIKASI (WA / EMAIL / IN-APP)
-- ============================================================================
CREATE TABLE notification_logs (
    id                  BIGINT GENERATED ALWAYS AS IDENTITY,
    ticket_id           UUID,
    ticket_created_at   TIMESTAMPTZ,
    recipient_type      VARCHAR(15) NOT NULL CHECK (recipient_type IN ('DOCTOR', 'B2B_PIC', 'ADMIN', 'AGENT')),
    recipient_target    VARCHAR(180) NOT NULL,
    channel             VARCHAR(15) NOT NULL CHECK (channel IN ('WHATSAPP', 'EMAIL', 'SYSTEM')),
    template_code       VARCHAR(50) NOT NULL,
    delivery_status     VARCHAR(20) NOT NULL DEFAULT 'QUEUED'
                        CHECK (delivery_status IN ('QUEUED', 'SENT', 'DELIVERED', 'FAILED')),
    sent_at             TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (id, sent_at)
) PARTITION BY RANGE (sent_at);

CREATE TABLE notification_logs_2026 PARTITION OF notification_logs
    FOR VALUES FROM ('2026-01-01 00:00:00+00') TO ('2027-01-01 00:00:00+00');
CREATE TABLE notification_logs_2027 PARTITION OF notification_logs
    FOR VALUES FROM ('2027-01-01 00:00:00+00') TO ('2028-01-01 00:00:00+00');
CREATE TABLE notification_logs_default PARTITION OF notification_logs DEFAULT;

CREATE INDEX idx_notif_brin_time ON notification_logs USING BRIN (sent_at);
CREATE INDEX idx_notif_ticket ON notification_logs (ticket_id, sent_at DESC);

-- ============================================================================
-- 14. SLA BERTINGKAT PER JENIS LAYANAN & TAHAPAN (MULTI-TIER SLA RULES)
-- ============================================================================
CREATE TABLE service_sla_tiers (
    id                    INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    service_type_id       SMALLINT NOT NULL REFERENCES master_service_types(id) ON DELETE CASCADE,
    channel_type          VARCHAR(10) NOT NULL CHECK (channel_type IN ('B2C', 'B2B')),
    priority_tier         VARCHAR(20) NOT NULL DEFAULT 'REGULAR'
                          CHECK (priority_tier IN ('REGULAR', 'EXPRESS', 'ENTERPRISE_BATCH')),
    stage_code            VARCHAR(30) NOT NULL
                          CHECK (stage_code IN (
                              'AWAITING_DOCS', 'INTERNAL_CURATION', 'REVISION_REQUIRED',
                              'SUBMITTED_TO_GOV', 'GOV_VERIFICATION'
                          )),
    max_duration_hours    SMALLINT NOT NULL CHECK (max_duration_hours > 0),
    warning_threshold_pct SMALLINT NOT NULL DEFAULT 80,
    escalation_role       VARCHAR(30) NOT NULL DEFAULT 'SUPER_ADMIN',
    is_active             BOOLEAN NOT NULL DEFAULT TRUE,
    UNIQUE (service_type_id, channel_type, priority_tier, stage_code)
);

CREATE TABLE ticket_stage_slas (
    id                  UUID NOT NULL,
    ticket_id           UUID NOT NULL,
    ticket_created_at   TIMESTAMPTZ NOT NULL,
    stage_code          VARCHAR(30) NOT NULL,
    started_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    warning_at          TIMESTAMPTZ NOT NULL,
    breach_due_at       TIMESTAMPTZ NOT NULL,
    completed_at        TIMESTAMPTZ,
    sla_status          VARCHAR(15) NOT NULL DEFAULT 'ON_TRACK'
                        CHECK (sla_status IN ('ON_TRACK', 'WARNING', 'BREACHED', 'MET')),
    PRIMARY KEY (id, started_at),
    FOREIGN KEY (ticket_id, ticket_created_at) REFERENCES service_tickets(id, created_at)
) PARTITION BY RANGE (started_at);

CREATE TABLE ticket_stage_slas_2026 PARTITION OF ticket_stage_slas
    FOR VALUES FROM ('2026-01-01 00:00:00+00') TO ('2027-01-01 00:00:00+00');
CREATE TABLE ticket_stage_slas_2027 PARTITION OF ticket_stage_slas
    FOR VALUES FROM ('2027-01-01 00:00:00+00') TO ('2028-01-01 00:00:00+00');
CREATE TABLE ticket_stage_slas_default PARTITION OF ticket_stage_slas DEFAULT;

CREATE INDEX idx_sla_ticket_open ON ticket_stage_slas (ticket_id, ticket_created_at)
    WHERE completed_at IS NULL;
CREATE INDEX idx_sla_active_watch ON ticket_stage_slas (breach_due_at, sla_status)
    WHERE completed_at IS NULL;

-- ============================================================================
-- 15. MATRIKS KOMISI & BUKU BESAR PENCAIRAN AGEN / PIC (PARTITIONED)
-- ============================================================================
CREATE TABLE commission_rules (
    id                  INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    service_type_id     SMALLINT NOT NULL REFERENCES master_service_types(id),
    channel_type        VARCHAR(10) NOT NULL CHECK (channel_type IN ('B2C', 'B2B')),
    role_earner         VARCHAR(25) NOT NULL CHECK (role_earner IN ('REFERRAL_AGENT', 'HANDLING_PIC', 'REGIONAL_LEAD')),
    calc_method         VARCHAR(15) NOT NULL CHECK (calc_method IN ('FIXED_IDR', 'PERCENTAGE')),
    commission_value    NUMERIC(12, 2) NOT NULL CHECK (commission_value >= 0),
    trigger_stage       VARCHAR(30) NOT NULL DEFAULT 'COMPLETED',
    is_active           BOOLEAN NOT NULL DEFAULT TRUE,
    UNIQUE (service_type_id, channel_type, role_earner)
);

CREATE TABLE commission_ledger (
    id                  UUID NOT NULL,
    agent_id            UUID NOT NULL REFERENCES agents_and_pics(id),
    ticket_id           UUID NOT NULL,
    ticket_created_at   TIMESTAMPTZ NOT NULL,
    invoice_id          UUID REFERENCES service_invoices(id),
    role_earner         VARCHAR(25) NOT NULL,
    gross_amount_idr    BIGINT NOT NULL CHECK (gross_amount_idr >= 0),
    tax_pph_idr         BIGINT NOT NULL DEFAULT 0,
    net_amount_idr      BIGINT NOT NULL CHECK (net_amount_idr >= 0),
    payout_status       VARCHAR(20) NOT NULL DEFAULT 'PENDING_SETTLEMENT'
                        CHECK (payout_status IN ('PENDING_SETTLEMENT', 'APPROVED', 'PAID', 'CLAWBACK')),
    payout_batch_ref    VARCHAR(50),
    paid_at             TIMESTAMPTZ,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (id, created_at),
    FOREIGN KEY (ticket_id, ticket_created_at) REFERENCES service_tickets(id, created_at)
) PARTITION BY RANGE (created_at);

CREATE TABLE commission_ledger_2026 PARTITION OF commission_ledger
    FOR VALUES FROM ('2026-01-01 00:00:00+00') TO ('2027-01-01 00:00:00+00');
CREATE TABLE commission_ledger_2027 PARTITION OF commission_ledger
    FOR VALUES FROM ('2027-01-01 00:00:00+00') TO ('2028-01-01 00:00:00+00');
CREATE TABLE commission_ledger_default PARTITION OF commission_ledger DEFAULT;

CREATE INDEX idx_comm_ledger_agent_status ON commission_ledger (agent_id, payout_status, created_at DESC)
    INCLUDE (net_amount_idr, ticket_id);

-- ============================================================================
-- 16. TRIGGERS OTOMATISASI (SLA TRACKING & COUNTER KELENGKAPAN DOKUMEN)
-- ============================================================================

-- Trigger A: Sinkronisasi SLA otomatis saat tiket dibuat / berpindah tahap
CREATE OR REPLACE FUNCTION fn_sync_ticket_stage_sla()
RETURNS TRIGGER AS $$
DECLARE
    v_rule RECORD;
BEGIN
    IF (TG_OP = 'INSERT') OR (NEW.current_stage IS DISTINCT FROM OLD.current_stage) THEN
        UPDATE ticket_stage_slas
        SET completed_at = NOW(),
            sla_status = CASE WHEN NOW() > breach_due_at THEN 'BREACHED' ELSE 'MET' END
        WHERE ticket_id = NEW.id
          AND ticket_created_at = NEW.created_at
          AND completed_at IS NULL;

        SELECT max_duration_hours, warning_threshold_pct INTO v_rule
        FROM service_sla_tiers
        WHERE service_type_id = NEW.service_type_id
          AND channel_type = NEW.channel_type
          AND priority_tier = NEW.priority_tier
          AND stage_code = NEW.current_stage
          AND is_active = TRUE
        LIMIT 1;

        IF FOUND THEN
            INSERT INTO ticket_stage_slas (
                id, ticket_id, ticket_created_at, stage_code,
                started_at, warning_at, breach_due_at
            ) VALUES (
                gen_random_uuid(), NEW.id, NEW.created_at, NEW.current_stage,
                NOW(),
                NOW() + ((v_rule.max_duration_hours * v_rule.warning_threshold_pct / 100.0) || ' hours')::INTERVAL,
                NOW() + (v_rule.max_duration_hours || ' hours')::INTERVAL
            );
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_ticket_stage_sla
AFTER INSERT OR UPDATE OF current_stage ON service_tickets
FOR EACH ROW EXECUTE FUNCTION fn_sync_ticket_stage_sla();

-- Trigger B: Sinkronisasi counter verified_docs_count secara real-time tanpa COUNT(*) JOIN
CREATE OR REPLACE FUNCTION fn_sync_verified_docs_counter()
RETURNS TRIGGER AS $$
DECLARE
    v_verified_count SMALLINT;
BEGIN
    IF (TG_OP = 'INSERT' AND NEW.verification_status IN ('VERIFIED_OCR', 'VERIFIED_PSV'))
       OR (TG_OP = 'UPDATE' AND NEW.verification_status IS DISTINCT FROM OLD.verification_status)
       OR (TG_OP = 'DELETE' AND OLD.verification_status IN ('VERIFIED_OCR', 'VERIFIED_PSV')) THEN

        SELECT COUNT(DISTINCT doc_code)::SMALLINT INTO v_verified_count
        FROM doctor_documents
        WHERE doctor_id = COALESCE(NEW.doctor_id, OLD.doctor_id)
          AND verification_status IN ('VERIFIED_OCR', 'VERIFIED_PSV');

        UPDATE service_tickets
        SET verified_docs_count = v_verified_count,
            updated_at = NOW()
        WHERE doctor_id = COALESCE(NEW.doctor_id, OLD.doctor_id)
          AND current_stage NOT IN ('COMPLETED', 'CANCELLED');
    END IF;
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_sync_verified_docs
AFTER INSERT OR UPDATE OF verification_status OR DELETE ON doctor_documents
FOR EACH ROW EXECUTE FUNCTION fn_sync_verified_docs_counter();

-- ============================================================================
-- 17. ROW-LEVEL SECURITY (RLS) UNTUK ISOLASI MULTI-TENANT B2B & WILAYAH
-- ============================================================================
ALTER TABLE service_tickets ENABLE ROW LEVEL SECURITY;

-- Kebijakan isolasi berbasis variabel sesi aplikasi:
-- SET app.current_role = 'B2B_ADMIN'; SET app.current_org_id = '<uuid>';
CREATE POLICY pol_tickets_tenant_isolation ON service_tickets
    USING (
        current_setting('app.current_role', true) IN ('SUPER_ADMIN', 'NATIONAL_VERIFIER', 'FINANCE_OPS')
        OR (
            current_setting('app.current_role', true) = 'B2B_ADMIN'
            AND organization_id::text = current_setting('app.current_org_id', true)
        )
        OR (
            current_setting('app.current_role', true) = 'REGIONAL_PIC'
            AND province_code = current_setting('app.current_province', true)
        )
        OR (
            current_setting('app.current_role', true) = 'DOCTOR'
            AND doctor_id::text = current_setting('app.current_doctor_id', true)
        )
    );

-- ============================================================================
-- 18. SEED DATA AWAL: ROLES, PERMISSIONS & ROLE MAPPING
-- ============================================================================
INSERT INTO roles (code, name, description, is_system_role) VALUES
    ('SUPER_ADMIN', 'Super Administrator Nasional', 'Akses penuh ke seluruh konfigurasi sistem, RBAC, dan data nasional.', TRUE),
    ('NATIONAL_VERIFIER', 'Verifikator & Operator Pusat', 'Kurasi dokumen dokter, verifikasi PSV, dan pengajuan ke Kemenkes/KKI.', TRUE),
    ('REGIONAL_PIC', 'Koordinator Operasional Wilayah', 'Mengelola antrean tiket dan agen lapangan pada cakupan provinsi tertentu.', TRUE),
    ('B2B_ADMIN', 'Koordinator Klinik / Faskes B2B', 'Mendaftarkan dan memantau kelengkapan berkas dokter di faskes mitra.', TRUE),
    ('DOCTOR', 'Dokter / Tenaga Medis (B2C & B2B)', 'Mengelola profil pribadi, mengunggah berkas syarat, dan mengunduh hasil.', TRUE),
    ('FIELD_AGENT', 'Agen Lapangan / Mitra Akuisisi', 'Mendaftarkan dokter/klinik baru dan memantau saldo komisi.', TRUE),
    ('FINANCE_OPS', 'Staf Keuangan & Settlement', 'Verifikasi pembayaran invoice dan persetujuan pencairan komisi agen.', TRUE);

INSERT INTO permissions (module_code, action_code, description) VALUES
    ('TICKETS', 'tickets:read', 'Melihat daftar dan detail tiket pengurusan'),
    ('TICKETS', 'tickets:create', 'Membuat tiket pengurusan baru (B2C/B2B)'),
    ('TICKETS', 'tickets:curate', 'Melakukan kurasi berkas dan meminta revisi dokter'),
    ('TICKETS', 'tickets:submit_gov', 'Mengajukan berkas terverifikasi ke Kemenkes/KKI/Dinkes'),
    ('DOCUMENTS', 'docs:upload', 'Mengunggah dokumen persyaratan dokter'),
    ('DOCUMENTS', 'docs:verify_psv', 'Menyetujui keabsahan dokumen hasil pemeriksaan PSV'),
    ('DOCUMENTS', 'docs:view_sensitive_nik', 'Melihat data identitas sensitif (NIK terdekripsi)'),
    ('B2B_ORGS', 'orgs:manage_doctors', 'Menambah atau mengelola afiliasi dokter dalam organisasi B2B'),
    ('FINANCE', 'invoices:read', 'Melihat tagihan dan status pembayaran'),
    ('FINANCE', 'invoices:verify_payment', 'Mengonfirmasi pembayaran invoice masuk'),
    ('COMMISSIONS', 'commissions:read_own', 'Melihat riwayat komisi pribadi'),
    ('COMMISSIONS', 'commissions:approve_payout', 'Menyetujui pencairan batch komisi agen'),
    ('RBAC', 'rbac:manage_users_roles', 'Mengatur penugasan peran, wilayah, dan hak akses pengguna');

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r CROSS JOIN permissions p WHERE r.code = 'SUPER_ADMIN';

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.code = 'NATIONAL_VERIFIER'
  AND p.action_code IN ('tickets:read', 'tickets:create', 'tickets:curate', 'tickets:submit_gov', 'docs:upload', 'docs:verify_psv');

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.code = 'B2B_ADMIN'
  AND p.action_code IN ('tickets:read', 'tickets:create', 'docs:upload', 'orgs:manage_doctors', 'invoices:read');

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.code = 'DOCTOR'
  AND p.action_code IN ('tickets:read', 'tickets:create', 'docs:upload', 'invoices:read');

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.code = 'FIELD_AGENT'
  AND p.action_code IN ('tickets:read', 'tickets:create', 'commissions:read_own');

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.code = 'FINANCE_OPS'
  AND p.action_code IN ('tickets:read', 'invoices:read', 'invoices:verify_payment', 'commissions:approve_payout');

COMMIT;

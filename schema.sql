-- EstateHub Database Schema
-- Run: psql -U postgres -d estatehub -f schema.sql

-- Drop tables if they exist (for re-runs)
DROP TABLE IF EXISTS maintenance CASCADE;
DROP TABLE IF EXISTS payments CASCADE;
DROP TABLE IF EXISTS leases CASCADE;
DROP TABLE IF EXISTS tenants CASCADE;
DROP TABLE IF EXISTS properties CASCADE;
DROP TABLE IF EXISTS landlords CASCADE;

-- LANDLORDS
CREATE TABLE landlords (
  id          SERIAL PRIMARY KEY,
  name        VARCHAR(255) NOT NULL,
  email       VARCHAR(255) UNIQUE NOT NULL,
  phone       VARCHAR(50),
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- PROPERTIES
CREATE TABLE properties (
  id           SERIAL PRIMARY KEY,
  landlord_id  INTEGER NOT NULL REFERENCES landlords(id) ON DELETE CASCADE,
  title        VARCHAR(255) NOT NULL,
  description  TEXT,
  address      VARCHAR(500) NOT NULL,
  city         VARCHAR(100) NOT NULL,
  postcode     VARCHAR(20) NOT NULL,
  type         VARCHAR(50) NOT NULL CHECK (type IN ('apartment','house','studio','villa','commercial')),
  bedrooms     INTEGER NOT NULL DEFAULT 1,
  bathrooms    INTEGER NOT NULL DEFAULT 1,
  area_sqft    INTEGER,
  rent_pcm     NUMERIC(10,2) NOT NULL,
  status       VARCHAR(20) NOT NULL DEFAULT 'available' CHECK (status IN ('available','occupied','maintenance')),
  amenities    TEXT[],
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW()
);

-- TENANTS
CREATE TABLE tenants (
  id           SERIAL PRIMARY KEY,
  name         VARCHAR(255) NOT NULL,
  email        VARCHAR(255) UNIQUE NOT NULL,
  phone        VARCHAR(50),
  id_verified  BOOLEAN DEFAULT FALSE,
  credit_score INTEGER CHECK (credit_score BETWEEN 300 AND 850),
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- LEASES
CREATE TABLE leases (
  id          SERIAL PRIMARY KEY,
  property_id INTEGER NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  tenant_id   INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  start_date  DATE NOT NULL,
  end_date    DATE NOT NULL,
  rent_pcm    NUMERIC(10,2) NOT NULL,
  deposit     NUMERIC(10,2) NOT NULL,
  status      VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('active','expired','terminated','pending')),
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- PAYMENTS
CREATE TABLE payments (
  id        SERIAL PRIMARY KEY,
  lease_id  INTEGER NOT NULL REFERENCES leases(id) ON DELETE CASCADE,
  amount    NUMERIC(10,2) NOT NULL,
  due_date  DATE NOT NULL,
  paid_date DATE,
  status    VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','paid','late','waived')),
  method    VARCHAR(50),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- MAINTENANCE
CREATE TABLE maintenance (
  id          SERIAL PRIMARY KEY,
  property_id INTEGER NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  tenant_id   INTEGER REFERENCES tenants(id) ON DELETE SET NULL,
  title       VARCHAR(255) NOT NULL,
  description TEXT,
  priority    VARCHAR(20) NOT NULL DEFAULT 'medium' CHECK (priority IN ('low','medium','high','emergency')),
  status      VARCHAR(20) NOT NULL DEFAULT 'open' CHECK (status IN ('open','in_progress','resolved')),
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  resolved_at TIMESTAMPTZ
);

-- INDEXES
CREATE INDEX idx_properties_landlord_id ON properties(landlord_id);
CREATE INDEX idx_properties_status ON properties(status);
CREATE INDEX idx_properties_city ON properties(city);
CREATE INDEX idx_leases_property_id ON leases(property_id);
CREATE INDEX idx_leases_tenant_id ON leases(tenant_id);
CREATE INDEX idx_leases_status ON leases(status);
CREATE INDEX idx_payments_lease_id ON payments(lease_id);
CREATE INDEX idx_payments_status ON payments(status);
CREATE INDEX idx_maintenance_property_id ON maintenance(property_id);
CREATE INDEX idx_maintenance_tenant_id ON maintenance(tenant_id);
CREATE INDEX idx_maintenance_status ON maintenance(status);

-- ============================================================
-- SEED DATA
-- ============================================================

-- Landlords
INSERT INTO landlords (name, email, phone) VALUES
  ('James Worthington', 'james@estatehub.io', '+44 7700 900123'),
  ('Sophia Chen', 'sophia@estatehub.io', '+44 7700 900456');

-- Properties
INSERT INTO properties (landlord_id, title, description, address, city, postcode, type, bedrooms, bathrooms, area_sqft, rent_pcm, status, amenities) VALUES
  (1, 'The Ivory Penthouse', 'A stunning top-floor penthouse with panoramic city views, bespoke kitchen, and private terrace.', '12 Belgravia Square', 'London', 'SW1X 8PQ', 'apartment', 3, 2, 1850, 5500.00, 'occupied',   ARRAY['Concierge','Gym','Rooftop Terrace','Underfloor Heating','Parking']),
  (1, 'Kensington Garden Flat', 'Bright and airy ground-floor flat overlooking private gardens. Period features throughout.', '4A Pembridge Villas', 'London', 'W11 3EP', 'apartment', 2, 1, 920, 3200.00, 'occupied',   ARRAY['Garden Access','Bike Storage','Broadband']),
  (2, 'The Cotswold Retreat', 'A beautifully restored stone cottage set in half an acre, ideal for remote workers seeking rural tranquility.', 'Old Mill Lane', 'Bourton-on-the-Water', 'GL54 2BY', 'house', 4, 3, 2400, 2800.00, 'available', ARRAY['Garden','Hot Tub','Log Burner','Double Garage','EV Charging']);

-- Tenants
INSERT INTO tenants (name, email, phone, id_verified, credit_score) VALUES
  ('Oliver Hartley',  'oliver.hartley@email.com',  '+44 7911 123456', TRUE,  812),
  ('Amara Okonkwo',   'amara.okonkwo@email.com',   '+44 7911 234567', TRUE,  754),
  ('Felix Beaumont',  'felix.beaumont@email.com',  '+44 7911 345678', FALSE, 690);

-- Leases
INSERT INTO leases (property_id, tenant_id, start_date, end_date, rent_pcm, deposit, status) VALUES
  (1, 1, '2024-01-01', '2025-12-31', 5500.00, 11000.00, 'active'),
  (2, 2, '2024-03-01', '2025-02-28', 3200.00,  6400.00, 'active');

-- Payments (last 3 months for lease 1)
INSERT INTO payments (lease_id, amount, due_date, paid_date, status, method) VALUES
  (1, 5500.00, '2026-01-01', '2026-01-02', 'paid',    'Bank Transfer'),
  (1, 5500.00, '2026-02-01', '2026-02-03', 'paid',    'Bank Transfer'),
  (1, 5500.00, '2026-03-01', NULL,         'late',    NULL),
  (2, 3200.00, '2026-01-01', '2026-01-01', 'paid',    'Direct Debit'),
  (2, 3200.00, '2026-02-01', '2026-02-01', 'paid',    'Direct Debit'),
  (2, 3200.00, '2026-03-01', '2026-03-01', 'paid',    'Direct Debit'),
  (2, 3200.00, '2026-04-01', NULL,         'pending', NULL);

-- Maintenance requests
INSERT INTO maintenance (property_id, tenant_id, title, description, priority, status) VALUES
  (1, 1, 'Boiler not heating', 'Boiler making strange noise and water not reaching temperature above 40°C.', 'high',      'in_progress'),
  (2, 2, 'Leaking tap in kitchen', 'Cold water tap drips continuously when fully closed.', 'medium',    'open'),
  (1, 1, 'Intercom system fault', 'Front door intercom intermittently fails to connect to flat.', 'low',       'open'),
  (2, 2, 'Emergency: Gas smell', 'Faint gas odour detected near hob. Windows opened, awaiting engineer.', 'emergency', 'in_progress');

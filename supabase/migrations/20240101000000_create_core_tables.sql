-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users Table
CREATE TABLE users (
  user_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on email for faster lookups
CREATE INDEX idx_users_email ON users(email);

-- RLS Policy for Users
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can only access their own data"
  ON users FOR ALL
  USING (auth.uid() = user_id);

-- Clients Table
CREATE TABLE clients (
  client_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  industry VARCHAR(100),
  contact_email VARCHAR(255),
  contact_phone VARCHAR(50),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on user_id for faster queries
CREATE INDEX idx_clients_user_id ON clients(user_id);

-- RLS Policy for Clients
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can only access their own clients"
  ON clients FOR ALL
  USING (user_id = auth.uid());

-- Commission_Models Table
CREATE TABLE commission_models (
  model_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID NOT NULL REFERENCES clients(client_id) ON DELETE CASCADE,
  commission_percentage DECIMAL(5,2) NOT NULL CHECK (commission_percentage >= 0 AND commission_percentage <= 100),
  calculation_basis VARCHAR(50) NOT NULL CHECK (calculation_basis IN ('sales_revenue', 'total_revenue')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on client_id for faster queries
CREATE INDEX idx_commission_models_client_id ON commission_models(client_id);

-- RLS Policy for Commission_Models
ALTER TABLE commission_models ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can access commission models for their clients"
  ON commission_models FOR ALL
  USING (client_id IN (SELECT client_id FROM clients WHERE user_id = auth.uid()));

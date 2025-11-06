-- Create registrations table
CREATE TABLE IF NOT EXISTS registrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    ticket_id UUID NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    company VARCHAR(255),
    job_title VARCHAR(255),
    dietary_restrictions TEXT,
    special_requirements TEXT,
    quantity INTEGER NOT NULL DEFAULT 1,
    total_amount DECIMAL(10, 2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD',
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled', 'waitlisted', 'checked_in')),
    payment_status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'refunded', 'failed')),
    payment_id VARCHAR(255),
    registration_code VARCHAR(255) UNIQUE NOT NULL,
    qr_code_url VARCHAR(500),
    ticket_url VARCHAR(500),
    checked_in_at TIMESTAMP,
    checked_in_by UUID REFERENCES users(id),
    custom_field_values JSONB,
    referral_source VARCHAR(255),
    marketing_consent BOOLEAN DEFAULT false,
    email_notifications BOOLEAN DEFAULT true,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX idx_registrations_event_id ON registrations(event_id);
CREATE INDEX idx_registrations_ticket_id ON registrations(ticket_id);
CREATE INDEX idx_registrations_user_id ON registrations(user_id);
CREATE INDEX idx_registrations_email ON registrations(email);
CREATE INDEX idx_registrations_status ON registrations(status);
CREATE INDEX idx_registrations_payment_status ON registrations(payment_status);
CREATE INDEX idx_registrations_registration_code ON registrations(registration_code);
CREATE INDEX idx_registrations_created_at ON registrations(created_at);

-- Create trigger to update updated_at column
CREATE TRIGGER update_registrations_updated_at
    BEFORE UPDATE ON registrations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add constraints
ALTER TABLE registrations ADD CONSTRAINT check_quantity_positive
CHECK (quantity > 0);

ALTER TABLE registrations ADD CONSTRAINT check_total_amount_non_negative
CHECK (total_amount >= 0);

-- Create unique constraint for event_id and email combination to prevent duplicate registrations
CREATE UNIQUE INDEX idx_registrations_event_email_unique
ON registrations(event_id, email)
WHERE status NOT IN ('cancelled');
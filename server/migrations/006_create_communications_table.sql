-- Create communications table for email tracking
CREATE TABLE IF NOT EXISTS communications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID REFERENCES events(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    recipient_type VARCHAR(20) NOT NULL DEFAULT 'all' CHECK (recipient_type IN ('all', 'ticket_type', 'specific', 'waitlist')),
    ticket_type_id UUID REFERENCES tickets(id) ON DELETE CASCADE,
    subject VARCHAR(500) NOT NULL,
    content TEXT NOT NULL,
    email_template VARCHAR(100),
    scheduled_at TIMESTAMP,
    sent_at TIMESTAMP,
    status VARCHAR(20) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'sending', 'sent', 'failed', 'cancelled')),
    recipient_count INTEGER DEFAULT 0,
    sent_count INTEGER DEFAULT 0,
    open_count INTEGER DEFAULT 0,
    click_count INTEGER DEFAULT 0,
    bounce_count INTEGER DEFAULT 0,
    unsubscribe_count INTEGER DEFAULT 0,
    attachments JSONB,
    campaign_name VARCHAR(255),
    tags TEXT[],
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create communication_logs table for individual email tracking
CREATE TABLE IF NOT EXISTS communication_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    communication_id UUID NOT NULL REFERENCES communications(id) ON DELETE CASCADE,
    registration_id UUID REFERENCES registrations(id) ON DELETE CASCADE,
    recipient_email VARCHAR(255) NOT NULL,
    recipient_name VARCHAR(255),
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'delivered', 'opened', 'clicked', 'bounced', 'unsubscribed', 'failed')),
    sent_at TIMESTAMP,
    delivered_at TIMESTAMP,
    opened_at TIMESTAMP,
    clicked_at TIMESTAMP,
    bounced_at TIMESTAMP,
    error_message TEXT,
    tracking_id VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for communications
CREATE INDEX idx_communications_event_id ON communications(event_id);
CREATE INDEX idx_communications_sender_id ON communications(sender_id);
CREATE INDEX idx_communications_status ON communications(status);
CREATE INDEX idx_communications_scheduled_at ON communications(scheduled_at);
CREATE INDEX idx_communications_created_at ON communications(created_at);

-- Create indexes for communication_logs
CREATE INDEX idx_communication_logs_communication_id ON communication_logs(communication_id);
CREATE INDEX idx_communication_logs_registration_id ON communication_logs(registration_id);
CREATE INDEX idx_communication_logs_recipient_email ON communication_logs(recipient_email);
CREATE INDEX idx_communication_logs_status ON communication_logs(status);
CREATE INDEX idx_communication_logs_created_at ON communication_logs(created_at);

-- Create trigger to update updated_at column for communications
CREATE TRIGGER update_communications_updated_at
    BEFORE UPDATE ON communications
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
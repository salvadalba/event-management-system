-- Create events table
CREATE TABLE IF NOT EXISTS events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    short_description VARCHAR(500),
    organizer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    venue_name VARCHAR(255) NOT NULL,
    venue_address TEXT NOT NULL,
    venue_city VARCHAR(100) NOT NULL,
    venue_state VARCHAR(100),
    venue_country VARCHAR(100) NOT NULL,
    venue_postal_code VARCHAR(20),
    start_date TIMESTAMP NOT NULL,
    end_date TIMESTAMP NOT NULL,
    timezone VARCHAR(50) DEFAULT 'UTC',
    max_attendees INTEGER,
    current_attendees INTEGER DEFAULT 0,
    status VARCHAR(20) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'canceled', 'completed')),
    is_featured BOOLEAN DEFAULT false,
    featured_image_url VARCHAR(500),
    agenda JSONB,
    tags TEXT[],
    custom_fields JSONB,
    registration_deadline TIMESTAMP,
    checkin_enabled BOOLEAN DEFAULT true,
    requires_approval BOOLEAN DEFAULT false,
    social_links JSONB,
    contact_email VARCHAR(255),
    contact_phone VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX idx_events_organizer_id ON events(organizer_id);
CREATE INDEX idx_events_start_date ON events(start_date);
CREATE INDEX idx_events_end_date ON events(end_date);
CREATE INDEX idx_events_status ON events(status);
CREATE INDEX idx_events_is_featured ON events(is_featured);
CREATE INDEX idx_events_venue_city ON events(venue_city);
CREATE INDEX idx_events_tags ON events USING GIN(tags);

-- Create trigger to update updated_at column
CREATE TRIGGER update_events_updated_at
    BEFORE UPDATE ON events
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add constraint to ensure end_date is after start_date
ALTER TABLE events ADD CONSTRAINT check_end_date_after_start_date
CHECK (end_date > start_date);

-- Add constraint to ensure max_attendees is positive if specified
ALTER TABLE events ADD CONSTRAINT check_max_attendees_positive
CHECK (max_attendees IS NULL OR max_attendees > 0);

-- Add constraint to ensure current_attendees is not negative
ALTER TABLE events ADD CONSTRAINT check_current_attendees_non_negative
CHECK (current_attendees >= 0);
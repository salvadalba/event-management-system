-- Create checkins table for detailed check-in tracking
CREATE TABLE IF NOT EXISTS checkins (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    registration_id UUID NOT NULL REFERENCES registrations(id) ON DELETE CASCADE,
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    checked_in_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    checkin_time TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    checkin_method VARCHAR(20) NOT NULL DEFAULT 'qr_code' CHECK (checkin_method IN ('qr_code', 'manual', 'search', 'walk_in')),
    device_id VARCHAR(255),
    location VARCHAR(255),
    notes TEXT,
    badge_printed BOOLEAN DEFAULT false,
    badge_printed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX idx_checkins_registration_id ON checkins(registration_id);
CREATE INDEX idx_checkins_event_id ON checkins(event_id);
CREATE INDEX idx_checkins_checked_in_by ON checkins(checked_in_by);
CREATE INDEX idx_checkins_checkin_time ON checkins(checkin_time);
CREATE INDEX idx_checkins_checkin_method ON checkins(checkin_method);

-- Create unique constraint to prevent duplicate check-ins for the same registration
CREATE UNIQUE INDEX idx_checkins_registration_unique
ON checkins(registration_id)
WHERE checkin_time IS NOT NULL;
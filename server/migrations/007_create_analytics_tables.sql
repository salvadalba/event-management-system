-- Create analytics_events table for tracking event-level metrics
CREATE TABLE IF NOT EXISTS analytics_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    total_views INTEGER DEFAULT 0,
    unique_visitors INTEGER DEFAULT 0,
    registration_views INTEGER DEFAULT 0,
    conversion_rate DECIMAL(5, 2) DEFAULT 0.00,
    revenue_total DECIMAL(10, 2) DEFAULT 0.00,
    tickets_sold INTEGER DEFAULT 0,
    new_registrations INTEGER DEFAULT 0,
    waitlist_additions INTEGER DEFAULT 0,
    cancellations INTEGER DEFAULT 0,
    checkins INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create analytics_traffic_sources table
CREATE TABLE IF NOT EXISTS analytics_traffic_sources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    source VARCHAR(100) NOT NULL,
    source_type VARCHAR(50) NOT NULL DEFAULT 'other' CHECK (source_type IN ('organic', 'direct', 'social', 'email', 'referral', 'paid', 'other')),
    visitors INTEGER DEFAULT 0,
    registrations INTEGER DEFAULT 0,
    revenue DECIMAL(10, 2) DEFAULT 0.00,
    date DATE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create analytics_ticket_performance table
CREATE TABLE IF NOT EXISTS analytics_ticket_performance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_id UUID NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    views INTEGER DEFAULT 0,
    purchases INTEGER DEFAULT 0,
    revenue DECIMAL(10, 2) DEFAULT 0.00,
    conversion_rate DECIMAL(5, 2) DEFAULT 0.00,
    average_order_value DECIMAL(10, 2) DEFAULT 0.00,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for analytics tables
CREATE UNIQUE INDEX idx_analytics_events_unique ON analytics_events(event_id, date);
CREATE INDEX idx_analytics_events_event_id ON analytics_events(event_id);
CREATE INDEX idx_analytics_events_date ON analytics_events(date);

CREATE INDEX idx_analytics_traffic_sources_event_id ON analytics_traffic_sources(event_id);
CREATE INDEX idx_analytics_traffic_sources_date ON analytics_traffic_sources(date);
CREATE INDEX idx_analytics_traffic_sources_source_type ON analytics_traffic_sources(source_type);

CREATE UNIQUE INDEX idx_analytics_ticket_performance_unique ON analytics_ticket_performance(ticket_id, date);
CREATE INDEX idx_analytics_ticket_performance_event_id ON analytics_ticket_performance(event_id);
CREATE INDEX idx_analytics_ticket_performance_date ON analytics_ticket_performance(date);

-- Create trigger to update updated_at column
CREATE TRIGGER update_analytics_events_updated_at
    BEFORE UPDATE ON analytics_events
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create views for common analytics queries
CREATE OR REPLACE VIEW event_summary AS
SELECT
    e.id,
    e.title,
    e.start_date,
    e.end_date,
    e.max_attendees,
    e.current_attendees,
    e.status,
    COUNT(DISTINCT r.id) as total_registrations,
    COUNT(DISTINCT CASE WHEN r.payment_status = 'paid' THEN r.id END) as paid_registrations,
    COUNT(DISTINCT CASE WHEN r.status = 'checked_in' THEN r.id END) as total_checkins,
    COALESCE(SUM(CASE WHEN r.payment_status = 'paid' THEN r.total_amount ELSE 0 END), 0) as total_revenue,
    ROUND(
        CASE
            WHEN COUNT(DISTINCT r.id) > 0 THEN
                (COUNT(DISTINCT CASE WHEN r.status = 'checked_in' THEN r.id END) * 100.0 / COUNT(DISTINCT r.id))
            ELSE 0
        END, 2
    ) as attendance_rate
FROM events e
LEFT JOIN registrations r ON e.id = r.event_id AND r.status != 'cancelled'
GROUP BY e.id, e.title, e.start_date, e.end_date, e.max_attendees, e.current_attendees, e.status;

CREATE OR REPLACE VIEW ticket_summary AS
SELECT
    t.id,
    t.name,
    t.type,
    t.price,
    t.quantity_available,
    t.quantity_sold,
    e.id as event_id,
    e.title as event_title,
    COUNT(DISTINCT r.id) as registrations,
    COALESCE(SUM(r.quantity), 0) as total_quantity_sold,
    COALESCE(SUM(CASE WHEN r.payment_status = 'paid' THEN r.total_amount ELSE 0 END), 0) as revenue,
    ROUND(
        CASE
            WHEN t.quantity_available > 0 THEN
                (COALESCE(SUM(r.quantity), 0) * 100.0 / t.quantity_available)
            ELSE 0
        END, 2
    ) as sell_through_rate
FROM tickets t
LEFT JOIN events e ON t.event_id = e.id
LEFT JOIN registrations r ON t.id = r.ticket_id AND r.status != 'cancelled'
GROUP BY t.id, t.name, t.type, t.price, t.quantity_available, t.quantity_sold, e.id, e.title;
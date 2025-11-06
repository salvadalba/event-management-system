-- Create tickets table
CREATE TABLE IF NOT EXISTS tickets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    type VARCHAR(50) NOT NULL DEFAULT 'general' CHECK (type IN ('general', 'vip', 'early_bird', 'student', 'group', 'sponsor')),
    price DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    currency VARCHAR(3) DEFAULT 'USD',
    quantity_available INTEGER,
    quantity_sold INTEGER DEFAULT 0,
    sales_start TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    sales_end TIMESTAMP,
    min_purchase INTEGER DEFAULT 1,
    max_purchase INTEGER DEFAULT 10,
    is_active BOOLEAN DEFAULT true,
    requires_approval BOOLEAN DEFAULT false,
    discount_code VARCHAR(255),
    discount_percentage DECIMAL(5, 2),
    early_bird_price DECIMAL(10, 2),
    early_bird_deadline TIMESTAMP,
    group_min_size INTEGER,
    group_discount_percentage DECIMAL(5, 2),
    benefits TEXT[],
    restrictions TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX idx_tickets_event_id ON tickets(event_id);
CREATE INDEX idx_tickets_type ON tickets(type);
CREATE INDEX idx_tickets_is_active ON tickets(is_active);
CREATE INDEX idx_tickets_sales_start ON tickets(sales_start);
CREATE INDEX idx_tickets_sales_end ON tickets(sales_end);
CREATE INDEX idx_tickets_discount_code ON tickets(discount_code);

-- Create trigger to update updated_at column
CREATE TRIGGER update_tickets_updated_at
    BEFORE UPDATE ON tickets
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add constraints
ALTER TABLE tickets ADD CONSTRAINT check_price_non_negative
CHECK (price >= 0);

ALTER TABLE tickets ADD CONSTRAINT check_quantity_available_positive
CHECK (quantity_available IS NULL OR quantity_available > 0);

ALTER TABLE tickets ADD CONSTRAINT check_quantity_sold_non_negative
CHECK (quantity_sold >= 0);

ALTER TABLE tickets ADD CONSTRAINT check_sales_end_after_start
CHECK (sales_end IS NULL OR sales_end > sales_start);

ALTER TABLE tickets ADD CONSTRAINT check_min_purchase_positive
CHECK (min_purchase > 0);

ALTER TABLE tickets ADD CONSTRAINT check_max_purchase_ge_min
CHECK (max_purchase >= min_purchase);

ALTER TABLE tickets ADD CONSTRAINT check_discount_percentage_range
CHECK (discount_percentage IS NULL OR (discount_percentage >= 0 AND discount_percentage <= 100));

ALTER TABLE tickets ADD CONSTRAINT check_early_bird_price_non_negative
CHECK (early_bird_price IS NULL OR early_bird_price >= 0);

ALTER TABLE tickets ADD CONSTRAINT check_group_min_size_positive
CHECK (group_min_size IS NULL OR group_min_size > 0);

ALTER TABLE tickets ADD CONSTRAINT check_group_discount_percentage_range
CHECK (group_discount_percentage IS NULL OR (group_discount_percentage >= 0 AND group_discount_percentage <= 100));
-- Seed Data for Event Management System

-- Insert venues
INSERT INTO venues (id, name, address, city, country, capacity) VALUES
('550e8400-e29b-41d4-a716-446655440001', 'Convention Center Hall A', '123 Main Street', 'New York', 'USA', 1000),
('550e8400-e29b-41d4-a716-446655440002', 'Tech Hub Conference Room', '456 Innovation Ave', 'San Francisco', 'USA', 200),
('550e8400-e29b-41d4-a716-446655440003', 'Grand Ballroom', '789 Luxury Blvd', 'Los Angeles', 'USA', 500),
('550e8400-e29b-41d4-a716-446655440004', 'Community Center', '321 Local Street', 'Chicago', 'USA', 150),
('550e8400-e29b-41d4-a716-446655440005', 'Outdoor Festival Grounds', '555 Park Avenue', 'Austin', 'USA', 2000)
ON CONFLICT (id) DO NOTHING;

-- Insert admin user (password: admin123)
INSERT INTO users (id, first_name, last_name, email, password_hash, role, is_active, email_verified) VALUES
('550e8400-e29b-41d4-a716-446655440010', 'Super', 'Admin', 'admin@eventmanager.com', '$2b$10$rQZ8ZHWK2PYWNDMU/KyA8.9mICjVmqKSqN3vG6A3rMwUOJNhXk8v6', 'super_admin', true, true)
ON CONFLICT (id) DO NOTHING;

-- Insert additional users
INSERT INTO users (id, first_name, last_name, email, password_hash, role, is_active, email_verified) VALUES
('550e8400-e29b-41d4-a716-446655440011', 'John', 'Smith', 'john.smith@example.com', '$2b$10$rQZ8ZHWK2PYWNDMU/KyA8.9mICjVmqKSqN3vG6A3rMwUOJNhXk8v6', 'event_manager', true, true),
('550e8400-e29b-41d4-a716-446655440012', 'Sarah', 'Johnson', 'sarah.johnson@example.com', '$2b$10$rQZ8ZHWK2PYWNDMU/KyA8.9mICjVmqKSqN3vG6A3rMwUOJNhXk8v6', 'event_manager', true, true),
('550e8400-e29b-41d4-a716-446655440013', 'Mike', 'Wilson', 'mike.wilson@example.com', '$2b$10$rQZ8ZHWK2PYWNDMU/KyA8.9mICjVmqKSqN3vG6A3rMwUOJNhXk8v6', 'check_in_staff', true, true),
('550e8400-e29b-41d4-a716-446655440014', 'Emma', 'Davis', 'emma.davis@example.com', '$2b$10$rQZ8ZHWK2PYWNDMU/KyA8.9mICjVmqKSqN3vG6A3rMwUOJNhXk8v6', 'check_in_staff', true, true),
('550e8400-e29b-41d4-a716-446655440015', 'David', 'Brown', 'david.brown@example.com', '$2b$10$rQZ8ZHWK2PYWNDMU/KyA8.9mICjVmqKSqN3vG6A3rMwUOJNhXk8v6', 'event_manager', true, true),
('550e8400-e29b-41d4-a716-446655440016', 'Lisa', 'Anderson', 'lisa.anderson@example.com', '$2b$10$rQZ8ZHWK2PYWNDMU/KyA8.9mICjVmqKSqN3vG6A3rMwUOJNhXk8v6', 'check_in_staff', true, true),
('550e8400-e29b-41d4-a716-446655440017', 'Robert', 'Taylor', 'robert.taylor@example.com', '$2b$10$rQZ8ZHWK2PYWNDMU/KyA8.9mICjVmqKSqN3vG6A3rMwUOJNhXk8v6', 'event_manager', true, true),
('550e8400-e29b-41d4-a716-446655440018', 'Jennifer', 'White', 'jennifer.white@example.com', '$2b$10$rQZ8ZHWK2PYWNDMU/KyA8.9mICjVmqKSqN3vG6A3rMwUOJNhXk8v6', 'check_in_staff', true, true),
('550e8400-e29b-41d4-a716-446655440019', 'William', 'Martinez', 'william.martinez@example.com', '$2b$10$rQZ8ZHWK2PYWNDMU/KyA8.9mICjVmqKSqN3vG6A3rMwUOJNhXk8v6', 'event_manager', true, true)
ON CONFLICT (id) DO NOTHING;

-- Insert sample events
INSERT INTO events (id, title, description, short_description, venue_id, organizer_id, start_date, end_date, max_attendees, current_attendees, status, is_featured, tags) VALUES
('550e8400-e29b-41d4-a716-446655440020', 'Tech Innovation Summit 2024', 'Join us for the biggest tech innovation summit of the year. Features keynote speakers from leading tech companies, hands-on workshops, and networking opportunities with industry leaders.', 'Premier tech conference with keynotes and workshops', '550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440011', '2024-12-15 09:00:00', '2024-12-15 18:00:00', 500, 342, 'published', true, ARRAY['technology', 'innovation', 'networking']),
('550e8400-e29b-41d4-a716-446655440021', 'Digital Marketing Masterclass', 'Learn the latest digital marketing strategies from industry experts. This intensive workshop covers SEO, social media marketing, content strategy, and analytics.', 'Complete digital marketing training workshop', '550e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440012', '2024-11-28 10:00:00', '2024-11-28 17:00:00', 200, 156, 'published', false, ARRAY['marketing', 'digital', 'workshop']),
('550e8400-e29b-41d4-a716-446655440022', 'Startup Pitch Competition', 'Watch promising startups pitch their ideas to top venture capitalists. Network with entrepreneurs and investors in this exciting event.', 'Entrepreneurial pitch event with VCs', '550e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440015', '2024-12-05 14:00:00', '2024-12-05 20:00:00', 300, 278, 'published', true, ARRAY['startup', 'pitching', 'investors']),
('550e8400-e29b-41d4-a716-446655440023', 'AI & Machine Learning Conference', 'Explore the latest advancements in artificial intelligence and machine learning. Features technical sessions, demos, and expert panels.', 'Cutting-edge AI and ML conference', '550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440017', '2025-01-20 09:00:00', '2025-01-21 18:00:00', 800, 234, 'published', false, ARRAY['AI', 'machine learning', 'technology']),
('550e8400-e29b-41d4-a716-446655440024', 'Creative Design Workshop', 'Hands-on design workshop covering UI/UX principles, design thinking, and creative tools. Perfect for designers and creative professionals.', 'Interactive design and creativity workshop', '550e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440011', '2024-12-08 10:00:00', '2024-12-08 16:00:00', 50, 45, 'published', false, ARRAY['design', 'UI/UX', 'creative']),
('550e8400-e29b-41d4-a716-446655440025', 'Blockchain & Cryptocurrency Summit', 'Deep dive into blockchain technology, cryptocurrency markets, and decentralized finance. Features industry leaders and technical experts.', 'Comprehensive blockchain and crypto event', '550e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440019', '2025-02-10 09:00:00', '2025-02-10 18:00:00', 400, 89, 'published', true, ARRAY['blockchain', 'cryptocurrency', 'DeFi']),
('550e8400-e29b-41d4-a716-446655440026', 'Music & Arts Festival', 'A celebration of music and arts featuring live performances, art exhibitions, and interactive installations. Food trucks and vendors available.', 'Outdoor music and arts celebration', '550e8400-e29b-41d4-a716-446655440005', '550e8400-e29b-41d4-a716-446655440012', '2024-11-15 12:00:00', '2024-11-15 23:00:00', 2000, 1654, 'published', false, ARRAY['music', 'arts', 'festival']),
('550e8400-e29b-41d4-a716-446655440027', 'Health & Wellness Expo', 'Discover the latest in health, fitness, and wellness. Features yoga sessions, nutrition talks, and wellness product demonstrations.', 'Complete health and wellness exhibition', '550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440015', '2025-01-10 08:00:00', '2025-01-10 18:00:00', 600, 321, 'published', false, ARRAY['health', 'wellness', 'fitness'])
ON CONFLICT (id) DO NOTHING;

-- Insert tickets for events
INSERT INTO tickets (id, event_id, name, description, type, price, currency, quantity_available, quantity_sold, sale_start_date, sale_end_date) VALUES
-- Tech Innovation Summit tickets
('550e8400-e29b-41d4-a716-446655440030', '550e8400-e29b-41d4-a716-446655440020', 'General Admission', 'Access to all main sessions and networking areas', 'general', 199.00, 'USD', 300, 198, '2024-10-01 00:00:00', '2024-12-14 23:59:59'),
('550e8400-e29b-41d4-a716-446655440031', '550e8400-e29b-41d4-a716-446655440020', 'VIP Pass', 'General admission + VIP lunch + workshop access', 'vip', 399.00, 'USD', 100, 87, '2024-10-01 00:00:00', '2024-12-14 23:59:59'),
('550e8400-e29b-41d4-a716-446655440032', '550e8400-e29b-41d4-a716-446655440020', 'Student Ticket', 'Discounted rate for students with valid ID', 'student', 99.00, 'USD', 100, 57, '2024-10-01 00:00:00', '2024-12-14 23:59:59'),

-- Digital Marketing Masterclass tickets
('550e8400-e29b-41d4-a716-446655440033', '550e8400-e29b-41d4-a716-446655440021', 'Standard Registration', 'Full access to all workshop sessions', 'general', 299.00, 'USD', 150, 124, '2024-10-15 00:00:00', '2024-11-27 23:59:59'),
('550e8400-e29b-41d4-a716-446655440034', '550e8400-e29b-41d4-a716-446655440021', 'Early Bird', 'Discounted rate for early registration', 'early_bird', 199.00, 'USD', 50, 32, '2024-10-01 00:00:00', '2024-10-31 23:59:59'),

-- Startup Pitch Competition tickets
('550e8400-e29b-41d4-a716-446655440035', '550e8400-e29b-41d4-a716-446655440022', 'Attendee', 'General admission to pitch competition', 'general', 75.00, 'USD', 250, 198, '2024-10-01 00:00:00', '2024-12-04 23:59:59'),
('550e8400-e29b-41d4-a716-446655440036', '550e8400-e29b-41d4-a716-446655440022', 'Investor Pass', 'Special access for investors and VCs', 'vip', 150.00, 'USD', 50, 80, '2024-10-01 00:00:00', '2024-12-04 23:59:59'),

-- AI & Machine Learning Conference tickets
('550e8400-e29b-41d4-a716-446655440037', '550e8400-e29b-41d4-a716-446655440023', 'Conference Pass', 'Access to all conference sessions and exhibitions', 'general', 499.00, 'USD', 600, 156, '2024-11-01 00:00:00', '2025-01-19 23:59:59'),
('550e8400-e29b-41d4-a716-446655440038', '550e8400-e29b-41d4-a716-446655440023', 'Workshop Add-on', 'Additional hands-on workshop sessions', 'general', 199.00, 'USD', 200, 78, '2024-11-01 00:00:00', '2025-01-19 23:59:59'),

-- Creative Design Workshop tickets
('550e8400-e29b-41d4-a716-446655440039', '550e8400-e29b-41d4-a716-446655440024', 'Workshop Registration', 'Full day design workshop with materials', 'general', 149.00, 'USD', 50, 45, '2024-10-15 00:00:00', '2024-12-07 23:59:59'),

-- Blockchain & Cryptocurrency Summit tickets
('550e8400-e29b-41d4-a716-446655440040', '550e8400-e29b-41d4-a716-446655440025', 'Standard Access', 'Access to all summit presentations', 'general', 349.00, 'USD', 300, 67, '2024-11-15 00:00:00', '2025-02-09 23:59:59'),
('550e8400-e29b-41d4-a716-446655440041', '550e8400-e29b-41d4-a716-446655440025', 'Networking Pass', 'Standard access + exclusive networking events', 'vip', 599.00, 'USD', 100, 22, '2024-11-15 00:00:00', '2025-02-09 23:59:59'),

-- Music & Arts Festival tickets
('550e8400-e29b-41d4-a716-446655440042', '550e8400-e29b-41d4-a716-446655440026', 'General Admission', 'Access to all festival areas and performances', 'general', 45.00, 'USD', 1500, 1234, '2024-09-01 00:00:00', '2024-11-14 23:59:59'),
('550e8400-e29b-41d4-a716-446655440043', '550e8400-e29b-41d4-a716-446655440026', 'VIP Experience', 'GA + VIP seating + backstage access', 'vip', 125.00, 'USD', 500, 420, '2024-09-01 00:00:00', '2024-11-14 23:59:59'),

-- Health & Wellness Expo tickets
('550e8400-e29b-41d4-a716-446655440044', '550e8400-e29b-41d4-a716-446655440027', 'Expo Pass', 'Access to all expo areas and presentations', 'general', 25.00, 'USD', 500, 321, '2024-10-01 00:00:00', '2025-01-09 23:59:59'),
('550e8400-e29b-41d4-a716-446655440045', '550e8400-e29b-41d4-a716-446655440027', 'Full Access', 'Expo pass + workshop sessions + consultations', 'vip', 75.00, 'USD', 100, 0, '2024-10-01 00:00:00', '2025-01-09 23:59:59')
ON CONFLICT (id) DO NOTHING;

-- Insert sample registrations
INSERT INTO registrations (id, event_id, user_id, ticket_id, status, qr_code, notes) VALUES
-- Tech Innovation Summit registrations
('550e8400-e29b-41d4-a716-446655440050', '550e8400-e29b-41d4-a716-446655440020', '550e8400-e29b-41d4-a716-446655440011', '550e8400-e29b-41d4-a716-446655440030', 'confirmed', 'QR-TS-001-001', null),
('550e8400-e29b-41d4-a716-446655440051', '550e8400-e29b-41d4-a716-446655440020', '550e8400-e29b-41d4-a716-446655440012', '550e8400-e29b-41d4-a716-446655440031', 'confirmed', 'QR-TS-001-002', null),
('550e8400-e29b-41d4-a716-446655440052', '550e8400-e29b-41d4-a716-446655440020', '550e8400-e29b-41d4-a716-446655440015', '550e8400-e29b-41d4-a716-446655440030', 'checked_in', 'QR-TS-001-003', 'Early arrival'),
('550e8400-e29b-41d4-a716-446655440053', '550e8400-e29b-41d4-a716-446655440020', '550e8400-e29b-41d4-a716-446655440013', '550e8400-e29b-41d4-a716-446655440032', 'confirmed', 'QR-TS-001-004', 'Student ID verified'),
('550e8400-e29b-41d4-a716-446655440054', '550e8400-e29b-41d4-a716-446655440020', '550e8400-e29b-41d4-a716-446655440014', '550e8400-e29b-41d4-a716-446655440030', 'confirmed', 'QR-TS-001-005', null),
('550e8400-e29b-41d4-a716-446655440055', '550e8400-e29b-41d4-a716-446655440020', '550e8400-e29b-41d4-a716-446655440017', '550e8400-e29b-41d4-a716-446655440031', 'confirmed', 'QR-TS-001-006', null),

-- Digital Marketing Masterclass registrations
('550e8400-e29b-41d4-a716-446655440056', '550e8400-e29b-41d4-a716-446655440021', '550e8400-e29b-41d4-a716-446655440019', '550e8400-e29b-41d4-a716-446655440033', 'confirmed', 'QR-MM-001-001', null),
('550e8400-e29b-41d4-a716-446655440057', '550e8400-e29b-41d4-a716-446655440021', '550e8400-e29b-41d4-a716-446655440011', '550e8400-e29b-41d4-a716-446655440034', 'confirmed', 'QR-MM-001-002', 'Early bird registration'),
('550e8400-e29b-41d4-a716-446655440058', '550e8400-e29b-41d4-a716-446655440021', '550e8400-e29b-41d4-a716-446655440018', '550e8400-e29b-41d4-a716-446655440033', 'confirmed', 'QR-MM-001-003', null),

-- Startup Pitch Competition registrations
('550e8400-e29b-41d4-a716-446655440059', '550e8400-e29b-41d4-a716-446655440022', '550e8400-e29b-41d4-a716-446655440012', '550e8400-e29b-41d4-a716-446655440036', 'confirmed', 'QR-SP-001-001', 'Investor registration'),
('550e8400-e29b-41d4-a716-446655440060', '550e8400-e29b-41d4-a716-446655440022', '550e8400-e29b-41d4-a716-446655440015', '550e8400-e29b-41d4-a716-446655440035', 'confirmed', 'QR-SP-001-002', null),
('550e8400-e29b-41d4-a716-446655440061', '550e8400-e29b-41d4-a716-446655440022', '550e8400-e29b-41d4-a716-446655440017', '550e8400-e29b-41d4-a716-446655440035', 'checked_in', 'QR-SP-001-003', 'Checked in early'),

-- Music & Arts Festival registrations (more sample data)
('550e8400-e29b-41d4-a716-446655440062', '550e8400-e29b-41d4-a716-446655440026', '550e8400-e29b-41d4-a716-446655440011', '550e8400-e29b-41d4-a716-446655440043', 'confirmed', 'QR-MA-001-001', 'VIP pass'),
('550e8400-e29b-41d4-a716-446655440063', '550e8400-e29b-41d4-a716-446655440026', '550e8400-e29b-41d4-a716-446655440012', '550e8400-e29b-41d4-a716-446655440042', 'confirmed', 'QR-MA-001-002', null),
('550e8400-e29b-41d4-a716-446655440064', '550e8400-e29b-41d4-a716-446655440026', '550e8400-e29b-41d4-a716-446655440013', '550e8400-e29b-41d4-a716-446655440042', 'confirmed', 'QR-MA-001-003', null),
('550e8400-e29b-41d4-a716-446655440065', '550e8400-e29b-41d4-a716-446655440026', '550e8400-e29b-41d4-a716-446655440014', '550e8400-e29b-41d4-a716-446655440043', 'checked_in', 'QR-MA-001-004', 'VIP arrived'),
('550e8400-e29b-41d4-a716-446655440066', '550e8400-e29b-41d4-a716-446655440026', '550e8400-e29b-41d4-a716-446655440015', '550e8400-e29b-41d4-a716-446655440042', 'confirmed', 'QR-MA-001-005', null)
ON CONFLICT (id) DO NOTHING;

-- Insert check-ins
INSERT INTO checkins (id, registration_id, checked_in_by, method, notes) VALUES
('550e8400-e29b-41d4-a716-446655440070', '550e8400-e29b-41d4-a716-446655440052', '550e8400-e29b-41d4-a716-446655440013', 'manual', 'Early check-in for VIP'),
('550e8400-e29b-41d4-a716-446655440071', '550e8400-e29b-41d4-a716-446655440061', '550e8400-e29b-41d4-a716-446655440018', 'qr_code', 'QR code scanned successfully'),
('550e8400-e29b-41d4-a716-446655440072', '550e8400-e29b-41d4-a716-446655440065', '550e8400-e29b-41d4-a716-446655440016', 'qr_code', 'VIP guest with backstage access')
ON CONFLICT (id) DO NOTHING;

-- Insert communications
INSERT INTO communications (id, subject, type, recipient_type, content, status, event_id, sender_id, created_at, sent_at) VALUES
('550e8400-e29b-41d4-a716-446655440080', 'Welcome to Tech Innovation Summit 2024!', 'email', 'event', 'Dear {first_name},\n\nThank you for registering for Tech Innovation Summit 2024! We''re excited to have you join us for this incredible event.\n\nEvent Details:\n• Date: December 15, 2024\n• Time: 9:00 AM - 6:00 PM\n• Venue: Convention Center Hall A\n\nPlease arrive 30 minutes early for check-in. Don''t forget to bring your ID and registration confirmation.\n\nBest regards,\nThe Event Team', 'sent', '550e8400-e29b-41d4-a716-446655440020', '550e8400-e29b-41d4-a716-446655440011', '2024-11-15 10:00:00', '2024-11-15 10:05:00'),

('550e8400-e29b-41d4-a716-446655440081', 'Reminder: Digital Marketing Masterclass Tomorrow', 'email', 'event', 'Hi {first_name},\n\nThis is a friendly reminder that your Digital Marketing Masterclass is scheduled for tomorrow, November 28th.\n\nWorkshop Details:\n• Date: November 28, 2024\n• Time: 10:00 AM - 5:00 PM\n• Location: Tech Hub Conference Room\n\nPlease bring your laptop and any questions you might have. Coffee and lunch will be provided.\n\nSee you there!\nSarah Johnson', 'sent', '550e8400-e29b-41d4-a716-446655440021', '550e8400-e29b-41d4-a716-446655440012', '2024-11-27 15:00:00', '2024-11-27 15:30:00'),

('550e8400-e29b-41d4-a716-446655440082', 'Last Chance: Startup Pitch Competition Tickets', 'email', 'all', 'Limited seats available for tomorrow''s Startup Pitch Competition!\n\nJoin us to see promising startups pitch to top VCs and investors. Network with entrepreneurs and industry leaders.\n\nWhen: December 5, 2024, 2:00 PM - 8:00 PM\nWhere: Grand Ballroom\n\nGet your tickets now before they sell out!\n\nRegister here: [event link]', 'sent', null, '550e8400-e29b-41d4-a716-446655440012', '2024-12-04 09:00:00', '2024-12-04 09:15:00'),

('550e8400-e29b-41d4-a716-446655440083', 'Thank You for Attending Music & Arts Festival!', 'email', 'event', 'Dear {first_name},\n\nThank you so much for attending our Music & Arts Festival! We hope you had an amazing time.\n\nWe''d love to hear your feedback about the event. Your input helps us make future events even better.\n\nStay tuned for more exciting events coming soon!\n\nBest wishes,\nThe Festival Team', 'draft', '550e8400-e29b-41d4-a716-446655440026', '550e8400-e29b-41d4-a716-446655440011', '2024-11-16 11:00:00', null)
ON CONFLICT (id) DO NOTHING;

-- Insert analytics data
INSERT INTO analytics (id, event_id, metric_type, metric_value, recorded_at, metadata) VALUES
-- Tech Innovation Summit analytics
('550e8400-e29b-41d4-a716-446655440090', '550e8400-e29b-41d4-a716-446655440020', 'registrations', 342, '2024-11-15 23:59:59', '{"daily_registrations": 12}'),
('550e8400-e29b-41d4-a716-446655440091', '550e8400-e29b-41d4-a716-446655440020', 'revenue', 85658.00, '2024-11-15 23:59:59', '{"ticket_sales": {"general": 198, "vip": 87, "student": 57}}'),
('550e8400-e29b-41d4-a716-446655440092', '550e8400-e29b-41d4-a716-446655440020', 'attendance_rate', 68.4, '2024-11-15 23:59:59', '{"checked_in": 234, "total_registered": 342}'),

-- Digital Marketing Masterclass analytics
('550e8400-e29b-41d4-a716-446655440093', '550e8400-e29b-41d4-a716-446655440021', 'registrations', 156, '2024-11-15 23:59:59', '{"daily_registrations": 8}'),
('550e8400-e29b-41d4-a716-446655440094', '550e8400-e29b-41d4-a716-446655440021', 'revenue', 38426.00, '2024-11-15 23:59:59', '{"ticket_sales": {"standard": 124, "early_bird": 32}}'),

-- Music & Arts Festival analytics
('550e8400-e29b-41d4-a716-446655440095', '550e8400-e29b-41d4-a716-446655440026', 'registrations', 1654, '2024-11-15 23:59:59', '{"daily_registrations": 45}'),
('550e8400-e29b-41d4-a716-446655440096', '550e8400-e29b-41d4-a716-446655440026', 'revenue', 84285.00, '2024-11-15 23:59:59', '{"ticket_sales": {"general": 1234, "vip": 420}}'),
('550e8400-e29b-41d4-a716-446655440097', '550e8400-e29b-41d4-a716-446655440026', 'attendance_rate', 82.7, '2024-11-15 23:59:59', '{"checked_in": 1368, "total_registered": 1654}'),

-- Overall system analytics
('550e8400-e29b-41d4-a716-446655440098', null, 'total_events', 8, '2024-11-15 23:59:59', '{"active_events": 8, "past_events": 0}'),
('550e8400-e29b-41d4-a716-446655440099', null, 'total_users', 10, '2024-11-15 23:59:59', '{"active_users": 10, "roles": {"admin": 1, "event_manager": 4, "check_in_staff": 3}}'),
('550e8400-e29b-41d4-a716-446655440100', null, 'total_registrations', 2156, '2024-11-15 23:59:59', '{"confirmed": 2000, "checked_in": 1602}'),
('550e8400-e29b-41d4-a716-446655440101', null, 'total_revenue', 208369.00, '2024-11-15 23:59:59', '{"currency": "USD", "events_revenue": {"tech_summit": 85658, "marketing_class": 38426, "festival": 84285}}')
ON CONFLICT (id) DO NOTHING;
-- ============================================
-- FLIGHT CHECKER DATABASE
-- ============================================

-- AIRPORTS TABLE
CREATE TABLE airports (
    airport_code VARCHAR(3) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    city VARCHAR(50) NOT NULL,
    country VARCHAR(50) DEFAULT 'Vietnam',
    lounges TEXT[],
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- FLIGHTS TABLE
CREATE TABLE flights (
    id SERIAL PRIMARY KEY,
    flight_code VARCHAR(10) UNIQUE NOT NULL,
    airline VARCHAR(50) NOT NULL,
    from_airport VARCHAR(3) REFERENCES airports(airport_code),
    to_airport VARCHAR(3) REFERENCES airports(airport_code),
    departure_time TIME NOT NULL,
    arrival_time TIME NOT NULL,
    status VARCHAR(20) DEFAULT 'On Time',
    gate VARCHAR(10),
    terminal VARCHAR(5),
    aircraft VARCHAR(20),
    price INTEGER,
    delay_minutes INTEGER DEFAULT 0,
    delay_reason TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- WEATHER TABLE
CREATE TABLE weather (
    id SERIAL PRIMARY KEY,
    airport_code VARCHAR(3) UNIQUE REFERENCES airports(airport_code),
    temperature INTEGER NOT NULL,
    condition VARCHAR(50) NOT NULL,
    humidity INTEGER,
    wind_speed VARCHAR(20),
    visibility VARCHAR(20) DEFAULT 'Good',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- BOOKINGS TABLE
CREATE TABLE bookings (
    id SERIAL PRIMARY KEY,
    booking_code VARCHAR(10) UNIQUE NOT NULL,
    flight_code VARCHAR(10) REFERENCES flights(flight_code),
    passenger_name VARCHAR(100) NOT NULL,
    passenger_email VARCHAR(100),
    passenger_phone VARCHAR(20),
    seat_number VARCHAR(5),
    ticket_price INTEGER,
    status VARCHAR(20) DEFAULT 'Confirmed',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- INDEXES
CREATE INDEX idx_flights_route ON flights(from_airport, to_airport);
CREATE INDEX idx_flights_status ON flights(status);
CREATE INDEX idx_weather_airport ON weather(airport_code);

-- ============================================
-- SEED DATA - AIRPORTS
-- ============================================
INSERT INTO airports (airport_code, name, city, lounges) VALUES
('SGN', 'Tan Son Nhat International Airport', 'Ho Chi Minh City', ARRAY['CIP Orchid Lounge', 'Le Saigonnais Lounge', 'SASCO Business Lounge']),
('HAN', 'Noi Bai International Airport', 'Hanoi', ARRAY['Song Hong Business Lounge', 'Noi Bai Premium Lounge', 'VietJet Sky Lounge']),
('DAD', 'Da Nang International Airport', 'Da Nang', ARRAY['CIP Lounge', 'Lotus Lounge']),
('PQC', 'Phu Quoc International Airport', 'Phu Quoc', ARRAY['Pearl Lounge', 'Coral Lounge']),
('CXR', 'Cam Ranh International Airport', 'Nha Trang', ARRAY['Sky Lounge']),
('VDO', 'Van Don International Airport', 'Quang Ninh', ARRAY['Ha Long Lounge']);

-- ============================================
-- SEED DATA - FLIGHTS
-- ============================================
INSERT INTO flights (flight_code, airline, from_airport, to_airport, departure_time, arrival_time, status, gate, terminal, aircraft, price, delay_minutes, delay_reason) VALUES
('VN123', 'Vietnam Airlines', 'SGN', 'HAN', '08:00', '10:15', 'On Time', 'A12', '1', 'Airbus A321', 1500000, 0, NULL),
('VN456', 'Vietnam Airlines', 'HAN', 'DAD', '14:30', '15:45', 'Delayed', 'B5', '2', 'Airbus A320', 1200000, 45, 'Weather conditions at destination'),
('VN789', 'Vietnam Airlines', 'SGN', 'PQC', '11:00', '12:00', 'On Time', 'A8', '1', 'ATR 72', 950000, 0, NULL),
('VN234', 'Vietnam Airlines', 'HAN', 'SGN', '16:00', '18:15', 'On Time', 'B10', '2', 'Boeing 787', 1800000, 0, NULL),
('VN567', 'Vietnam Airlines', 'DAD', 'SGN', '19:00', '20:20', 'On Time', 'C3', '1', 'Airbus A321', 1100000, 0, NULL),
('VJ789', 'VietJet Air', 'SGN', 'PQC', '09:15', '10:15', 'Boarding', 'C8', '1', 'Airbus A321', 890000, 0, NULL),
('VJ123', 'VietJet Air', 'HAN', 'SGN', '07:00', '09:15', 'On Time', 'D2', '1', 'Airbus A320', 750000, 0, NULL),
('VJ456', 'VietJet Air', 'SGN', 'DAD', '13:00', '14:20', 'Delayed', 'C12', '1', 'Airbus A321', 680000, 30, 'Air traffic control delay'),
('VJ890', 'VietJet Air', 'DAD', 'HAN', '15:30', '16:45', 'On Time', 'D5', '1', 'Airbus A320', 720000, 0, NULL),
('QH101', 'Bamboo Airways', 'HAN', 'SGN', '16:00', '18:15', 'Cancelled', NULL, NULL, 'Boeing 787', 1800000, 0, 'Technical issues with aircraft'),
('QH202', 'Bamboo Airways', 'SGN', 'HAN', '20:00', '22:15', 'On Time', 'A15', '1', 'Airbus A321', 1650000, 0, NULL),
('QH303', 'Bamboo Airways', 'SGN', 'PQC', '14:00', '15:00', 'On Time', 'A10', '1', 'Embraer 190', 1100000, 0, NULL),
('BL101', 'Pacific Airlines', 'SGN', 'HAN', '06:00', '08:15', 'On Time', 'B1', '2', 'Airbus A320', 650000, 0, NULL),
('BL202', 'Pacific Airlines', 'HAN', 'DAD', '10:00', '11:15', 'Delayed', 'B8', '2', 'Airbus A321', 580000, 60, 'Crew scheduling issue');

-- ============================================
-- SEED DATA - WEATHER
-- ============================================
INSERT INTO weather (airport_code, temperature, condition, humidity, wind_speed, visibility) VALUES
('SGN', 32, 'Sunny', 75, '10 km/h', 'Excellent'),
('HAN', 28, 'Cloudy', 80, '15 km/h', 'Good'),
('DAD', 30, 'Partly Cloudy', 70, '12 km/h', 'Good'),
('PQC', 31, 'Clear', 78, '8 km/h', 'Excellent'),
('CXR', 29, 'Sunny', 72, '14 km/h', 'Excellent'),
('VDO', 26, 'Foggy', 85, '5 km/h', 'Moderate');

-- ============================================
-- SEED DATA - BOOKINGS
-- ============================================
INSERT INTO bookings (booking_code, flight_code, passenger_name, passenger_email, passenger_phone, seat_number, ticket_price, status) VALUES
('BK001', 'VN123', 'Nguyen Van A', 'nguyenvana@email.com', '0901234567', '12A', 1500000, 'Confirmed'),
('BK002', 'VN456', 'Tran Thi B', 'tranthib@email.com', '0912345678', '15C', 1200000, 'Confirmed'),
('BK003', 'VJ789', 'Le Van C', 'levanc@email.com', '0923456789', '8B', 890000, 'Checked In'),
('BK004', 'QH101', 'Pham Thi D', 'phamthid@email.com', '0934567890', '20A', 1800000, 'Cancelled');

-- ============================================
-- VIEWS
-- ============================================
CREATE OR REPLACE VIEW v_flight_details AS
SELECT 
    f.flight_code,
    f.airline,
    f.from_airport,
    a1.name as from_airport_name,
    a1.city as from_city,
    f.to_airport,
    a2.name as to_airport_name,
    a2.city as to_city,
    f.departure_time,
    f.arrival_time,
    f.status,
    f.gate,
    f.terminal,
    f.aircraft,
    f.price,
    f.delay_minutes,
    f.delay_reason,
    w.temperature as dest_temperature,
    w.condition as dest_weather
FROM flights f
JOIN airports a1 ON f.from_airport = a1.airport_code
JOIN airports a2 ON f.to_airport = a2.airport_code
LEFT JOIN weather w ON f.to_airport = w.airport_code;

CREATE OR REPLACE VIEW v_disrupted_flights AS
SELECT * FROM v_flight_details
WHERE status IN ('Delayed', 'Cancelled');

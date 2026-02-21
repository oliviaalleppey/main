-- Create outlet_status enum if it doesn't exist
DO $$ BEGIN
    CREATE TYPE outlet_status AS ENUM('operational', 'upcoming', 'temporarily_closed');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create dining_outlets table
CREATE TABLE IF NOT EXISTS dining_outlets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    short_description TEXT,
    
    -- Operational Details
    capacity INTEGER,
    opening_time VARCHAR(20),
    closing_time VARCHAR(20),
    operating_hours VARCHAR(100),
    
    -- Cuisine & Type
    cuisine_type VARCHAR(255),
    outlet_type VARCHAR(50),
    
    -- Location
    location VARCHAR(100),
    floor INTEGER,
    
    -- Status
    status outlet_status DEFAULT 'operational',
    
    -- Images
    featured_image TEXT,
    images JSONB DEFAULT '[]'::jsonb,
    
    -- Contact
    phone VARCHAR(20),
    email VARCHAR(255),
    
    -- Display
    is_featured BOOLEAN DEFAULT false,
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    
    -- Menu
    menu_url TEXT,
    
    -- Special Features
    special_features JSONB DEFAULT '[]'::jsonb,
    dress_code VARCHAR(100),
    reservation_required BOOLEAN DEFAULT false,
    
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

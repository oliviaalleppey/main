import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL!);

async function createVenuesTable() {
    console.log('Creating venues table...');

    try {
        // Create enums
        await sql`
            DO $$ BEGIN
                CREATE TYPE venue_type AS ENUM('ballroom', 'meeting_room', 'outdoor', 'boardroom', 'conference_hall');
            EXCEPTION
                WHEN duplicate_object THEN null;
            END $$;
        `;
        console.log('✓ venue_type enum created/verified');

        await sql`
            DO $$ BEGIN
                CREATE TYPE seating_style AS ENUM('theatre', 'cluster', 'classroom', 'u_shape', 'boardroom', 'banquet', 'cocktail');
            EXCEPTION
                WHEN duplicate_object THEN null;
            END $$;
        `;
        console.log('✓ seating_style enum created/verified');

        // Create table
        await sql`
            CREATE TABLE IF NOT EXISTS venues (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                name VARCHAR(255) NOT NULL,
                slug VARCHAR(255) NOT NULL UNIQUE,
                description TEXT,
                short_description TEXT,
                
                venue_type venue_type NOT NULL,
                
                length DECIMAL(10, 2),
                width DECIMAL(10, 2),
                height DECIMAL(10, 2),
                area INTEGER,
                
                capacity_theatre INTEGER,
                capacity_cluster VARCHAR(50),
                capacity_classroom INTEGER,
                capacity_u_shape INTEGER,
                capacity_boardroom INTEGER,
                capacity_banquet INTEGER,
                capacity_cocktail INTEGER,
                
                is_divisible BOOLEAN DEFAULT false,
                has_natural_light BOOLEAN DEFAULT false,
                has_av BOOLEAN DEFAULT true,
                has_wifi BOOLEAN DEFAULT true,
                has_projector BOOLEAN DEFAULT false,
                has_whiteboard BOOLEAN DEFAULT false,
                has_stage BOOLEAN DEFAULT false,
                has_dance_floor BOOLEAN DEFAULT false,
                
                floor INTEGER,
                location VARCHAR(100),
                
                featured_image TEXT,
                images JSONB DEFAULT '[]'::jsonb,
                floor_plan TEXT,
                
                half_day_rate DECIMAL(10, 2),
                full_day_rate DECIMAL(10, 2),
                
                is_featured BOOLEAN DEFAULT false,
                sort_order INTEGER DEFAULT 0,
                is_active BOOLEAN DEFAULT true,
                
                equipment JSONB DEFAULT '[]'::jsonb,
                amenities JSONB DEFAULT '[]'::jsonb,
                suitable_for JSONB DEFAULT '[]'::jsonb,
                
                created_at TIMESTAMP DEFAULT NOW(),
                updated_at TIMESTAMP DEFAULT NOW()
            );
        `;
        console.log('✓ Venues table created successfully!');
    } catch (error) {
        console.error('Error creating table:', error);
        throw error;
    }
}

createVenuesTable()
    .then(() => {
        console.log('Done!');
        process.exit(0);
    })
    .catch((error) => {
        console.error('Failed:', error);
        process.exit(1);
    });

import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL!);

async function createDiningTable() {
    console.log('Creating dining_outlets table...');

    try {
        // Create enum
        await sql`
            DO $$ BEGIN
                CREATE TYPE outlet_status AS ENUM('operational', 'upcoming', 'temporarily_closed');
            EXCEPTION
                WHEN duplicate_object THEN null;
            END $$;
        `;
        console.log('✓ Enum created/verified');

        // Create table
        await sql`
            CREATE TABLE IF NOT EXISTS dining_outlets (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                name VARCHAR(255) NOT NULL,
                slug VARCHAR(255) NOT NULL UNIQUE,
                description TEXT,
                short_description TEXT,
                
                capacity INTEGER,
                opening_time VARCHAR(20),
                closing_time VARCHAR(20),
                operating_hours VARCHAR(100),
                
                cuisine_type VARCHAR(255),
                outlet_type VARCHAR(50),
                
                location VARCHAR(100),
                floor INTEGER,
                
                status outlet_status DEFAULT 'operational',
                
                featured_image TEXT,
                images JSONB DEFAULT '[]'::jsonb,
                
                phone VARCHAR(20),
                email VARCHAR(255),
                
                is_featured BOOLEAN DEFAULT false,
                sort_order INTEGER DEFAULT 0,
                is_active BOOLEAN DEFAULT true,
                
                menu_url TEXT,
                
                special_features JSONB DEFAULT '[]'::jsonb,
                dress_code VARCHAR(100),
                reservation_required BOOLEAN DEFAULT false,
                
                created_at TIMESTAMP DEFAULT NOW(),
                updated_at TIMESTAMP DEFAULT NOW()
            );
        `;
        console.log('✓ Table created successfully!');
    } catch (error) {
        console.error('Error creating table:', error);
        throw error;
    }
}

createDiningTable()
    .then(() => {
        console.log('Done!');
        process.exit(0);
    })
    .catch((error) => {
        console.error('Failed:', error);
        process.exit(1);
    });

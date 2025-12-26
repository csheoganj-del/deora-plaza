import { createClient } from '@supabase/supabase-js';

// Supabase configuration - hardcoded values from your .env file
const supabaseUrl = 'https://wjqsqwitgxqypzbaayos.supabase.co';
const supabaseServiceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndqcXNxd2l0Z3hxeXB6YmFheW9zIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTM1MjM2MywiZXhwIjoyMDgwOTI4MzYzfQ.0jTsgFT39ZVD-kf9qIMb5zmn281LHR7J_803_gYuofY';

// Create Supabase client with service role key for admin operations
const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

async function initializeRooms() {
  try {
    console.log('🚀 Initializing hotel rooms...');
    
    // Sample rooms data
    const sampleRooms = [
      {
        number: '101',
        type: 'Standard',
        price: 2500,
        capacity: 2,
        status: 'available',
        floor: 1,
        amenities: ['WiFi', 'TV', 'AC'],
        description: 'Cozy standard room with essential amenities'
      },
      {
        number: '102',
        type: 'Standard',
        price: 2500,
        capacity: 2,
        status: 'available',
        floor: 1,
        amenities: ['WiFi', 'TV', 'AC'],
        description: 'Comfortable standard room'
      },
      {
        number: '103',
        type: 'Deluxe',
        price: 3500,
        capacity: 2,
        status: 'available',
        floor: 1,
        amenities: ['WiFi', 'TV', 'AC', 'Mini Bar'],
        description: 'Spacious deluxe room with premium amenities'
      },
      {
        number: '201',
        type: 'Deluxe',
        price: 3500,
        capacity: 2,
        status: 'available',
        floor: 2,
        amenities: ['WiFi', 'TV', 'AC', 'Mini Bar'],
        description: 'Deluxe room with city view'
      },
      {
        number: '202',
        type: 'Suite',
        price: 5000,
        capacity: 4,
        status: 'available',
        floor: 2,
        amenities: ['WiFi', 'TV', 'AC', 'Mini Bar', 'Kitchenette', 'Balcony'],
        description: 'Luxurious suite with kitchenette and balcony'
      },
      {
        number: '301',
        type: 'Suite',
        price: 6000,
        capacity: 4,
        status: 'available',
        floor: 3,
        amenities: ['WiFi', 'TV', 'AC', 'Mini Bar', 'Kitchenette', 'Balcony', 'Jacuzzi'],
        description: 'Premium suite with jacuzzi and panoramic view'
      }
    ];

    // Add timestamps to all rooms
    const roomsWithTimestamps = sampleRooms.map(room => ({
      ...room,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }));

    console.log('_roomsWithTimestamps:', roomsWithTimestamps);

    // Insert sample rooms
    const { error: roomsError } = await supabase
      .from('rooms')
      .upsert(roomsWithTimestamps, {
        onConflict: 'number'
      });

    if (roomsError) {
      console.error('❌ Error initializing rooms:', roomsError.message);
      process.exit(1);
    }

    console.log('✅ Hotel rooms initialized successfully\n');
    
    // Verify rooms were created
    const { data: rooms, error: fetchError } = await supabase
      .from('rooms')
      .select('*')
      .limit(10);

    if (fetchError) {
      console.error('❌ Error fetching rooms:', fetchError.message);
    } else {
      console.log(`📋 Created ${rooms?.length || 0} sample rooms:`);
      rooms?.forEach(room => {
        console.log(`   • Room ${room.number} (${room.type}) - ₹${room.price}/night`);
      });
    }

    console.log('\n🎉 Room initialization completed!');
    process.exit(0);
  } catch (error) {
    console.error('💥 Unexpected error during room initialization:', error);
    process.exit(1);
  }
}

// Run the initialization
initializeRooms();
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Clean existing data
  await prisma.auditLog.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.message.deleteMany();
  await prisma.favorite.deleteMany();
  await prisma.discount.deleteMany();
  await prisma.review.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.reservation.deleteMany();
  await prisma.roomAvailability.deleteMany();
  await prisma.room.deleteMany();
  await prisma.hotel.deleteMany();
  await prisma.user.deleteMany();

  const hashedPassword = await bcrypt.hash('Password123', 12);

  // ─── Users ──────────────────────────────────────────────────────
  const admin = await prisma.user.create({
    data: {
      email: 'admin@hotelbooking.com',
      password: hashedPassword,
      firstName: 'Admin',
      lastName: 'User',
      role: 'ADMIN',
      emailVerified: true,
    },
  });

  const owner1 = await prisma.user.create({
    data: {
      email: 'owner@grandhotel.com',
      password: hashedPassword,
      firstName: 'James',
      lastName: 'Anderson',
      role: 'OWNER',
      emailVerified: true,
    },
  });

  const owner2 = await prisma.user.create({
    data: {
      email: 'owner@seasideresort.com',
      password: hashedPassword,
      firstName: 'Sarah',
      lastName: 'Mitchell',
      role: 'OWNER',
      emailVerified: true,
    },
  });

  const customer1 = await prisma.user.create({
    data: {
      email: 'john@example.com',
      password: hashedPassword,
      firstName: 'John',
      lastName: 'Doe',
      role: 'CUSTOMER',
      emailVerified: true,
    },
  });

  const customer2 = await prisma.user.create({
    data: {
      email: 'jane@example.com',
      password: hashedPassword,
      firstName: 'Jane',
      lastName: 'Smith',
      role: 'CUSTOMER',
      emailVerified: true,
    },
  });

  console.log('✅ Users created');

  // ─── Hotels ─────────────────────────────────────────────────────
  const hotel1 = await prisma.hotel.create({
    data: {
      name: 'The Grand Palace Hotel',
      description: 'Experience luxury at its finest in the heart of New York City. Our 5-star hotel offers breathtaking views of Central Park, world-class dining, and unparalleled service. Each room is meticulously designed with modern amenities and classic elegance.',
      address: '123 Park Avenue',
      city: 'New York',
      country: 'United States',
      latitude: 40.7589,
      longitude: -73.9851,
      stars: 5,
      amenities: ['WiFi', 'Pool', 'Spa', 'Gym', 'Restaurant', 'Bar', 'Parking', 'Room Service', 'Concierge', 'Business Center'],
      images: [],
      ownerId: owner1.id,
    },
  });

  const hotel2 = await prisma.hotel.create({
    data: {
      name: 'Seaside Paradise Resort',
      description: 'Escape to paradise with our stunning beachfront resort. Enjoy pristine white sand beaches, crystal-clear waters, and tropical gardens. Perfect for romantic getaways and family vacations alike.',
      address: '456 Ocean Drive',
      city: 'Miami',
      country: 'United States',
      latitude: 25.7617,
      longitude: -80.1918,
      stars: 4,
      amenities: ['WiFi', 'Pool', 'Beach Access', 'Spa', 'Restaurant', 'Water Sports', 'Kids Club', 'Parking'],
      images: [],
      ownerId: owner2.id,
    },
  });

  const hotel3 = await prisma.hotel.create({
    data: {
      name: 'Mountain View Lodge',
      description: 'Nestled in the stunning Rocky Mountains, our lodge offers a perfect retreat for nature lovers. Enjoy hiking trails, ski slopes, and cozy fireside evenings with panoramic mountain views.',
      address: '789 Alpine Road',
      city: 'Denver',
      country: 'United States',
      latitude: 39.7392,
      longitude: -104.9903,
      stars: 4,
      amenities: ['WiFi', 'Fireplace', 'Ski Storage', 'Restaurant', 'Hot Tub', 'Hiking Trails', 'Parking'],
      images: [],
      ownerId: owner1.id,
    },
  });

  const hotel4 = await prisma.hotel.create({
    data: {
      name: 'Urban Boutique Hotel',
      description: 'A stylish boutique hotel in downtown San Francisco. Features contemporary design, artisan coffee bar, rooftop terrace with bay views, and walkable access to the city\'s best attractions.',
      address: '321 Market Street',
      city: 'San Francisco',
      country: 'United States',
      latitude: 37.7749,
      longitude: -122.4194,
      stars: 3,
      amenities: ['WiFi', 'Coffee Bar', 'Rooftop Terrace', 'Gym', 'Bike Rental', 'Coworking Space'],
      images: [],
      ownerId: owner2.id,
    },
  });

  console.log('✅ Hotels created');

  // ─── Rooms ──────────────────────────────────────────────────────
  const rooms = await Promise.all([
    // Grand Palace Hotel rooms
    prisma.room.create({
      data: {
        name: 'Standard King Room',
        description: 'Elegant room with king-size bed, city views, and marble bathroom',
        type: 'Standard',
        pricePerNight: 299,
        capacity: 2,
        quantity: 20,
        amenities: ['King Bed', 'City View', 'Minibar', 'Safe', 'Coffee Maker'],
        hotelId: hotel1.id,
      },
    }),
    prisma.room.create({
      data: {
        name: 'Deluxe Suite',
        description: 'Spacious suite with separate living area, Central Park views, and luxury amenities',
        type: 'Suite',
        pricePerNight: 599,
        capacity: 3,
        quantity: 10,
        amenities: ['King Bed', 'Park View', 'Living Area', 'Jacuzzi', 'Butler Service'],
        hotelId: hotel1.id,
      },
    }),
    prisma.room.create({
      data: {
        name: 'Presidential Suite',
        description: 'The ultimate luxury experience with panoramic views, private terrace, and personal concierge',
        type: 'Presidential',
        pricePerNight: 1499,
        capacity: 4,
        quantity: 2,
        amenities: ['Master Bedroom', 'Panoramic View', 'Private Terrace', 'Dining Room', 'Personal Concierge'],
        hotelId: hotel1.id,
      },
    }),
    // Seaside Paradise Resort rooms
    prisma.room.create({
      data: {
        name: 'Ocean View Room',
        description: 'Bright and airy room with stunning ocean views and private balcony',
        type: 'Standard',
        pricePerNight: 249,
        capacity: 2,
        quantity: 30,
        amenities: ['Queen Bed', 'Ocean View', 'Balcony', 'Minibar'],
        hotelId: hotel2.id,
      },
    }),
    prisma.room.create({
      data: {
        name: 'Beachfront Villa',
        description: 'Private villa steps from the beach with plunge pool and outdoor shower',
        type: 'Villa',
        pricePerNight: 899,
        capacity: 4,
        quantity: 5,
        amenities: ['King Bed', 'Beachfront', 'Plunge Pool', 'Outdoor Shower', 'Kitchen'],
        hotelId: hotel2.id,
      },
    }),
    // Mountain View Lodge rooms
    prisma.room.create({
      data: {
        name: 'Mountain Cabin',
        description: 'Cozy cabin with fireplace and mountain views',
        type: 'Cabin',
        pricePerNight: 179,
        capacity: 2,
        quantity: 15,
        amenities: ['Queen Bed', 'Fireplace', 'Mountain View', 'Coffee Maker'],
        hotelId: hotel3.id,
      },
    }),
    prisma.room.create({
      data: {
        name: 'Family Lodge Suite',
        description: 'Spacious suite perfect for families with kids',
        type: 'Suite',
        pricePerNight: 349,
        capacity: 6,
        quantity: 8,
        amenities: ['2 Queen Beds', 'Mountain View', 'Fireplace', 'Kitchenette', 'Bunk Beds'],
        hotelId: hotel3.id,
      },
    }),
    // Urban Boutique Hotel rooms
    prisma.room.create({
      data: {
        name: 'Studio Room',
        description: 'Modern studio with workspace and city views',
        type: 'Studio',
        pricePerNight: 159,
        capacity: 2,
        quantity: 25,
        amenities: ['Queen Bed', 'Workspace', 'City View', 'Smart TV'],
        hotelId: hotel4.id,
      },
    }),
    prisma.room.create({
      data: {
        name: 'Penthouse Loft',
        description: 'Two-level loft with bay views and private rooftop access',
        type: 'Penthouse',
        pricePerNight: 499,
        capacity: 3,
        quantity: 3,
        amenities: ['King Bed', 'Bay View', 'Rooftop Access', 'Hot Tub', 'Kitchen'],
        hotelId: hotel4.id,
      },
    }),
  ]);

  console.log('✅ Rooms created');

  // ─── Sample Reviews ────────────────────────────────────────────
  await Promise.all([
    prisma.review.create({
      data: {
        userId: customer1.id,
        hotelId: hotel1.id,
        rating: 5,
        title: 'Absolutely Stunning!',
        comment: 'The Grand Palace Hotel exceeded all expectations. The room was immaculate, the service was impeccable, and the views of Central Park were breathtaking. Will definitely return!',
      },
    }),
    prisma.review.create({
      data: {
        userId: customer2.id,
        hotelId: hotel1.id,
        rating: 4,
        title: 'Luxury Experience',
        comment: 'Beautiful hotel with excellent amenities. The spa was world-class and the restaurant offered incredible cuisine. Only minor issue was the noise from the street at night.',
      },
    }),
    prisma.review.create({
      data: {
        userId: customer1.id,
        hotelId: hotel2.id,
        rating: 5,
        title: 'Paradise Found',
        comment: 'The most beautiful beach resort I have ever visited. The beachfront villa was spectacular with its private plunge pool. The staff went above and beyond to make our stay memorable.',
      },
    }),
    prisma.review.create({
      data: {
        userId: customer2.id,
        hotelId: hotel3.id,
        rating: 4,
        title: 'Perfect Mountain Getaway',
        comment: 'The lodge is a gem! Cozy cabins with amazing mountain views. The fireplace made it so romantic. Hiking trails were easily accessible. Great value for money.',
      },
    }),
  ]);

  console.log('✅ Reviews created');

  // ─── Sample Discounts ──────────────────────────────────────────
  await Promise.all([
    prisma.discount.create({
      data: {
        hotelId: hotel1.id,
        code: 'GRAND20',
        percentage: 20,
        validFrom: new Date(),
        validUntil: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
      },
    }),
    prisma.discount.create({
      data: {
        hotelId: hotel2.id,
        code: 'SUMMER15',
        percentage: 15,
        validFrom: new Date(),
        validUntil: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
      },
    }),
  ]);

  console.log('✅ Discounts created');
  console.log('');
  console.log('🎉 Database seeded successfully!');
  console.log('');
  console.log('Test Accounts:');
  console.log('──────────────────────────────────');
  console.log('Admin:    admin@hotelbooking.com / Password123');
  console.log('Owner 1:  owner@grandhotel.com / Password123');
  console.log('Owner 2:  owner@seasideresort.com / Password123');
  console.log('Customer: john@example.com / Password123');
  console.log('Customer: jane@example.com / Password123');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

const { pool } = require('./pool');

const barbers = [
  {
    name: 'Azamat Jusupov',
    role: 'Barber',
    experienceYears: 8,
    rating: 4.9,
    reviewsCount: 342,
    imageUrl: '/assets/master-1.jpg',
    isAvailable: true,
    specialties: ['Men haircut', 'Shave', 'Styling'],
    location: 'Center',
    bio: 'Senior barber focused on clean fades and natural styling.',
    isActive: true
  },
  {
    name: 'Aigul Satybaldieva',
    role: 'Stylist',
    experienceYears: 12,
    rating: 5.0,
    reviewsCount: 518,
    imageUrl: '/assets/master-2.jpg',
    isAvailable: true,
    specialties: ['Women haircut', 'Styling', 'Care'],
    location: 'Center',
    bio: 'Lead stylist for event looks and premium haircare routines.',
    isActive: true
  },
  {
    name: 'Daniyar Kasymov',
    role: 'Barber',
    experienceYears: 5,
    rating: 4.8,
    reviewsCount: 189,
    imageUrl: '/assets/master-3.jpg',
    isAvailable: false,
    specialties: ['Men haircut', 'Beard design'],
    location: 'North',
    bio: 'Modern cuts specialist with strong attention to detail.',
    isActive: true
  },
  {
    name: 'Elnura Toktosunova',
    role: 'Colorist',
    experienceYears: 10,
    rating: 4.9,
    reviewsCount: 427,
    imageUrl: '/assets/master-4.jpg',
    isAvailable: true,
    specialties: ['Coloring', 'Highlights', 'Balayage'],
    location: 'South',
    bio: 'Certified colorist focused on natural tones and healthy shine.',
    isActive: true
  }
];

const services = [
  { name: 'Classic haircut', duration: 30, price: 500 },
  { name: 'Fade haircut', duration: 45, price: 700 },
  { name: 'Beard trim', duration: 20, price: 400 },
  { name: 'Hair coloring', duration: 60, price: 1500 },
  { name: 'Hair styling', duration: 35, price: 900 }
];

const products = [
  {
    name: 'Volume shampoo',
    description: 'Professional shampoo for thin hair. Adds volume and shine.',
    price: 650,
    imageUrl: '/assets/product-1.jpg',
    category: 'unisex',
    type: 'Care',
    stockQty: 30
  },
  {
    name: 'Styling cream',
    description: 'Light hold with matte finish for natural texture.',
    price: 850,
    imageUrl: '/assets/product-2.jpg',
    category: 'men',
    type: 'Styling',
    stockQty: 25
  },
  {
    name: 'Hair oil',
    description: 'Nourishing argan oil that restores and protects hair.',
    price: 1100,
    imageUrl: '/assets/product-3.jpg',
    category: 'women',
    type: 'Care',
    stockQty: 20
  },
  {
    name: 'Scalp detox shampoo',
    description: 'Detox formula for oily scalp and deep cleansing.',
    price: 550,
    imageUrl: '/assets/product-4.jpg',
    category: 'men',
    type: 'Care',
    stockQty: 28
  },
  {
    name: 'Heat protection spray',
    description: 'Protects hair up to 230C and keeps smooth finish.',
    price: 750,
    imageUrl: '/assets/product-1.jpg',
    category: 'women',
    type: 'Protection',
    stockQty: 24
  },
  {
    name: 'Beard wax',
    description: 'Medium hold wax for beard shape and hydration.',
    price: 480,
    imageUrl: '/assets/product-2.jpg',
    category: 'men',
    type: 'Styling',
    stockQty: 32
  }
];

async function upsertBarbers(client) {
  for (const barber of barbers) {
    await client.query(
      `
      INSERT INTO barbers (
        name, role, experience_years, rating, reviews_count, image_url,
        is_available, specialties, location, bio, is_active
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8::text[], $9, $10, $11)
      ON CONFLICT (name) DO UPDATE SET
        role = EXCLUDED.role,
        experience_years = EXCLUDED.experience_years,
        rating = EXCLUDED.rating,
        reviews_count = EXCLUDED.reviews_count,
        image_url = EXCLUDED.image_url,
        is_available = EXCLUDED.is_available,
        specialties = EXCLUDED.specialties,
        location = EXCLUDED.location,
        bio = EXCLUDED.bio,
        is_active = EXCLUDED.is_active
      `,
      [
        barber.name,
        barber.role,
        barber.experienceYears,
        barber.rating,
        barber.reviewsCount,
        barber.imageUrl,
        barber.isAvailable,
        barber.specialties,
        barber.location,
        barber.bio,
        barber.isActive
      ]
    );
  }
}

async function upsertServices(client) {
  for (const service of services) {
    await client.query(
      `
      INSERT INTO services (name, duration_minutes, price, is_active)
      VALUES ($1, $2, $3, TRUE)
      ON CONFLICT (name) DO UPDATE SET
        duration_minutes = EXCLUDED.duration_minutes,
        price = EXCLUDED.price,
        is_active = TRUE
      `,
      [service.name, service.duration, service.price]
    );
  }
}

async function upsertProducts(client) {
  for (const product of products) {
    await client.query(
      `
      INSERT INTO products (
        name, description, price, image_url, category, type, stock_qty, is_active
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, TRUE)
      ON CONFLICT (name) DO UPDATE SET
        description = EXCLUDED.description,
        price = EXCLUDED.price,
        image_url = EXCLUDED.image_url,
        category = EXCLUDED.category,
        type = EXCLUDED.type,
        stock_qty = EXCLUDED.stock_qty,
        is_active = TRUE
      `,
      [
        product.name,
        product.description,
        product.price,
        product.imageUrl,
        product.category,
        product.type,
        product.stockQty
      ]
    );
  }
}

async function resetDemoData(client) {
  await client.query('TRUNCATE bookings, slots RESTART IDENTITY');
}

async function refreshSeeds(options = {}) {
  const { resetDemo = false } = options;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    if (resetDemo) {
      await resetDemoData(client);
    }

    await upsertBarbers(client);
    await upsertServices(client);
    await upsertProducts(client);

    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

module.exports = { refreshSeeds, barbers, services, products };

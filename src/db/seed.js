const { pool } = require('./pool');

const salons = [
  {
    code: 'center',
    name: 'HairLine Center',
    address: 'Chuy Ave, 150',
    workHours: '09:00 - 21:00',
    latitude: 42.876731,
    longitude: 74.606215,
    sortOrder: 1
  },
  {
    code: 'north',
    name: 'HairLine North',
    address: 'Jibek Jolu, 42',
    workHours: '10:00 - 20:00',
    latitude: 42.889112,
    longitude: 74.628954,
    sortOrder: 2
  },
  {
    code: 'south',
    name: 'HairLine South',
    address: 'Akhunbaev St, 98',
    workHours: '09:00 - 21:00',
    latitude: 42.833481,
    longitude: 74.602614,
    sortOrder: 3
  }
];

const barbers = [
  {
    name: 'Timur Karimov',
    salonCode: 'center',
    role: 'Senior Barber',
    experienceYears: 11,
    rating: 4.9,
    reviewsCount: 328,
    imageUrl: 'https://placehold.co/600x600/png?text=Timur+K',
    isAvailable: true,
    specialties: ['Skin fade', 'Classic cut', 'Beard styling'],
    bio: 'Focuses on precision fades and modern men styles.',
    isActive: true
  },
  {
    name: 'Aida Omurbekova',
    salonCode: 'center',
    role: 'Top Stylist',
    experienceYears: 9,
    rating: 4.8,
    reviewsCount: 274,
    imageUrl: 'https://placehold.co/600x600/png?text=Aida+O',
    isAvailable: true,
    specialties: ['Layered cuts', 'Styling', 'Hair care'],
    bio: 'Creates soft forms and practical daily styling routines.',
    isActive: true
  },
  {
    name: 'Nursultan Imanov',
    salonCode: 'north',
    role: 'Barber',
    experienceYears: 6,
    rating: 4.7,
    reviewsCount: 183,
    imageUrl: 'https://placehold.co/600x600/png?text=Nursultan+I',
    isAvailable: true,
    specialties: ['Taper fade', 'Beard trim', 'Contour line'],
    bio: 'Strong at clean lines and quick, consistent execution.',
    isActive: true
  },
  {
    name: 'Elena Petrova',
    salonCode: 'south',
    role: 'Color Specialist',
    experienceYears: 12,
    rating: 5.0,
    reviewsCount: 412,
    imageUrl: 'https://placehold.co/600x600/png?text=Elena+P',
    isAvailable: true,
    specialties: ['Coloring', 'Balayage', 'Hair recovery'],
    bio: 'Works with natural shades and restorative color techniques.',
    isActive: true
  },
  {
    name: 'Bekzat Sadykov',
    salonCode: 'north',
    role: 'Barber',
    experienceYears: 4,
    rating: 4.6,
    reviewsCount: 96,
    imageUrl: 'https://placehold.co/600x600/png?text=Bekzat+S',
    isAvailable: true,
    specialties: ['Buzz cut', 'Kids haircut', 'Simple styling'],
    bio: 'Fast service and good choice for regular maintenance cuts.',
    isActive: true
  },
  {
    name: 'Madina Ryskulova',
    salonCode: 'south',
    role: 'Stylist',
    experienceYears: 7,
    rating: 4.8,
    reviewsCount: 205,
    imageUrl: 'https://placehold.co/600x600/png?text=Madina+R',
    isAvailable: true,
    specialties: ['Evening styling', 'Texture', 'Volume'],
    bio: 'Builds long-lasting volume and polished final look.',
    isActive: true
  }
];

const services = [
  { name: 'Classic haircut', duration: 35, price: 700 },
  { name: 'Skin fade', duration: 45, price: 950 },
  { name: 'Beard trim', duration: 25, price: 500 },
  { name: 'Royal shave', duration: 30, price: 650 },
  { name: 'Scissors cut', duration: 40, price: 850 },
  { name: 'Hair wash and styling', duration: 25, price: 550 },
  { name: 'Kids haircut', duration: 25, price: 600 },
  { name: 'Coloring', duration: 90, price: 2400 },
  { name: 'Tone correction', duration: 70, price: 1800 },
  { name: 'Keratin care', duration: 80, price: 2100 }
];

const products = [
  {
    name: 'Matte Clay',
    description: 'Flexible hold with matte finish for everyday styling.',
    price: 890,
    imageUrl: 'https://placehold.co/600x600/png?text=Matte+Clay',
    category: 'men',
    type: 'Styling',
    stockQty: 42
  },
  {
    name: 'Sea Salt Spray',
    description: 'Adds texture and volume without heavy residue.',
    price: 760,
    imageUrl: 'https://placehold.co/600x600/png?text=Sea+Salt+Spray',
    category: 'unisex',
    type: 'Styling',
    stockQty: 35
  },
  {
    name: 'Repair Shampoo',
    description: 'Daily shampoo for damaged and dry hair.',
    price: 980,
    imageUrl: 'https://placehold.co/600x600/png?text=Repair+Shampoo',
    category: 'unisex',
    type: 'Care',
    stockQty: 30
  },
  {
    name: 'Beard Oil',
    description: 'Softens beard and hydrates skin under it.',
    price: 670,
    imageUrl: 'https://placehold.co/600x600/png?text=Beard+Oil',
    category: 'men',
    type: 'Care',
    stockQty: 28
  },
  {
    name: 'Heat Shield Mist',
    description: 'Protects hair from heat up to 220C.',
    price: 840,
    imageUrl: 'https://placehold.co/600x600/png?text=Heat+Shield',
    category: 'women',
    type: 'Protection',
    stockQty: 26
  },
  {
    name: 'Curl Defining Cream',
    description: 'Shapes curls with medium hold and soft touch.',
    price: 920,
    imageUrl: 'https://placehold.co/600x600/png?text=Curl+Cream',
    category: 'women',
    type: 'Styling',
    stockQty: 24
  },
  {
    name: 'Scalp Detox',
    description: 'Deep-clean treatment for oily scalp.',
    price: 730,
    imageUrl: 'https://placehold.co/600x600/png?text=Scalp+Detox',
    category: 'unisex',
    type: 'Care',
    stockQty: 21
  },
  {
    name: 'Strong Hold Gel',
    description: 'Long-lasting hold for neat and slick looks.',
    price: 610,
    imageUrl: 'https://placehold.co/600x600/png?text=Strong+Gel',
    category: 'men',
    type: 'Styling',
    stockQty: 50
  },
  {
    name: 'Leave-in Conditioner',
    description: 'Light moisture support and easier detangling.',
    price: 990,
    imageUrl: 'https://placehold.co/600x600/png?text=Conditioner',
    category: 'women',
    type: 'Care',
    stockQty: 33
  },
  {
    name: 'Volume Powder',
    description: 'Instant lift at roots with natural finish.',
    price: 780,
    imageUrl: 'https://placehold.co/600x600/png?text=Volume+Powder',
    category: 'unisex',
    type: 'Styling',
    stockQty: 31
  }
];

const demoUsers = [
  {
    fullName: 'Ivan Petrov',
    email: 'ivan.petrov@example.com',
    phone: '+996555100001',
    passwordHash: '$2a$10$cl7uvxDsDH./lX07w3Zn1.vbRUnDpV40RjaOftlMNKdLPWfUOJw9i'
  },
  {
    fullName: 'Aida User',
    email: 'aida.user@example.com',
    phone: '+996555100002',
    passwordHash: '$2a$10$cl7uvxDsDH./lX07w3Zn1.vbRUnDpV40RjaOftlMNKdLPWfUOJw9i'
  },
  {
    fullName: 'Test Client',
    email: 'test.client@example.com',
    phone: '+996555100003',
    passwordHash: '$2a$10$2zOm8J.QW7vLlj3D4BYmSuw2J58iPFteVwJJ0EcVh4PeTRkp58DOq'
  }
];

const reviewSeeds = [
  {
    barberName: 'Timur Karimov',
    userEmail: 'ivan.petrov@example.com',
    authorName: 'Ivan Petrov',
    rating: 5.0,
    comment: 'Very clean fade, exactly as requested.',
    createdAt: '2026-03-01T10:20:00Z'
  },
  {
    barberName: 'Timur Karimov',
    userEmail: 'aida.user@example.com',
    authorName: 'Aida User',
    rating: 4.8,
    comment: 'Fast service and good attention to detail.',
    createdAt: '2026-03-04T12:15:00Z'
  },
  {
    barberName: 'Aida Omurbekova',
    userEmail: 'test.client@example.com',
    authorName: 'Test Client',
    rating: 4.9,
    comment: 'Loved the styling tips, very practical.',
    createdAt: '2026-03-05T16:05:00Z'
  },
  {
    barberName: 'Elena Petrova',
    userEmail: 'ivan.petrov@example.com',
    authorName: 'Ivan Petrov',
    rating: 5.0,
    comment: 'Color result looks natural and healthy.',
    createdAt: '2026-03-08T14:40:00Z'
  },
  {
    barberName: 'Nursultan Imanov',
    userEmail: 'aida.user@example.com',
    authorName: 'Aida User',
    rating: 4.6,
    comment: 'Trim and contour were accurate, will come back.',
    createdAt: '2026-03-09T09:30:00Z'
  },
  {
    barberName: 'Madina Ryskulova',
    userEmail: 'test.client@example.com',
    authorName: 'Test Client',
    rating: 4.8,
    comment: 'Great volume and the hairstyle lasted all day.',
    createdAt: '2026-03-12T11:10:00Z'
  }
];

const slotTimes = [
  '10:00',
  '10:30',
  '11:00',
  '11:30',
  '12:00',
  '12:30',
  '14:00',
  '14:30',
  '15:00',
  '15:30',
  '16:00',
  '16:30',
  '17:00',
  '17:30'
];

function toIsoDate(date) {
  return date.toISOString().slice(0, 10);
}

function buildUpcomingDates(days = 14) {
  const dates = [];
  const start = new Date();
  start.setHours(0, 0, 0, 0);

  for (let day = 0; day < days; day += 1) {
    const next = new Date(start);
    next.setDate(start.getDate() + day);
    dates.push(toIsoDate(next));
  }

  return dates;
}

async function upsertSalons(client) {
  const salonIdByCode = new Map();
  const codes = salons.map((salon) => salon.code);

  for (const salon of salons) {
    const updatedByName = await client.query(
      `
      UPDATE salons
      SET
        code = $1,
        address = $3,
        work_hours = $4,
        latitude = $5,
        longitude = $6,
        sort_order = $7,
        is_active = TRUE,
        updated_at = NOW()
      WHERE name = $2
      RETURNING id, code
      `,
      [
        salon.code,
        salon.name,
        salon.address,
        salon.workHours,
        salon.latitude,
        salon.longitude,
        salon.sortOrder
      ]
    );

    if (updatedByName.rowCount) {
      salonIdByCode.set(updatedByName.rows[0].code, updatedByName.rows[0].id);
      continue;
    }

    const result = await client.query(
      `
      INSERT INTO salons (
        code, name, address, work_hours, latitude, longitude, sort_order, is_active, updated_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, TRUE, NOW())
      ON CONFLICT (code) DO UPDATE SET
        name = EXCLUDED.name,
        address = EXCLUDED.address,
        work_hours = EXCLUDED.work_hours,
        latitude = EXCLUDED.latitude,
        longitude = EXCLUDED.longitude,
        sort_order = EXCLUDED.sort_order,
        is_active = TRUE,
        updated_at = NOW()
      RETURNING id, code
      `,
      [
        salon.code,
        salon.name,
        salon.address,
        salon.workHours,
        salon.latitude,
        salon.longitude,
        salon.sortOrder
      ]
    );

    salonIdByCode.set(result.rows[0].code, result.rows[0].id);
  }

  await client.query(
    `
    UPDATE salons
    SET is_active = FALSE, updated_at = NOW()
    WHERE code <> ALL($1::text[])
    `,
    [codes]
  );

  return salonIdByCode;
}

async function upsertBarbers(client, salonIdByCode) {
  const barberIdByName = new Map();
  const names = barbers.map((barber) => barber.name);

  for (const barber of barbers) {
    const salonId = salonIdByCode.get(barber.salonCode) || null;
    const result = await client.query(
      `
      INSERT INTO barbers (
        name, role, experience_years, rating, reviews_count, image_url, is_available,
        specialties, salon_id, bio, is_active
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
        salon_id = EXCLUDED.salon_id,
        bio = EXCLUDED.bio,
        is_active = EXCLUDED.is_active
      RETURNING id, name
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
        salonId,
        barber.bio,
        barber.isActive
      ]
    );

    barberIdByName.set(result.rows[0].name, result.rows[0].id);
  }

  await client.query(
    `
    UPDATE barbers
    SET is_active = FALSE
    WHERE name <> ALL($1::text[])
    `,
    [names]
  );

  return barberIdByName;
}

async function upsertServices(client) {
  const names = services.map((service) => service.name);
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

  await client.query(
    `
    UPDATE services
    SET is_active = FALSE
    WHERE name <> ALL($1::text[])
    `,
    [names]
  );
}

async function upsertProducts(client) {
  const names = products.map((product) => product.name);
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

  await client.query(
    `
    UPDATE products
    SET is_active = FALSE
    WHERE name <> ALL($1::text[])
    `,
    [names]
  );
}

async function upsertUsers(client) {
  const userIdByEmail = new Map();

  for (const user of demoUsers) {
    const result = await client.query(
      `
      INSERT INTO users (full_name, email, phone, password_hash)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (email) DO UPDATE SET
        full_name = EXCLUDED.full_name,
        phone = EXCLUDED.phone,
        password_hash = EXCLUDED.password_hash
      RETURNING id, email
      `,
      [user.fullName, user.email, user.phone, user.passwordHash]
    );

    userIdByEmail.set(result.rows[0].email, result.rows[0].id);
  }

  return userIdByEmail;
}

async function upsertReviews(client, barberIdByName, userIdByEmail) {
  for (const review of reviewSeeds) {
    const barberId = barberIdByName.get(review.barberName);
    if (!barberId) {
      continue;
    }

    const userId = userIdByEmail.get(review.userEmail) || null;
    await client.query(
      `
      INSERT INTO reviews (barber_id, user_id, author_name, rating, comment, created_at)
      VALUES ($1, $2, $3, $4, $5, $6::timestamptz)
      ON CONFLICT (barber_id, author_name, comment) DO UPDATE SET
        rating = EXCLUDED.rating,
        created_at = EXCLUDED.created_at
      `,
      [
        barberId,
        userId,
        review.authorName,
        review.rating,
        review.comment,
        review.createdAt
      ]
    );
  }
}

async function seedSlots(client, barberIdByName) {
  const dates = buildUpcomingDates(14);
  const barberIds = Array.from(barberIdByName.values());

  await client.query(
    `DELETE FROM slots
     WHERE date < CURRENT_DATE
       AND status = 'available'`
  );

  for (const barberId of barberIds) {
    for (const date of dates) {
      await client.query(
        `
        INSERT INTO slots (barber_id, date, time, status)
        SELECT $1, $2::date, UNNEST($3::time[]), 'available'
        ON CONFLICT (barber_id, date, time) DO NOTHING
        `,
        [barberId, date, slotTimes]
      );
    }
  }
}

async function refreshBarberRatings(client) {
  await client.query(
    `
    UPDATE barbers AS b
    SET
      rating = stats.avg_rating,
      reviews_count = stats.total_count
    FROM (
      SELECT barber_id, ROUND(AVG(rating)::numeric, 1) AS avg_rating, COUNT(*)::int AS total_count
      FROM reviews
      GROUP BY barber_id
    ) AS stats
    WHERE b.id = stats.barber_id
    `
  );
}

async function resetDemoData(client) {
  await client.query('TRUNCATE bookings, slots, reviews RESTART IDENTITY');
}

async function refreshSeeds(options = {}) {
  const { resetDemo = false } = options;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    if (resetDemo) {
      await resetDemoData(client);
    }

    const salonIdByCode = await upsertSalons(client);
    const barberIdByName = await upsertBarbers(client, salonIdByCode);
    await upsertServices(client);
    await upsertProducts(client);
    const userIdByEmail = await upsertUsers(client);
    await upsertReviews(client, barberIdByName, userIdByEmail);
    await seedSlots(client, barberIdByName);
    await refreshBarberRatings(client);

    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

module.exports = { refreshSeeds, salons, barbers, services, products, demoUsers, reviewSeeds };

import { PrismaClient, PostType } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Create some sample users if they don't exist
  // Use upsert so running the seed multiple times doesn't create duplicates
  let user1 = await prisma.user.upsert({
    where: { email: 'john.doe@example.com' },
    update: {
      name: 'John Doe',
      username: 'johndoe',
      points: 100,
      googleId: 'sample_google_id_1',
    },
    create: {
      email: 'john.doe@example.com',
      name: 'John Doe',
      username: 'johndoe',
      points: 100,
      googleId: 'sample_google_id_1',
    },
  });

  let user2 = await prisma.user.upsert({
    where: { email: 'jane.smith@example.com' },
    update: {
      name: 'Jane Smith',
      username: 'janesmith',
      points: 150,
      googleId: 'sample_google_id_2',
    },
    create: {
      email: 'jane.smith@example.com',
      name: 'Jane Smith',
      username: 'janesmith',
      points: 150,
      googleId: 'sample_google_id_2',
    },
  });

  // Create some sample locations
  let location1 = await prisma.location.findUnique({
    where: { googlePlaceId: 'sample_place_1' },
  });
  location1 = await prisma.location.upsert({
    where: { googlePlaceId: 'sample_place_1' },
    update: {
      street: 'Alexanderplatz 1',
      city: 'Berlin',
      country: 'Germany',
      coordinates: [13.405, 52.52],
      type: 'RECYCLING_CENTER',
    },
    create: {
      street: 'Alexanderplatz 1',
      city: 'Berlin',
      country: 'Germany',
      coordinates: [13.405, 52.52], // Berlin coordinates
      type: 'RECYCLING_CENTER',
      googlePlaceId: 'sample_place_1',
    },
  });

  // Additional Berlin-area locations (no images will be used for posts referencing these)
  const location2 = await prisma.location.upsert({
    where: { googlePlaceId: 'sample_place_2' },
    update: {
      street: 'Friedrichstraße 100',
      city: 'Berlin',
      country: 'Germany',
      coordinates: [13.3885, 52.5175],
      type: 'DROP_OFF_POINT',
    },
    create: {
      street: 'Friedrichstraße 100',
      city: 'Berlin',
      country: 'Germany',
      coordinates: [13.3885, 52.5175],
      type: 'DROP_OFF_POINT',
      googlePlaceId: 'sample_place_2',
    },
  });

  const location3 = await prisma.location.upsert({
    where: { googlePlaceId: 'sample_place_3' },
    update: {
      street: 'Kurfürstendamm 12',
      city: 'Berlin',
      country: 'Germany',
      coordinates: [13.335, 52.501],
      type: 'COLLECTION_SITE',
    },
    create: {
      street: 'Kurfürstendamm 12',
      city: 'Berlin',
      country: 'Germany',
      coordinates: [13.335, 52.501],
      type: 'COLLECTION_SITE',
      googlePlaceId: 'sample_place_3',
    },
  });

  const location4 = await prisma.location.upsert({
    where: { googlePlaceId: 'sample_place_4' },
    update: {
      street: 'Karl-Marx-Straße 66',
      city: 'Berlin',
      country: 'Germany',
      coordinates: [13.432, 52.472],
      type: 'DONATION_CENTER',
    },
    create: {
      street: 'Karl-Marx-Straße 66',
      city: 'Berlin',
      country: 'Germany',
      coordinates: [13.432, 52.472],
      type: 'DONATION_CENTER',
      googlePlaceId: 'sample_place_4',
    },
  });

  const location5 = await prisma.location.upsert({
    where: { googlePlaceId: 'sample_place_5' },
    update: {
      street: 'Potsdamer Platz 1',
      city: 'Berlin',
      country: 'Germany',
      coordinates: [13.376, 52.509],
      type: 'PICKUP_LOCATION',
    },
    create: {
      street: 'Potsdamer Platz 1',
      city: 'Berlin',
      country: 'Germany',
      coordinates: [13.376, 52.509],
      type: 'PICKUP_LOCATION',
      googlePlaceId: 'sample_place_5',
    },
  });

  const location6 = await prisma.location.upsert({
    where: { googlePlaceId: 'sample_place_6' },
    update: {
      street: 'Prenzlauer Allee 227',
      city: 'Berlin',
      country: 'Germany',
      coordinates: [13.422, 52.541],
      type: 'DROP_OFF_POINT',
    },
    create: {
      street: 'Prenzlauer Allee 227',
      city: 'Berlin',
      country: 'Germany',
      coordinates: [13.422, 52.541],
      type: 'DROP_OFF_POINT',
      googlePlaceId: 'sample_place_6',
    },
  });

  // Create sample posts
  const posts = [
    {
      title: 'Old Electronics for Recycling',
      description:
        'I have some old laptops and monitors that I want to recycle responsibly. Looking for a good recycling center.',
      category: 'Electronics',
      condition: 'Used',
      postType: PostType.GIVEAWAY,
      tags: ['electronics', 'laptop', 'monitor', 'recycling'],
      images: [
        'https://budli.in/blog/wp-content/uploads/2021/07/5-should-you-buy-a-refurbished-laptop.jpg',
      ],
      authorId: user1.id,
      locationId: location1.id,
    },
    {
      title: 'Plastic Bottles Collection',
      description:
        'Collecting plastic bottles for a community recycling drive. Drop off your clean plastic bottles!',
      category: 'Plastics',
      postType: PostType.REQUESTS,
      tags: ['plastic', 'bottles', 'community', 'drive'],
      images: [],
      authorId: user2.id,
      locationId: location1.id,
    },
    {
      title: 'Glass Jars Giveaway',
      description:
        'I have several glass jars that I no longer need. Perfect for storage or crafts. Free to anyone who wants them.',
      category: 'Glass',
      condition: 'Good',
      postType: PostType.GIVEAWAY,
      tags: ['glass', 'jars', 'storage', 'crafts'],
      images: [
        'https://saladinajar.com/wp-content/uploads/2019/08/5-Mason-jar-stars-1.jpg',
        'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRc4orLYBBNCMegVFTk2ssWte4rwcZ3Ml5r9w&s',
      ],
      authorId: user1.id,
    },
    {
      title: 'Paper Recycling Initiative',
      description:
        'Starting a paper recycling program in our neighborhood. Join us to make our community more sustainable!',
      category: 'Paper',
      postType: PostType.REQUESTS,
      tags: ['paper', 'recycling', 'community', 'sustainable'],
      images: [],
      authorId: user2.id,
    },
    {
      title: 'Metal Cans for Scrap',
      description:
        'Have a bunch of aluminum cans that I want to turn into scrap metal. Anyone interested in collecting?',
      category: 'Metal',
      condition: 'Used',
      postType: PostType.GIVEAWAY,
      tags: ['metal', 'aluminum', 'cans', 'scrap'],
      images: ['https://www.sadieseasongoods.com/wp-content/uploads/2024/06/tin-can-crafts.jpg'],
      authorId: user1.id,
      locationId: location1.id,
    },
    // New posts near Berlin (no images)
    {
      title: 'Clothes Donation Drive - Friedrichstraße',
      description:
        'Collecting gently used clothes for donation. Drop off at Friedrichstraße location during business hours.',
      category: 'Clothing',
      condition: 'Good',
      postType: PostType.REQUESTS,
      tags: ['clothing', 'donation', 'Berlin'],
      images: [],
      authorId: user2.id,
      locationId: location2.id,
    },
    {
      title: 'Small Electronics Give-Away (Kurfürstendamm)',
      description:
        'A few small electronics (chargers, cables, small speakers) available for free. First come, first served.',
      category: 'Electronics',
      condition: 'Used',
      postType: PostType.GIVEAWAY,
      tags: ['electronics', 'accessories', 'free'],
      images: [],
      authorId: user1.id,
      locationId: location3.id,
    },
    {
      title: 'Books for the Community (Karl-Marx-Straße)',
      description:
        'I have various fiction and non-fiction books looking for new homes. Come by Karl-Marx-Straße to pick them up.',
      category: 'Books',
      condition: 'Good',
      postType: PostType.GIVEAWAY,
      tags: ['books', 'reading', 'community'],
      images: [],
      authorId: user2.id,
      locationId: location4.id,
    },
    {
      title: 'Cardboard Boxes Collection (Potsdamer Platz)',
      description:
        'Offering a stack of cardboard boxes from a recent move. Free to anyone who can pick up at Potsdamer Platz.',
      category: 'Paper',
      condition: 'Good',
      postType: PostType.GIVEAWAY,
      tags: ['cardboard', 'boxes', 'moving'],
      images: [],
      authorId: user1.id,
      locationId: location5.id,
    },
    {
      title: 'Household Items Pickup - Prenzlauer Allee',
      description:
        'Several household items (kettle, lamp, small table) available to pick up near Prenzlauer Allee.',
      category: 'Household',
      condition: 'Used',
      postType: PostType.GIVEAWAY,
      tags: ['household', 'furniture', 'pickup'],
      images: [],
      authorId: user2.id,
      locationId: location6.id,
    },
  ];

  for (const postData of posts) {
    // Make posts idempotent: if a post by same title and author exists, update it, otherwise create
    const existing = await prisma.post.findFirst({
      where: {
        title: postData.title,
        authorId: postData.authorId,
      },
    });
    if (existing) {
      await prisma.post.update({
        where: { id: existing.id },
        data: postData,
      });
    } else {
      await prisma.post.create({ data: postData });
    }
  }

  console.log('Seeded database with sample posts');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

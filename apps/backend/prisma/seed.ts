import { PrismaClient, PostType } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Create some sample users if they don't exist
  let user1 = await prisma.user.findUnique({
    where: { email: 'john.doe@example.com' },
  });
  if (!user1) {
    user1 = await prisma.user.create({
      data: {
        email: 'john.doe@example.com',
        name: 'John Doe',
        username: 'johndoe',
        points: 100,
        googleId: 'sample_google_id_1',
      },
    });
  }

  let user2 = await prisma.user.findUnique({
    where: { email: 'jane.smith@example.com' },
  });
  if (!user2) {
    user2 = await prisma.user.create({
      data: {
        email: 'jane.smith@example.com',
        name: 'Jane Smith',
        username: 'janesmith',
        points: 150,
        googleId: 'sample_google_id_2',
      },
    });
  }

  // Create some sample locations
  let location1 = await prisma.location.findUnique({
    where: { googlePlaceId: 'sample_place_1' },
  });
  if (!location1) {
    location1 = await prisma.location.create({
      data: {
        street: 'Alexanderplatz 1',
        city: 'Berlin',
        country: 'Germany',
        coordinates: [13.405, 52.52], // Berlin coordinates
        type: 'RECYCLING_CENTER',
        googlePlaceId: 'sample_place_1',
      },
    });
  }

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
      images: ['https://example.com/image1.jpg'],
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
      images: ['https://example.com/image2.jpg', 'https://example.com/image3.jpg'],
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
      images: ['https://example.com/image4.jpg'],
      authorId: user1.id,
      locationId: location1.id,
    },
  ];

  for (const postData of posts) {
    await prisma.post.create({
      data: postData,
    });
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

import { Command, CommandRunner } from 'nest-commander';
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

function generateStandRange(prefix: string, start: number, end: number, description: string) {
  const stands = [];
  for (let i = start; i <= end; i++) {
    const numStr = `${prefix}${i}`;
    stands.push({
      standNumber: numStr,
      title: `Stand ${numStr}`,
      description: `${description} (${numStr})`,
    });
  }
  return stands;
}

export const exhibitionSeedStructure = {
  halls: [
    // -------------------------------------------------------------
    // 1. GOFFS COMPLEX
    // -------------------------------------------------------------
    {
      title: 'Goffs Complex',
      standCategories: [
        {
          title: 'Standard Size',
          slug: 'goffs-complex-standard-size',
          size: '3m x 2m',
          price: 1750,
          priceInMinorUnit: 175000,
          vatPercentage: 0,
          stands: [2, 3, 4, 5, 6, 7, 12, 13, 14, 15, 16, 18, 19].map((num) => ({
            standNumber: String(num),
            title: `Stand ${num}`,
            description: `Standard indoor exhibition booth (3m x 2m) located in Goffs Complex with prime walkway access.`,
          })),
        },
        {
          title: 'Premium Size (6m x 2m, rectangle)',
          slug: 'goffs-complex-premium-6x2',
          size: '6m x 2m, rectangle',
          price: 3000,
          priceInMinorUnit: 300000,
          vatPercentage: 0,
          stands: [
            {
              standNumber: '8',
              title: 'Stand 8',
              description: 'Spacious premium rectangular booth (6m x 2m) near main lounge area in Goffs Complex.',
            },
          ],
        },
        {
          title: 'Premium Size (4m x 2m, rectangle)',
          slug: 'goffs-complex-premium-4x2',
          size: '4m x 2m, rectangle',
          price: 3000,
          priceInMinorUnit: 300000,
          vatPercentage: 0,
          stands: [
            {
              standNumber: '11',
              title: 'Stand 11',
              description: 'Premium front-row rectangular exhibition booth (4m x 2m) with maximum brand visibility.',
            },
          ],
        },
        {
          title: 'Premium Size (4m x 3.5m, corner)',
          slug: 'goffs-complex-premium-4x3.5',
          size: '4m x 3.5m, corner',
          price: 3000,
          priceInMinorUnit: 300000,
          vatPercentage: 0,
          stands: [
            {
              standNumber: '17',
              title: 'Stand 17',
              description: 'Exclusive corner premium booth (4m x 3.5m) offering high dual-side visitor exposure.',
            },
          ],
        },
        {
          title: 'Small Size',
          slug: 'goffs-complex-small-size',
          size: '2.5m x 1.5m',
          price: 1250,
          priceInMinorUnit: 125000,
          vatPercentage: 0,
          stands: [
            {
              standNumber: '9',
              title: 'Stand 9',
              description: 'Compact exhibition booth (2.5m x 1.5m) ideal for startups and targeted product showcases.',
            },
          ],
        },
      ],
    },

    // -------------------------------------------------------------
    // 2. MARQUEE
    // -------------------------------------------------------------
    {
      title: 'Marquee',
      standCategories: [
        {
          title: 'Standard Size',
          slug: 'marquee-standard-size',
          size: '3m x 2m',
          price: 1250,
          priceInMinorUnit: 125000,
          vatPercentage: 0,
          stands: [
            {
              standNumber: 'M1',
              title: 'Stand M1',
              description: 'Standard marquee booth (3m x 2m) located right at the entrance of Goffs Auditorium hall.',
            },
            ...generateStandRange('M', 3, 26, 'Standard indoor marquee booth (3m x 2m) positioned along the main exhibition corridor'),
            ...generateStandRange('M', 28, 49, 'Standard indoor marquee booth (3m x 2m) situated in central aisle for steady attendee traffic'),
            ...generateStandRange('M', 52, 71, 'Standard indoor marquee booth (3m x 2m) located along main hall corridor'),
          ],
        },
        {
          title: 'Premium Size (3m x 3m, corner)',
          slug: 'marquee-premium-3x3',
          size: '3m x 3m, corner',
          price: 2250,
          priceInMinorUnit: 225000,
          vatPercentage: 0,
          stands: [
            {
              standNumber: 'M2',
              title: 'Stand M2',
              description: 'Top-tier corner premium booth (3m x 3m) positioned at the main entrance junction of Marquee.',
            },
          ],
        },
        {
          title: 'Premium Size (3m x 4m, square)',
          slug: 'marquee-premium-3x4',
          size: '3m x 4m, square',
          price: 2700,
          priceInMinorUnit: 270000,
          vatPercentage: 0,
          stands: [
            {
              standNumber: 'M50',
              title: 'Stand M50',
              description: 'Premium square exhibition booth (3m x 4m) with large footprint for immersive product displays.',
            },
          ],
        },
        {
          title: 'Premium Size (5m x 2m, rectangle)',
          slug: 'marquee-premium-5x2',
          size: '5m x 2m, rectangle',
          price: 2250,
          priceInMinorUnit: 225000,
          vatPercentage: 0,
          stands: [
            {
              standNumber: 'M51',
              title: 'Stand M51',
              description: 'Wide rectangular premium booth (5m x 2m) offering prominent front-line visitor presentation.',
            },
          ],
        },
        {
          title: 'Premium Size (4m x 3m, corner)',
          slug: 'marquee-premium-4x3',
          size: '4m x 3m, corner',
          price: 1600,
          priceInMinorUnit: 160000,
          vatPercentage: 0,
          stands: [
            {
              standNumber: 'M27',
              title: 'Stand M27',
              description: 'Corner premium booth (4m x 3m) located at the south exit corner of Marquee hall.',
            },
            {
              standNumber: 'M72',
              title: 'Stand M72',
              description: 'Corner premium booth (4m x 3m) situated at the south entrance junction of Marquee hall.',
            },
          ],
        },
      ],
    },

    // -------------------------------------------------------------
    // 3. OUTDOOR
    // -------------------------------------------------------------
    {
      title: 'Outdoor',
      standCategories: [
        {
          title: 'Standard Size',
          slug: 'outdoor-standard-size',
          size: 'approx 10m x 5m',
          price: 1500,
          priceInMinorUnit: 150000,
          vatPercentage: 0,
          stands: [
            {
              standNumber: 'O1',
              title: 'Outdoor Stand 1',
              description: 'Large outdoor exhibition space (10m x 5m) suited for machinery, vehicles, and open-air displays.',
            },
            {
              standNumber: 'O2',
              title: 'Outdoor Stand 2',
              description: 'Large outdoor exhibition plot (10m x 5m) with high visibility from the venue entrance.',
            },
            {
              standNumber: 'O3',
              title: 'Outdoor Stand 3',
              description: 'Outdoor exhibition area (10m x 5m) ideal for heavy equipment and interactive outdoor setups.',
            },
            {
              standNumber: 'O4',
              title: 'Outdoor Stand 4',
              description: 'Outdoor exhibition plot (10m x 5m) offering flexible space for custom structure installation.',
            },
            {
              standNumber: 'O5',
              title: 'Outdoor Stand 5',
              description: 'Spacious outdoor plot (10m x 5m) near main venue walkways for open-air visitor engagement.',
            },
          ],
        },
      ],
    },
  ],
};

@Injectable()
@Command({
  name: 'seed-exhibition',
  aliases: ['exhibition-seed'],
  description: 'Seed or update the latest exhibition with halls, categories, and stands',
})
export class ExhibitionSeedCommand extends CommandRunner {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async run(passedParam: string[]): Promise<void> {
    await this.seedExhibition();
  }

  async seedExhibition() {
    console.log('Starting Exhibition Seeding/Updating process...');

    try {
      await this.prisma.$transaction(async (tx) => {
        // 1. Find or create active exhibition
        let exhibition = await tx.exhibition.findFirst({
          where: { deletedAt: null },
          orderBy: { createdAt: 'desc' },
        });

        if (!exhibition) {
          console.log('No active exhibition found. Creating a new one...');
          exhibition = await tx.exhibition.create({
            data: {
              title: 'ITBA EXPO The NEXT 100',
              slug: 'itba-expo-next-100',
              description: 'The premier industry exhibition event.',
              location: 'Goffs, Naas, Co. Kildare',
              startedAt: new Date('2027-01-06T00:00:00Z'),
              endedAt: new Date('2027-01-08T00:00:00Z'),
              bookingStatedAt: new Date('2026-01-01T00:00:00Z'),
              bookingEndedAt: new Date('2026-12-06T00:00:00Z'),
            },
          });
        } else {
          console.log(`Updating existing exhibition (ID: ${exhibition.id})...`);
          exhibition = await tx.exhibition.update({
            where: { id: exhibition.id },
            data: {
              title: 'ITBA EXPO The NEXT 100',
              location: 'Goffs, Naas, Co. Kildare',
              startedAt: new Date('2027-01-06T00:00:00Z'),
              bookingEndedAt: new Date('2026-12-06T00:00:00Z'),
            },
          });
        }

        // 2. Clean up previous halls/categories/stands for this exhibition to maintain idempotency
        const existingHalls = await tx.hall.findMany({
          where: { exhibitionId: exhibition.id },
          select: { id: true },
        });
        const hallIds = existingHalls.map((h) => h.id);

        if (hallIds.length > 0) {
          console.log('Cleaning up existing stands, categories, and halls...');
          await tx.stand.deleteMany({
            where: { exhibitionId: exhibition.id },
          });
          await tx.standCategory.deleteMany({
            where: { hallId: { in: hallIds } },
          });
          await tx.hall.deleteMany({
            where: { exhibitionId: exhibition.id },
          });
        }

        // 3. Create Halls, Stand Categories, and Stands according to floor plan
        for (const hallData of exhibitionSeedStructure.halls) {
          console.log(`Creating Hall: ${hallData.title}...`);
          const createdHall = await tx.hall.create({
            data: {
              title: hallData.title,
              exhibitionId: exhibition.id,
            },
          });

          for (const categoryData of hallData.standCategories) {
            const createdCategory = await tx.standCategory.create({
              data: {
                title: categoryData.title,
                slug: categoryData.slug,
                size: categoryData.size,
                price: categoryData.price,
                priceInMinorUnit: categoryData.priceInMinorUnit,
                vatPercentage: categoryData.vatPercentage,
                hallId: createdHall.id,
              },
            });

            for (const standData of categoryData.stands) {
              await tx.stand.create({
                data: {
                  title: standData.title,
                  standNumber: standData.standNumber,
                  description: standData.description,
                  isAvailable: 1,
                  exhibitionId: exhibition.id,
                  categoryId: createdCategory.id,
                },
              });
            }
          }
        }
      });

      console.log('✅ Exhibition seeding/updating completed successfully!');
    } catch (error) {
      console.error('❌ Exhibition seeding failed:', error);
      throw error;
    }
  }
}

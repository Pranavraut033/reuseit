import { Injectable } from '@nestjs/common';
import { Location } from '@prisma/client';

import { PrismaService } from '~/prisma/prisma.service';

import { CreateLocationInput } from './dto/create-location.input';
import { UpdateLocationInput } from './dto/update-location.input';

@Injectable()
export class LocationService {
  constructor(private prismaService: PrismaService) {}

  create(data: CreateLocationInput, userId?: string) {
    return this.prismaService.location.create({
      data: {
        ...data,
        userId,
      },
    });
  }

  findAll() {
    return this.prismaService.location.findMany();
  }

  findOne(id: string) {
    return this.prismaService.location.findUnique({ where: { id } });
  }

  update({ id, ...data }: UpdateLocationInput) {
    return this.prismaService.location.update({ where: { id }, data });
  }

  remove(id: string) {
    return this.prismaService.location.delete({ where: { id } });
  }

  findNearBy(
    latitude: number,
    longitude: number,
    radiusInKm = 0.5,
  ): Promise<{ _id: { $oid: string } }[]> {
    // const radiusInRadians = radiusInKm / 6378.1; // Earth's radius in km

    return this.prismaService.location.aggregateRaw({
      pipeline: [
        {
          $geoNear: {
            near: {
              type: 'Point',
              coordinates: [longitude, latitude],
            },
            distanceField: 'distance',
            maxDistance: radiusInKm * 1000, // Convert to meters
            spherical: true,
          },
        },
      ],
    }) as unknown as Promise<
      {
        _id: { $oid: string };
      }[]
    >;
  }

  async verifyOrCreate(
    id: string | undefined,
    createLocationInput: CreateLocationInput | undefined,
    optional: true,
  ): Promise<string | undefined>;

  async verifyOrCreate(
    id: string | undefined,
    createLocationInput: CreateLocationInput | undefined,
    optional?: false,
  ): Promise<string>;

  async verifyOrCreate(
    id: string | undefined,
    createLocationInput: CreateLocationInput | undefined,
    optional: boolean = false,
  ): Promise<string | undefined> {
    if (id || createLocationInput?.googlePlaceId) {
      await this.prismaService.location.findFirstOrThrow({
        where: { id, googlePlaceId: createLocationInput?.googlePlaceId },
      });
      return id;
    }

    if (createLocationInput) {
      const location = await this.create(createLocationInput);
      return location.id;
    }

    if (optional) {
      return undefined;
    }

    throw new Error('Either locationId or location data must be provided');
  }
}

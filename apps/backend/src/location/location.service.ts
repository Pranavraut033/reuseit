import { Injectable } from '@nestjs/common';

import { PrismaService } from '~/prisma/prisma.service';

import { CreateLocationInput } from './dto/create-location.input';
import { UpdateLocationInput } from './dto/update-location.input';

@Injectable()
export class LocationService {
  constructor(private prismaService: PrismaService) {}

  create(data: CreateLocationInput) {
    return this.prismaService.location.create({ data });
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

  findNearBy(latitude: number, longitude: number, radiusInKm = 5) {
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
    });
  }
}

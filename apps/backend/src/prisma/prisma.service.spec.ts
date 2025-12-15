import { PrismaService } from './prisma.service';

describe('PrismaService', () => {
  let service: PrismaService;

  beforeEach(() => {
    service = new PrismaService();
    // Prevent actual DB calls
    service.$connect = jest.fn().mockResolvedValue(undefined) as any;
    service.$transaction = jest.fn().mockResolvedValue([]) as any;
  });

  it('ensures geospatial index on startup', async () => {
    const runCommandMock = jest.fn().mockResolvedValue({ ok: 1 });
    service.$runCommandRaw = runCommandMock as any;

    await service.onModuleInit();

    expect(runCommandMock).toHaveBeenCalledWith({
      createIndexes: 'Location',
      indexes: [{ key: { coordinates: '2dsphere' }, name: 'coordinates_2dsphere' }],
    });
  });

  it('ignores already-exists error when ensuring indexes', async () => {
    const err = new Error('Index with name: coordinates_2dsphere already exists');
    const runCommandMock = jest.fn().mockRejectedValue(err);
    service.$runCommandRaw = runCommandMock as any;

    await expect(service.onModuleInit()).resolves.not.toThrow();
    expect(runCommandMock).toHaveBeenCalled();
  });
});

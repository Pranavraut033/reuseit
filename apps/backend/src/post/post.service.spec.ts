describe('PostService (compiled)', () => {
  it('should search by title/description/tags when search is provided', async () => {
    const mockPrisma = { post: { findMany: jest.fn().mockResolvedValue([]) } } as any;
    const mockLocation = { findNearBy: jest.fn() } as any;
    const mockPoints = { addPoints: jest.fn() } as any;
    const mockNotification = { sendNotificationToUser: jest.fn() } as any;

    // Require compiled JS to avoid TS path alias issues in Jest

    const { PostService } = require('../../dist/post/post.service');

    const service = new PostService(mockPrisma, mockLocation, mockPoints, mockNotification);

    await service.findAll(10, 0, { search: 'bike' } as any);

    expect(mockPrisma.post.findMany).toHaveBeenCalled();
    const calledWith = (mockPrisma.post.findMany as jest.Mock).mock.calls[0][0] || {};
    expect(calledWith.where).toBeDefined();
    const and = calledWith.where.AND as any[];
    expect(and).toBeDefined();
    const searchClause = and.find((c: any) => c && c.OR !== undefined);
    expect(searchClause).toBeDefined();
    expect(searchClause.OR as any[]).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ title: expect.any(Object) }),
        expect.objectContaining({ description: expect.any(Object) }),
        expect.objectContaining({ tags: expect.any(Object) }),
      ]),
    );
  });
});

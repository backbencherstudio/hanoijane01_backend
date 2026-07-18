import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { AuthGuard } from './guards/auth.guard';
import { ExecutionContext } from '@nestjs/common';

const mockAuthService = {
  me: jest
    .fn()
    .mockResolvedValue({ success: true, data: { id: '1', name: 'Test User' } }),
  updateUser: jest.fn().mockResolvedValue({ success: true }),
};

// Fake user injection
const mockUserRequest = {
  user: {
    id: '1',
    email: 'test@example.com',
  },
};

// Mock Auth Guard
const mockAuthGuard = {
  canActivate: (context: ExecutionContext) => {
    const req = context.switchToHttp().getRequest();
    req.user = mockUserRequest.user;
    return true;
  },
};

describe('AuthController', () => {
  let controller: AuthController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
      ],
    })
      .overrideGuard(AuthGuard)
      .useValue(mockAuthGuard)
      .compile();

    controller = module.get<AuthController>(AuthController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should return current user info', async () => {
    const result = await controller.me({ user: { id: '1' } } as any);
    expect(result.data.id).toBe('1');
  });

  it('should update user', async () => {
    const result = await controller.updateUser(
      { user: { id: '1' } } as any,
      {},
      {} as any,
    );
    expect(result.success).toBe(true);
  });
});

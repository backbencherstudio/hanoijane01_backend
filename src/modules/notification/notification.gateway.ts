import {
  WebSocketGateway,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { OnModuleInit, Injectable, Logger } from '@nestjs/common';
import Redis from 'ioredis';
import appConfig from '../../config/app.config';
import { auth } from '../auth/auth';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
@Injectable()
export class NotificationGateway
  implements
    OnGatewayInit,
    OnGatewayConnection,
    OnGatewayDisconnect,
    OnModuleInit
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(NotificationGateway.name);
  private redisPubClient: Redis;
  private redisSubClient: Redis;

  onModuleInit() {
    try {
      this.redisPubClient = new Redis({
        host: appConfig().redis.host,
        port: Number(appConfig().redis.port),
        password: appConfig().redis.password,
        lazyConnect: true,
      });

      this.redisSubClient = new Redis({
        host: appConfig().redis.host,
        port: Number(appConfig().redis.port),
        password: appConfig().redis.password,
        lazyConnect: true,
      });

      this.redisPubClient.connect().catch((err) => {
        this.logger.warn(`Redis pub client connect error: ${err.message}`);
      });

      this.redisSubClient
        .connect()
        .then(() => {
          this.redisSubClient.subscribe(
            'notification_channel',
            (err, count) => {
              if (err) {
                this.logger.error(`Redis subscribe error: ${err.message}`);
              }
            },
          );
        })
        .catch((err) => {
          this.logger.warn(`Redis sub client connect error: ${err.message}`);
        });

      this.redisSubClient.on('message', (channel: string, message: string) => {
        if (channel === 'notification_channel') {
          try {
            const parsed = JSON.parse(message);
            if (parsed.receiverId && parsed.data) {
              this.server
                .to(parsed.receiverId)
                .emit('notification', parsed.data);
            }
          } catch (e) {
            this.logger.error(`Error parsing redis notification message: ${e}`);
          }
        }
      });
    } catch (err) {
      this.logger.error(`Error initializing Redis in gateway: ${err}`);
    }
  }

  afterInit(server: Server) {
    this.logger.log('WebSocket Gateway initialized');
  }

  /**
   * Helper: Extracts headers and token from Socket handshake
   */
  private extractHeaders(client: Socket): Headers {
    const reqHeaders = new Headers();
    const handshakeHeaders = client.handshake.headers;

    for (const [key, value] of Object.entries(handshakeHeaders)) {
      if (value) {
        if (Array.isArray(value)) {
          value.forEach((v) => reqHeaders.append(key, v));
        } else {
          reqHeaders.set(key, value);
        }
      }
    }

    const authToken =
      client.handshake.auth?.token ||
      client.handshake.auth?.authorization ||
      client.handshake.query?.token;

    if (authToken && !reqHeaders.has('authorization')) {
      const authHeader = String(authToken).startsWith('Bearer ')
        ? String(authToken)
        : `Bearer ${authToken}`;
      reqHeaders.set('authorization', authHeader);
    }

    return reqHeaders;
  }

  /**
   * Connection Authorization: Validates Better Auth session token
   */
  async handleConnection(client: Socket) {
    try {
      const headers = this.extractHeaders(client);
      const session = await auth.api.getSession({ headers });

      if (!session || !session.user) {
        this.logger.warn(
          `Unauthorized WebSocket connection attempt from socket ${client.id}`,
        );
        client.emit('error', { message: 'Unauthorized WebSocket connection' });
        client.disconnect(true);
        return;
      }

      if ((session.user as any)?.status === -1) {
        this.logger.warn(
          `Banned user ${session.user.id} tried connecting to WebSocket`,
        );
        client.emit('error', { message: 'Your account has been banned' });
        client.disconnect(true);
        return;
      }

      const authenticatedUserId = session.user.id;
      client.data.user = session.user;
      client.join(authenticatedUserId);

      this.logger.log(
        `User ${authenticatedUserId} (${session.user.email}) authenticated & joined room ${authenticatedUserId} (socket ${client.id})`,
      );
    } catch (err: any) {
      this.logger.error(`WebSocket connection auth error: ${err.message}`);
      client.disconnect(true);
    }
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Socket ${client.id} disconnected`);
  }

  /**
   * Target emission to a specific receiverId room ONLY.
   */
  async sendNotificationToUser(receiverId: string, payload: any) {
    if (!receiverId) return;

    // 1. Direct Socket Emit to room receiverId
    if (this.server) {
      this.server.to(receiverId).emit('notification', payload);
    }

    // 2. Redis pub/sub for multi-instance scaling
    if (this.redisPubClient && this.redisPubClient.status === 'ready') {
      try {
        await this.redisPubClient.publish(
          'notification_channel',
          JSON.stringify({ receiverId, data: payload }),
        );
      } catch (err) {
        this.logger.warn(`Failed to publish to redis: ${err}`);
      }
    }
  }
}

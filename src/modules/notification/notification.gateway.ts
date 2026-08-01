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

  async handleConnection(client: Socket) {
    const userId =
      (client.handshake.query.userId as string) ||
      (client.handshake.auth?.userId as string);

    if (userId) {
      client.join(userId);
      this.logger.log(
        `User ${userId} joined room ${userId} (socket ${client.id})`,
      );
    } else {
      this.logger.log(`Socket ${client.id} connected without userId`);
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

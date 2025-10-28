import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';

@WebSocketGateway({ 
  cors: { 
    origin: '*',
    methods: ['GET', 'POST']
  } 
})
export class NotificationGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(NotificationGateway.name);

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  /**
   * Client subscribes to tenant-specific notifications
   */
  @SubscribeMessage('join_tenant')
  handleJoinTenant(client: Socket, tenantId: string) {
    client.join(`tenant:${tenantId}`);
    this.logger.log(`Client ${client.id} joined tenant:${tenantId}`);
    return { success: true, message: `Joined tenant ${tenantId}` };
  }

  /**
   * Client leaves tenant room
   */
  @SubscribeMessage('leave_tenant')
  handleLeaveTenant(client: Socket, tenantId: string) {
    client.leave(`tenant:${tenantId}`);
    this.logger.log(`Client ${client.id} left tenant:${tenantId}`);
    return { success: true, message: `Left tenant ${tenantId}` };
  }

  /**
   * Notify that extraction is complete
   */
  notifyExtractionComplete(tenantId: string, caseId: string, jobId: string, data: any) {
    this.server.to(`tenant:${tenantId}`).emit('extraction_completed', {
      caseId,
      jobId,
      timestamp: new Date().toISOString(),
      ...data,
    });
    
    this.logger.log(`Notified tenant ${tenantId} about case ${caseId} extraction completion`);
  }

  /**
   * Notify about extraction failure
   */
  notifyExtractionFailed(tenantId: string, caseId: string, jobId: string, error: string) {
    this.server.to(`tenant:${tenantId}`).emit('extraction_failed', {
      caseId,
      jobId,
      error,
      timestamp: new Date().toISOString(),
    });
    
    this.logger.log(`Notified tenant ${tenantId} about case ${caseId} extraction failure`);
  }

  /**
   * Send general notification to tenant
   */
  notifyTenant(tenantId: string, event: string, data: any) {
    this.server.to(`tenant:${tenantId}`).emit(event, {
      ...data,
      timestamp: new Date().toISOString(),
    });
    
    this.logger.log(`Sent ${event} notification to tenant ${tenantId}`);
  }
}
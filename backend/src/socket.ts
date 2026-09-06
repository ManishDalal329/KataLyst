import { Server as HttpServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';

let io: SocketIOServer | null = null;

export function initSocket(server: HttpServer) {
  io = new SocketIOServer(server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST', 'PATCH']
    }
  });

  io.on('connection', (socket: Socket) => {
    console.log(`[Socket.io] Client connected: ${socket.id}`);

    socket.on('join_room', (roomId: string) => {
      socket.join(roomId);
      console.log(`[Socket.io] Socket ${socket.id} joined room ${roomId}`);
    });

    socket.on('disconnect', () => {
      console.log(`[Socket.io] Client disconnected: ${socket.id}`);
    });
  });

  return io;
}

export function emitBookingUpdate(bookingId: string, updatedBooking: any) {
  if (io) {
    io.to(`booking_${bookingId}`).emit('booking_status_changed', updatedBooking);
    io.emit('global_booking_update', updatedBooking);
  }
}

export function emitNewServiceRequest(request: any) {
  if (io) {
    io.emit('new_service_request', request);
    io.emit('global_request_update', { type: 'CREATED', request });
  }
}

export function emitRequestAccepted(requestId: string, customerId: string, data: any) {
  if (io) {
    io.to(`request_${requestId}`).emit('request_worker_accepted', data);
    io.to(`user_${customerId}`).emit('customer_notification', {
      type: 'WORKER_ACCEPTED',
      requestId,
      workerName: data.workerName,
      totalAccepted: data.totalAccepted,
      message: `${data.workerName} has accepted your request (${data.totalAccepted} responded).`,
      timestamp: new Date().toISOString()
    });
    io.emit('global_request_update', { type: 'ACCEPTED', requestId, data });
  }
}

export function emitRequestConfirmed(requestId: string, data: any) {
  if (io) {
    io.to(`request_${requestId}`).emit('request_confirmed', data);
    io.emit('global_request_update', { type: 'CONFIRMED', requestId, data });
  }
}

export function emitRequestStatusUpdate(requestId: string, data: any) {
  if (io) {
    io.to(`request_${requestId}`).emit('request_status_changed', data);
    io.emit('global_request_update', { type: 'STATUS_UPDATE', requestId, data });
  }
}

export function emitWorkerAvailabilityChanged(workerId: string, isAvailable: boolean) {
  if (io) {
    io.emit('worker_availability_changed', { workerId, isAvailable });
  }
}

export function emitWorkerDeclined(requestId: string, customerId: string, data: any) {
  if (io) {
    io.to(`request_${requestId}`).emit('request_worker_declined', data);
    const notif = {
      type: 'WORKER_DECLINED',
      requestId,
      workerId: data.workerId,
      workerName: data.workerName,
      reason: data.reason,
      message: `${data.workerName} withdrew acceptance (${data.reason || 'Declined'}).`,
      timestamp: new Date().toISOString()
    };
    io.to(`user_${customerId}`).emit('customer_notification', notif);
    io.emit('customer_notification', notif);
    io.emit('global_request_update', { type: 'WORKER_DECLINED', requestId, data });
  }
}


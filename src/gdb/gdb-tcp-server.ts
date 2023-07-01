import { createServer, Socket } from 'net';
import { GDBConnection } from './gdb-connection';
import { GDBServer } from './gdb-server';
import { RP2040 } from '../rp2040';

export class GDBTCPServer extends GDBServer {
  private socketServer = createServer();

  constructor(rp2040: RP2040, readonly port: number = 3333) {
    super(rp2040);
    this.socketServer.listen(port);
    this.socketServer.on('connection', (socket) => this.handleConnection(socket));
  }

  public stop() {
    this.socketServer.close();
  }

  handleConnection(socket: Socket) {
    this.info('GDB connected');
    socket.setNoDelay(true);

    const connection = new GDBConnection(this, (data) => {
      socket.write(data);
    });

    socket.on('data', (data) => {
      connection.feedData(data.toString('utf-8'));
    });

    socket.on('error', (err) => {
      this.removeConnection(connection);
      this.error(`GDB socket error ${err}`);
    });

    socket.on('close', () => {
      this.removeConnection(connection);
      this.info('GDB disconnected');
    });
  }
}

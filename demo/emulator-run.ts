import * as fs from 'fs';
import { RP2040 } from '../src';
import { bootromB1 } from './bootrom';
import { loadHex } from './intelhex';
import { GDBTCPServer } from '../src/gdb/gdb-tcp-server';

// Create an array with the compiled code of blink
// Execute the instructions from this array, one by one.

var mcu: RP2040;
var gdbServer: GDBTCPServer;

function reloadHex() {
  let hexFile = process.env['picotarget'];
  if (hexFile === undefined) {
    hexFile = 'hello_uart.hex';
  }
  const hex = fs.readFileSync(hexFile, 'utf-8');
  mcu.loadBootrom(bootromB1);
  loadHex(hex, mcu.flash, 0x10000000);
}

function restart() {
  mcu = new RP2040();
  gdbServer = new GDBTCPServer(mcu, 3333);
  console.log(`RP2040 GDB Server ready! Listening on port ${gdbServer.port}`);

  reloadHex();
  mcu.uart[0].onByte = (value) => {
    process.stdout.write(new Uint8Array([value]));
  };
  mcu.core.PC = 0x10000000;
  mcu.execute();
}

process.on('SIGHUP', () => {
  console.log('SIGHUP');
  mcu.stop();
  gdbServer.stop();

  restart();
});

restart();

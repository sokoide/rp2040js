import * as fs from 'fs';
import { RP2040 } from '../src';
import { bootromB1 } from './bootrom';
import { loadHex } from './intelhex';
import { GDBTCPServer } from '../src/gdb/gdb-tcp-server';

// Create an array with the compiled code of blink
// Execute the instructions from this array, one by one.

let mcu = new RP2040();

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
  reloadHex();
  mcu.uart[0].onByte = (value) => {
    process.stdout.write(new Uint8Array([value]));
  };
  mcu.core.PC = 0x10000000;
  mcu.execute();
}

const gdbServer = new GDBTCPServer(mcu, 3333);
console.log(`RP2040 GDB Server ready! Listening on port ${gdbServer.port}`);

process.on('SIGHUP', () => {
  console.log('SIGHUP');
  mcu.stop();
  // mcu.uart[0].onByte = () => {};

  mcu = new RP2040();
  restart();
});

restart();

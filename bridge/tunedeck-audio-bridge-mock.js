#!/usr/bin/env node

process.stdin.resume();
process.stdin.setEncoding('utf8');

let status = {
  bridgeReady: true,
  pluginConnected: false,
  localOutputReady: true,
  broadcastOutputReady: false,
  sampleRate: 48000,
  channels: 2,
  mode: 'dual-output-prep',
};

function send(message) {
  process.stdout.write(JSON.stringify(message) + '\n');
}

send({ type: 'status', ...status });

process.stdin.on('data', (chunk) => {
  const lines = chunk.split(/\r?\n/).filter(Boolean);
  for (const line of lines) {
    try {
      const msg = JSON.parse(line);
      switch (msg.type) {
        case 'bridge.ping':
          send({ type: 'pong', ...status });
          break;
        case 'bridge.connect':
          status.pluginConnected = true;
          status.broadcastOutputReady = true;
          send({ type: 'status', ...status });
          break;
        case 'bridge.disconnect':
          status.pluginConnected = false;
          status.broadcastOutputReady = false;
          send({ type: 'status', ...status });
          break;
        default:
          send({ type: 'ack', received: msg.type, ...status });
          break;
      }
    } catch {
      send({ type: 'error', message: 'Invalid bridge message.' });
    }
  }
});

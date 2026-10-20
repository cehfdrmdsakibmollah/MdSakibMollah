// ESM preflight: avoid starting duplicate Next.js / Express processes.
import net from 'node:net';

const ports = [3000, 4000];
const isOccupied = (port) => new Promise((resolve, reject) => {
  const server = net.createServer();
  server.once('error', (error) => {
    if (error.code === 'EADDRINUSE') return resolve(true);
    // Listening on IPv6 may be unavailable on some machines; retry via IPv4.
    if (error.code === 'EADDRNOTAVAIL' || error.code === 'EAFNOSUPPORT') {
      const ipv4 = net.createServer();
      ipv4.once('error', (err) => err.code === 'EADDRINUSE' ? resolve(true) : reject(err));
      ipv4.listen(port, '127.0.0.1', () => ipv4.close(() => resolve(false)));
      return;
    }
    reject(error);
  });
  server.listen(port, '::', () => server.close(() => resolve(false)));
});

try {
  const busy = [];
  for (const port of ports) if (await isOccupied(port)) busy.push(port);
  if (busy.length) {
    console.error('\n[Portfolio] Cannot start twice. Already listening:', busy.join(', '));
    console.error('Stop the older Next.js / API terminal with Ctrl+C, then run npm run dev once from the project root.');
    console.error('To inspect the owning PID in PowerShell: Get-NetTCPConnection -LocalPort 3000,4000 -State Listen\n');
    process.exitCode = 1;
  } else {
    console.log('[Portfolio] Ports 3000 and 4000 are available.');
  }
} catch (error) {
  console.error('[Portfolio] Port preflight failed:', error.message);
  process.exitCode = 1;
}

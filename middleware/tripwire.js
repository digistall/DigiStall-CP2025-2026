export const honeypotTripwire = (req, res, next) => {
  const trapRoutes = ['/wp-admin', '/.env', '/.git', '/admin/config.php', '/phpmyadmin'];
  
  if (trapRoutes.some(route => req.path.includes(route))) {
    const attackerIp = req.ip || req.connection.remoteAddress;
    
    // 1. High-Priority Logging
    console.error(`\n[CRITICAL SECURITY ALERT] Malicious Automated Scanning Detected!`);
    console.error(`-> Offending IP: ${attackerIp}`);
    console.error(`-> Target Route: ${req.path}`);
    console.error(`-> User-Agent: ${req.headers['user-agent']}\n`);
    
    // 2. The Tarpit (Stall the response to drain scanner resources)
    setTimeout(() => {
      // 3. Fake Server Error
      return res.status(500).send(`
        <html><body><h1>Internal Server Error</h1>
        <p>Fatal exception in kernel module at 0x0000000000000000</p>
        <p>Memory dump initiated...</p>
        </body></html>
      `);
    }, 5000); // 5-second stall
    return;
  }
  
  next();
};

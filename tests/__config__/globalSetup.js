const { spawn } = require('child_process');
const http = require('http');

module.exports = async () => {
    console.log('\nStarting API server for testing...');

    // Start the server (assuming it's in the server directory relative to root)
    // We use detached: true to be able to kill the whole process group if needed,
    // but standard spawn is usually enough for simple node processes.
    global.serverProcess = spawn('node', ['server/index.js'], {
        stdio: 'inherit', // Pipe output so we can see server logs
        cwd: process.cwd(),
        env: {
            ...process.env,
            PORT: '3001',
            NODE_ENV: 'test'
        }
    });

    // Wait for server to be ready
    await waitForServer(3001);
    console.log('Server is ready for testing.');
};

function waitForServer(port) {
    return new Promise((resolve, reject) => {
        const maxRetries = 20;
        let retries = 0;

        const interval = setInterval(() => {
            const req = http.get(`http://localhost:${port}/api/health`, (res) => {
                if (res.statusCode === 200) {
                    clearInterval(interval);
                    resolve();
                }
            });

            req.on('error', (err) => {
                // Ignore connection refused errors while server is starting
            });

            req.end();

            retries++;
            if (retries > maxRetries) {
                clearInterval(interval);
                if (global.serverProcess) {
                    global.serverProcess.kill();
                }
                reject(new Error('Server failed to start within timeout'));
            }
        }, 1000);
    });
}

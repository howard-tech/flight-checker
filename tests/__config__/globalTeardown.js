module.exports = async () => {
    if (global.serverProcess) {
        console.log('\nStopping API server...');
        global.serverProcess.kill();
        // Give it a moment to shut down
        await new Promise(resolve => setTimeout(resolve, 500));
        console.log('API server stopped.');
    }
};

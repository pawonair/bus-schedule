const { app, BrowserWindow, ipcMain } = require('electron/main');
const path = require('node:path');

const createWindow = () => {
    const win = new BrowserWindow({
        width: 840,
        height: 515,
        icon: './icons/Icon.png',
        resizable: false,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            nodeIntegration: false,
            contextIsolation: true,
            webSecurity: true,
            webviewTag: true,
        },
    });

    win.webContents.session.webRequest.onHeadersReceived((details, callback) => {
        callback({
            responseHeaders: {
                ...details.responseHeaders,
                'Content-Security-Policy': [
                    "default-src 'self';"
                    + "img-src 'self' https://www.vgn.de;"
                    + "connect-src 'self' https://www.vgn.de https://nominatim.openstreetmap.org;"
                    + "style-src 'self' 'unsafe-inline';"
                ],
            },
        });
    });

    win.loadFile('index.html');
    // win.webContents.openDevTools();
};

app.whenReady().then(() => {
    ipcMain.handle('ping', () => 'pong');
    createWindow();

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
});

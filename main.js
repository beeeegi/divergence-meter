const { app, BrowserWindow } = require('electron')
const path = require('path')

app.on('ready', () => {
    const win = new BrowserWindow({
        autoHideMenuBar: true,
        icon: path.join(__dirname, 'icon.ico'),
        webPreferences: {
            contextIsolation: true,
            nodeIntegration: false,
            preload: path.join(__dirname, 'preload.js'),
        },
    })
    
    win.maximize()
    win.loadFile('index.html')
})
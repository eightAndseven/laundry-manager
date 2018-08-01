const electron = require('electron')
const path = require('path')
const url = require('url')
const os = require('os')
const storage = require('electron-json-storage')

const {app, BrowserWindow, Menu, dialog, ipcMain} = electron

// Global variable
process.env.NODE_ENV = 'dev'
let windowMain
let windowSettings

global.globalappsettings = {}
global.apptransactions = []


// Main window
function createWindowMain(){
    windowMain = new BrowserWindow({
        'height' : 600,
        'width' : 1000,
        'minHeight' : 600,
        'minWIdth' : 1000
    })

    windowMain.loadURL(url.format({
        pathname : path.join(__dirname, 'index.html'),
        protocol : 'file',
        slashes : true
    }))

    windowMain.on('closed', () => {
        app.quit()
    })

    const menu = Menu.buildFromTemplate(menuTemplate)
    Menu.setApplicationMenu(menu)

    // Applications settings
    // storage.get('appmanagersettings', mainAppSettings)
    storage.get('appmanagersettings',  (err, data) => {
        if (err) throw err
        globalappsettings = data
        windowMain.appsettings = globalappsettings
    })
    // create if there is no appsettings
    storage.get('appmanagersettings', (err, data) => {
        if (err) throw err
        if (Object.keys(data).length == 0 && data.constructor === Object) {
            emptyobj = {
                appname: 'Laundry Manager',
                appdesc: 'Sample POS Laundry Manager',
                columns: []
            }
            storage.set('appmanagersettings', emptyobj, err => {
                if (err) throw err
                globalappsettings = emptyobj
                windowMain.appsettings = globalappsettings
            })
        } else {
            globalappsettings = data
            windowMain.appsettings = globalappsettings
        }   
    })
    apptransactions.push('hi im from main.js')
    // windowMain.apptransactions = apptransactions
}

function mainAppSettings(err, data) {
    if (err) throw err
    globalappsettings = data
    windowMain.appsettings = globalappsettings
    windowMain.webContents.send('user:settings', data)
}


// Settings Window
function createSettingsWindow(){
    windowSettings = new BrowserWindow({
        title: 'User Settings'
    })
    windowSettings.loadURL(url.format({
        pathname: path.join(__dirname, 'settings.html'),
        protocol: 'file:',
        slashes: true
    }))
    windowSettings.on('close', () => {
        windowSettings = null
    })
    windowSettings.appsettings = JSON.stringify(globalappsettings)
}

// set storage
function setStorageLoc(){
    storage.setDataPath(os.tmpdir())
    const dataPath = storage.getDataPath()
}

app.on('ready', () => {
    setStorageLoc()
    createWindowMain()
})

app.on('window-all-closed', () => {
    if (process.platform) {
        app.quit()
    }
})

/**
 * ipcMain
 */
ipcMain.on('settings:update', (err, item) => {
    itemupdate = JSON.parse(item)
    console.log(itemupdate)
    storage.set('appmanagersettings', itemupdate, (err) => {
        if (err) throw err
        storage.get('appmanagersettings', mainAppSettings)
    })
    windowSettings.close()
    windowSettings = null
})

ipcMain.on('settings:cancel', (err, item) => {
    windowSettings.close()
    windowSettings = null
})

ipcMain.on('transact:add', (err, item) => {
    // load from index.html is stringified
    const load = JSON.parse(item)
    console.log(buildtransaction('now', load))
    
    // apptransactions.push(load)
    // console.log(load)
})
function buildtransaction (date, load) {
    let total = 0
    load.forEach(item => {
        if (item.type === 'cost') total += (item.value.price * item.value.quantity)
    })
    return {
        date : date,
        transact : load,
        total : total
    }
}

// Menu Template
const menuTemplate = [
    {
        label: 'File',
        submenu:[
            {
                label: 'Open File',
                accelerator:process.platform === 'darwin' ? 'Command+F' : 'Ctrl+F',
                click(){}
            },
            {
                label: 'Quit',
                accelerator:process.platform === 'darwin' ? 'Command+Q' : 'Ctrl+Q',
                click(){
                    const buttons = ['Yes', 'No']
                    dialog.showMessageBox(windowMain, {
                        options: ['question'],
                        title: 'Chain',
                        message: 'Do you really want to quit?',
                        buttons: buttons
                    }, (response) => {
                        if (buttons[response] === 'Yes'){
                            app.quit()
                        }
                    })
                }
            }
        ]
    },
    {
        label: 'Settings',
        submenu: [
            {
                label: 'Open Settings',
                accelerator:process.platform === 'darwin' ? 'Command+O' : 'Ctrl+O',
                click(){
                    createSettingsWindow()
                }
            }
        ]
    }
]

if (process.platform === 'darwin'){
    menu.unshift({})
}

if (process.env.NODE_ENV !== 'production'){
    menuTemplate.push({
        label: 'Developer Tools',
        submenu: [
            {
                label: 'Toggle DevTools',
                accelerator:process.platform === 'darwin' ? 'Command+I' : 'F12',
                click(item, focusedWindow){
                    focusedWindow.toggleDevTools();
                }
            },
            {
                role: 'reload'
            }
        ]
    })
}
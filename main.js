const electron = require('electron')
const path = require('path')
const url = require('url')
const os = require('os')
const storage = require('electron-json-storage')
const dateformat = require('dateformat')
const excel = require('./functions/excel')

const {app, BrowserWindow, Menu, dialog, ipcMain} = electron

// Global variable
process.env.NODE_ENV = 'dev'
let windowMain
let windowSettings
let currentSavePath = null

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
        pathname : path.join(__dirname, 'windows/index/index.html'),
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
        pathname: path.join(__dirname, 'windows/column-settings/settings.html'),
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
    const transaction = buildtransaction(dateformat(new Date(), 'yyyy-mm-dd HH:MM:ss'), load)
    console.log(transaction)
    apptransactions.push(transaction)
    
    windowMain.webContents.send('table:add', JSON.stringify(transaction))
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

function saveAsExcel(transaction, filename) {
    const wb = new xl.Workbook()

    const ws = wb.addWorksheet('Sheet 1')
    const ws2 = wb.addWorksheet('Sheet 2')

    const style = wb.createStyle({
        font : {
            color : '#FF0800',
            size : 12
        },
        numberFormat : 'Php ##.00;'
    })

    ws.cell(1, 1).number(100).style(style)
    ws.cell(1, 2).number(200).style(style)
    ws.cell(1, 3).formula('A1 + B1').style(style)
    ws.cell(2, 1).string('string').style(style)
    ws.cell(3, 1).bool(true).style(style).style({font: {size:20}})
    wb.write(filename)
}

function saveAsFile(){
    windowMain.webContents.executeJavaScript(`document.querySelector('input#work-title').value`, (title) => {
        const options = {
            defaultPath: title,
            buttonLabel : 'Save As',
            filters : [
                {
                    name : 'Excel Workbook',
                    extensions : ['xlsx']
                }
            ]
        }
        dialog.showSaveDialog(windowMain, options, (filename) => {
            if (filename !== undefined) {
                excel.saveAsExcel(globalappsettings.columns, apptransactions, filename, (err) => {
                    if (err) throw err
                })
                currentSavePath = filename
            }
            console.log('Saved in ' + filename)
        })
    })
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
                label: 'Save',
                accelerator:process.platform === 'darwin' ? 'Command+S' : 'Ctrl+S',
                click(){

                    if (currentSavePath != null) {
                        // has saved file
                        windowMain.webContents.executeJavaScript(`document.querySelector('input#work-title').value`, value => {
                            const dir = currentSavePath.split('\\')
                            const currenttitle = value + '.xlsx'
                            if (dir[dir.length-1] === currenttitle) {
                                excel.saveAsExcel(globalappsettings.columns, apptransactions, currentSavePath, (err) => {
                                    if (err) throw err
                                })
                            } else {
                                saveAsFile()
                            }
                        })
                    } else {
                        // has no current saved file
                        saveAsFile()
                    }
                }
            },
            {
                label: 'Save As...',
                accelerator:process.platform === 'darwin' ? 'Command+Shift+S' : 'Ctrl+Shift+S',
                click(){
                    saveAsFile()
                }
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
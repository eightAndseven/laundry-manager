const electron = require('electron')
const path = require('path')
const url = require('url')
const dateformat = require('dateformat')
const excel = require('./functions/excel')
const localapp = require('./functions/localapp')

const {app, BrowserWindow, Menu, dialog, ipcMain} = electron

const localfolder = 'POSManager'

// Global variable
process.env.NODE_ENV = 'production'
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
    // window Main Menu only
    windowMain.setMenu(menu)

    // all windows
    // Menu.setApplicationMenu(menu)

    localapp.createLocalAppDataSync(localfolder)
    localapp.getColumnSetting(localfolder, (data) => {
        globalappsettings = data
        windowMain.appsettings = globalappsettings
    })
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
    // set menu to null
    windowSettings.setMenu(null)
}

app.on('ready', () => {
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
    localapp.updateColumnSetting(localfolder, itemupdate, (data) => {
        globalappsettings = data
        windowMain.appsettings = globalappsettings
        windowMain.webContents.send('user:settings', data)
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

// function to build transaction
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

// function for save as dialog
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
                accelerator:process.platform === 'darwin' ? 'Command+O' : 'Ctrl+O',
                click(){
                    function arrangeTransaction (transaction, summary, columns) {
                        const apptransaction = []
                        function buildsingletransaction (name, type, value) {
                            return {
                                name : name,
                                type : type,
                                value : value
                            }
                        }
                        transaction.forEach(item => {
                            const date = item['date_time']
                            let transactarr = []
                            let total = 0
                            for (key in item) {
                                if (key !== 'date_time'){
                                    const foundcolumn = columns.find(obj => obj['column_id'] === key)
                                    const name = key
                                    const type = foundcolumn['column_worn'].toLowerCase()
                                    let value
                                    if (type === 'cost'){
                                        const foundsummary = summary.filter(obj => obj['prod_name'] === key)
                                        const valfromxl = parseFloat(item[key])
                                        const sumprice = foundsummary.find(obj => valfromxl % parseFloat(obj['prod_price']) == 0)
                                        const price = parseFloat(sumprice['prod_price'])
                                        const qty = valfromxl / price
                                        total += valfromxl
                                        value = {
                                            price : price,
                                            quantity : qty
                                        }
                                    } else if (type === 'name'){
                                        value = item[key]
                                    }
                                    transactarr.push(buildsingletransaction(name, type, value))
                                }
                            }
                            apptransaction.push({
                                date : date,
                                transact : transactarr,
                                total : total
                            })
                        })
                        return apptransaction
                    }
                    
                    const getfromExcel = (array, find) => array.filter(obj => obj[find])[0][find]
                    const options = {
                        title : 'Open Excel Workbook',
                        filters : [
                            {name : 'Excel Workbook', extensions : ['xlsx']}
                        ],
                        properties : ['openFile']
                    }
                    dialog.showOpenDialog(windowMain, options, (filename) => {
                        if (filename !== undefined) {
                            filename = filename[0]
                            excel.openExcel(filename, (err, result) => {
                                if (err) throw err
                                const transaction = getfromExcel(result, 'Transactions')
                                const summaryreport = getfromExcel(result, 'Summary Report')
                                const columns = getfromExcel(result, 'Columns')
                                const apptransact = arrangeTransaction(transaction, summaryreport, columns)
                                columns.forEach(item => {
                                    if (item.column_worn === 'Cost') item.column_price = parseFloat(item.column_price)
                                })
                                // change global variables
                                apptransactions = apptransact
                                globalappsettings.columns = columns
                                const title = filename.split('\\')[filename.split('\\').length - 1].replace('.xlsx', '')
                                windowMain.webContents.send('transact:open', title)
                            })
                        }
                    })
                }
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
                accelerator:process.platform === 'darwin' ? 'Command+P' : 'Ctrl+P',
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
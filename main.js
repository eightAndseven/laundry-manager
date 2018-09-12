const electron = require('electron')
const path = require('path')
const url = require('url')
const dateformat = require('dateformat')
const excel = require('./functions/excel')
const localapp = require('./functions/localapp')

const {app, BrowserWindow, Menu, dialog, ipcMain} = electron
app.showExitPrompt = true

const localfolder = 'POSManager'

// Global variable
process.env.NODE_ENV = 'development'
let windowInit
let windowMain
let windowSettings
let windowCustomer
let splashScreen
global.currentSavePath = null

global.globalappsettings = {}
global.apptransactions = []
global.customersetting = {}

global.unsavedchanges = []

/**
 * @description Initialize
 */
function appInit() {
    localapp.createLocalAppDataSync(localfolder)
    const prevfile = localapp.getCurrentTransactionBook(localfolder)
    if (prevfile != null) {
        createSplashScreen()
        const filepath = prevfile[0]
        const transactionbook = excel.openExcelSync(filepath)
        const transaction = getfromExcel(transactionbook, 'Transactions')
        const summaryreport = getfromExcel(transactionbook, 'Summary Report')
        const columns = getfromExcel(transactionbook, 'Columns')
        const customertransaction = getfromExcel(transactionbook, 'Customer Transactions')
        const customersxl = getfromExcel(transactionbook, 'Customers')
        const apptransact = arrangeTransaction(transaction, summaryreport, columns)

        // customers
        if (customersxl.length > 0) {
            for (i in customersxl) {
                customersxl[i].order = []
            }
        }

        // customers transaction
        if (customertransaction.length > 0) {
            for (i in customertransaction) {
                let date
                for (ii in apptransact) {
                    if (customertransaction[i].transact_date === apptransact[ii].date) {
                        date = apptransact[ii].date
                        apptransact[ii].customer = {
                            id : parseInt(customertransaction[i].id),
                            name : customertransaction[i].name,
                            norder : parseInt(customertransaction[i].numberoforder)
                        }
                        break
                    }
                }
                for (ii in customersxl) {
                    if (parseInt(customertransaction[i].id) == parseInt(customersxl[ii].id)) {
                        customersxl[ii].order.push(date)
                        break
                    }
                }
            }
        }

        columns.forEach(item => {
            if (item.column_worn === 'Cost') item.column_price = parseFloat(item.column_price)
        })
        apptransactions = apptransact
        localapp.updateColumnOnly(localfolder, columns, result => {
            globalappsettings = result
        })

        // change save path
        currentSavePath = filepath
        
        // local customer setting
        localapp.getCustomerSetting(localfolder, result => {
            customersetting = result
            customersetting.list = customersxl
            localapp.updateCustomerSetting(localfolder, customersetting, result => {
                customersetting = result
            })
        })
        createWindowMain()
    } else {
        createWindowInit()
    }
}

/**
 * @description Function to create the init window
 */
function createWindowInit() {
    windowInit = new BrowserWindow({
        height : 400,
        width : 600,
        resizable : false,
        show : false
    })

    windowInit.loadURL(url.format({
        pathname : path.join(__dirname, 'browserwindows/init/init.html'),
        protocol : 'file',
        slashes : true
    }))

    windowInit.on('close', () => {
        windowInit = null
    })

    windowInit.setMenu(null)

    windowInit.once('ready-to-show', () => {
        windowInit.show()
    })
}


/**
 * @description Function to create the main window
 */
function createWindowMain(){
    windowMain = new BrowserWindow({
        'height' : 600,
        'width' : 1000,
        'minHeight' : 600,
        'minWIdth' : 1000,
        'show' : false
    })

    windowMain.loadURL(url.format({
        pathname : path.join(__dirname, 'browserwindows/index/index.html'),
        protocol : 'file',
        slashes : true
    }))

    windowMain.on('close', (e) => {
        if (unsavedchanges.length > 0) {
            // https://github.com/electron/electron/issues/2301
            // handle if there are unsaved changes
            if (app.showExitPrompt) {
                e.preventDefault()
                const buttons = ['Yes', 'No', 'Cancel']
                dialog.showMessageBox(windowMain, {
                    options: ['question'],
                    type: 'warning',
                    title: 'Unsaved changes',
                    message: 'Do you want to save your unsaved changes before exit?',
                    buttons: buttons
                }, response => {
                    if (buttons[response] === 'Yes') {
                        // save
                        windowMain.hide()
                        excel.saveAsExcel(globalappsettings.columns, apptransactions, customersetting.list, currentSavePath, (err) => {
                            if (err) throw err
                            setTimeout(() => {
                                app.showExitPrompt = false
                                windowMain.close()
                            }, 1000)
                        })
                    } else if (buttons[response] === 'No') {
                        app.showExitPrompt = false
                        windowMain.close()
                    }
                })
            } else {
                app.quit()
            }
        } else {
            app.quit()
        }
    })

    const menu = Menu.buildFromTemplate(menuTemplate)
    // window Main Menu only
    windowMain.setMenu(menu)

    // all windows
    // Menu.setApplicationMenu(menu)

    localapp.getColumnSetting(localfolder, (data) => {
        globalappsettings = data
        windowMain.appsettings = globalappsettings
    })
    windowMain.once('ready-to-show', () => {
        splashScreen.close()
        windowMain.show()
    })
}

/**
 * @description Function to create the splash screen window
 */
function createSplashScreen() {
    splashScreen = new BrowserWindow({
        frame : false,
        resizable : false,
        transparent : true,
        width: 200, 
        height: 400,
    })
    splashScreen.loadURL(url.format({
        pathname : path.join(__dirname, 'browserwindows/splash/splash.html'),
        protocol : 'file',
        slashes : true
    }))
    splashScreen.on('close', () => {
        splashScreen = null
    })
}

/**
 * @description Function to create the column settings window
 */
function createSettingsWindow(){
    windowSettings = new BrowserWindow({
        title: 'User Settings',
        resizable : false,
        height : 675,
        width : 800
    })
    windowSettings.loadURL(url.format({
        pathname: path.join(__dirname, 'browserwindows/column-settings/settings.html'),
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

function createWindowCustomer() {
    windowCustomer = new BrowserWindow({
        title : 'Customer Page',
        resizable : false
    })
    windowCustomer.loadURL(url.format({
        pathname : path.join(__dirname, 'browserwindows/customer/customer.html'),
        protocol : 'file:',
        slashes : true
    }))
    windowCustomer.on('close', () => {
        windowCustomer = null
    })
}

app.on('ready', () => {
    appInit()
})

app.on('window-all-closed', () => {
    if(process.platform != 'darwin')
        app.quit()
})

/**
 * ipcMain
 */
ipcMain.on('settings:update', (err, item) => {
    unsavedchanges.push('updated settings')
    itemupdate = JSON.parse(item)
    localapp.updateColumnSetting(localfolder, itemupdate, (data) => {
        globalappsettings = data
        windowMain.appsettings = globalappsettings
        windowMain.webContents.send('user:settings', data)
        unsavedchanges.push('settings updated')
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
    unsavedchanges.push('added transaction')
    const load = JSON.parse(item)
    const transaction = buildtransaction(dateformat(new Date(), 'yyyy-mm-dd HH:MM:ss'), load)
    if (typeof transaction.customer !== 'undefined') {
        customerorderincrement(transaction)
    }
    
    apptransactions.push(transaction)
    
    windowMain.webContents.send('table:add', JSON.stringify(transaction))
})

ipcMain.on('init:new', (err, item) => {
    dialogNewTransactionBook(windowInit)
})

ipcMain.on('init:open', (err, item) => {
    dialogOpenTransactionBook(windowInit)
})


// Customer page
ipcMain.on('customer:add', (err, item) => {
    // load from ipcRenderer is stringified
    const obj = JSON.parse(item)
    customersetting.list.push(obj)
    localapp.updateCustomerSetting(localfolder, customersetting, data => {
        unsavedchanges.push('added customer')
        windowCustomer.webContents.send('customer:added', JSON.stringify(obj))
        windowMain.webContents.send('index:reset:column', true)
    })
})

ipcMain.on('customer:activate', (err, item) => {
    // load from ipcRenderer is boolean
    customersetting.activated = item
    localapp.updateCustomerSetting(localfolder, customersetting, data => {
        unsavedchanges.push('customer activated')
        windowCustomer.webContents.send('customer:activated', item)
        windowMain.webContents.send('transact:reset', true)
    })
})

ipcMain.on('customer:delete', (err, item) => {
    const l = customersetting.list
    for(i in l) {
        if (l[i].id == item) {
            customersetting.list.splice(i, 1)
            break
        }
    }
    localapp.updateCustomerSetting(localfolder, customersetting, data => {
        unsavedchanges.push('remove customer')
        windowCustomer.webContents.send('customer:deleted', item)
        windowMain.webContents.send('index:reset:column', true)
    })
})

ipcMain.on('index:open:customerpage', (err, item) => {
    if (windowCustomer == null || typeof windowCustomer === 'undefined') {
        createWindowCustomer()
    }
})

ipcMain.on('index:open:customizecolumn', (err, item) => {
    if (windowSettings == null || typeof windowSettings === 'undefined') {
        createSettingsWindow()
    }
})

ipcMain.on('index:transaction:remove', (err, item) => {
    // load from renderer is stringified
    const load = JSON.parse(item)
    let tosplice = []
    for (i in apptransactions) {
        if (apptransactions[i].date == load[0]) {
            const a = load.shift()
            if (typeof apptransactions[i].customer !== 'undefined') {
                const id = apptransactions[i].customer.id
                for (ii in customersetting.list) {
                    if (id == parseInt(customersetting.list[ii].id)) {
                        for (iii in customersetting.list[ii].order) {
                            if (a === customersetting.list[ii].order[iii]) {
                                customersetting.list[ii].order.splice(iii, 1)
                                break
                            }
                        }
                        break
                    }
                }
            }
            tosplice.push(i)
        }
    }
    tosplice.reverse()
    for (i in tosplice) {
        apptransactions.splice(tosplice[i], 1)
    }

    localapp.updateCustomerSetting(localfolder, customersetting, data => {
        unsavedchanges.push('removed')
        windowMain.webContents.send('index:transaction:removed', true)
    })
})

// function to build transaction
function buildtransaction (date, load) {
    let total = 0
    load.transact.forEach(item => {
        if (item.type === 'cost') total += (item.value.price * item.value.quantity)
    })
    if (typeof load.customer === 'undefined') {
        return {
            date : date,
            transact : load.transact,
            total : total
        }
    } else {
        return {
            date : date,
            customer : load.customer,
            transact : load.transact,
            total : total
        }
    }
}

/**
 * @description Function to increment the order of customer
 */
function customerorderincrement(transaction) {
    transaction.customer.norder += 1
    for (i in customersetting.list) {
        if (customersetting.list[i].id == transaction.customer.id) {
            customersetting.list[i].order.push(transaction.date)
            localapp.updateCustomerSetting(localfolder, customersetting, data => {})
            break
        }
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
                unsavedchanges = []
                excel.saveAsExcel(globalappsettings.columns, apptransactions, customersetting.list, filename, (err) => {
                    if (err) throw err
                })
                currentSavePath = filename
            }
        })
    })
}

const getfromExcel = (array, find) => array.filter(obj => obj[find])[0][find]

/**
 * @description arrange transaction to use for data
 * @param {Array} transaction 
 * @param {Object} summary 
 * @param {Object} columns 
 */
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
            if (key !== 'date_time' && key !== 'total'){
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


/**
 * @description Function to open dialog box for new transaction book
 * @param {BrowserWindow} windoww
 */
function dialogNewTransactionBook(windoww) {
    const options = {
        title : 'New Transaction Book',
        filters : [
            {
                name : 'Excel Workbook',
                extensions : ['xlsx']
            }
        ]
    }
    dialog.showSaveDialog(windoww, options, (filename) => {
        if (filename !== undefined) {
            excel.saveNewExcel(filename, (file) => {
                localapp.setCurrentTransactionBook(localfolder, file, (err) => {
                    if (err) throw err
                    const f = localapp.getCurrentTransactionBook(localfolder)
                    app.relaunch({args: process.argv.slice(1).concat(['--relaunch'])})
                    app.exit(0)
                })
            })
        }
    })
}

/**
 * @description Function to open dialog box to open a transaction book
 * @param {BrowserWindow} windoww 
 */
function dialogOpenTransactionBook(windoww) {
    const options = {
        title : 'Open Excel Workbook',
        filters : [
            {name : 'Excel Workbook', extensions : ['xlsx']}
        ],
        properties : ['openFile']
    }
    dialog.showOpenDialog(windoww, options, (filename) => {
        if (filename !== undefined) {
            filename = filename[0]
            excel.openExcel(filename, (err, result) => {
                if (err) throw err
                localapp.setCurrentTransactionBook(localfolder, filename, () => {
                    if (err) throw err
                    app.relaunch({args: process.argv.slice(1).concat(['--relaunch'])})
                    app.exit(0)
                })
            })
        }
    })
}


// Menu Template
const menuTemplate = [
    {
        label: 'File',
        submenu:[
            {
                label: 'New Transaction Book',
                accelerator: process.platform === 'darwin' ? 'Command+N' : 'Ctrl+N',
                click() {
                    dialogNewTransactionBook(windowMain)
                }
            },
            {
                label: 'Open File',
                accelerator:process.platform === 'darwin' ? 'Command+O' : 'Ctrl+O',
                click(){
                    dialogOpenTransactionBook(windowMain)
                }
            },
            {
                label: 'Save',
                accelerator:process.platform === 'darwin' ? 'Command+S' : 'Ctrl+S',
                click(){
                    if (currentSavePath != null) {
                        // has saved file
                        if (unsavedchanges.length > 0) {
                            unsavedchanges = []
                            excel.saveAsExcel(globalappsettings.columns, apptransactions, customersetting.list, currentSavePath, (err) => {
                                if (err) throw err
                            })
                        }
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
                label: 'Customize Columns',
                accelerator:process.platform === 'darwin' ? 'Command+P' : 'Ctrl+P',
                click(){
                    if (windowSettings == null || typeof windowSettings === 'undefined') {
                        createSettingsWindow()
                    }
                }
            },
            {
                label : 'Customer Page',
                accelerator : process.platform === 'darwin' ? 'Command+L' : 'Ctrl+L',
                click() {
                    if (windowCustomer == null || typeof windowCustomer === 'undefined') {
                        createWindowCustomer()
                    }
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
const electron = require('electron')
const path = require('path')
const url = require('url')

const {app, BrowserWindow, Menu, dialog} = electron

process.env.NODE_ENV = 'dev'

let windowMain

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

    const menu = Menu.buildFromTemplate(menuTemplate)
    Menu.setApplicationMenu(menu)
}

app.on('ready', createWindowMain)

app.on('window-all-closed', () => {
    if (process.platform) {
        app.quit()
    }
})




// Menu 
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
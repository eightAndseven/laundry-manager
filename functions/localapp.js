const fs = require('fs')

const columnsettingname = 'columnsetting.json'

const applicationsetting = 'settings.json'

/**
 * @description Function to create a folder in the User > AppData > Local
 * @param {Folder name of the Application} foldername 
 * @param {Function callback} callback 
 */
const createLocalAppData = (foldername, callback) => {
    try {
        const path = process.env.LOCALAPPDATA + '\\' + foldername
        if (!fs.existsSync(path)) {
            fs.mkdirSync(path)
        }
        const settingspath = process.env.LOCALAPPDATA + '\\' + foldername + '\\' + applicationsetting
        if (!fs.existsSync(settingspath)) {
            fs.writeFileSync(settingspath, JSON.stringify({}, null, 4))
        }
        if (typeof callback !== 'undefined') callback(null)
    } catch (err) {
        if (typeof callback !== 'undefined') callback(err)
    }
}

/**
 * @description Function to check settings in boot
 * @param {Function callback} callback 
 */
const getColumnSetting = (foldername, callback) => {
    
    const jsonpath = process.env.LOCALAPPDATA + '\\' + foldername + '\\' + columnsettingname

    function getFile(err) {
        if (err) throw err
        fs.readFile(jsonpath, (err, data) => {
            if (err) throw err
            callback(JSON.parse(data))
        })
    }

    // check if json does not exist and create a json file
    if (!fs.existsSync(jsonpath)) {
        emptyobj = {
            appname: 'Laundry Manager',
            appdesc: 'Sample POS Laundry Manager',
            columns: []
        }
        fs.writeFile(jsonpath, JSON.stringify(emptyobj, null, 4), getFile)
    } else {
        getFile(null)
    }
}

/**
 * @description Function to update column setting
 * @param {Folder name of the application} foldername 
 * @param {Object data to update} data 
 * @param {Function callback} callback 
 */
const updateColumnSetting = (foldername, settingupdate, callback) => {
    
    const jsonpath = process.env.LOCALAPPDATA + '\\' + foldername + '\\' + columnsettingname

    function updateFile(err) {
        if (err) throw err
        fs.writeFile(jsonpath, JSON.stringify(settingupdate, null, 4), getFile)
    }

    function getFile(err) {
        if (err) throw err
        fs.readFile(jsonpath, (err, data) => {
            if (err) throw err
            callback(JSON.parse(data))
        })
    }

    // check if json does not exist and create a json file
    if (!fs.existsSync(jsonpath)) {
        const emptyobj = {
            appname: 'Laundry Manager',
            appdesc: 'Sample POS Laundry Manager',
            columns: []
        }
        fs.writeFile(jsonpath, JSON.stringify(emptyobj, null, 4), updateFile)
    } else {
        updateFile(null)
    }
}

/**
 * @description Function to update column only
 * @param {String} foldername 
 * @param {Object} columns
 * @param {Function} callback
 */
const updateColumnOnly = (foldername, columns, callback) => {
    const jsonpath = process.env.LOCALAPPDATA + '\\' + foldername + '\\' + columnsettingname

    function updateFile(err) {
        if (err) throw err
        let columnsetting = JSON.parse(fs.readFileSync(jsonpath))
        columnsetting.columns = columns
        fs.writeFileSync(jsonpath, JSON.stringify(columnsetting, null, 4))
        getFile(null)
    }

    function getFile(err) {
        if (err) throw err
        const result = JSON.parse(fs.readFileSync(jsonpath))
        callback(result)
    }

    // check if json does not exist and create a json file
    if (!fs.existsSync(jsonpath)) {
        const emptyobj = {
            appname: 'Laundry Manager',
            appdesc: 'Sample POS Laundry Manager',
            columns: []
        }
        fs.writeFileSync(jsonpath, JSON.stringify(emptyobj, null, 4))
        updateFile(null)
    } else {
        updateFile(null)
    }
}



/**
 * @async
 * @description Function to set the current transaction book
 * @param {String} foldername 
 * @param {Function} callback 
 */
const setCurrentTransactionBook = async (foldername, filepath, callback) => {
    try {
        const res = await new Promise(resolve => {
            const path = process.env.LOCALAPPDATA + '\\' + foldername + '\\' + applicationsetting
            if (fs.existsSync(path)) {
                const setting = JSON.parse(fs.readFileSync(path))
                setting.currentopenbook = filepath
                fs.writeFileSync(path, JSON.stringify(setting, null, 4))
            }
            resolve()
        })
        callback (null)
    } catch (err) {
        callback (err)
    }
}

/**
 * @returns {String} location of current transaction book
 * @description Function to get the current transaction book
 * @param {String} foldername
 */
const getCurrentTransactionBook = (foldername) => {
    const path = process.env.LOCALAPPDATA + '\\' + foldername + '\\' + applicationsetting
    let value
    if (fs.existsSync(path)) {
        const setting = JSON.parse(fs.readFileSync(path))
        if (typeof setting.currentopenbook !== 'undefined') {
            if (fs.existsSync(setting.currentopenbook)) {
                value = setting.currentopenbook
                const a = setting.currentopenbook.split('\\')
                value = [setting.currentopenbook, a[a.length - 1].replace('.xlsx', '')]
            } else {
                value = null
            }
        } else {
            value = null
        }
    } else {
        fs.writeFileSync(settingspath, JSON.stringify({}, null, 4))
        value = null
    }
    return value
}

module.exports = {
    createLocalAppDataSync : createLocalAppData,
    getColumnSetting : getColumnSetting,
    updateColumnSetting : updateColumnSetting,
    updateColumnOnly : updateColumnOnly,
    setCurrentTransactionBook : setCurrentTransactionBook,
    getCurrentTransactionBook : getCurrentTransactionBook
}
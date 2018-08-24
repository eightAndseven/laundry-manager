const fs = require('fs')

const columnsettingname = 'columnsetting.json'

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
 * @description Function to update setting
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

module.exports = {
    createLocalAppDataSync : createLocalAppData,
    getColumnSetting : getColumnSetting,
    updateColumnSetting : updateColumnSetting
}
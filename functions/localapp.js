const fs = require('fs')
const dateformat = require('dateformat')

const columnsettingname = 'columnsetting.json'
const settingsname = 'settings.json'

/**
 * @description Function to create a folder in the User > AppData > Local
 * @param {String} foldername 
 * @param {Function} callback 
 */
const createLocalAppData = (foldername, callback) => {
    try {
        let path = process.env.LOCALAPPDATA + '\\' + foldername
        if (!fs.existsSync(path)) {
            fs.mkdirSync(path)
        }
        let datapath = path + '\\' + 'data'
        if (!fs.existsSync(datapath)) {
            fs.mkdirSync(datapath)
        }
        let settingspath = path + '\\' + settingsname
        if (!fs.existsSync(settingspath)) {
            fs.writeFileSync(settingspath, JSON.stringify({data : []}, null, 4))
        }
        if (typeof callback !== 'undefined') callback(null)
    } catch (err) {
        if (typeof callback !== 'undefined') callback(err)
    }
}

/**
 * @description Function to check settings in boot
 * @param {Function} callback 
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
 * @param {String} foldername 
 * @param {Object} data 
 * @param {Function} callback 
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
 * @description Function to save a single transaction in Local App
 * @param {String} foldername 
 * @param {Object} transaction 
 * @param {Function} callback 
 */
const saveLocalTransact = async (foldername, transaction, callback) => {
    try {
        const value = await new Promise(resolve => {
            const filename = dateformat(new Date(), 'yyyymmdd')
            const jsonpath = process.env.LOCALAPPDATA + '\\' + foldername + '\\data\\' + filename + '.json'
            // check if json data does not exists
            if (!fs.existsSync(jsonpath)) {
                const firstdata = [transaction]
                // create new json data
                fs.writeFile(jsonpath, JSON.stringify(firstdata, null, 4), (err) => {
                    if (err) throw err
                    const settingspath = process.env.LOCALAPPDATA + '\\' + foldername + '\\' + settingsname
                    const settings = JSON.parse(fs.readFileSync(settingspath))
                    settings.data.push(filename)
                    fs.writeFile(settingspath, JSON.stringify(settings, null, 4), (err) => {
                        if (err) throw err
                    })
                })
            } else {
                // append to file
                const file = JSON.parse(fs.readFileSync(jsonpath))
                file.push(transaction)
                fs.writeFile(jsonpath, JSON.stringify(file, null, 4), (err) => {
                    if (err) throw err
                })
            }
            resolve()
        })
        callback(null)
    } catch (err) {
        callback(err)
    }
}

/**
 * @description Synchronous function to open local transaction
 * @param {String} foldername 
 * @returns Lists of transactions
 */
const openLocalTransactSync = (foldername) => {
    const path = process.env.LOCALAPPDATA + '\\' + foldername
    const settingspath = path + '\\' + settingsname
    const settings = JSON.parse(fs.readFileSync(settingspath))
    let transaction = []
    for (i in settings.data) {
        const datapath = path + '\\data\\' + settings.data[i] + '.json'
        const datatransact = JSON.parse(fs.readFileSync(datapath))
        for (ii in datatransact) {
            transaction.push(datatransact[ii])
        }
    }
    return transaction
}

/**
 * @async
 * @description Function to open local transaction
 * @param {String} foldername 
 * @param {Funciton} callback 
 */
const openLocalTransact = async (foldername, callback) => {
    try {
        const result = await new Promise(resolve => {
            const path = process.env.LOCALAPPDATA + '\\' + foldername
            const settingspath = path + '\\' + settingsname
            const settings = JSON.parse(fs.readFileSync(settingspath))
            let transaction = []
            for (i in settings.data) {
                const datapath = path + '\\data\\' + settings.data[i] + '.json'
                const datatransact = JSON.parse(fs.readFileSync(datapath))
                for (ii in datatransact) {
                    transaction.push(datatransact[ii])
                }
            }
            resolve(transaction)
        })
        callback(null, result)
    } catch (err) {
        callback(err, null)
    }
}

module.exports = {
    createLocalAppDataSync : createLocalAppData,
    getColumnSetting : getColumnSetting,
    updateColumnSetting : updateColumnSetting,
    saveLocalTransact : saveLocalTransact,
    openLocalTransactSync : openLocalTransactSync,
    openLocalTransact : openLocalTransact
}
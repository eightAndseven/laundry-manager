const xl = require('excel4node')
const xlsx = require('xlsx')

function funcsaveAsExcel(columns, transaction, filename){
    const wb = new xl.Workbook()

    // worksheets
    const ws = wb.addWorksheet('Transactions')
    const ws2 = wb.addWorksheet('Summary Report')
    const ws3 = wb.addWorksheet('Columns')

    // Transaction Worksheet
    // columns cell
    columnname = []
    columncost = []

    // separate name and cost
    columns.forEach(item => {
        if (item.column_worn === 'Name') {
            columnname.push(item)
        } else {
            columncost.push(item)
        }
    })
    
    // charcode to change letter and number
    const codeletternumber = 64

    // counter for column
    let xlcolumnobj = {}
    let xlcolumncounter = 1
    let xlrowcounter = 1

    // summary report object
    let summaryreport = []

    // transactions worksheet
    // print date
    ws.cell(xlrowcounter, xlcolumncounter).string('date_time')
    xlcolumnobj['date_time'] = codeletternumber + xlcolumncounter
    xlcolumncounter += 1

    // print names
    columnname.forEach(item => {
        ws.cell(xlrowcounter, xlcolumncounter).string(item.column_id)
        xlcolumnobj[item.column_id] = codeletternumber + xlcolumncounter
        xlcolumncounter += 1
    })
    // print costs
    columncost.forEach(item => {
        ws.cell(xlrowcounter, xlcolumncounter).string(item.column_id)
        xlcolumnobj[item.column_id] = codeletternumber + xlcolumncounter
        xlcolumncounter += 1
    })

    // print total
    ws.cell(xlrowcounter, xlcolumncounter).string('total')
    xlcolumnobj['total'] = codeletternumber + xlcolumncounter
    xlcolumncounter += 1

    xlrowcounter += 1

    // print rows
    transaction.forEach((item, index) => {
        // print date
        ws.cell(xlrowcounter, xlcolumnobj['date_time'] - codeletternumber).string(item.date)
        
        let totalformula = ''
        // print custom columns
        item.transact.forEach(i => {
            if (i['type'] === 'name') {
                ws.cell(xlrowcounter, xlcolumnobj[i['name']] - codeletternumber).string(i.value)
            } else if (i['type'] === 'cost') {
                const total = i['value']['price'] * i['value']['quantity']
                ws.cell(xlrowcounter, xlcolumnobj[i['name']] - codeletternumber).number(total)
                totalformula += totalformula === '' 
                    ? String.fromCharCode(xlcolumnobj[i['name']]) + xlrowcounter.toString()
                    : '+' + String.fromCharCode(xlcolumnobj[i['name']]) + xlrowcounter.toString()

                if (index == 0) {
                    summaryreport.push({
                        name : i['name'],
                        price : i['value']['price'],
                        quantity : i['value']['quantity']
                    })
                } else {
                    summaryreport.forEach(r => {
                        if (r['name'] === i['name'] && r['price'] == i['value']['price']) {
                            r['quantity'] += i['value']['quantity']
                        } else if (r['name'] === i['name'] && r['price'] != i['value']['price']) {
                            summaryreport.push({
                                name : i['name'],
                                price : i['value']['price'],
                                quantity : i['value']['quantity']
                            })    
                        }
                    })
                }
            }
        })
        // print total
        if (totalformula !== ''){
            ws.cell(xlrowcounter, xlcolumnobj['total'] - codeletternumber).formula(totalformula)
        }
        xlrowcounter += 1
    })

    // summary report sheet
    xlrowcounter = 1
    xlcolumncounter = 1
    const summarycolumn = ['prod_name', 'prod_price', 'prod_sold', 'prod_sale']
    // print columns
    summarycolumn.forEach(item => {
        ws2.cell(xlrowcounter, xlcolumncounter).string(item)
        xlcolumncounter += 1
    })

    // add row and reset column
    xlrowcounter += 1
    xlcolumncounter = 1
    
    // print product
    let totalformula = ''
    summaryreport.forEach(item => {
        // print name
        ws2.cell(xlrowcounter, xlcolumncounter).string(item['name'])
        xlcolumncounter += 1
        // print price
        ws2.cell(xlrowcounter, xlcolumncounter).number(item['price'])
        xlcolumncounter += 1
        // print quantity
        ws2.cell(xlrowcounter, xlcolumncounter).number(item['quantity'])
        xlcolumncounter += 1
        // print sale
        const formula = String.fromCharCode( codeletternumber + summarycolumn.indexOf('prod_price') + 1 ) + xlrowcounter.toString() + '*' +
                        String.fromCharCode( codeletternumber + summarycolumn.indexOf('prod_sold') + 1) + xlrowcounter.toString()
        ws2.cell(xlrowcounter, xlcolumncounter).formula(formula)

        totalformula += totalformula === '' 
            ? String.fromCharCode(xlcolumncounter + codeletternumber) + xlrowcounter.toString()
            : '+' + String.fromCharCode(xlcolumncounter + codeletternumber) + xlrowcounter.toString()
        // add row and reset column
        xlrowcounter += 1
        xlcolumncounter = 1
    })
    // print total
    ws2.cell(xlrowcounter, summarycolumn.indexOf('prod_sold') + 1).string('total')
    ws2.cell(xlrowcounter, summarycolumn.indexOf('prod_sale') + 1).formula(totalformula)

    // column worksheet
    xlcolumncounter = 1
    xlrowcounter = 1
    let appcolumns = ['column_id', 'column_name', 'column_require', 'column_desc', 'column_worn', 'column_price']
    
    // print column
    appcolumns.forEach(item => {
        ws3.cell(xlrowcounter, xlcolumncounter).string(item)
        xlcolumncounter += 1
    })

    // add row and reset column
    xlrowcounter += 1

    // print application columns
    columns.forEach(item => {
        appcolumns.forEach(i => {
            if (typeof item[i] !== 'undefined') {
                if (typeof item[i] === 'string') {
                    ws3.cell(xlrowcounter, appcolumns.indexOf(i) + 1).string(item[i])
                } else {
                    ws3.cell(xlrowcounter, appcolumns.indexOf(i) + 1).number(item[i])
                }
                
            }
        })
        xlrowcounter += 1
    })
    wb.write(filename)
}

function resolveAsExcel(columns, transaction, filename) {
    return new Promise(resolve => {
        funcsaveAsExcel(columns, transaction, filename)
        resolve()
    })
}

const saveAsExcel = async (columns, transaction, filename, callback) => {
    try{
        await resolveAsExcel(columns, transaction, filename)
        callback(null)
    } catch (err) {
        callback(err)
    }
}

function funcopenExcel(filename) {
    const workbook = xlsx.readFile(filename)
    const sheet_name_list = workbook.SheetNames
    let excelsheets = []
    sheet_name_list.forEach(item => {
        let sheetobj = {}
        sheetobj[item] = xlsx.utils.sheet_to_json(workbook.Sheets[sheet_name_list[sheet_name_list.indexOf(item)]])
        excelsheets.push(sheetobj)
    })
    return excelsheets
}

/**
 * @async
 * @description Function to open excel file
 * @param {String} filename 
 * @param {Function} callback 
 */
const openExcel = async (filename, callback) => {
    try {
        const result = await new Promise(resolve => {
            resolve(funcopenExcel(filename))
        })
        callback(null, result)
    } catch (err) {
        callback(err, null)
    }
}

/**
 * @returns {Array}
 * @description Synchronous function to open excel file
 * @param {String} filename 
 */
const openExcelSync = (filename) => {
    const workbook = xlsx.readFile(filename)
    const sheet_name_list = workbook.SheetNames
    let excelsheets = []
    sheet_name_list.forEach(item => {
        let sheetobj = {}
        sheetobj[item] = xlsx.utils.sheet_to_json(workbook.Sheets[sheet_name_list[sheet_name_list.indexOf(item)]])
        excelsheets.push(sheetobj)
    })
    return excelsheets
}

/**
 * @description Function to save a new excel as transaction book
 * @param {String} filename 
 * @param {Function} callback
 */
const saveNewExcel = (filename, callback) => {
    const wb = new xl.Workbook()

    // worksheets
    const ws1 = wb.addWorksheet('Transactions')
    const ws2 = wb.addWorksheet('Summary Report')
    const ws3 = wb.addWorksheet('Columns')
    const ws4 = wb.addWorksheet('Customer')

    wb.write(filename)
    setTimeout(() => {
        callback(filename)
    }, 500)
    
}

/**
 * @description Function to save excel
 * @param {Object} columns 
 * @param {Object} transaction 
 * @param {Object} filename 
 * @param {Object} customers 
 * @param {Function} callback 
 */
const saveAsExcelNew = async (columns, transaction, customers, filename, callback) => {
    try {
        await new Promise(resolve => {
            funcsaveAsExcelNew(columns, transaction, customers, filename)
            resolve()
        })
        callback()
    } catch (err) {
        callback(err)
    }
}

function funcsaveAsExcelNew(columns, transaction, customers, filename){
    const wb = new xl.Workbook()

    // worksheets
    const ws = wb.addWorksheet('Transactions')
    const ws2 = wb.addWorksheet('Summary Report')
    const ws3 = wb.addWorksheet('Columns')
    const ws4 = wb.addWorksheet('Customer Transactions')
    const ws5 = wb.addWorksheet('Customers')

    // Transaction Worksheet
    // columns cell
    columnname = []
    columncost = []

    // separate name and cost
    columns.forEach(item => {
        if (item.column_worn === 'Name') {
            columnname.push(item)
        } else {
            columncost.push(item)
        }
    })
    
    // charcode to change letter and number
    const codeletternumber = 64

    // counter for column
    let xlcolumnobj = {}
    let xlcolumncounter = 1
    let xlrowcounter = 1

    // summary report object
    let summaryreport = []

    // customers object
    let customerstransaction = []

    // transactions worksheet
    // print date
    ws.cell(xlrowcounter, xlcolumncounter).string('date_time')
    xlcolumnobj['date_time'] = codeletternumber + xlcolumncounter
    xlcolumncounter += 1

    // print names
    columnname.forEach(item => {
        ws.cell(xlrowcounter, xlcolumncounter).string(item.column_id)
        xlcolumnobj[item.column_id] = codeletternumber + xlcolumncounter
        xlcolumncounter += 1
    })
    // print costs
    columncost.forEach(item => {
        ws.cell(xlrowcounter, xlcolumncounter).string(item.column_id)
        xlcolumnobj[item.column_id] = codeletternumber + xlcolumncounter
        xlcolumncounter += 1
    })

    // print total
    ws.cell(xlrowcounter, xlcolumncounter).string('total')
    xlcolumnobj['total'] = codeletternumber + xlcolumncounter
    xlcolumncounter += 1

    xlrowcounter += 1

    // print rows
    transaction.forEach((item, index) => {
        // print date
        ws.cell(xlrowcounter, xlcolumnobj['date_time'] - codeletternumber).string(item.date)
        
        let totalformula = ''
        // print custom columns
        item.transact.forEach(i => {
            if (i['type'] === 'name') {
                ws.cell(xlrowcounter, xlcolumnobj[i['name']] - codeletternumber).string(i.value)
            } else if (i['type'] === 'cost') {
                const total = i['value']['price'] * i['value']['quantity']
                ws.cell(xlrowcounter, xlcolumnobj[i['name']] - codeletternumber).number(total)
                totalformula += totalformula === '' 
                    ? String.fromCharCode(xlcolumnobj[i['name']]) + xlrowcounter.toString()
                    : '+' + String.fromCharCode(xlcolumnobj[i['name']]) + xlrowcounter.toString()

                if (index == 0) {
                    summaryreport.push({
                        name : i['name'],
                        price : i['value']['price'],
                        quantity : i['value']['quantity']
                    })
                } else {
                    summaryreport.forEach(r => {
                        if (r['name'] === i['name'] && r['price'] == i['value']['price']) {
                            r['quantity'] += i['value']['quantity']
                        } else if (r['name'] === i['name'] && r['price'] != i['value']['price']) {
                            summaryreport.push({
                                name : i['name'],
                                price : i['value']['price'],
                                quantity : i['value']['quantity']
                            })    
                        }
                    })
                }
            }
        })
        // print total
        if (totalformula !== ''){
            ws.cell(xlrowcounter, xlcolumnobj['total'] - codeletternumber).formula(totalformula)
        }

        if (typeof item.customer !== 'undefined') {
            customerstransaction.push(item)
        }
        xlrowcounter += 1
    })

    // summary report sheet
    xlrowcounter = 1
    xlcolumncounter = 1
    const summarycolumn = ['prod_name', 'prod_price', 'prod_sold', 'prod_sale']
    // print columns
    summarycolumn.forEach(item => {
        ws2.cell(xlrowcounter, xlcolumncounter).string(item)
        xlcolumncounter += 1
    })

    // add row and reset column
    xlrowcounter += 1
    xlcolumncounter = 1
    
    // print product
    let totalformula = ''
    summaryreport.forEach(item => {
        // print name
        ws2.cell(xlrowcounter, xlcolumncounter).string(item['name'])
        xlcolumncounter += 1
        // print price
        ws2.cell(xlrowcounter, xlcolumncounter).number(item['price'])
        xlcolumncounter += 1
        // print quantity
        ws2.cell(xlrowcounter, xlcolumncounter).number(item['quantity'])
        xlcolumncounter += 1
        // print sale
        const formula = String.fromCharCode( codeletternumber + summarycolumn.indexOf('prod_price') + 1 ) + xlrowcounter.toString() + '*' +
                        String.fromCharCode( codeletternumber + summarycolumn.indexOf('prod_sold') + 1) + xlrowcounter.toString()
        ws2.cell(xlrowcounter, xlcolumncounter).formula(formula)

        totalformula += totalformula === '' 
            ? String.fromCharCode(xlcolumncounter + codeletternumber) + xlrowcounter.toString()
            : '+' + String.fromCharCode(xlcolumncounter + codeletternumber) + xlrowcounter.toString()
        // add row and reset column
        xlrowcounter += 1
        xlcolumncounter = 1
    })
    // print total
    ws2.cell(xlrowcounter, summarycolumn.indexOf('prod_sold') + 1).string('total')
    ws2.cell(xlrowcounter, summarycolumn.indexOf('prod_sale') + 1).formula(totalformula)

    // column worksheet
    xlcolumncounter = 1
    xlrowcounter = 1
    let appcolumns = ['column_id', 'column_name', 'column_require', 'column_desc', 'column_worn', 'column_price']
    
    // print column
    appcolumns.forEach(item => {
        ws3.cell(xlrowcounter, xlcolumncounter).string(item)
        xlcolumncounter += 1
    })

    // add row and reset column
    xlrowcounter += 1

    // print application columns
    columns.forEach(item => {
        appcolumns.forEach(i => {
            if (typeof item[i] !== 'undefined') {
                if (typeof item[i] === 'string') {
                    ws3.cell(xlrowcounter, appcolumns.indexOf(i) + 1).string(item[i])
                } else {
                    ws3.cell(xlrowcounter, appcolumns.indexOf(i) + 1).number(item[i])
                }
                
            }
        })
        xlrowcounter += 1
    })

    // customers transaction
    xlcolumncounter = 1
    xlrowcounter = 1
    let custtransactcolumn = ['transact_date', 'id', 'name', 'numberoforder']

    // print column
    custtransactcolumn.forEach(item => {
        ws4.cell(xlrowcounter, xlcolumncounter).string(item)
        xlcolumncounter += 1
    })

    // add row and reset column
    xlrowcounter += 1
    xlcolumncounter = 1

    customerstransaction.forEach(item => {
        ws4.cell(xlrowcounter, xlcolumncounter).string(item.date)
        xlcolumncounter += 1
        ws4.cell(xlrowcounter, xlcolumncounter).string(item.customer['id'].toString())
        xlcolumncounter += 1
        ws4.cell(xlrowcounter, xlcolumncounter).string(item.customer['name'])
        xlcolumncounter += 1
        ws4.cell(xlrowcounter, xlcolumncounter).number(item.customer['norder'])

        // reset
        xlcolumncounter = 1
        xlrowcounter += 1
    })

    // customers
    xlcolumncounter = 1
    xlrowcounter = 1
    let customercolumn = ['id', 'name', 'desc']
    // print column
    customercolumn.forEach(item => {
        ws5.cell(xlrowcounter, xlcolumncounter).string(item)
        xlcolumncounter += 1
    })

    // add row and reset column
    xlrowcounter += 1
    xlcolumncounter = 1

    customers.forEach(item => {
        ws5.cell(xlrowcounter, xlcolumncounter).string(item.id.toString())
        xlcolumncounter += 1
        ws5.cell(xlrowcounter, xlcolumncounter).string(item.name)
        xlcolumncounter += 1
        ws5.cell(xlrowcounter, xlcolumncounter).string(item.desc)
        xlcolumncounter = 1
        xlrowcounter += 1
    })

    wb.write(filename)
}


module.exports = {
    // saveAsExcel : saveAsExcel,
    saveAsExcel : saveAsExcelNew,
    openExcel : openExcel,
    openExcelSync : openExcelSync,
    saveNewExcel : saveNewExcel
}
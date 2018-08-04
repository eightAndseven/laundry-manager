let appsettings = {
    appname:"Reinier's Store",
    appdesc:"Sample POS Laundry Manager",
    columns:[
        {
            column_id:"cust_name",
            column_name:"Customer Name",
            column_require:"Optional",
            column_desc:"Name of the customer",
            column_worn:"Name"
        },
        {
            column_id:"candy",
            column_name:"Candy",
            column_require:"Optional",
            column_desc:"Customer buys a candy",
            column_worn:"Cost",
            column_price:1
        },
        {
            column_id:"jeep",
            column_name:"Jeepney",
            column_require:"Required",
            column_desc:"Fare in the jeep",
            column_worn:"Cost",
            column_price:9
        },
        {
            column_id:"chips",
            column_name:"Chips",
            column_require:"Optional",
            column_desc:"Junk Food",
            column_worn:"Cost",
            column_price:40
        },
        {
            column_id:"load",
            column_name:"Sim load",
            column_require:"Optional",
            column_desc:"Load on sim",
            column_worn:"Cost",
            column_price:1
        }
    ]
}

let apptransact = [
    {
        date: '2018-08-03 18:21:02',
        transact: [
            {
                name: 'cust_name', 
                type: 'name', 
                value: 'rein'
            },
            {
                name: 'candy', 
                type:'cost', 
                value:{
                    price: 1,
                    quantity: 2
                }
            },
            {
                name: 'jeep', 
                type:'cost', 
                value:{
                    price: 9,
                    quantity: 3
                }
            },
            {
                name: 'chips', 
                type:'cost', 
                value:{
                    price: 40,
                    quantity: 4
                }
            },
            {
                name: 'load', 
                type:'cost', 
                value:{
                    price: 1,
                    quantity: 5
                }
            }
        ],
        total: 194
    },
    {
        date: '2018-08-03 18:25:27',
        transact: [
            {
                name: 'cust_name', 
                type: 'name', 
                value: 'jansen'
            },
            {
                name: 'candy', 
                type:'cost', 
                value:{
                    price: 1,
                    quantity: 4
                }
            },
            {
                name: 'jeep', 
                type:'cost', 
                value:{
                    price: 9,
                    quantity: 3
                }
            },
            {
                name: 'chips', 
                type:'cost', 
                value:{
                    price: 40,
                    quantity: 2
                }
            },
            {
                name: 'load', 
                type:'cost', 
                value:{
                    price: 1,
                    quantity: 5
                }
            }
        ],
        total: 116
    },
    {
        date: '2018-08-03 18:25:39',
        transact: [
            {
                name: 'cust_name', 
                type: 'name', 
                value: 'santos'
            },
            {
                name: 'candy', 
                type:'cost', 
                value:{
                    price: 1,
                    quantity: 2
                }
            },
            {
                name: 'jeep', 
                type:'cost', 
                value:{
                    price: 9,
                    quantity: 4
                }
            },
            {
                name: 'chips', 
                type:'cost', 
                value:{
                    price: 40,
                    quantity: 5
                }
            },
            {
                name: 'load', 
                type:'cost', 
                value:{
                    price: 1,
                    quantity: 6
                }
            }
        ],
        total: 244
    }
]
const filename = 'C:\\Users\\Reinier\\Desktop\\test.xlsx'

const xl = require('excel4node')
const fs = require('fs')

function saveAsExcel(columns, transaction, filename, callback) {
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
    callback()
}

if (fs.existsSync(filename)) fs.unlinkSync(filename)
saveAsExcel(appsettings.columns, apptransact, filename, () => {

})
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
const filename = 'C:\\Users\\rein\\Desktop\\test.xlsx'

const xl = require('excel4node')
const fs = require('fs')

function saveAsExcel(columns, transaction, filename) {
    const wb = new xl.Workbook()

    const ws = wb.addWorksheet('Transactions')
    const ws2 = wb.addWorksheet('Summary Report')

    // const numberstyle = wb.createStyle({
    //     font : {
    //         color : '#000000',
    //         size : 12
    //     },
    //     numberFormat : 'Php ##.00;'
    // })
    
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
    let summaryreport = {}

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
    transaction.forEach(item => {
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

                
            }
        })
        // print total
        if (totalformula !== ''){
            ws.cell(xlrowcounter, xlcolumnobj['total'] - codeletternumber).formula(totalformula)
        }
        xlrowcounter += 1
    })

    // ws.cell(1, 1).number(100).style(style)
    // ws.cell(1, 2).number(200).style(style)
    // ws.cell(1, 3).formula('A1 + B1').style(style)
    // ws.cell(2, 1).string('string').style(style)
    // ws.cell(3, 1).bool(true).style(style).style({font: {size:20}})
    wb.write(filename)
}

if (fs.existsSync(filename)) fs.unlinkSync(filename)
saveAsExcel(appsettings.columns, apptransact, filename)
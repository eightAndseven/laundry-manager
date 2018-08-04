const electron = require('electron')
const dateformat = require('dateformat')
const {ipcRenderer, remote} = electron
let appsettings
let transactiontablecolumns

// function to change title of application
function getAppSettings(data){
    if (typeof data.appname !== 'undefined') {
        const brand = document.querySelector('a#brand')
        brand.innerHTML = data.appname
        document.title = data.appname
    }
}

// function to load customized columns
function transanctioncolumns(){
    const divcolumn = document.querySelector('div#transaction-columns')
    divcolumn.innerHTML = ''
    const columns = appsettings.columns
    
    if (columns.length > 0) {
        // do it here
        const form = document.createElement('form')
        form.id = 'form-add-transaction'
        form.className = 'col s12'
        const divtransact = document.createElement('div')
        divtransact.className = 'col s12'

        let columnname = []
        let columncost = []
        columns.forEach(item => {
            if (item.column_worn === 'Name') {
                columnname.push(item)
            } else {
                columncost.push(item)
            }             
        })
        if (columnname.length > 0) {
            columnname.forEach(item => {
                const rowdiv = document.createElement('div')
                rowdiv.className = 'input-field'
                const input = document.createElement('input')
                input.type = 'text'
                input.id = item.column_id
                input.className = 'input-add-transaction-name'
                input.setAttribute('column-type', 'name')
                const label = document.createElement('label')
                label.setAttribute('for', item.column_id)
                if (item.column_require === 'Required') input.classList.add('transact-required') 
                const required = item.column_required === 'Required' ? '*' : ''
                label.innerHTML = item.column_name + required
                rowdiv.appendChild(input)
                rowdiv.appendChild(label)
                divtransact.appendChild(rowdiv)
            })
        }
        if (columncost.length > 0) {
            columncost.forEach(item => {
                const row = document.createElement('div')
                row.className = 'row col s12'
                row.style.marginBottom = '-20px'
                const rowdiv = document.createElement('div')
                rowdiv.className = 'input-field col s5'
                const input = document.createElement('input')
                input.type = 'number'
                input.id = item.column_id
                input.min = 0
                input.className = 'input-add-transaction-cost number-only'
                input.setAttribute('column-type', 'cost')
                const label = document.createElement('label')
                label.setAttribute('for', item.column_id)
                if (item.column_require === 'Required') input.classList.add('transact-required') 
                const required = item.column_require === 'Required' ? '*' : ''
                label.innerHTML = item.column_name + required
                rowdiv.appendChild(input)
                rowdiv.appendChild(label)

                const compdiv = document.createElement('div')
                compdiv.className = 'col s3'
                compdiv.style.paddingTop = '35px'
                
                // initial price per qty
                let span = document.createElement('span')
                span.innerHTML = 'x'
                span.style.marginRight = '10px'
                compdiv.appendChild(span)
                span = document.createElement('span')
                span.setAttribute('price-val', item.column_price)
                span.className = 'price-init ' + item.column_id
                span.innerHTML = item.column_price
                compdiv.appendChild(span)
                
                // total
                const divtotal = document.createElement('div')
                divtotal.className = 'right-align col s4'
                divtotal.style.paddingTop = '35px'
                span = document.createElement('span')
                span.className = 'right-align'
                span.style.marginRight = '10px'
                span.innerHTML = '='
                divtotal.appendChild(span)
                span = document.createElement('span')
                span.className = 'price-total ' + item.column_id
                span.innerHTML = 0
                // appends
                divtotal.appendChild(span)    
                row.appendChild(rowdiv)
                row.appendChild(compdiv)
                row.appendChild(divtotal)
                divtransact.appendChild(row)
            })
            // total div
            const divtot = document.createElement('div')
            divtot.className = 'row col s12'
            divtot.style.paddingTop = '16px'
            const divtotdesc = document.createElement('div')
            divtotdesc.className = 'col s8 right-align'
            divtotdesc.style.fontWeight = 'bold'
            divtotdesc.innerHTML = 'Total:'
            divtotprice = document.createElement('div')
            divtotprice.className = 'col s4 right-align'
            let spantotprice = document.createElement('span')
            spantotprice.innerHTML = 'Php '
            divtotprice.appendChild(spantotprice)
            spantotprice = document.createElement('span')
            spantotprice.id = 'total-add-transaction'
            spantotprice.style.fontWeight = 'bold'
            spantotprice.innerHTML = '0'
            divtotprice.appendChild(spantotprice)
            divtot.appendChild(divtotdesc)
            divtot.appendChild(divtotprice)
            divtransact.appendChild(divtot)


            // buttons
            const divright = document.createElement('div')
            divright.className = 'row col s12 right-align'
            divright.style.padding = '10px'
            // clear
            let a = document.createElement('a')
            a.id = 'clear-add-transaction'
            a.href = '#'
            a.className = 'waves-effect waves-teal btn-flat'
            a.style.margin = '0px 5px'
            a.innerHTML = 'Clear'
            divright.appendChild(a)
            // add
            a = document.createElement('a')
            a.id = 'add-add-transaction'
            a.href = '#'
            a.className = 'waves-effect waves-teal btn'
            a.style.margin = '0px 5px'
            a.innerHTML = 'ADD'
            divright.appendChild(a)
            divtransact.appendChild(divright)
        }
        form.appendChild(divtransact)
        divcolumn.appendChild(form)
    }
    // functions
    function computetotal() {
        const total = document.querySelector('span#total-add-transaction')
        const addends = document.querySelectorAll('span.price-total')
        let sum = 0
        addends.forEach(item => sum += parseFloat(item.innerHTML))
        total.innerHTML = sum
    }

    // Events        
    const numberonly = document.querySelectorAll('input.number-only')
    const formtransaction = document.querySelector('form#form-add-transaction')
    const canceltransaction = document.querySelector('a#clear-add-transaction')
    const addaddtransaction = document.querySelector('a#add-add-transaction')
    
    numberonly.forEach(item => item.addEventListener('keypress', e => {
        const ev = e ? e : window.event
        const code = ev.which ? ev.which : ev.keyCode
        if (code >= 48 && code <= 57){
            return ev.key
        } 
        e.preventDefault()
    }))
    numberonly.forEach(item => item.addEventListener('keyup', e => {
        const ev = e ? e : window.event
        const code = ev.which ? ev.which : ev.keyCode
        const val = e.target.value === '' ? 0 : e.target.value
        let qrys = 'span.price-init.' + e.target.id
        const price = parseFloat(document.querySelector(qrys).getAttribute('price-val'))
        qrys = 'span.price-total.' + e.target.id
        document.querySelector(qrys).innerHTML = val * price
        computetotal()
        e.preventDefault()
    }))

    formtransaction.addEventListener('submit', e => e.preventDefault())

    canceltransaction.addEventListener('click', e => {
        const form = document.querySelector('form#form-add-transaction')
        const input = form.querySelectorAll('input')
        const priceinit = form.querySelectorAll('span.price-total')
        input.forEach(item => item.value = '')
        priceinit.forEach(item => item.innerHTML = '0')
        computetotal()
        M.updateTextFields()
        e.preventDefault()
    })
    addaddtransaction.addEventListener('click', e => {
        apptransaction = remote.getGlobal('apptransactions')
        const form = document.querySelector('form#form-add-transaction')
        const input = form.querySelectorAll('input')
        // validation
        // check requried first
        let required = true
        const inputrequired = form.querySelectorAll('input.transact-required')
        inputrequired.forEach(item => {
            if (item.value === '') required = false
        })

        // if required is filled
        if (required) {
            // {
            //     name : 'string',
            //     type : 'name' | 'cost',
            //     value: 'string' | object
            // }
            let transact = []
            // submit transaction
            input.forEach(item => {
                transact.push({
                    name : item.id,
                    type : item.getAttribute('column-type'),
                    value: item.getAttribute('column-type') === 'name' 
                        ? item.value 
                        : {
                            price : parseInt(form.querySelector('span.price-init.' + item.id).innerHTML),
                            quantity: item.value === '' 
                                ? 0
                                : parseInt(item.value)
                        }
                })
                item.value = ''
            })
            form.querySelectorAll('span.price-total').forEach(item => item.innerHTML = '0')
            computetotal()
            M.updateTextFields()

            ipcRenderer.send('transact:add', JSON.stringify(transact))
        }
        e.preventDefault()
    })
}

// function to add an item in the table
function tableadd(item) {
    const tbody = document.querySelector('tbody#transaction-table-body')
    tr = document.createElement('tr')
    // date
    let td = document.createElement('td')
    const date = dateformat(item.date, 'mmm dd, yy - hh:MM:ss TT')
    let text = document.createTextNode(date)
    td.appendChild(text)
    tr.appendChild(td)
    // columns
    item.transact.forEach(itemt => {
        td = document.createElement('td')
        text = itemt.type === 'cost'
            ? document.createTextNode(itemt.value.price * itemt.value.quantity)
            : document.createTextNode(itemt.value)
        td.appendChild(text)
        tr.appendChild(td)
    })
    // total
    td = document.createElement('td')
    text = document.createTextNode(item.total)
    td.appendChild(text)
    tr.appendChild(td)
    tbody.insertBefore(tr, tbody.childNodes[0])
}

// function for 
function transactiontable() {
    const thead = document.querySelector('thead#transaction-table-head')
    let columns = [
        {
            column_id      : 'date_time',
            column_name    : 'Date Time',
            column_require : 'Required',
            column_desc    : 'Date and time of transaction',
            column_worn    : 'DateTime' 
        }
    ]
    appsettings.columns.forEach(item => columns.push(item))
    columns.push({
        column_id      : 'total',
        column_name    : 'Total',
        column_require : 'Required',
        column_desc    : 'Total cost',
        column_worn    : 'Total'
    })
    transactiontablecolumns = []
    let tr = document.createElement('tr')
    columns.forEach((item, index) => {
        transactiontablecolumns.push(item.column_id)
        const th = document.createElement('th')
        th.innerHTML = item.column_name
        th.className = 'tooltipped'
        th.setAttribute('data-position', 'top')
        const isprice = item.column_worn === 'Cost' ? ' | Php ' + item.column_price : ''
        const tooltip = item.column_desc + isprice
        th.setAttribute('data-tooltip', tooltip)
        th.setAttribute('column-code', item.column_id)
        th.setAttribute('column-index', index)
        tr.appendChild(th)
    })
    thead.appendChild(tr)
    
    // load main transaction
    apptransaction = remote.getGlobal('apptransactions')

    
    if (apptransaction.length > 0) {
        apptransaction.forEach(tableadd)
    }

    // Materialize initialize
    const elems = document.querySelectorAll('.tooltipped')
    M.Tooltip.init(elems)
}

document.addEventListener('DOMContentLoaded', e => {
    appsettings = remote.getCurrentWindow().appsettings
    getAppSettings(appsettings)
    transanctioncolumns()
    transactiontable()
})

// ipcRenderer
ipcRenderer.on('user:settings', (err, data) => {
    const brand = document.querySelector('a#brand')
    brand.innerHTML = data.appname
    document.title = data.appname
    appsettings = remote.getCurrentWindow().appsettings
    transanctioncolumns()
})

ipcRenderer.on('table:add', (err, data) => {
    // load from main.js is stringified
    const load = JSON.parse(data)
    tableadd(load)
})
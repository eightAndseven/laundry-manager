const electron = require('electron')
const dateformat = require('dateformat')
const {ipcRenderer, remote, dialog} = electron
let appsettings
let transactiontablecolumns
let customers = remote.getGlobal('customersetting')

/**
 * @description Function to change the title of the application
 * @param {Object} data 
 */
function getAppSettings(data){
    if (typeof data.appname !== 'undefined') {
        const brand = document.querySelector('a#brand')
        brand.innerHTML = data.appname
        document.title = data.appname
    }
}

/**
 * @description Function to load customized columns
 */
function transactioncolumns(){
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

        // check if customer is activated
        if (customers.activated) {
            const customerlist = customers.list

            const outdiv = document.createElement('div')
            outdiv.className = 'row col s12'
            const rowdiv = document.createElement('div')
            rowdiv.className = 'input-field col s6'
            const i = document.createElement('i')
            i.className = 'material-icons prefix'
            i.innerHTML = 'search'
            const input = document.createElement('input')
            input.type = 'text'
            input.id = 'customer-transact-search'
            const label = document.createElement('label')
            label.setAttribute('for', 'customer-transact-search')
            label.innerHTML = 'Search Customer'
            rowdiv.appendChild(i)
            rowdiv.appendChild(input)
            rowdiv.appendChild(label)

            const overflowdiv = document.createElement('div')
            overflowdiv.style.height = '140px'
            overflowdiv.style.overflowY = 'scroll'
            const coldiv = document.createElement('div')
            coldiv.className = 'collection'
            customerlist.forEach(item => {
                const a = document.createElement('a')
                const text = document.createTextNode(item.name)
                a.href = '#'
                a.className = 'collection-item cust-transact-search'
                a.setAttribute('cust-id', item.id)
                a.appendChild(text)
                coldiv.appendChild(a)
            })
            overflowdiv.appendChild(coldiv)
            rowdiv.appendChild(overflowdiv)
            outdiv.appendChild(rowdiv)

            const customerprofile = document.createElement('div')
            customerprofile.className = 'col s6'
            
            // h4
            const ch5 = document.createElement('h5')
            ch5.innerHTML = 'Customer Selected'
            customerprofile.appendChild(ch5)

            // id
            let p = document.createElement('p')
            let text = document.createTextNode('ID: ')
            let span = document.createElement('span')
            span.id = 'cust-transact-id'
            p.appendChild(text)
            p.appendChild(span)
            customerprofile.appendChild(p)

            // name
            p = document.createElement('p')
            text = document.createTextNode('Name: ')
            span = document.createElement('span')
            span.id = 'cust-transact-name'
            p.appendChild(text)
            p.appendChild(span)
            customerprofile.appendChild(p)

            // description
            p = document.createElement('p')
            text = document.createTextNode('Description: ')
            span = document.createElement('span')
            span.id = 'cust-transact-desc'
            p.appendChild(text)
            p.appendChild(span)
            customerprofile.appendChild(p)

            // number of orders
            p = document.createElement('p')
            text = document.createTextNode('Number of orders: ')
            span = document.createElement('span')
            span.id = 'cust-transact-norder'
            p.appendChild(text)
            p.appendChild(span)
            customerprofile.appendChild(p)
            
            outdiv.appendChild(customerprofile)
            divtransact.appendChild(outdiv)
        }

        // name
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

        // cost
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
            a.innerHTML = 'Cancel'
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
    function removeselected () {
        let span = document.querySelector('span#cust-transact-id')
        span.innerHTML = ''
        span = document.querySelector('span#cust-transact-name')
        span.innerHTML = ''
        span = document.querySelector('span#cust-transact-desc')
        span.innerHTML = ''
        span = document.querySelector('span#cust-transact-norder')
        span.innerHTML = ''
    }

    // Events        
    // form
    const formtransaction = document.querySelector('form#form-add-transaction')

    // anchor
    const canceltransaction = document.querySelector('a#clear-add-transaction')
    const addaddtransaction = document.querySelector('a#add-add-transaction')
    const custtransactcollection = document.querySelectorAll('a.cust-transact-search')

    // input
    const numberonly = document.querySelectorAll('input.number-only')
    const customertransactsearch = document.querySelector('input#customer-transact-search')
    
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
        // clear customers
        const active = document.querySelector('a.cust-transact-search.active')
        if (active != null) {
            active.classList.remove('active')
            removeselected ()
        }
        // close modal
        const modal = M.Modal.getInstance(document.querySelector('div#modal-addtransact'))
        modal.close()
        e.preventDefault()
    })
    addaddtransaction.addEventListener('click', e => {
        apptransaction = remote.getGlobal('apptransactions')
        const form = document.querySelector('form#form-add-transaction')
        const input = form.querySelectorAll('input.input-add-transaction-cost')
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
            const obj = {
                transact : transact
            }
            if (customers.activated) {
                const id = document.querySelector('span#cust-transact-id')
                const name = document.querySelector('span#cust-transact-name')
                const norder = document.querySelector('span#cust-transact-norder')
                if (id.innerHTML !== '') {
                    obj.customer = {
                        id : parseInt(id.innerHTML),
                        name : name.innerHTML,
                        norder : parseInt(norder.innerHTML)
                    }
                }
            }
            form.querySelectorAll('span.price-total').forEach(item => item.innerHTML = '0')
            computetotal()
            M.updateTextFields()

            ipcRenderer.send('transact:add', JSON.stringify(obj))
            // clear customers
            const active = document.querySelector('a.cust-transact-search.active')
            if (active != null) {
                active.classList.remove('active')
                removeselected ()
            }
            // close modal
            const modal = M.Modal.getInstance(document.querySelector('div#modal-addtransact'))
            modal.close()
        }
        e.preventDefault()
    })
    if (customers.activated) {
        custtransactcollection.forEach(a => a.addEventListener('click', e => {
            e.preventDefault()
            if (e.target.classList.contains('active')) {
                e.target.classList.remove('active')
                // remove selected
                removeselected()
            } else {
                const active = document.querySelector('a.cust-transact-search.active')    
                if (active != null) {
                    active.classList.remove('active')
                    // remove selected
                    removeselected()
                }
                e.target.classList.add('active')
                // selected
                const id = parseInt(e.target.getAttribute('cust-id'))
                for (i in customers.list) {
                    if (customers.list[i].id == id) {
                        const obj = customers.list[i]
                        let span = document.querySelector('span#cust-transact-id')
                        let text = document.createTextNode(obj.id)
                        span.appendChild(text)
                        span = document.querySelector('span#cust-transact-name')
                        text = document.createTextNode(obj.name)
                        span.appendChild(text)
                        span = document.querySelector('span#cust-transact-desc')
                        text = document.createTextNode(obj.desc)
                        span.appendChild(text)
                        span = document.querySelector('span#cust-transact-norder')
                        text = document.createTextNode(obj.order.length)
                        span.appendChild(text)
                        break
                    }
                }
            }
        }))
    
        customertransactsearch.addEventListener('keyup', e => {
            const val = e.target.value
            if (e.target.value !== '') {
                const acollection = document.querySelectorAll('a.cust-transact-search')
                acollection.forEach(item => {
                    const itemname = item.innerHTML
                    if (itemname.toLowerCase().includes(val.toLowerCase())) {
                        item.style.display = 'block'
                    } else {
                        item.style.display = 'none'
                    }
                })
            } else {
                const acollection = document.querySelectorAll('a.cust-transact-search')
                acollection.forEach(item => {
                    item.style.display = 'block'
                })
            }
        })
    }
}

/**
 * @description function to clear table content
 */
function tableclearcontent() {
    const thead = document.querySelector('thead#transaction-table-head')
    const tbody = document.querySelector('tbody#transaction-table-body')
    thead.innerHTML = ''
    tbody.innerHTML = ''
}

/**
 * @description Function to a single item in the table
 * @param {Object} column_item 
 */
function tableadd(column_item) {
    const tbody = document.querySelector('tbody#transaction-table-body')
    const tr = document.createElement('tr')
    tr.style.display = 'table-row'
    let incrementcolumn = 0

    const tdbox = document.createElement('td')
    const tdlabel = document.createElement('label')
    const tdcheckbox = document.createElement('input')
    const tdspan = document.createElement('span')
    tdspan.style.left = '10%'
    tdcheckbox.type = 'checkbox'
    tdcheckbox.className = 'td-checkbox'
    tdcheckbox.setAttribute('date', column_item.date)
    tdlabel.appendChild(tdcheckbox)
    tdlabel.appendChild(tdspan)
    tdbox.appendChild(tdlabel)
    tr.appendChild(tdbox)
    incrementcolumn += 1

    // date
    let td = document.createElement('td')
    const date = dateformat(column_item.date, 'mmm dd, yy - hh:MM:ss TT')
    let text = document.createTextNode(date)
    td.appendChild(text)
    tr.appendChild(td)
    // increment by 1
    incrementcolumn += 1

    // check if customer is activated
    if (customers.activated) {
        if (typeof column_item.customer !== 'undefined') {
            const customer = column_item.customer
            td = document.createElement('td')
            text = document.createTextNode(customer.name)
            td.className = 'tooltipped'
            td.setAttribute('data-position', 'right')
            td.setAttribute('data-tooltip',  customer.norder + ' order/s')
    
            td.appendChild(text)
            tr.appendChild(td)
        } else {
            td = document.createElement('td')
            tr.appendChild(td)
        }
        incrementcolumn += 1
    }

    const thead = document.querySelector('thead#transaction-table-head')
    const th = thead.querySelectorAll('th')
    let columnarr = []
    for (let i = 1; i < th.length - 1; i++) {
        columnarr.push(th[i].getAttribute('column-code'))
    }

    // arrange columns
    let transactarr = []
    columnarr.forEach(i => {
        column_item.transact.forEach(ii => {
            if (i === ii.name) transactarr.push(ii)
        })
    })

    // columns
    transactarr.forEach(itemt => {
        td = document.createElement('td')
        text = itemt.type === 'cost'
            ? document.createTextNode(itemt.value.price * itemt.value.quantity)
            : document.createTextNode(itemt.value)

        if (itemt.type === 'cost') {
            td.className = 'tooltipped'
            td.setAttribute('data-position', 'right')
            td.setAttribute('data-tooltip', 'qty: ' + itemt.value.quantity)
        }
        td.appendChild(text)
        tr.appendChild(td)

        incrementcolumn += 1
    })

    // total
    const totalelem = document.querySelector('th[column-code="total"]')
    // increment by 1 to represent column
    while (incrementcolumn <= parseInt(totalelem.getAttribute('column-index'))) {
        td = document.createElement('td')
        td.innerHTML = ''
        tr.appendChild(td)
        incrementcolumn += 1
    }
    td = document.createElement('td')
    text = document.createTextNode(column_item.total)
    td.appendChild(text) 
    tr.appendChild(td)
    tbody.insertBefore(tr, tbody.childNodes[0])
    
    // Materialize initialize
    const elems = document.querySelectorAll('.tooltipped')
    const tooltipoptions = {
        enterDelay : 1000
    }
    M.Tooltip.init(elems, tooltipoptions)
}

/**
 * @description Function to initialize transaction table
 */
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

    // check if customers is activated
    if (customers.activated) {
        columns.push({
            column_id      : 'customers',
            column_name    : 'Customer',
            column_require : 'Optional',
            column_desc    : `Customer's Name`,
            column_worn    : 'Customer' 
        })
    }


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

    const thbox = document.createElement('th')
    const thlabel = document.createElement('label')
    const thcheckbox = document.createElement('input')
    const thspan = document.createElement('span')
    thspan.style.left = '10%'
    thcheckbox.type = 'checkbox'
    thcheckbox.id = 'th-checkbox'
    thlabel.appendChild(thcheckbox)
    thlabel.appendChild(thspan)
    thbox.appendChild(thlabel)
    tr.appendChild(thbox)

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
    const tooltipoptions = {
        enterDelay : 1000
    }
    M.Tooltip.init(elems, tooltipoptions)

    // Events
    const ethcheckbox = document.querySelector('input#th-checkbox')

    ethcheckbox.addEventListener('change', e => {
        const ischecked = e.target.checked
        const tdcbox = document.querySelectorAll('input.td-checkbox')
        if (ischecked) {
            tdcbox.forEach(item => {
                const ctr = item.closest('tr')
                if (!item.checked && ctr.style.display === 'table-row') {
                    item.checked = true
                }
            })
        } else {
            tdcbox.forEach(item => {
                const ctr = item.closest('tr')
                if (item.checked && ctr.style.display === 'table-row') {
                    item.checked = false
                }
            })
        }
    })


}

// Events
const acustpage = document.querySelector('a#a-customer-page')
const acustomcolumn = document.querySelector('a#a-customize-column')
const aremoverow = document.querySelector('a#remove-row')

document.addEventListener('DOMContentLoaded', e => {
    appsettings = remote.getCurrentWindow().appsettings

    // Matrialize initialize
    // modal
    M.Modal.init(document.querySelectorAll('.modal'))
    M.FloatingActionButton.init(document.querySelectorAll('.fixed-action-btn'), {
        direction : 'left',
        hoverEnabled : false
    })

    getAppSettings(appsettings)
    transactioncolumns()
    tableclearcontent()
    transactiontable()
})

acustpage.addEventListener('click', e => {
    e.preventDefault()
    ipcRenderer.send('index:open:customerpage', true)
})

acustomcolumn.addEventListener('click', e => {
    e.preventDefault()
    ipcRenderer.send('index:open:customizecolumn', true)
})

aremoverow.addEventListener('click', e => {
    e.preventDefault()
    const tdcbox = document.querySelectorAll('input.td-checkbox')
    let checked = []
    for (i in tdcbox) {
        if (tdcbox[i].checked == true) {
            checked.push(tdcbox[i])
        }
    }
    if (checked.length > 0) {
        remote.dialog.showMessageBox({
            type : 'question',
            title : 'Remove transactions?',
            buttons : ['Yes', 'No'],
            message : 'Remove selected transactions? \n Number of transactions: ' + checked.length
        }, response => {
            if (response == 0) {
                let dates = []
                for (i in checked) {
                    // console.log(checked[i])
                    dates.push(checked[i].getAttribute('date'))
                }
                dates.reverse()
                ipcRenderer.send('index:transaction:remove', JSON.stringify(dates))
            }
        })
    } else {
        remote.dialog.showMessageBox({
            type : 'info',
            title : 'Remove transactions?',
            message : 'No selected rows to delete'
        })
    }
})

// ipcRenderer
ipcRenderer.on('user:settings', (err, data) => {
    const brand = document.querySelector('a#brand')
    brand.innerHTML = data.appname
    document.title = data.appname
    appsettings = remote.getCurrentWindow().appsettings
    transactioncolumns()
    tableclearcontent()
    transactiontable()
})

ipcRenderer.on('table:add', (err, data) => {
    // load from main.js is stringified
    const load = JSON.parse(data)
    tableadd(load)
})

ipcRenderer.on('transact:open', (err, data) => {
    // load from main.js is title
    const title = document.querySelector('input#work-title')
    title.value = data
    appsettings = remote.getGlobal('globalappsettings')
    M.updateTextFields()
    getAppSettings(appsettings)
    tableclearcontent()
    transactiontable()
})

ipcRenderer.on('transact:reset', (err, item) => {
    customers = remote.getGlobal('customersetting')
    transactioncolumns()
    tableclearcontent()
    transactiontable()
})

ipcRenderer.on('index:transaction:removed', (err, item) => {
    tableclearcontent()
    transactiontable()
})

ipcRenderer.on('index:reset:column', (err, item) => {
    customers = remote.getGlobal('customersetting')
    transactioncolumns()
})
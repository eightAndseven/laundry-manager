const electron = require('electron')
    const {ipcRenderer, remote} = electron
    let appsettings = {}
    
    // nodes used for events
    // anchor
    const reviewchanges = document.querySelector('a#review-changes')
    const reviewcancel = document.querySelector('a#review-cancel')
    const addcolumn = document.querySelector('a#add-col-btn')
    const addclear = document.querySelector('a#add-col-clear')
    const savechanges = document.querySelector('a#save-changes')
    const cancelchanges = document.querySelector('a#cancel-changes')
    const editcancel = document.querySelector('a#edit-col-cancel')
    const editupdate = document.querySelector('a#edit-col-update')
    // form
    const formsettings = document.querySelector('form#form-settings')
    const formaddcol = document.querySelector('form#form-add-column')
    const formeditcol = document.querySelector('form#form-edit-column')
    // select
    const addcolselect = document.querySelector('select#selectwn')
    const editcolselect = document.querySelector('select#edit-selectwn')

    const unixtime = () => Math.round((new Date).getTime() / 1000)

    // remove the column
    function removecolumnli(e) {
        e.preventDefault()
        const rmli = e.target.closest('li')
        const id = rmli.id.replace('col-', '')
        for (let i = 0; i < appsettings.columns.length; i++) {
            if (appsettings.columns[i].column_id === id) appsettings.columns.splice(i, 1)
        }
        rmli.remove()
    }

    // edit the column
    function editcolumnli(e) {
        e.preventDefault()
        const currentediting = document.querySelector('li.editing')
        if (typeof currentediting !== 'undefined' && currentediting != null) currentediting.classList.remove('editing')
        const edli = e.target.closest('li')
        const id = edli.id.replace('col-', '')
        edli.classList.add('editing')
        formaddcol.style.display = 'none'
        formeditcol.style.display = 'block'
        let obj
        for (let i = 0; i < appsettings.columns.length; i++) {
            if (appsettings.columns[i].column_id === id) {
                obj = appsettings.columns[i]
                break
            }
        }
        // set values in inputs
        document.querySelector('input#edit-col-code').value = obj.column_id
        document.querySelector('input#edit-col-name').value = obj.column_name
        document.querySelector('input#edit-col-req').checked = obj.column_require === 'Required' ? true : false
        document.querySelector('textarea#edit-col-desc').value = obj.column_desc
        document.querySelector('select#edit-selectwn').selectedIndex = obj.column_worn === 'Name' ? 0 : 1
        if (obj.column_worn === 'Cost') {
            const price = document.querySelector('input#edit-col-price')
            price.value = obj.column_price
            price.disabled = false
        }
        // re initiate views of materialize 
        M.FormSelect.init(document.querySelector('select#edit-selectwn'))
        M.updateTextFields()
    }

    // function to list columns that are added using add columns
    function addcolumnlist(obj) {
        const ul = document.querySelector('ul#ul-columns')
        let textnode
        // <li>
        const li = document.createElement('li')
        li.id = 'col-' + obj.column_id
        // <div header>
        const divheader = document.createElement('div')
        divheader.className += 'collapsible-header'
        divheader.tabIndex = 0
        const i = document.createElement('i')
        i.className = 'material-icons'
        i.innerHTML = obj.column_worn === 'Name' ? 'format_list_bulleted' : 'format_list_numbered'
        const asterisk = obj.column_require === 'Required' ? '*' : ''
        textnode = document.createTextNode(obj.column_name + asterisk)
        // <span new>
        const spannew = document.createElement('span')
        spannew.className += 'new badge'
        divheader.appendChild(i)
        divheader.appendChild(textnode)
        divheader.appendChild(spannew)
        li.appendChild(divheader)
        // <div body>
        const divbody = document.createElement('div')
        divbody.className += 'collapsible-body'
        let span
        // body head
        const divheaddivide = document.createElement('div')
        span = document.createElement('span')
        span.className += 'grey-text'
        span.style.fontSize = '10px'
        const checkprice = obj.column_worn === 'Cost' ? ' | Price: Php ' + obj.column_price : ''
        const deschead = obj.column_id + ' | ' + obj.column_require.toUpperCase() + ' | ' +
            obj.column_worn.toUpperCase() + checkprice
        textnode = document.createTextNode(deschead)
        span.appendChild(textnode)
        divheaddivide.appendChild(span)
        // edit and remove buttons
        const diveditrm = document.createElement('div')
        diveditrm.className = 'right'
        const aedit = document.createElement('a')
        aedit.href = '#'
        aedit.style.fontSize = '12px'
        aedit.className = 'edit-column-new'
        aedit.innerHTML = '[Edit]'
        const aremove = document.createElement('a')
        aremove.href = '#'
        aremove.style.fontSize = '12px'
        aremove.className = 'remove-column-new red-text'
        aremove.innerHTML = '[Remove]'
        aremove.style.marginLeft = '5px'
        diveditrm.appendChild(aedit)
        diveditrm.appendChild(aremove)
        divheaddivide.appendChild(diveditrm)
        divbody.appendChild(divheaddivide)
        // divider
        const divdivider = document.createElement('div')
        divdivider.className += 'divider'
        divbody.appendChild(divdivider)
        //body desc
        const divsection = document.createElement('div')
        span = document.createElement('span')
        textnode = document.createTextNode(obj.column_desc)
        span.appendChild(textnode)
        divsection.appendChild(span)
        divbody.appendChild(divsection)
        li.appendChild(divbody)
        ul.appendChild(li)

        // events
        const anchorrm = document.querySelectorAll('a.remove-column-new')
        const anchored = document.querySelectorAll('a.edit-column-new')
        // remove new column
        anchorrm.forEach(item => item.addEventListener('click', removecolumnli))
        // edit new column
        anchored.forEach(item => item.addEventListener('click', editcolumnli))
    }

    // function list columns to list current columns in storage
    function listcolumns(obj) {
        const ul = document.querySelector('ul#ul-columns')
        let textnode 
        // <li>
        const li = document.createElement('li')
        li.id = 'col-' + obj.column_id
        // <div header>
        const divheader = document.createElement('div')
        divheader.className = 'collapsible-header'
        divheader.tabIndex = 0
        // i
        const i = document.createElement('i')
        i.className = 'material-icons'
        i.innerHTML = obj.column_worn === 'Name' ? 'format_list_bulleted' : 'format_list_numbered'
        const asterisk = obj.column_require === 'Required' ? '*' : ''
        textnode = document.createTextNode(obj.column_name + asterisk)
        divheader.appendChild(i)
        divheader.appendChild(textnode)
        li.appendChild(divheader)
        // <div body>
        const divbody = document.createElement('div')
        divbody.className += 'collapsible-body'
        let span
        // body head
        const divheaddivide = document.createElement('div')
        span = document.createElement('span')
        span.className += 'grey-text'
        span.style.fontSize = '10px'
        const checkprice = obj.column_worn === 'Cost' ? ' | Price: Php ' + obj.column_price : ''
        const deschead = obj.column_id + ' | ' + obj.column_require.toUpperCase() + ' | ' +
            obj.column_worn.toUpperCase() + checkprice
        textnode = document.createTextNode(deschead)
        span.appendChild(textnode)
        divheaddivide.appendChild(span)
        // edit and remove buttons
        const diveditrm = document.createElement('div')
        diveditrm.className = 'right'
        const aedit = document.createElement('a')
        aedit.href = '#'
        aedit.style.fontSize = '12px'
        aedit.className = 'edit-column'
        aedit.innerHTML = '[Edit]'
        const aremove = document.createElement('a')
        aremove.href = '#'
        aremove.style.fontSize = '12px'
        aremove.className = 'remove-column red-text'
        aremove.innerHTML = '[Remove]'
        aremove.style.marginLeft = '5px'
        diveditrm.appendChild(aedit)
        diveditrm.appendChild(aremove)
        divheaddivide.appendChild(diveditrm)
        divbody.appendChild(divheaddivide)
        // divider
        const divdivider = document.createElement('div')
        divdivider.className += 'divider'
        divbody.appendChild(divdivider)
        //body desc
        const divsection = document.createElement('div')
        span = document.createElement('span')
        textnode = document.createTextNode(obj.column_desc)
        span.appendChild(textnode)
        divsection.appendChild(span)
        divbody.appendChild(divsection)
        li.appendChild(divbody)
        ul.appendChild(li)

        // events
        const anchorrm = document.querySelectorAll('a.remove-column')
        const anchored = document.querySelectorAll('a.edit-column')
        
        // remove
        anchorrm.forEach(item => item.addEventListener('click', removecolumnli))

        // edit
        anchored.forEach(item => item.addEventListener('click', editcolumnli))
    }

    reviewchanges.addEventListener('click', (e) => {
        e.preventDefault()
        const appname = document.querySelector('input#app-name').value
        const appdesc = document.querySelector('textarea#app-desc').value
        if (appname !== '') {
            appsettings.appname = appname
            appsettings.appdesc = appdesc

            function compareChanges(obj) {
                const divreview = document.querySelector('div#changes-settings')
                divreview.innerHTML = ''
                const remoteobj = JSON.parse(remote.getCurrentWindow().appsettings)
                let isempty = true
                // application name changes
                if (remoteobj.appname !== obj.appname) {
                    isempty = false
                    const p = document.createElement('p')
                    // title
                    let span = document.createElement('span')
                    span.style.fontWeight = 'bold'
                    span.style.paddingRight = '10px'
                    span.innerHTML = 'Application Name:'
                    p.appendChild(span)
                    // from change
                    span = document.createElement('span')
                    span.className = 'red-text'
                    span.style.paddingRight = '10px'
                    span.innerHTML = remoteobj.appname
                    p.appendChild(span)
                    // arrow
                    span = document.createElement('span')
                    span.style.paddingRight = '10px'
                    span.innerHTML = '->'
                    p.appendChild(span)
                    // after change
                    span = document.createElement('span')
                    span.className = 'green-text'
                    span.innerHTML = obj.appname
                    p.appendChild(span)
                    divreview.appendChild(p)
                }
                // application description changes
                if (remoteobj.appdesc !== appsettings.appdesc) {
                    isempty = false
                    const p = document.createElement('p')
                    // title
                    let span = document.createElement('span')
                    span.style.fontWeight = 'bold'
                    span.style.paddingRight = '10px'
                    span.innerHTML = 'Application Description:'
                    p.appendChild(span)
                    // from change
                    span = document.createElement('span')
                    span.className = 'red-text'
                    span.style.paddingRight = '10px'
                    span.innerHTML = remoteobj.appdesc
                    p.appendChild(span)
                    // arrow
                    span = document.createElement('span')
                    span.style.paddingRight = '10px'
                    span.innerHTML = '->'
                    p.appendChild(span)
                    // after change
                    span = document.createElement('span')
                    span.className = 'green-text'
                    span.innerHTML = obj.appdesc
                    p.appendChild(span)
                    divreview.appendChild(p)
                }
                
                // check if there are added columns
                let localeobjids = []
                let remoteobjids = []
                let addedcol = []
                let removcol = []
                let updatcol = []

                remoteobj.columns.forEach(item => {
                    remoteobjids.push(item.column_id)
                })
                appsettings.columns.forEach(item => {
                    localeobjids.push(item.column_id)
                    if (!remoteobjids.includes(item.column_id)) {
                        addedcol.push(item)
                    }
                })

                if (addedcol.length > 0) {
                    if (isempty) isempty = false
                    const padd = document.createElement('p')
                    padd.innerHTML = 'Added Columns'
                    padd.style.fontWeight = 'bold'
                    divreview.appendChild(padd)
                    addedcol.forEach(item => {
                        const p = document.createElement('p')
                        const spandivide = document.createElement('span')
                        spandivide.innerHTML = ' | '
                        // id
                        let span = document.createElement('span')
                        let text = 'Code: <strong>' + item.column_id + '</strong>'
                        span.innerHTML = text
                        span.className = 'green-text'
                        p.appendChild(span)
                        p.appendChild(spandivide.cloneNode(true))
                        // name
                        span = document.createElement('span')
                        text = 'Name: <strong>' + item.column_name + '</strong>'
                        span.innerHTML = text
                        span.className = 'green-text'
                        p.appendChild(span)
                        p.appendChild(spandivide.cloneNode(true))
                        // required
                        span = document.createElement('span')
                        text = '<strong>' + item.column_require + '</strong>'
                        span.innerHTML = text
                        span.className = 'green-text'
                        p.appendChild(span)
                        p.appendChild(spandivide.cloneNode(true))
                        // name or cost
                        span = document.createElement('span')
                        text = '<strong>' + item.column_worn + '</strong>'
                        span.innerHTML = text
                        span.className = 'green-text'
                        p.appendChild(span)
                        // check if cost then print price
                        if (item.column_worn === 'Cost') {
                            // price
                            p.appendChild(spandivide.cloneNode(true))
                            span = document.createElement('span')
                            text = 'Price: <strong>' + item.column_price + '</strong>'
                            span.innerHTML = text
                            span.className = 'green-text'
                            p.appendChild(span)
                        }
                        divreview.appendChild(p)
                    })
                }
                
                // check if there are removed columns
                remoteobj.columns.forEach(item => {
                    if (!localeobjids.includes(item.column_id)) {
                        removcol.push(item)
                    }
                })
                if (removcol.length > 0) {
                    if (isempty) isempty = false
                    const padd = document.createElement('p')
                    padd.innerHTML = 'Removed Columns'
                    padd.style.fontWeight = 'bold'
                    divreview.appendChild(padd)
                    removcol.forEach(item => {
                        const p = document.createElement('p')
                        const spandivide = document.createElement('span')
                        spandivide.innerHTML = ' | '
                        // id
                        let span = document.createElement('span')
                        let text = 'Code: <strong>' + item.column_id + '</strong>'
                        span.innerHTML = text
                        span.className = 'red-text'
                        p.appendChild(span)
                        p.appendChild(spandivide.cloneNode(true))
                        // name
                        span = document.createElement('span')
                        text = 'Name: <strong>' + item.column_name + '</strong>'
                        span.innerHTML = text
                        span.className = 'red-text'
                        p.appendChild(span)
                        p.appendChild(spandivide.cloneNode(true))
                        // required
                        span = document.createElement('span')
                        text = '<strong>' + item.column_require + '</strong>'
                        span.innerHTML = text
                        span.className = 'red-text'
                        p.appendChild(span)
                        p.appendChild(spandivide.cloneNode(true))
                        // name or cost
                        span = document.createElement('span')
                        text = '<strong>' + item.column_worn + '</strong>'
                        span.innerHTML = text
                        span.className = 'red-text'
                        p.appendChild(span)
                        // check if cost then print price
                        if (item.column_worn === 'Cost') {
                            // price
                            p.appendChild(spandivide.cloneNode(true))
                            span = document.createElement('span')
                            text = 'Price: <strong>' + item.column_price + '</strong>'
                            span.innerHTML = text
                            span.className = 'red-text'
                            p.appendChild(span)
                        }
                        divreview.appendChild(p)
                    })
                                        
                }

                // check if there are updated items
                for (let i = 0; i < remoteobj.columns.length; i++) {
                    let outerobj = remoteobj.columns[i]
                    for (let j = 0; j < appsettings.columns.length; j++) {
                        let innerobj = appsettings.columns[j]
                        if (outerobj.column_id === innerobj.column_id) {
                            let ifedited = true
                            let updatedobj = {}
                            if (outerobj.column_name !== innerobj.column_name) {
                                if (ifedited) ifedited = false
                                updatedobj.column_name = innerobj.column_name
                            }
                            if (outerobj.column_desc !== innerobj.column_desc) {
                                if (ifedited) ifedited = false
                                updatedobj.column_desc = innerobj.column_name
                            }
                            if (outerobj.column_require !== innerobj.column_require) {
                                if (ifedited) ifedited = false
                                updatedobj.column_require = innerobj.column_require
                            }
                            if (outerobj.column_worn !== innerobj.column_worn) {
                                if (ifedited) ifedited = false
                                updatedobj.column_worn = innerobj.column_worn
                            }
                            if (innerobj.column_worn === 'Cost') {
                                if (outerobj.column_worn === 'Cost') {
                                    if (outerobj.column_price == innerobj.column_price) {
                                        if (ifedited) ifedited = false
                                        updatedobj.column_price = innerobj.column_price
                                    }
                                } else {
                                    if (ifedited) ifedited = false
                                    updatedobj.column_price = innerobj.column_price
                                }
                            }
                            if (!ifedited) {
                                updatedobj.column_id = innerobj.column_id
                                updatcol.push(updatedobj)
                            }
                            break
                        }
                    }
                }
                if (updatcol.length > 0) {
                    if (isempty) isempty = false
                    const padd = document.createElement('p')
                    padd.innerHTML = 'Updated Columns'
                    padd.style.fontWeight = 'bold'
                    divreview.appendChild(padd)
                    updatcol.forEach(item => {
                        const p = document.createElement('p')
                        const spandivide = document.createElement('span')
                        spandivide.innerHTML = ' | '
                        // id/code
                        let span = document.createElement('span')
                        let text = 'Code: <strong>' + item.column_id + '</strong>'
                        span.innerHTML = text
                        p.appendChild(span)
                        // name
                        if (typeof item.column_name !== 'undefined') {
                            p.appendChild(spandivide.cloneNode(true))
                            span = document.createElement('span')
                            text = 'Name: '
                            span.innerHTML = text
                            p.appendChild(span)
                            span = document.createElement('span')
                            text = item.column_name
                            span.className = 'green-text'
                            span.innerHTML = text
                            p.appendChild(span)
                        }
                        // description
                        if (typeof item.column_desc !== 'undefined') {
                            p.appendChild(spandivide.cloneNode(true))
                            span = document.createElement('span')
                            text = 'Description: '
                            span.innerHTML = text
                            p.appendChild(span)
                            span = document.createElement('span')
                            text = item.column_desc
                            span.className = 'green-text'
                            span.innerHTML = text
                            p.appendChild(span)
                        }
                        // required
                        if (typeof item.column_require !== 'undefined') {
                            p.appendChild(spandivide.cloneNode(true))
                            span = document.createElement('span')
                            text = item.column_require
                            span.className = 'green-text'
                            span.innerHTML = text
                            p.appendChild(span)
                        }
                        // word or cost
                        if (typeof item.column_worn !== 'undefined') {
                            p.appendChild(spandivide.cloneNode(true))
                            span = document.createElement('span')
                            text = item.column_worn
                            span.className = 'green-text'
                            span.innerHTML = text
                            p.appendChild(span)
                        }
                        // price
                        if (typeof item.column_price !== 'undefined') {
                            p.appendChild(spandivide.cloneNode(true))
                            span = document.createElement('span')
                            text = item.column_price
                            span.className = 'green-text'
                            span.innerHTML = text
                            p.appendChild(span)
                        }
                        divreview.appendChild(p)
                    })
                }

                const a = document.querySelector('a#save-changes')
                a.style.pointerEvents = 'auto'
                // if no changes were made
                if (isempty) {
                    a.style.pointerEvents = 'none'
                    const div = document.createElement('div')
                    const h5 = document.createElement('h5')
                    h5.className = 'center-align'
                    h5.innerHTML = 'No changes were made.'
                    div.appendChild(h5)
                    divreview.appendChild(div)
                }
            }
            
            // changes
            compareChanges(appsettings)
            const modal = document.querySelector('.modal#modal-review')
            const instance = M.Modal.getInstance(modal)
            instance.open()
            
            // ipcRenderer.send('settings:update', payload)
        }
    })
    reviewcancel.addEventListener('click', e => {
        e.preventDefault()
        ipcRenderer.send('settings:cancel', '')
    })

    addcolumn.addEventListener('click', e => {
        e.preventDefault()
        const addcolcode = document.querySelector('input#add-col-code')

        // check if column code already exists...
        let iscode = true
        const currentcolumns = appsettings.columns
        currentcolumns.forEach(e => {
            if (e.column_id === addcolcode.value) {
                iscode = false
            }
        })
        const addcolname = document.querySelector('input#add-col-name')
        const addcoldesc = document.querySelector('textarea#add-col-desc')
        const isrequired = document.querySelector('input#add-col-req')
        const selectwn = document.querySelector('select#selectwn')
        const addcolprice = document.querySelector('input#add-col-price')
        if ((addcolname.value !== '' || addcoldesc.value !== '') && iscode) {
            let colobj = {
                column_id : addcolcode.value.split(' ').join(''),
                column_name : addcolname.value,
                column_require : isrequired.checked ? 'Required' : 'Optional',
                column_desc : addcoldesc.value,
                column_worn : selectwn.value == 1 ? 'Name' : 'Cost'
            }
            if (selectwn.value == 2) {
                if (addcolprice.value !== '' && !isNaN(parseFloat(addcolprice.value))) {
                    const price = parseFloat(addcolprice.value)
                    colobj.column_price = price
                    addcolcode.value = ''
                    addcolname.value = ''
                    addcoldesc.value = ''
                    selectwn.selectedIndex = 0
                    isrequired.checked = false
                    addcolprice.value = ''
                    addcolprice.disabled = true
                    M.FormSelect.init(selectwn)
                    M.updateTextFields()
                    addcolumnlist(colobj)
                    const col = appsettings.columns
                    col.push(colobj)
                    appsettings.columns = col
                }
            } else {
                addcolcode.value = ''
                addcolname.value = ''
                addcoldesc.value = ''
                selectwn.selectedIndex = 0
                isrequired.checked = false
                M.updateTextFields()
                addcolumnlist(colobj)
                const col = appsettings.columns
                col.push(colobj)
                appsettings.columns = col
            }
        }       
    })
    savechanges.addEventListener('click', e => {
        e.preventDefault()
        item = JSON.stringify(appsettings)
        ipcRenderer.send('settings:update', item)
    })

    cancelchanges.addEventListener('click', e => e.preventDefault())

    editcancel.addEventListener('click', e => {
        e.preventDefault()
        formeditcol.style.display = 'none'
        formaddcol.style.display = 'block'
        const editing = document.querySelector('li.editing')
        editing.classList.remove('editing')
        document.querySelector('input#edit-col-code').value = ''
        document.querySelector('input#edit-col-name').value = ''
        document.querySelector('input#edit-col-req').checked = false
        document.querySelector('textarea#edit-col-desc').value = ''
        document.querySelector('select#edit-selectwn').selectedIndex = 0
        const price = document.querySelector('input#edit-col-price')
        price.value = ''
        price.disabled = true
        // re initiate views of materialize 
        M.FormSelect.init(document.querySelector('select#edit-selectwn'))
        M.updateTextFields()
    })

    editupdate.addEventListener('click', e => {
        e.preventDefault()
        const editing = document.querySelector('li.editing')
        const editid = editing.id.replace('col-', '')
        editing.classList.remove('editing')
        editing.classList.remove('active')
        let editobj
        for (let i = 0; i < appsettings.columns.length; i++) {
            if (appsettings.columns[i].column_id === editid) {
                editobj = appsettings.columns[i]
                break
            }
        }
        const editcolcode = document.querySelector('input#edit-col-code')
        const editcolname = document.querySelector('input#edit-col-name')
        const editcolreq = document.querySelector('input#edit-col-req')
        const editcoldesc = document.querySelector('textarea#edit-col-desc')
        const editselectwn = document.querySelector('select#edit-selectwn')
        const editcolprice = document.querySelector('input#edit-col-price')

        // replace values in obj
        editobj.column_id  = editcolcode.value
        editobj.column_name = editcolname.value
        editobj.column_require = editcolreq.checked ? 'Required' : 'Optional'
        editobj.column_desc = editcoldesc.value
        editobj.column_worn = editselectwn.value == 1 ? 'Name' : 'Cost'
        if (editobj.column_worn === 'Cost') {
            editobj.column_price = editcolprice.value
        } else {
            delete editobj.column_price
        }

        editcolcode.value = ''
        editcolname.value = ''
        editcolreq.checked = false
        editcoldesc.value = ''
        editselectwn.selectedIndex = 0
        editcolprice.value = ''
        editcolprice.disabled = true
        // reinitialize materialize
        M.FormSelect.init(editselectwn)
        M.updateTextFields()
        formeditcol.style.display = 'none'
        formaddcol.style.display = 'block'

        // styles
        editing.id = 'col-' + editobj.column_id
        editing.innerHTML = ''
        // <div header>
        const divheader = document.createElement('div')
        divheader.className += 'collapsible-header'
        divheader.tabIndex = 0
        const i = document.createElement('i')
        i.className = 'material-icons'
        i.innerHTML = editobj.column_worn === 'Name' ? 'format_list_bulleted' : 'format_list_numbered'
        const asterisk = editobj.column_require === 'Required' ? '*' : ''
        textnode = document.createTextNode(editobj.column_name + asterisk)
        // <span new>
        const spannew = document.createElement('span')
        spannew.className += 'new badge'
        spannew.setAttribute('data-badge-caption', 'edited')
        divheader.appendChild(i)
        divheader.appendChild(textnode)
        divheader.appendChild(spannew)
        editing.appendChild(divheader)
        // <div body>
        const divbody = document.createElement('div')
        divbody.className += 'collapsible-body'
        let span
        // body head
        const divheaddivide = document.createElement('div')
        span = document.createElement('span')
        span.className += 'grey-text'
        span.style.fontSize = '10px'
        const checkprice = editobj.column_worn === 'Cost' ? ' | Price: Php ' + editobj.column_price : ''
        const deschead = editobj.column_id + ' | ' + editobj.column_require.toUpperCase() + ' | ' +
            editobj.column_worn.toUpperCase() + checkprice
        textnode = document.createTextNode(deschead)
        span.appendChild(textnode)
        divheaddivide.appendChild(span)
        // edit and remove buttons
        const diveditrm = document.createElement('div')
        diveditrm.className = 'right'
        const aedit = document.createElement('a')
        aedit.href = '#'
        aedit.style.fontSize = '12px'
        aedit.className = 'edit-column-edited'
        aedit.innerHTML = '[Edit]'
        const aremove = document.createElement('a')
        aremove.href = '#'
        aremove.style.fontSize = '12px'
        aremove.className = 'remove-column-edited red-text'
        aremove.innerHTML = '[Remove]'
        aremove.style.marginLeft = '5px'
        diveditrm.appendChild(aedit)
        diveditrm.appendChild(aremove)
        divheaddivide.appendChild(diveditrm)
        divbody.appendChild(divheaddivide)
        // divider
        const divdivider = document.createElement('div')
        divdivider.className += 'divider'
        divbody.appendChild(divdivider)
        //body desc
        const divsection = document.createElement('div')
        span = document.createElement('span')
        textnode = document.createTextNode(editobj.column_desc)
        span.appendChild(textnode)
        divsection.appendChild(span)
        divbody.appendChild(divsection)
        editing.appendChild(divbody)

        // events
        const editedited = document.querySelectorAll('a.edit-column-edited')
        const removeedited = document.querySelectorAll('a.remove-column-edited')

        editedited.forEach(item => item.addEventListener('click', editcolumnli))
        removeedited.forEach(item => item.addEventListener('click',removecolumnli))
    })

    addclear.addEventListener('click', e => {
        e.preventDefault()
        document.querySelector('input#add-col-code').value = ''
        document.querySelector('input#add-col-name').value = ''
        document.querySelector('input#add-col-req').checked = false
        document.querySelector('textarea#add-col-desc').value = ''
        document.querySelector('input#add-col-price').value = ''
        M.updateTextFields()
    })

    formsettings.addEventListener('submit', e => e.preventDefault())
    
    formaddcol.addEventListener('submit', e => e.preventDefault())

    formeditcol.addEventListener('submit', e => e.preventDefault())

    addcolselect.addEventListener('change', e => {
        const val = e.target.value
        const addcolprice = document.querySelector('input#add-col-price')
        addcolprice.disabled = val == 1 ? true : false
        if (addcolprice.disabled) addcolprice.value = ''
        M.updateTextFields()
    })

    editcolselect.addEventListener('change', e => {
        const val = e.target.value
        const editcolprice = document.querySelector('input#edit-col-price')
        editcolprice.disabled = val == 1 ? true : false
        if (editcolprice.disabled) editcolprice.value = ''
        M.updateTextFields()
    })

    
    document.addEventListener('DOMContentLoaded', () => {

        // Initiatialize Materialzie
        const select = document.querySelectorAll('select')
        const collapse = document.querySelectorAll('.collapsible')
        const modal = document.querySelector('.modal')
        const selectinstances = M.FormSelect.init(select)
        const collapseinstances = M.Collapsible.init(collapse)
        const modalinstsances = M.Modal.init(modal)

        appsettings = JSON.parse(remote.getCurrentWindow().appsettings)
        // application name
        if (typeof appsettings.appname !== 'undefined') {
            const appname = document.querySelector('input#app-name')
            appname.value = appsettings.appname
            M.updateTextFields()
        }
        // application description
        if (typeof appsettings.appdesc !== 'undefined') {
            const appdesc = document.querySelector('textarea#app-desc')
            appdesc.value = appsettings.appdesc
            M.updateTextFields()
        }

        // columns passed
        if (appsettings.columns.length > 0) {
            appsettings.columns.forEach(listcolumns)
        }
    })
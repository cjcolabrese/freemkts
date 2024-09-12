var editor = new DataTable.Editor({
    ajax: '../php/staff.php',
    fields: [
        {
            label: 'First name:',
            name: 'first_name'
        },
        {
            label: 'Last name:',
            name: 'last_name'
        },
        {
            label: 'Position:',
            name: 'position'
        },
        {
            label: 'Office:',
            name: 'office'
        },
        {
            label: 'Extension:',
            name: 'extn'
        },
        {
            label: 'Start date:',
            name: 'start_date',
            type: 'datetime'
        },
        {
            label: 'Salary:',
            name: 'salary'
        }
    ],
    table: '#example'
});
 
$('#example').DataTable({
    ajax: '../php/staff.php',
    columns: [
        {
            data: null,
            render: function (data, type, row) {
                // Combine the first and last names into a single table field
                return data.first_name + ' ' + data.last_name;
            }
        },
        { data: 'position' },
        { data: 'office' },
        { data: 'extn' },
        { data: 'start_date' },
        { data: 'salary', render: DataTable.render.number(null, null, 0, '$') }
    ],
    layout: {
        topStart: {
            buttons: [
                { extend: 'create', editor: editor },
                { extend: 'edit', editor: editor },
                { extend: 'remove', editor: editor }
            ]
        }
    },
    select: true
});
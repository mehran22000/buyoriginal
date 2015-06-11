// Userlist data array for filling in info box
var userListData = [];
var brandListData = [];
var storeListData = [];
var categoryListData = [];


// DOM Ready =============================================================
$(document).ready(function() {

    // Populate the user table on initial page load
    populateTable();
    // Username link click
    $('#userList table tbody').on('click', 'td a.linkshowuser', showUserInfo);
    // Add User button click
    $('#btnAddStore').on('click', addStore);
    // Delete User link click
    $('#storeList table tbody').on('click', 'td a.linkdeletestore', deleteStore);


});

// Functions =============================================================

// Fill table with data
function populateTable() {

    // Empty content string
    var tableContent = '';

    // jQuery AJAX call for JSON
    $.getJSON( '/stores/storelist', function( data ) {
	
    // Stick our user data array into a userlist variable in the global object
    storeListData = data;

        // For each item in our JSON, add a table row and cells to the content string
        $.each(data, function(){
            tableContent += '<tr>';
            tableContent += '<td>' + this.bId + '</td>';
            tableContent += '<td>' + this.bName + '</td>';
            tableContent += '<td>' + this.bCategory + '</td>';
            tableContent += '<td>' + this.sId + '</td>';
            tableContent += '<td>' + this.sName + '</td>';
            tableContent += '<td>' + this.bDistributor + '</td>';
            tableContent += '<td>' + this.sCity + '</td>';
            tableContent += '<td>' + this.sAddress + '</td>';
            tableContent += '<td>' + this.sHours + '</td>';
            tableContent += '<td>' + this.sAreaCode + '</td>';
            tableContent += '<td>' + this.sTel1 + '</td>';
            tableContent += '<td>' + this.sTel2 + '</td>';
            tableContent += '<td>' + this.sLat + '</td>';
            tableContent += '<td>' + this.sLong + '</td>';
            tableContent += '<td>' + this.sVerified + '</td>';
            tableContent += '<td><a href="#" class="linkdeletestore" rel="' + this._id + '">delete</a></td>';
            tableContent += '</tr>';
        });

        // Inject the whole content string into our existing HTML table
        $('#storeList table tbody').html(tableContent);
    });
};

// Show User Info
function showUserInfo(event) {

    // Prevent Link from Firing
    event.preventDefault();

    // Retrieve username from link rel attribute
    var thisUserName = $(this).attr('rel');

    // Get Index of object based on id value
    var arrayPosition = userListData.map(function(arrayItem) { return arrayItem.username; }).indexOf(thisUserName);
    // Get our User Object
    var thisUserObject = userListData[arrayPosition];

    //Populate Info Box
    $('#userInfoName').text(thisUserObject.fullname);
    $('#userInfoAge').text(thisUserObject.age);
    $('#userInfoGender').text(thisUserObject.gender);
    $('#userInfoLocation').text(thisUserObject.location);

};

// Add Store
function addStore(event) {
    event.preventDefault();

    // Super basic validation - increase errorCount variable if any fields are blank
    var errorCount = 0;
    $('#addStore input').each(function(index, val) {
        if($(this).val() === '') { errorCount++; }
    });

    // Check and make sure errorCount's still at zero
    if(errorCount === 0) {

        // If it is, compile all user info into one object
        var newStore = {
            'bId': $('#addStore fieldset input#inputbId').val(),
            'sId': $('#addStore fieldset input#inputsId').val(),
            'bName': $('#addStore fieldset input#inputbName').val(),
            'sName': $('#addStore fieldset input#inputsName').val(),
            'bCategory': $('#addStore fieldset input#inputbCategory').val(),
            'bDistributor': $('#addStore fieldset input#inputbDistributor').val(),
            'sCity': $('#addStore fieldset input#inputsCity').val(),
            'sAddress': $('#addStore fieldset input#inputsAddress').val(),
            'sAreaCode': $('#addStore fieldset input#inputsAreaCode').val(),
            'sHours': $('#addStore fieldset input#inputsHours').val(),
            'sTel1': $('#addStore fieldset input#inputsTel1').val(),
            'sTel2': $('#addStore fieldset input#inputsTel2').val(),
            'sLat': $('#addStore fieldset input#inputsLat').val(),
            'sLong': $('#addStore fieldset input#inputsLong').val(),
            'sVerified': $('#addStore fieldset input#inputsVerified').val()
        }

        // Use AJAX to post the object to our addstore service
        $.ajax({
            type: 'POST',
            data: newStore,
            url: '/stores/addstore',
            dataType: 'JSON'
        }).done(function( response ) {

            // Check for successful (blank) response
            if (response.msg === '') {

                // Clear the form inputs
                $('#addStore fieldset input').val('');

                // Update the table
                populateTable();

            }
            else {

                // If something goes wrong, alert the error message that our service returned
                alert('Error: ' + response.msg);

            }
        });
    }
    else {
        // If errorCount is more than 0, error out
        alert('Please fill in all fields');
        return false;
    }
};

// Delete User
function deleteStore(event) {

    event.preventDefault();

    // Pop up a confirmation dialog
    var confirmation = confirm('Are you sure you want to delete this store?');

    // Check and make sure the user confirmed
    if (confirmation === true) {

        // If they did, do our delete
        $.ajax({
            type: 'DELETE',
            url: '/stores/deletestore/' + $(this).attr('rel')
        }).done(function( response ) {

            // Check for a successful (blank) response
            if (response.msg === '') {
            }
            else {
                alert('Error: ' + response.msg);
            }

            // Update the table
            populateTable();

        });

    }
    else {

        // If they said no to the confirm, do nothing
        return false;

    }

};

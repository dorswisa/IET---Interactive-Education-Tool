var users, parents, userinfo;
function getValue(data1, data2) {
    users = data1;
    parents = data2;
}


(function() {
    var body = document.body,
        dropArea = document.getElementById( 'drop-area' ),
        droppableArr = [], dropAreaTimeout;

    // initialize droppables
    [].slice.call( document.querySelectorAll( '#drop-area .drop-area__item' )).forEach( function( el ) {
        droppableArr.push( new Droppable( el, {
            onDrop : function( instance, draggableEl ) {
                // show checkmark inside the droppabe element
                classie.add( instance.el, 'drop-feedback' );
                clearTimeout( instance.checkmarkTimeout );
                instance.checkmarkTimeout = setTimeout( function() {
                    classie.remove( instance.el, 'drop-feedback' );
                }, 800 );

                userinfo = draggableEl.textContent.trim();
                userinfo = userinfo.split("\n");
                for(let i=0; i<userinfo.length; i++)
                {
                    userinfo[i] = userinfo[i].replace(/\s+/g, '');
                }

                if(el.id == "delete")
                {
                    $('#delete-modal-title').html('Warning!');
                    $('#delete-modal-body').html('Are you sure you want to delete this account?.');
                    $('#delete-modal').modal('show');
                }
                else if(el.id == "signto")
                {
                    $('#connect-modal-title').html('Warning!');
                    $('#connect-modal-body').html('Are you sure you want to disconnect from your account and connect to this account?.');
                    $('#connect-modal').modal('show');
                }
                else if(el.id == 'edit')
                {
                    const usr = users.find(element => element.id == userinfo[0]);
                    document.getElementById("edit-username").value = usr.name;
                    document.getElementById("edit-id").value = usr.id;
                    document.getElementById("edit-type").value = usr.type;
                    document.getElementById("edit-email").value = usr.email;
                    if(usr.type == "Pupil")
                    {
                        document.getElementById("edit-class").value = usr.class;
                        document.getElementById("edit-parent").value = usr.parent;
                        document.getElementById("edit-class").style.display = "block";
                        document.getElementById("edit-parent").style.display = "block";
                    }
                    else
                    {
                        document.getElementById("edit-class").style.display = "none";
                        document.getElementById("edit-parent").style.display = "none";
                    }
                    $('#edit-class').value = usr.name;
                    $('.cd-user-modal').addClass('is-visible');
                    $('.cd-user-modal').find('#cd-edit').addClass('is-selected');
                    $('.cd-user-modal').find('#cd-create').removeClass('is-selected');
                }
            }
        } ) );
    } );

    // initialize draggable(s)
    [].slice.call(document.querySelectorAll( '#list .drag-me' )).forEach( function( el ) {
        new Draggable( el, droppableArr, {
            draggabilly : { containment: document.body },
            onStart : function() {
                // add class 'drag-active' to body
                classie.add( body, 'drag-active' );
                // clear timeout: dropAreaTimeout (toggle drop area)
                clearTimeout( dropAreaTimeout );
                // show dropArea
                classie.add( dropArea, 'show' );
            },
            onEnd : function( wasDropped ) {
                var afterDropFn = function() {
                    // hide dropArea
                    classie.remove( dropArea, 'show' );
                    // remove class 'drag-active' from body
                    classie.remove( body, 'drag-active' );
                };

                if( !wasDropped ) {
                    afterDropFn();
                }
                else {
                    // after some time hide drop area and remove class 'drag-active' from body
                    clearTimeout( dropAreaTimeout );
                    dropAreaTimeout = setTimeout( afterDropFn, 400 );
                }
            }
        } );
    } );
})();

document.getElementById("edit-type").addEventListener("change", function(){
    if(document.getElementById("edit-type").value == "Pupil")
    {
        var arr = parents;
        for( var i = 0; i < arr.length; i++){

            if ( arr[i].id === document.getElementById("edit-id").value) {

                arr.splice(i, 1);
            }

        }
        var $el = $("#edit-parent");
        $el.empty(); // remove old options
        $el.append($("<option></option>")
            .attr("value", '').attr("disabled", '').attr("selected", '').text("Select Parent"));
        $.each(arr, function(key,value) {
            $el.append($("<option></option>")
                .attr("value", value.id).text(value.name + " - " + value.id));
        });

        document.getElementById("edit-class").style.display = "block";
        $('#edit-class').prop('required',true);
        document.getElementById("edit-parent").style.display = "block";
    }
    else
    {
        $('#edit-class').prop('required',false);
        document.getElementById("edit-class").style.display = "none";
        document.getElementById("edit-parent").style.display = "none";
    }
});

document.getElementById("create-type").addEventListener("change", function(){
    if(document.getElementById("create-type").value == "Pupil")
    {
        document.getElementById("create-class").style.display = "block";
        $('#create-class').prop('required',true);
        document.getElementById("create-parent").style.display = "block";
    }
    else
    {
        $('#create-class').prop('required',false);
        document.getElementById("create-class").style.display = "none";
        document.getElementById("create-parent").style.display = "none";
    }
});

jQuery(document).ready(function($){

    var $form_modal = $('.cd-user-modal'),
        $form_edit = $form_modal.find('#cd-edit'),
        $form_create = $form_modal.find('#cd-create');

    $('.cd-create').on('click', function(){
        $form_modal.addClass('is-visible');
        //show the selected form
        create_selected();
    });


    //close modal
    $('.cd-close-form').on('click', function(event){
        $form_modal.removeClass('is-visible');
    });

    //close modal when clicking the esc keyboard button
    $(document).keyup(function(event){
        if(event.which=='27'){
            $form_modal.removeClass('is-visible');
        }
    });


    //hide or show password
    $('.hide-password').on('click', function(){
        var $this= $(this),
            $password_field = $this.prev().prev('input');

        ( 'password' === $password_field.attr('type') ) ? $password_field.attr('type', 'text') : $password_field.attr('type', 'password');
        ( '/css/visibility.png' === $this.children("img").attr('src') ) ? $this.children("img").attr('src','/css/invisible.png') : $this.children("img").attr('src','/css/visibility.png');
        //focus and move cursor to the end of input field
        $password_field.putCursorAtEnd();
    });

    function create_selected(){
        $form_modal.addClass('is-visible');
        $form_edit.removeClass('is-selected');
        $form_create.addClass('is-selected');
    }


    $('#cd-create').ajaxForm({
        type: 'POST',
        url: '/create-user',
        success: function (responseText, status, xhr, $form) {
            if (status == 'success')
            {
                $('#alert-modal-title').html('Creation Success!');
                $('#alert-modal-body').html('The user has been created. <br>Refreshing the page.');
                $('#alert-modal').modal('show');
                setTimeout(function(){window.location.reload();}, 3000);
            }
        },
        error: function (e) {
            if (e.responseText == 'user-taken')
            {
                $('#alert-modal-title').html('Creation Failure!');
                $('#alert-modal-body').html('This information has already been allocated to another user.');
                $('#alert-modal').modal('show');
            }
        }
    });
    $('#submitedituser').click(function() {
        $('#cd-edit').ajaxForm({
            type: 'POST',
            url: '/edit-user',
            data: {"pastid": userinfo[0]},
            success: function (responseText, status, xhr, $form) {
                if (status == 'success') {
                    $('#alert-modal-title').html('Edit Successful!');
                    $('#alert-modal-body').html('The user\'s account has been edited.. <br>Refreshing the page.');
                    $('#alert-modal').modal('show');
                    setTimeout(function () {
                        window.location.reload();
                    }, 3000);
                }
            },
            error: function (e) {
                $('#alert-modal-title').html('Edit Failure!');
                $('#alert-modal-body').html('This information has already been allocated to another user.');
                $('#alert-modal').modal('show');
            }
        });
    });

    $('#delete-access').click(function(){
        $('#delete-modal').modal('hide');
        $.ajax({
            url: '/delete-user',
            data: userinfo[0],
            type: 'POST',
            success: function(data){
                $('#alert-modal-title').html('Delete Successful!');
                $('#alert-modal-body').html('This account has been deleted.<br>Refreshing the page.');
                $('#alert-modal').modal('show');
                setTimeout(function(){window.location.reload();}, 3000);

            },
            error: function(jqXHR){
                console.log(jqXHR.responseText+' :: '+jqXHR.statusText);
            }
        });
    });

    $('#connect-access').click(function(){
        $('#connect-modal').modal('hide');
        $.ajax({
            url: '/connect-user',
            data: userinfo[0],
            type: 'POST',
            success: function(data){
                $('#alert-modal-title').html('Connect Successful!');
                $('#alert-modal-body').html('Redirecting to the user home page.');
                $('#alert-modal').modal('show');
                setTimeout(function(){window.location.href = '/';}, 3000);
            },
            error: function(jqXHR){
                console.log(jqXHR.responseText+' :: '+jqXHR.statusText);
            }
        });
    });
});

//credits https://css-tricks.com/snippets/jquery/move-cursor-to-end-of-textarea-or-input/
jQuery.fn.putCursorAtEnd = function() {
    return this.each(function() {
        // If this function exists...
        if (this.setSelectionRange) {
            // ... then use it (Doesn't work in IE)
            // Double the length because Opera is inconsistent about whether a carriage return is one character or two. Sigh.
            var len = $(this).val().length * 2;
            this.setSelectionRange(len, len);
        } else {
            // ... otherwise replace the contents with itself
            // (Doesn't work in Google Chrome)
            $(this).val($(this).val());
        }
    });
};
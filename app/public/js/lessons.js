var lessons, lessoninfo;
function getValue(data1) {
    lessons = data1;
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

                lessoninfo = draggableEl.textContent.trim();
                lessoninfo = lessoninfo.split("\n");
                for(let i=0; i<lessoninfo.length; i++)
                {
                    lessoninfo[i] = lessoninfo[i].trimStart();
                }
                var lsn = lessons.find(element => element.year == lessoninfo[0] && element.name == lessoninfo[1] && element.class == lessoninfo[3] && element.start == parseInt(lessoninfo[4].split(" ")[1]) && element.end == parseInt(lessoninfo[4].split(" ")[3]) && element.day == lessoninfo[4].split(" ")[0]);
                lessoninfo[0] = lsn._id;

                if(el.id == "delete")
                {
                    $('#delete-modal-title').html('Warning!');
                    $('#delete-modal-body').html('Are you sure you want to delete this lesson?.');
                    $('#delete-modal').modal('show');
                }
                else if(el.id == 'edit')
                {

                    document.getElementById("edit-year").value = lsn.year;
                    document.getElementById("edit-name").value = lsn.name;
                    document.getElementById("edit-teacher").value = lsn.teacher;
                    document.getElementById("edit-class").value = lsn.class;
                    document.getElementById("edit-day").value = lsn.day;
                    document.getElementById("edit-start").value = lsn.start < 10 ? "0" + lsn.start + ":00" : lsn.start + ":00";
                    document.getElementById("edit-end").value = lsn.end + ":00";

                    $('.cd-user-modal').addClass('is-visible');
                    $('.cd-user-modal').find('#cd-edit').addClass('is-selected');
                    $('.cd-user-modal').find('#cd-create').removeClass('is-selected');
                }
                else if(el.id == 'step-in')
                {
                    window.location.href = '/lesson/?id='+ lsn._id;
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

jQuery(document).ready(function($){

    $('#create-start , #create-end, #edit-start, #edit-end').timepicker({
        timeFormat: 'HH:mm',
        interval: 60,
        dropdown: true,
        scrollbar: true,
        minHour: 8,
        maxHour: 20
    });

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

    function create_selected(){
        $form_modal.addClass('is-visible');
        $form_edit.removeClass('is-selected');
        $form_create.addClass('is-selected');
    }


    $('#cd-create').ajaxForm({
        type: 'POST',
        url: '/create-lesson',
        beforeSubmit: function() {
            if(document.getElementById("create-start").value >= document.getElementById("create-end").value)
            {
                $('#alert-modal-title').html('Creation Failure!');
                $('#alert-modal-body').html('There is a problem with the times you entered.');
                $('#alert-modal').modal('show');
                return false;
            }
            return true;
        },
        success: function (responseText, status, xhr, $form) {
            if (status == 'success')
            {
                $('#alert-modal-title').html('Creation Success!');
                $('#alert-modal-body').html('The lesson has been created. <br>Refreshing the page.');
                $('#alert-modal').modal('show');
                setTimeout(function(){window.location.reload();}, 3000);
            }
        },
        error: function (e) {
            $('#alert-modal-title').html('Creation Failure!');
            $('#alert-modal-body').html('There is a problem with the times you entered.');
            $('#alert-modal').modal('show');
        }
    });

    $('#submiteditlesson').click(function() {
        $('#cd-edit').ajaxForm({
            type: 'POST',
            url: '/edit-lesson',
            data: {"pastid": lessoninfo[0]},
            beforeSubmit: function() {
                if(document.getElementById("edit-start").value >= document.getElementById("edit-end").value)
                {
                    $('#alert-modal-title').html('Creation Failure!');
                    $('#alert-modal-body').html('There is a problem with the times you entered.');
                    $('#alert-modal').modal('show');
                    return false;
                }
                return true;
            },
            success: function (responseText, status, xhr, $form) {
                if (status == 'success') {
                    $('#alert-modal-title').html('Edit Successful!');
                    $('#alert-modal-body').html('The lesson has been edited. <br>Refreshing the page.');
                    $('#alert-modal').modal('show');
                    setTimeout(function () {
                        window.location.reload();
                    }, 3000);
                }
            },
            error: function (e) {
                $('#alert-modal-title').html('Edit Failure!');
                $('#alert-modal-body').html('There is a problem with the times you entered.');
                $('#alert-modal').modal('show');
            }
        });
    });

    $('#delete-access').click(function(){
        $('#delete-modal').modal('hide');
        $.ajax({
            url: '/delete-lesson',
            data: lessoninfo[0],
            type: 'POST',
            success: function(data){
                $('#alert-modal-title').html('Delete Successful!');
                $('#alert-modal-body').html('This lesson has been deleted.<br>Refreshing the page.');
                $('#alert-modal').modal('show');
                setTimeout(function(){window.location.reload();}, 3000);

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
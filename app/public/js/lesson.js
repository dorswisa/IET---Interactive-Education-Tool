var lesson, contentinfo;
function getValue(data1) {
    lesson = data1;
}

var Elecounter = 0;
var Anscounter = 0;

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

                contentinfo = draggableEl.textContent.trim();
                contentinfo = contentinfo.split("\n");
                for(let i=0; i<contentinfo.length; i++)
                {
                    contentinfo[i] = contentinfo[i].trimStart();
                }

                contentinfo = lesson.contents[parseInt(contentinfo[0]) - 1];

                if(el.id == "delete")
                {
                    $('#delete-modal-title').html('Warning!');
                    $('#delete-modal-body').html('Are you sure you want to delete this content?.');
                    $('#delete-modal').modal('show');
                }
                else if(el.id == 'step-in')
                {
                    window.location.href = '/content/?id='+contentinfo;
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

    var $form_modal = $('.cd-user-modal'),
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
        $form_create.addClass('is-selected');
    }


    $('#cd-create').ajaxForm({
        type: 'POST',
        data: {lesson: lesson._id},
        url: '/create-content',
        beforeSubmit: function() {
            if((document.getElementById("date-end").value != '') && (document.getElementById("date-start").value >= document.getElementById("date-end").value))
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
                $('#alert-modal-body').html('The content has been created. <br>Refreshing the page.');
                $('#alert-modal').modal('show');
                setTimeout(function(){window.location.reload();}, 3000);
            }
        },
        error: function (e) {
            $('#alert-modal-title').html('Creation Failure!');
            $('#alert-modal-body').html('There is a question with no correct answer.');
            $('#alert-modal').modal('show');
        }
    });

    $('#delete-access').click(function(){
        $('#delete-modal').modal('hide');
        $.ajax({
            url: '/delete-content',
            data: contentinfo,
            type: 'POST',
            success: function(data){
                $('#alert-modal-title').html('Delete Successful!');
                $('#alert-modal-body').html('This content has been deleted.<br>Refreshing the page.');
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


document.getElementById("create-type").addEventListener("change", function(){
    if(document.getElementById("create-type").value == "Homework" || document.getElementById("create-type").value == "Quiz")
    {
        document.getElementById("add-que").style.display = "contents";
        document.getElementById("date-end").style.display = "block";
    }
    else
    {
        document.getElementById("add-que").style.display = "none";
        document.getElementById("date-end").style.display = "none";
    }
});

function addQue(){
    var newdiv = document.createElement('div');
    newdiv.id = "q"+Elecounter;
    newdiv.innerHTML = `<div class="form-group">
                            <input class="form-control" id=${Elecounter} name="questions[${"q"+Elecounter}][]" placeholder=" " type="text" required="" style="box-shadow: none;border-radius:0px;">
                            <label class="input-form" for=${Elecounter}>New Question</label>
                            <div class="que-icons"><i class="fa fa-plus-square" style="margin-right: 5px;" onclick="addAns(this)"></i><i class="fa fa-minus-square" onclick="removeEl(this)"></i></div>
                            </div>`;
    document.getElementById('questions').appendChild(newdiv);
    Elecounter++;
}

function addAns(element){
    console.log(element.parentNode.parentNode.parentNode.id);
    var newdiv = document.createElement('div');
    newdiv.id = "a"+Anscounter;
    newdiv.innerHTML = `<div class="form-group" style="width: 85%">
                            <input class="form-control" id=${"af"+Anscounter} name="questions[${element.parentNode.parentNode.parentNode.id}][]" placeholder=" " type="text" required="" style="box-shadow: none;border-radius:0px;">
                            <label class="input-form" for=${"af"+Anscounter}>New Answer</label>
                            <div class="que-icons"><i class="fa fa-minus-square" onclick="removeEl(this)"></i>
                            <input type="checkbox" name="questions[${element.parentNode.parentNode.parentNode.id}][]" style="float: right" />
                            </div>
                            </div>`;
    element.parentNode.parentNode.parentNode.appendChild(newdiv);
    Anscounter++;
}

function removeEl(element){
    element.parentNode.parentNode.parentNode.remove();
}


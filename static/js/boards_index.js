var app = function() {

    var self = {};

    Vue.config.silent = false; // show all warnings

    // Extends an array
    self.extend = function(a, b) {
        for (var i = 0; i < b.length; i++) {
            a.push(b[i]);
        }
    };
    
    // Enumerates an array.
    var enumerate = function(v) { var k=0; return v.map(function(e) {e._idx = k++;});};
    
// Copped from decks_index.js
// Really should be modularized

/*
------------------------------------------------------------------------------------
deck function
------------------------------------------------------------------------------------
*/

    /*get all decks belonging to the signed in user*/
    self.get_decks = function(){
        $.get(get_decks_url,
            function(decks){
                //initialize all deck uploading status
                for(var i=0; i<decks.length; i++){
                    decks[i].is_uploading = false;
                    decks[i].editing_deck = false;
                }
                enumerate(decks);
                self.vue.curr_decks = decks;
            }
        )
    }

/*
------------------------------------------------------------------------------------
card functions
------------------------------------------------------------------------------------
*/

    //show cards belonging to the given deck
    self.get_cards = function(){
        $.get(show_cards_url,
            function (data) {
                enumerate(data);
                self.vue.curr_cards = data;
                self.vue.delete_cart = [];
                self.vue.caption_cart = [];
            })
    }

/*
------------------------------------------------------------------------------------
    Board functions
------------------------------------------------------------------------------------
*/

    /*get all boards belonging to the signed in user*/
    self.get_boards = function(){
        $.get(get_boards_url,
            function(data){
                //initialize all deck uploading status
                enumerate(data);
                self.vue.curr_boards = data;
                self.board_open(0);
            }
        )
    }

    /*change view when user clicks create board button */
    self.board_create = function(){
        self.vue.adding_board = true;
    }

    /*Go back to default view and reset form board name */
    self.board_create_cancel = function(){
        self.vue.form_board_name = null;
        self.vue.adding_board = false;
    }

    /*if user confirms creation of a new board, add it to db and vue object */
    self.board_create_confirm = function(){
        $.post(add_board_url,
            {
                board_name: self.vue.form_board_name
            },
            function (data) {
                self.vue.curr_boards.push(data);
                enumerate(self.vue.curr_boards);
                
                self.vue.form_board_name = null;
                self.vue.adding_board = false;
                console.log(self.vue.curr_boards);
            });
    }

    /*Open the current board */
    self.board_open = function(idx){
        var board_id = self.vue.curr_boards[idx].id;
        var board_name = self.vue.curr_boards[idx].board_name;
        self.vue.open_board_id = board_id;
        self.vue.open_board_name = board_name;
        var svg = document.getElementById("board");
        svg.innerHTML = "";
        $.post(get_board_content_url,
            {
                board_id: board_id
            },
            function (data) {
                //console.log(board_id, " open and uploaded ", data);
                svg.innerHTML = data; 
            });
    }

    self.board_delete = function(idx){
        var board_id = self.vue.curr_boards[idx].id;
        var question = "Warning: this board will be permanantly deleted. Do you wish to proceed?";
        var continue_del = confirm(question);
        if(continue_del){
            $.post(delete_board_url,
                {
                    board_id: board_id
                },
                function (data) {
                    self.vue.curr_boards.splice(idx, 1);
                });
        }
    }

    self.save_board = function() {
        var board_state = document.getElementById("board").innerHTML;
        $.post(save_board_url,
            {
                board_state: board_state,
                board_id: self.vue.open_board_id
            },
            function (data) {
                console.log("Saved board!");
            });
    }
/*
------------------------------------------------------------------------------------
    Vue components
------------------------------------------------------------------------------------
*/
  

    //redraw the card onto the svg canvas
    svg_draw = function(card, xPos, yPos){
        var WIDTH = 150;
        var HEIGHT = 140;
        
        //svg uses its local position. Note that svg builds from topleft, so higher y goes downward
        var offset = $("#board").offset();
        var xOffset = xPos - offset.left - (WIDTH / 2);
        var yOffset = yPos - offset.top - (HEIGHT / 2);
        
        var g = d3.select("svg").append("g").attr("width", WIDTH);

        //draw the card image near site of drop
        g.append("svg:image")
        .attr("x", xOffset)
        .attr("y", yOffset)
        .attr("width", WIDTH)
        //.attr("height", HEIGHT)
        .attr("xlink:href", card.card_image_url);

        //uncommenting the below adds text without line breaks,
        //but it also does not follow the image when dragged...
        
        // var text = g.append("text")
        // .text(card.caption)
        // .attr("x", xOffset)
        // .attr("y", yOffset + 50);
        //.style("width", 90);
        
        //save the board after the user makes a change
        self.save_board();

        //bug text does not have line breaks..
    }

    // Using components to get JQuery binding properly
    // See https://vuejsdevelopers.com/2017/05/20/vue-js-safely-jquery-plugin/
    Vue.component('idea-card', {
        props: ['image'],
        template: '<p class="idea-card">\
                    <img v-bind:src="image.card_image_url"/>\
                    <!--Display text within image-->\
                    <span class="padded">{{image.caption}}</span>\
                  </p>',
        mounted: function() {
            // http://api.jqueryui.com/draggable/
            // Keep a copy of scope so we can access it within the JQuery functions
            let self = this;
            
            $(this.$el).draggable({
                stop: function(event, ui) {
                    //Draw the image onto the svg canvas
                    console.log(event);
                    svg_draw(self.image, event.pageX, event.pageY);
                    // Need to force this because it gets confused by
                    // the CSS switch to absolute positioning
                    $(event.target).css('top', 0).css('left', 0);
                },
                revert: true,
                revertDuration: false
            });
        }
    });

/*
------------------------------------------------------------------------------------
Our Vue Object
------------------------------------------------------------------------------------
*/
    self.vue = new Vue({
        el: "#vue-div",
        delimiters: ['${', '}'],
        unsafeDelimiters: ['!{', '}'],
        data: {
            curr_decks: [],         //storeall decks of signed in user
            curr_cards: [],          //store all cards of signed in user
            curr_boards: [],         //store all boards of signed in user
            adding_board: false,     //determine if we are creating a new board
            form_board_name: null,   //store the new board name
            open_board_id: null,     //keep track of what board we have open
            open_board_name: null
        },
        methods: {
            //deck functions
            get_decks: self.get_decks,

            //card functions
            get_cards: self.get_cards,

            //board functions
            get_boards: self.get_boards,
            board_create: self.board_create,
            board_create_cancel: self.board_create_cancel,
            board_create_confirm: self.board_create_confirm,
            board_open: self.board_open,
            board_delete: self.board_delete,
            save_board: self.save_board
        },
    });

/*
------------------------------------------------------------------------------------
initialize values like login status, decks, and cards when user
first signs in
------------------------------------------------------------------------------------
*/
    var initialize = function(){
        $.get(login_status_url,
            function (user) {
                //get login status
                self.vue.logged_in = (user != null);
                //if user is logged in, fetch user decks and cards
                if(self.vue.logged_in){
                    self.get_decks();
                    self.get_cards();
                    self.get_boards();
                }
            });
    }();
    
    $("#vue-div").show();

    return self;
};

var APP = null;


/*
-------------------------------------------------------------------------------
Handle drag and drop within the SVG Canvas
Code taken from
http://www.petercollingridge.co.uk/tutorials/svg/interactive/dragging/
-------------------------------------------------------------------------------
*/

var selectedElement, offset, transform;
selectedElement = false;

//handle dragging within the svg canvas
function makeDraggable(evt) {
    var svg = evt.target;
    svg.addEventListener('mousedown', startDrag);
    svg.addEventListener('mousemove', drag);
    svg.addEventListener('mouseup', endDrag);
    
    //when the drag starts
    function startDrag(evt) {
            selectedElement = evt.target;
            offset = getMousePosition(evt);
            // Get all the transforms currently on this element
            var transforms = selectedElement.transform.baseVal;
            // Ensure the first transform is a translate transform
            if (transforms.length === 0 || transforms.getItem(0).type !== SVGTransform.SVG_TRANSFORM_TRANSLATE) {
              // Create an transform that translates by (0, 0)
              var translate = svg.createSVGTransform();
              translate.setTranslate(0, 0);
              // Add the translation to the front of the transforms list
              selectedElement.transform.baseVal.insertItemBefore(translate, 0);
            }
            // Get initial translation amount
            transform = transforms.getItem(0);
            offset.x -= transform.matrix.e;
            offset.y -= transform.matrix.f;
          
    }

    //get position of the mouse in the browser
    function getMousePosition(evt) {
        var CTM = svg.getScreenCTM();
        return {
          x: (evt.clientX - CTM.e) / CTM.a,
          y: (evt.clientY - CTM.f) / CTM.d
        };
      }

    //handle positioning of the svg element during the drag
    function drag(evt) {
        if (selectedElement) {
            evt.preventDefault();
            var coord = getMousePosition(evt);
            selectedElement.setAttributeNS(null, "x", coord.x);
            selectedElement.setAttributeNS(null, "y", coord.y);
          }
    }

    //at the end of the drag, save changes and unselect dragged element
    function endDrag(evt) {
        APP.save_board();
        selectedElement = null;
    }
  }


// This will make everything accessible from the js console;
// for instance, self.x above would be accessible as APP.x
jQuery(function(){APP = app();});

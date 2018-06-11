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
/*
------------------------------------------------------------------------------------
    Vue components
------------------------------------------------------------------------------------
*/
    
    // Using components to get JQuery working
    // See https://vuejsdevelopers.com/2017/05/20/vue-js-safely-jquery-plugin/
    Vue.component('idea-card', {
        props: ['image_url', 'image_caption'],
        template: '<p class="idea-card lifted">\
                    <img v-bind:src="image_url"/>\
                    <!--Display text within image-->\
                    <span class="padded">{{image_caption}}</span>\
                  </p>',
        mounted: function() {
            $(this.$el).draggable();
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
            board_delete: self.board_delete
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

// This will make everything accessible from the js console;
// for instance, self.x above would be accessible as APP.x
jQuery(function(){APP = app();});

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

    self.open_uploader = function () {
        $("div#uploader_div").show();
        self.vue.is_uploading = true;
    };

    self.close_uploader = function () {
        $("div#uploader_div").hide();
        self.vue.is_uploading = false;
        $("input#file_input").val(""); // This clears the file choice once uploaded.

    };

    self.upload_file = function (event) {
        // Reads the file.
        var input = event.target;
        var file = input.files[0];
        if (file) {
            // First, gets an upload URL.
            console.log("Trying to get the upload url");
            $.getJSON('https://upload-dot-luca-teaching.appspot.com/start/uploader/get_upload_url',
                function (data) {
                    // We now have upload (and download) URLs.
                    var put_url = data['signed_url'];
                    var get_url = data['access_url'];
                    console.log("Received upload url: " + put_url);
                    // Uploads the file, using the low-level interface.
                    var req = new XMLHttpRequest();
                    req.addEventListener("load", self.upload_complete(get_url));
                    // TODO: if you like, add a listener for "error" to detect failure.
                    req.open("PUT", put_url, true);
                    req.send(file);
                });
        }
    };

    self.upload_complete = function(get_url) {
        // Hides the uploader div.
        self.close_uploader();
        console.log('The file was uploaded; it is now available at ' + get_url);
        // The file is uploaded.  Now you have to insert the get_url into the database, etc.
        $.post(add_card_url,
            {
                image_url: get_url
            },
            //execute the below code after a brief delay to allow image upload to finish
            setTimeout(function (uploaded_url) {
                
                self.vue.curr_images.push(get_url);
                enumerate(self.vue.curr_images);
                console.log(self.vue.curr_images);
            }, 1200))
    };

    //changes our vue boolean to true to allow user to create new deck
    self.add_new_deck = function(){
        self.vue.adding_deck = true;
    }

    //canceling creating new deck
    self.cancel_new_deck = function(){
        self.vue.form_deck_name = null;
        self.vue.adding_deck = false;
    }

    //finalize creation of new deck
    self.submit_new_deck = function(){
        $.post(add_deck_url,
            {
                deck_name: self.vue.form_deck_name
            },
            function (data) {
                self.vue.curr_decks.push(data);
            });

        //upon completion, set view back to normal
        self.vue.form_deck_name = null;
        self.vue.adding_deck = false;
    }

    //show cards belonging to the given deck
    self.get_cards = function(deckid){
        $.post(show_cards_url,
            {
                deckid: deckid
            },
            function (cards) {
                self.vue.curr_cards = cards;
                self.vue.show_decks = false;
            })
    }

    self.get_decks = function(){
        $.get(get_decks_url,
            function(decks){
                self.vue.curr_decks = decks;
            }
        )
    }

    //DEBUG FUNCTION
    self.delete_my_decks = function(){
        $.get(delete_my_decks_url,
            function(){
                self.vue.curr_decks = [];
            }
        )
    }


    //our vue object
    self.vue = new Vue({
        el: "#vue-div",
        delimiters: ['${', '}'],
        unsafeDelimiters: ['!{', '}'],
        data: {
            adding_deck: false,
            form_deck_name: null,
            show_decks: true,
            is_uploading: false,
            curr_decks: [],
            curr_cards: [],
            curr_user: null
        },
        methods: {
            open_uploader: self.open_uploader,
            close_uploader: self.close_uploader,
            upload_file: self.upload_file,
            add_new_deck: self.add_new_deck,
            cancel_new_deck: self.cancel_new_deck,
            submit_new_deck: self.submit_new_deck,
            get_decks: self.get_decks,
            get_cards: self.get_cards,
            //debug functions
            delete_my_decks: self.delete_my_decks
        }

    });

    //initialize values like login status and other user names
    var initialize = function(){
        $.get(login_status_url,
            function (user) {
                //get login status
                self.vue.logged_in = (user != null);
                //if user is logged in, get other users and store current user
                if(self.vue.logged_in){
                    self.get_decks();
                    self.vue.curr_user = user;
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

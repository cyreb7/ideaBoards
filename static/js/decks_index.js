var app = function() {

    var self = {};
    
    Vue.config.silent = false; // show all warnings
    
    // Stores any currently uploading images
    self.upload_image = {};

    // Extends an array
    self.extend = function(a, b) {
        for (var i = 0; i < b.length; i++) {
            a.push(b[i]);
        }
    };

    // Enumerates an array.
    var enumerate = function(v) { var k=0; return v.map(function(e) {e._idx = k++;});};

    /* Open up the uploader for a specific deck. If there is another uploader open,
       close it to avoid confusion. */
    self.open_uploader = function (idx) {
        //clear file and caption inputs if any
        $("input#file_input").val("");
        $("input#caption_input").val("");
        //close open uploader if any
        if(self.vue.prev_deck_uploading != null){
            self.vue.curr_decks[self.vue.prev_deck_uploading].is_uploading = false;
        }
        //set current deck as uploading
        var deckid = self.vue.curr_decks[idx].id;
        self.vue.curr_decks[idx].is_uploading = true;
        self.vue.prev_deck_uploading = idx;
        //used to figure out what deck to associate our card-to-be to
        self.vue.open_deck_id = deckid;
    };

    /*close the uploader. Since the uploader must also be closed upon
      completion of uploading a file, an argument of -1 is used if we
      dont know the deckid to simply close all uploading decks */
    self.close_uploader = function (idx) {
        if(idx == -1 && self.vue.prev_deck_uploading != null){
            self.vue.curr_decks[self.vue.prev_deck_uploading].is_uploading = false;
        }
        else{
            var deckid = self.vue.curr_decks[idx];
            self.vue.curr_decks[idx].is_uploading = false;
        }
        //clear the file and caption inputs
        $("input#file_input").val("");
        $("input#caption_input").val("");

    };

    /*Uploads the file to a storage site. Upon completion, call upload_complete */
    self.upload_file = function (event) {
        // Reads the file.
        var input = $("input#file_input")[0];
        var file = input.files[0];
        var caption = $("input#caption_input").val();
        var reader  = new FileReader();

        // Save data-URL for later
        reader.addEventListener("load", function () {
            self.upload_image.data_url = reader.result;
        }, false);
        
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
                    req.addEventListener("load", self.upload_complete(get_url, caption));
                    // TODO: if you like, add a listener for "error" to detect failure.
                    req.open("PUT", put_url, true);
                    req.send(file);
                });
            
            // Start reading file into data-URL
            reader.readAsDataURL(file);
        }
    };

    /*Given the url where the image of the card is hosted, add our card to the database and
      then update our current Vue object*/
    self.upload_complete = function(get_url, caption) {
        // Hides the uploader div.
        self.close_uploader(-1);
        console.log('The file was uploaded; it is now available at ' + get_url);
        // Insert the card into the database
        $.post(add_card_url,
        {
            deck_id: self.vue.open_deck_id,
            image_url: get_url,
            caption: caption
        },
            function(data){
                        //execute the below code after a brief delay to allow image upload to finish
                card = {}
                card.card_id = data.id;
                card.deck_id = data.deck_id;
                card.is_uploading = false;
                card.caption = caption;

                // Find best way to display image
                // Fall back to using image URL if the data-URL is not done in time
                if (self.upload_image.data_url == null) {
                    self.upload_image.data_url = get_url;
                    console.log("Data-URL not available in time, falling back to upload URL");
                }
                card.card_image_url = self.upload_image.data_url;
                self.vue.curr_cards.push(card);
                enumerate(self.vue.curr_cards);
                console.log(card);
                
                // Cleanup
                self.upload_image.data_url = null;
           }
        )
    };

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

    //changes our vue boolean to true to allow user to create new deck
    self.add_new_deck = function(){
        self.vue.form_deck_name = null;
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
                var deck = data;
                deck.editing_deck = false;
                deck.is_uploading = false;
                self.vue.curr_decks.push(deck);
                enumerate(self.vue.curr_decks);
                
                self.vue.form_deck_name = null;
                self.vue.adding_deck = false;
            });

    }

    /*Start editing a deck */
    self.edit_deck = function(idx){
        if(self.vue.prev_deck_editing != null){
            self.vue.curr_decks[self.vue.prev_deck_editing].editing_deck = false;
        }
        self.vue.curr_decks[idx].editing_deck = true;
        self.vue.prev_deck_editing = idx;
        self.vue.form_deck_name = self.vue.curr_decks[idx].deck_name;

    }

    /*Cancel edits. Note that at the moment, card deletes are still PERMANANT */
    self.cancel_deck_edit = function(idx){
        self.vue.curr_decks[idx].editing_deck = false;
        self.vue.prev_deck_editing = null;
    }

    /*Submit the edit, and change the deck name to what is specified */
    self.submit_deck_edit = function(idx){
        var deckid = self.vue.curr_decks[idx].id;
        var new_deck_name = self.vue.form_deck_name;
        $.post(edit_deck_url,
            {
                deck_id: deckid,
                deck_name: new_deck_name
            },
            function (data) {
                self.vue.curr_decks[idx].deck_name = data;
                self.vue.curr_decks[idx].editing_deck = false;
                self.vue.prev_deck_editing = null;
            });
    }

    /*delete a deck and all cards associated with it */
    self.delete_deck = function(idx){
        var question = "Warning: this will delete all cards associated with this deck. Do you wish to proceed?";
        var continue_del = confirm(question);
        if(continue_del){
            var deckid = self.vue.curr_decks[idx].id;
            $.post(delete_deck_url,
                {
                    deck_id: deckid
                },
                function (data) {
                    self.get_decks();
                    self.get_cards();
                });
        }
    }

    /*delete the card with the following cardid */
    self.delete_card = function(cardid){
        $.post(del_card_url,
            {
                card_id: cardid
            },
            function (data) {
                self.get_cards();
            })
    }

    //show cards belonging to the given deck
    self.get_cards = function(){
        $.get(show_cards_url,
            function (data) {
                self.vue.curr_cards = data;
            })
    }

    //determine if a card has a caption
    self.is_caption = function(is_caption){
        if(is_caption == null || is_caption == "") return false;
        return true;
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
            adding_deck: false,     //determine if we are creating a new deck
            form_deck_name: null,   //store the new deck name   
            open_deck_id: null,     //store deckid of card we are uploading
            curr_decks: [],         //storeall decks of signed in user
            curr_cards: [],          //store all cards of signed in user
            prev_deck_uploading: null,
            prev_deck_editing: null
        },
        methods: {
            //functions related to image upload
            open_uploader: self.open_uploader,
            close_uploader: self.close_uploader,
            upload_file: self.upload_file,

            //deck functions
            add_new_deck: self.add_new_deck,
            cancel_new_deck: self.cancel_new_deck,
            submit_new_deck: self.submit_new_deck,
            edit_deck: self.edit_deck,
            get_decks: self.get_decks,
            cancel_deck_edit: self.cancel_deck_edit,
            submit_deck_edit: self.submit_deck_edit,
            delete_deck: self.delete_deck,

            //card functions
            get_cards: self.get_cards,
            add_new_card: self.add_new_card,
            delete_card: self.delete_card,

            //debug functions
            delete_my_decks: self.delete_my_decks
        }

    });

    /*initialize values like login status, decks, and cards when user
      first signs in*/
    var initialize = function(){
        $.get(login_status_url,
            function (user) {
                //get login status
                self.vue.logged_in = (user != null);
                //if user is logged in, fetch user decks and cards
                if(self.vue.logged_in){
                    self.get_decks();
                    self.get_cards();
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


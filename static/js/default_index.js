// This is the js for the default/index.html view.


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
        $.post(add_image_url,
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

    //show images belonging to signed in user
    self.show_images = function(){
        $.get(show_images_url,
            function (images) {
                self.vue.curr_images = images;
                self.vue.self_page = true;
            });
    }

    //show images belonging to a different user
    self.other_user_images = function(uid){
        $.post(show_diff_images_url,
            {
                uid: uid
            },
            function (diff_images) {
                self.vue.curr_images = diff_images;
                self.vue.self_page = false;
            })
    }

    //our vue object
    self.vue = new Vue({
        el: "#vue-div",
        delimiters: ['${', '}'],
        unsafeDelimiters: ['!{', '}'],
        data: {
            logged_in: false,
            is_uploading: false,
            self_page: true, // Leave it to true, so initially you are looking at your own images.
            curr_images: [],
            user_list: [],
            curr_user: null
        },
        methods: {
            open_uploader: self.open_uploader,
            close_uploader: self.close_uploader,
            upload_file: self.upload_file,
            show_images: self.show_images,
            other_user_images: self.other_user_images
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
                    self.vue.curr_user = user;
                    $.getJSON(get_users_url,
                        function(data){
                            self.vue.user_list = data.other_users;
                        }
                    )
                    //by default, show images of signed in user
                    self.show_images();
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


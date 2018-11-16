$(document).ready(function() {
    // Initialize Firebase
    var config = {
        apiKey: "AIzaSyB9V4DnUbbTpymIwjdYrasEXuFwO6kh94E",
        authDomain: "rh-rps.firebaseapp.com",
        databaseURL: "https://rh-rps.firebaseio.com",
        projectId: "rh-rps",
        storageBucket: "rh-rps.appspot.com",
        messagingSenderId: "11265879013"
    };
    firebase.initializeApp(config);

    // Assign reference to the database.
    var database = firebase.database();

    // Initialize the FirebaseUI Widget using Firebase.
    var ui = new firebaseui.auth.AuthUI(firebase.auth());
    
    // Handles user authentication    
    var uiConfig = {
        callbacks: {
          signInSuccessWithAuthResult: function(authResult, redirectUrl) {
            // User successfully signed in.
            // Return type determines whether we continue the redirect automatically
            // or whether we leave that to developer to handle.

            // Shows the game area.
            $("main").show();

            // Hides the ui.
            $("#firebaseui-auth-container").hide();

            // Opens the modal asking if the player wants to play.
            

            return false;
          },
          uiShown: function() {
            // The widget is rendered.
            // Hide the loader.
            document.getElementById('loader').style.display = 'none';

            // Hides the game area.
            $("main").hide();
          }
        },
        // Will use popup for IDP Providers sign-in flow instead of the default, redirect.
        signInFlow: 'popup',
        // signInSuccessUrl: '<url-to-redirect-to-on-success>',
        signInOptions: [
            // Leave the lines as is for the providers you want to offer your users.
            // firebase.auth.GoogleAuthProvider.PROVIDER_ID,
            // firebase.auth.FacebookAuthProvider.PROVIDER_ID,
            // firebase.auth.TwitterAuthProvider.PROVIDER_ID,
            // firebase.auth.GithubAuthProvider.PROVIDER_ID,
            firebase.auth.EmailAuthProvider.PROVIDER_ID//,
            // firebase.auth.PhoneAuthProvider.PROVIDER_ID
        ]//,
        // Terms of service url.
        // tosUrl: '<your-tos-url>',
        // Privacy policy url.
        // privacyPolicyUrl: '<your-privacy-policy-url>'
    };

    // The start method will wait until the DOM is loaded.
    ui.start('#firebaseui-auth-container', uiConfig);

    // At the initial load and subsequent value changes, keep track of which users are playing.
    database.ref().child("players").on("child_added", function(users) {
        // Display all users on the watch list.
        $(users.val()).each(function(index, value) {
            let username = value.username;

            var user = $("<li>").text(username).addClass("user");

            // If the user is a player, then hide their name from the watch list.
            if(value.player) {
                // Hides the player from the watch list.
                user.addClass("player");

                // If there is room to play, the user can play.
                if($("#player1").attr("data-playing") == "") {
                    $("#player1").text(username).attr("data-playing", username);

                    $("#p1Win").text(value.wins);

                    $("#p1Lose").text(value.losses);
                } else if($("#player2").attr("data-playing") == "") {
                    $("#player2").text(username).attr("data-playing", username);

                    $("#p2Win").text(value.wins);

                    $("#p2Lose").text(value.losses);
                } else {
                    // Any other people who wish to play are added to the Wait List.
                    $("#waitList").append(user);
                }
            }

            // The player is added to the Watch List.
            $(user).attr("id", users.key);

            $("#watchList").append(user);
        });
    });

    // At the initial load and subsequent value changes, get a snapshot of the chat data.
    database.ref().child("chat").on("child_added", function(chats) {
        // For each chat, print out the dialogue
        $(chats.val()).each(function(index, value) {
            var chat = $("<li>").addClass("chat");

            var date = moment(value.time, "YYYY-MM-DD HH:mm").format("MMM Do hh:mm A");

            date = $("<span>").text(date).addClass("chat-date");

            var username = $("<span>").text(value.username).addClass("username");

            if(value.player) {
                username.addClass("player");
            }

            var message = $("<span>").text(value.message);

            chat.append(date, "<br>", username, ": ", message);

            $("#chat").append(chat);
        });
    });
});
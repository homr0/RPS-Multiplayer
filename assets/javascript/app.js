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
            $("#playerWatch").modal("open");

            // Gets the display name
            let name = authResult.user.displayName;
            $("#welcome").text(name);

            return false;
          },
          uiShown: function() {
            // The widget is rendered.
            // Show the authorization popup
            $("#firebaseui-auth-container").show();

            // Hides the game area and loader.
            $("main, #loader").hide();
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
            firebase.auth.EmailAuthProvider.PROVIDER_ID
        ]//,
        // Terms of service url.
        // tosUrl: '<your-tos-url>',
        // Privacy policy url.
        // privacyPolicyUrl: '<your-privacy-policy-url>'
    };

    // The start method will wait until the DOM is loaded.
    ui.start('#firebaseui-auth-container', uiConfig);

    // Database references
    var chatRef = database.ref().child("chat");
    var playerRef = database.ref().child("players");

    // Default information for user.
    var uname = "demo";
    var uid = "test";
    var playing = false;

    // Function for pushing a chat
    function chat(playing, user, uid, message) {
        chatRef.push({
            player: playing,
            username: user,
            uid: uid,
            message: message,
            time: moment().format("YYYY-MM-DD HH:mm")
        });
    }

    // Pushes a Game Master chat.
    function chatGM(message) {
        chat(false, "RPS Game Master", "autoGM", message);
    }

    // Watches for user status
    firebase.auth().onAuthStateChanged(function(user) {
        if(user) {
            // User is signed in.
            uname = user.displayName;
            uid = user.uid;

            // Check if the user ID is in the user database.
            playerRef.once("value").then(function(player) {
                if(player.child(uid).exists()) {
                    // The player is logged in.
                    playerRef.child(uid).update({
                        loggedIn: true,
                        lastLogin: moment().format("YYYY-MM-DD HH:mm"),
                        player: false
                    });
                } else {
                    // The player is added to the user database
                    playerRef.child(uid).set({
                        loggedIn: true,
                        lastLogin: moment().format("YYYY-MM-DD HH:mm"),
                        player: false,
                        username: uname,
                        wins: 0,
                        losses: 0
                    });
                }
            });
        } else {
            // User is signed out.
            playerRef.once("value").then(function(player) {
                playerRef.child(uid).update({
                    loggedIn: false,
                    player: false
                });
            });

            uname = "demo";
            uid = "test";
        }
    });

    // At the initial load and subsequent value changes, keep track of which users are playing.
    playerRef.on("child_added", function(users) {
        // Display all users on the watch list.
        $(users.val()).each(function(index, value) {
            let uid = users.key;
            let username = value.username;

            var user = $("<li>").text(username).addClass("user");

            // If the user is a player, then hide their name from the watch list.
            if(value.player) {
                // Hides the player from the watch list.
                user.addClass("player");

                // If there is room to play, the user can play.
                if($("#player1").attr("data-playing") == "") {
                    $("#player1").text(username).attr("data-playing", uid);

                    $("#p1Win").text(value.wins);

                    $("#p1Lose").text(value.losses);
                } else if($("#player2").attr("data-playing") == "") {
                    $("#player2").text(username).attr("data-playing", uid);

                    $("#p2Win").text(value.wins);

                    $("#p2Lose").text(value.losses);
                } else {
                    // Any other people who wish to play are added to the Wait List.
                    $("#waitList").append(user);
                }
            }

            // The player is added to the Watch List.
            $(user).attr("id", uid);

            $("#watchList").append(user);
        });
    });

    // At the initial load and subsequent value changes, get a snapshot of the chat data.
    chatRef.on("child_added", function(chats) {
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
    
    // When rock, paper, or scissors is clicked, the player is checked and then the two plays are compared.
    $("[name=rps]").on("click", function(e) {
        e.preventDefault();

        var play1 = "";
        var play2 = "";

        database.ref("game").once("value").then(function(play) {
            play1 = play.child("player1").val();
            play2 = play.child("player2").val();
        });

        // Makes sure that there are two players playing
        if(($("#player1").attr("data-playing") !== "") && ($("#player2").attr("data-playing") !== "")) {
            // Checks if the current user is player 1 or player 2 and then updates the game.
            if($("#player1").attr("data-playing") == uid) {
                database.ref("game").update({
                    player1: $(this).val()
                });

                play1 = $(this).val();
            } else if($("#player2").attr("data-playing") == uid) {
                database.ref("game").update({
                    player2: $(this).val()
                });

                play2 = $(this).val();
            }

            // Announces in the chat that the player has decided.
            chatGM(uname + " has decided....");

            // Checks if the game can be completed.
            if((play1 !== "") && (play2 !== "")) {
                let player1 = $("#player1").text();
                let player2 = $("#player2").text();
                let pid1 = $("#player1").attr("data-playing");
                let pid2 = $("#player2").attr("data-playing");

                chatGM(player1 + " has rolled " + play1 + ".\n" + player2 + " has rolled " + play2 + ".");

                // If both plays are the same, then it's a tie and scores are not updated.
                if(play1 == play2) {
                    chatGM(player1 + " and " + player2 + " have tied!");
                } else {
                    let winsP1 = parseInt($("#p1Win").text());
                    let losesP1 = parseInt($("#p1Lose").text());
                    let winsP2 = parseInt($("#p2Win").text());
                    let losesP2 = parseInt($("#p2Lose").text());

                    // Sets up the score for winning
                    var rpsWin = {
                        "rock": 0,
                        "paper": 1,
                        "scissors": 2
                    }

                    // Translates the play into a number
                    play1 = rpsWin[play1];
                    play2 = rpsWin[play2];

                    // Finds winning scenario for Player 1.
                    let win = play1 - play2;
                    if((win == 1) || (win == -2)) {
                        chatGM(player1 + " has won!\n" + player2 + " has lost!");

                        winsP1++;
                        losesP2++;

                        database.ref("players/" + pid1).update({
                            wins: winsP1
                        });

                        $("#p1Win").text(winsP1);

                        database.ref("players/" + pid2).update({
                            losses: losesP2 + 1
                        });

                        $("#p2Lose").text(losesP2);
                    } else {
                        // Player 2 wins
                        chatGM(player2 + " has won!\n" + player1 + " has lost!");

                        winsP2++;
                        losesP1++;

                        database.ref("players/" + pid2).update({
                            wins: winsP2
                        });

                        $("#p2Win").text(winsP2);

                        database.ref("players/" + pid1).update({
                            losses: losesP1
                        });

                        $("#p1Lose").text(losesP1);
                    }
                }
            }
        }

        console.log("Player 1: " + play1 + "\nPlayer 2: " + play2);
    });

    // Lets a watcher enter the game as a player.
    $(".gameJoin").on("click", function(e) {
        e.preventDefault();
        console.log("Adding a player to the game", uid);
        $("#" + uid).addClass("player");

        // Checks if there is a vacant player spot.
        let playing1 = $("#player1").attr("data-playing");
        let playing2 = $("#player2").attr("data-playing");

        if(playing1 == "") {
            $("#player1").text(uname).attr("data-playing", uid);

            database.ref("players/" + uid).once("value").then(function(player) {
                $("#p1Win").text(player.val().wins);
                $("#p1Lose").text(player.val().losses);
            });
        } else if((playing2 == "") && (playing1 !== uid)) {
            $("#player2").text(uname).attr("data-playing", uid);

            database.ref("players/" + uid).once("value").then(function(player) {
                $("#p2Win").text(player.val().wins);
                $("#p2Lose").text(player.val().losses);
            });
        } else if((playing1 !== uid) && (playing2 !== uid)) {
            // Player is added to the Wait List
            var waiting = $("<li>").text(uname).attr("data-waiting", uid);

            $("#waitList").append(waiting);
        }

        // Button is disabled until the user becomes a watcher
        $(".gameJoin").addClass("disabled");
    });

    // Logs out of the game
    $(".gameLeave").on("click", function(e) {
        e.preventDefault();

        // Logs the user out
        firebase.auth().signOut().then(function() {
            // Sign-out successful.
            // Show the sign-in again.
            ui.start('#firebaseui-auth-container', uiConfig);
        }).catch(function(error) {
            // An error happened.
            console.log(error);
        });
    });

    // Submits a dialog to the chat.
    $("#chat-submit").on("click", function(e) {
        e.preventDefault();
        let message = $("#chat-text").val().trim();

        // Checks if the current user is a player.
        if(($("#player1").attr("data-playing") == uid) || ($("#player2").attr("data-playing") == uid)) {
            playing = true;
        }

        // Adds the message to the chat
        chat(playing, uname, uid, message);

        // Clears the chat
        $("#chat-text").val("");
    });

    // Initializes modals.
    $(".modal").modal({
        dismissible: false
    });

    // Initializes side navs.
    $('.sidenav').sidenav({
        edge: 'right'
    });

    // Initializes tooltips.
    $('.tooltipped').tooltip();
});
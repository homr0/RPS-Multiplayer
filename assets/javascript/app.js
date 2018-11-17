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
            $("main, #loader, #gameControl").hide();
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

    // The wait list
    var waitingList = [];

    // Sets up the score for winning
    var rpsWin = {
        "rock": 0,
        "paper": 1,
        "scissors": 2
    }

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

    // Clears the gameplay.
    function finishGame() {
        // Clears the game selections upon completion.
        database.ref("game").update({
            player1: "",
            player2: ""
        });
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
                    database.ref("players/" + uid).update({
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
    database.ref("players").on("child_added", function(users) {
        // Display all users on the watch list.
        $(users.val()).each(function(index, value) {
            let uid = users.key;
            let username = value.username;;

            if(value.loggedIn) {
                var user = $("<li>").text(username).addClass("user");

                // The player is added to the Watch List.
                $(user).attr("id", uid);
    
                $("#watchList").append(user);
            }
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

            var message = $("<span>").html(value.message);

            chat.append(date, "<br>", username, ": ", message);

            $("#chat").append(chat);
        });
    });

    // Sets up the waiting list
    database.ref().once("value").then(function(snapshot) {
        if(snapshot.child("waiting").exists()) {
            waitingList = JSON.parse(snapshot.child("waiting").val());
        }
    });

    // Watches for when a player joins
    playerRef.on("child_changed", function(users) {
        $(users.val()).each(function(index, value) {
            let userKey = users.key;

            // If the user is waiting to play, then see if they're on the list.
            if(value.player) {
                $("#" + userKey).addClass("player");

                // If the user is not on the waiting list, then add them.
                if(waitingList.indexOf(userKey) < 0) {
                    waitingList.push(userKey);
                }
            } else {
                $("#" + userKey).removeClass("player");

                // Check if the player is on the list and remove them.
                let waitingPos = waitingList.indexOf(userKey);
                if(waitingPos >= 0) {
                    waitingList.splice(waitingPos, 1);
                }
            }

            // If the user is not on the list, then remove them.
            if(!value.loggedIn) {
                $("#" + userKey).remove();
            } else if(value.loggedIn && ($("#" + userKey).length == 0)) {
                // Adds a newly logged in user to the list.
                let newUser = $("<li>").text(value.username).addClass("user").attr("id", userKey);

                $("#watchList").append(newUser);
            }
        });

        // Updates the waiting list in the database.
        database.ref("waiting").set(JSON.stringify(waitingList));

        // Goes through the waiting list to set the players
        if(waitingList.length > 1) {
            let idP1 = waitingList[0];
            let idP2 = waitingList[1];

            // Gets Player 1.
            database.ref("players/" + idP1).once("value").then(function(player) {
                let play = player.val();
                
                $("#player1").text(play.username).attr("data-playing", idP1);

                $("#p1Win").text(play.wins);
                $("#p1Lose").text(play.losses);
            });

            // Gets Player 2.
            database.ref("players/" + idP2).once("value").then(function(player) {
                let play = player.val();

                $("#player2").text(play.username).attr("data-playing", idP2);

                $("#p2Win").text(play.wins);
                $("#p2Lose").text(play.losses);
            });

            // Creates the waiting list.
            for(let i = 2; i < waitingList.length; i++) {
                var waiting = $("<li>").text($("#" + waitingList[i]).val());

                $("#waitList").append(waiting);
            }

            // Shows the game controls for the players
            if((uid == idP1) || (uid == idP2)) {
                $("#gameControl").show();
            }
        } else {
            // Clear the player panels.
            $("#player1").text("Player 1");
            $("#player2").text("Player 2");
            $("#player1, #player2").attr("data-playing", "");
            $("#p1Win, #p1Lose, #p2Win, #p2Lose").text("0");
        }
    });

    // Watches for game changes.
    database.ref("game").on("child_changed", function(play) {
        database.ref("game").once("value").then(function(playing) {
            var play1 = playing.val().player1;
            var play2 = playing.val().player2;

            // Makes sure both plays aren't blank.
            if((play1 !== "") && (play2 !== "")) {
                let player1 = $("#player1").text();
                let player2 = $("#player2").text();

                // Chat announces what the plays are.
                chatGM(player1 + " has rolled " + play1 + ".<br>" + player2 + " has rolled " + play2 + ".");

                // Checks the win conditions.
                if(play1 == play2) {
                    // If both plays are the same, then it's a tie.
                    chatGM(player1 + " and " + player2 + " have tied!");
                } else {
                    // Determine who the winner is.
                    let winsP1 = parseInt($("#p1Win").text());
                    let losesP1 = parseInt($("#p1Lose").text());
                    let winsP2 = parseInt($("#p2Win").text());
                    let losesP2 = parseInt($("#p2Lose").text());

                    let pid1 = $("#player1").attr("data-playing");
                    let pid2 = $("#player2").attr("data-playing");

                    // Translates the play into a number
                    play1 = rpsWin[play1];
                    play2 = rpsWin[play2];

                    // Finds winning scenario for Player 1.
                    let win = play1 - play2;
                    if((win == 1) || (win == -2)) {
                        chatGM(player1 + " has won!<br>" + player2 + " has lost!");

                        winsP1++;
                        losesP2++;

                        database.ref("players/" + pid1).update({
                            wins: winsP1
                        });

                        $("#p1Win").text(winsP1);

                        database.ref("players/" + pid2).update({
                            losses: losesP2
                        });

                        $("#p2Lose").text(losesP2);
                    } else {
                        // Player 2 wins
                        chatGM(player2 + " has won!<br>" + player1 + " has lost!");

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

                finishGame();
            }
        });
    });
    
    // When rock, paper, or scissors is clicked, the play is updated in the database.
    $("[name=rps]").on("click", function(e) {
        e.preventDefault();

        // Makes sure that there are two players playing
        if(($("#player1").attr("data-playing") !== "") && ($("#player2").attr("data-playing") !== "")) {
            // Checks if the current user is player 1 or player 2 and then updates the game.
            if($("#player1").attr("data-playing") == uid) {
                database.ref("game").update({
                    player1: $(this).val()
                });
            } else if($("#player2").attr("data-playing") == uid) {
                database.ref("game").update({
                    player2: $(this).val()
                });
            }

            // Announces in the chat that the player has decided.
            chatGM(uname + " has decided....");
        }
    });

    // Lets a watcher enter the game as a player.
    $(".gameJoin").on("click", function(e) {
        e.preventDefault();
        $("#" + uid).addClass("player");

        database.ref("players/" + uid).update({
            player: true
        });

        // Button is disabled until the user becomes a watcher
        $(".gameJoin").addClass("disabled");
    });

    // Logs out of the game
    $(".gameLeave").on("click", function(e) {
        e.preventDefault();

        // Logs the user out
        firebase.auth().signOut().then(function() {
            // Sign-out successful.
            // Updates the user to not be a player.
            database.ref("players/" + uid).update({
                player: false,
                loggedIn: false
            });

            // Removes the player from the Watch List
            $("#" + uid).remove();

            // Show the sign-in again.
            ui.start('#firebaseui-auth-container', uiConfig);
        }).catch(function(error) {
            // An error happened.
            console.log(error);
        });
    });

    // Quit playing and return to watching
    $("#willQuit").on("click", function(e) {
        e.preventDefault();

        database.ref("players/" + uid).update({
            player: false,
        });

        $("#gameControl").hide();
        $(".gameJoin").removeClass("disabled");
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
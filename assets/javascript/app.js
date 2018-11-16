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

    // At the initial load and subsequent value changes, get a snapshot of the chat data.
    database.ref().child("chat").on("child_added", function(chats) {
        // For each chat, print out the dialogue
        $(chats.val()).each(function(index, value) {
            var chat = $("<li>").addClass("chat");

            var date = moment(value.time, "YYYY-MM-DD HH:mm").format("MMM Do hh:mm A");

            date = $("<span>").text(date).addClass("chat-date");

            var username = $("<span>").text(value.username).addClass("username");

            var message = $("<span>").text(value.message);

            chat.append(date, "<br>", username, ": ", message);

            $("#chat").append(chat);
        });
    });
});
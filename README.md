# Multiplayer Rock-Paper-Scissors

Play against another player in rock-paper-scissors. Or just watch two different players play it.

## Instructions

1. Log in with your user name and password.
2. Choose whether you want to be a player or a watcher.
3. Both players and watchers can comment in the chat during the game.

### Watchers

1. Watchers appear on the **Watch List**.
2. Watchers who want to play can move themselves to the **Wait List**.

### Player

1. If there are more than **2** players, then any other users wanting to play are moved to the **Wait List**.
2. Otherwise, the players will appear as **Player 1** and **Player 2**.
3. Each player can choose whether to roll *rock*, *paper*, or *scissors* by clicking the respective buttons for those.
4. Once both players have picked their play, the winner is determined.
5. Players can choose whether to continue or to leave the game after the match is over.

### Chat Etiquette

- Anyone logged in can use the chat.
- Trash talk is allowed.
- There is no moderation for words, so please watch your language.

## Developer Diary

While a single player rock-paper-scissors game is possible when playing against the computer with a random roll of rock, paper, or scissors, implementing two human players would not be possible with just client-side code.

To allow for multiple human players, I utilized Firebase and a login system so that anyone who accesses the site is required to log in. This allows the system to track who is currently playing the game, who is waiting to play, and who is currently watching the game.

Additionally, in addition to player data, the Firebase system also allows me to keep track of whether each player has picked rock, paper, or scissors, as well as allow the chat log to be seen by all logged in users.
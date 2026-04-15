document.addEventListener("DOMContentLoaded", () => {

  const gameId = window.GAME_ID;

  const socket = io();

  socket.on("connect", () => {
    console.log("Connected:", socket.id);
  });

  socket.emit("joinRoom", gameId);

  socket.on("gameStarted", (game_id) => {
    window.location.href = `/gameRulesIntro/${game_id}`;
  });

  let started = false;

  function fetchPlayers() {
    fetch("/api/waiting/" + gameId)
      .then(res => res.json())
      .then(data => {
        if (!data || data.error) return;
        const list = document.getElementById("playerList");
        const count = document.getElementById("playerCount");
        if (!list || !count) return;
        list.innerHTML = "";
        data.players.forEach((p) => {
          const li = document.createElement("li");
          li.innerText = p.player_name || "Unnamed";

          if (window.MY_PLAYER_ID && p.player_id === window.MY_PLAYER_ID) {
            li.innerText += " (You)";
            li.style.color = "#00ffcc";
          }

          if (p.user_id && data.players[0].host_user_id == p.user_id) {
            li.innerText += " 👑";
          }

          list.appendChild(li);
        });

        count.innerText = data.players.length + " / 4 players joined";

        if (data.players.length === 4 && !started) {
          started = true;
          startCountdown();
        }
      })
      .catch(err => console.log("Fetch error:", err));
  }

  function startCountdown() {
    let countdown = 10;
    const text = document.getElementById("countdownText");
    text.innerText = "Game starting in " + countdown + " seconds...";
    const interval = setInterval(() => {
      countdown--;
      text.innerText = "Game starting in " + countdown + " seconds...";
      if (countdown < 0) {
        clearInterval(interval);
        socket.emit("startGame", gameId);
      }
    }, 1000);
  }

  const startBtn = document.getElementById("startGameBtn");
  if (startBtn) {
    startBtn.addEventListener("click", () => {

      const playerCount = document.getElementById("playerList").children.length;
      if (playerCount < 2) {
        alert("Not enough players! Minimum 2 players required.");
        return;
      }
      socket.emit("startGame", gameId);
    });
  }

  fetchPlayers();

  setInterval(fetchPlayers, 2000);

});
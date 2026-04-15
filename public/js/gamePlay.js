document.addEventListener("DOMContentLoaded", () => {
  const dice = document.querySelector('.dice');
  const rollBtn = document.getElementById('rollDiceBtn');
  const scanBtn = document.getElementById("scanBtn");
  const reader = document.getElementById("reader");
  

  let hasRolled = false;
  let canScan = false;
  let html5QrCode;
  let shopShownTurn = 0;

  window.WINNER_SHOWN = false;
  function checkTurn() {
    fetch(`/current-turn/${window.GAME_ID}`)
      .then(res => res.json())
      .then(data => {

        const newTurn = Number(data.current_turn);
        const oldTurn = Number(window.CURRENT_TURN);

        // 🔄 detect turn change
        if (oldTurn !== newTurn) {
          hasRolled = false;

          // reset scanner for next turn
          canScan = false;
          scanBtn.style.display = "none";
        }

        // update turn
        window.CURRENT_TURN = newTurn;

        // update UI text/button
        updateTurnUI();

        // SAFE WINNER CHECK
        if (!window.WINNER_SHOWN) {
          fetch(`/game-winner/${window.GAME_ID}`)
            .then(res => res.json())
            .then(w => {

              if (w.winner_id) {
                window.WINNER_SHOWN = true;

                // delay to avoid UI conflict
                setTimeout(() => {
                  showWinnerPopup(w.winner_id, w.winner_name);
                }, 500);
              }
            })
            .catch(err => console.error("Winner check error:", err));
        }

        if (data.skillUsed === "IMMUNITY") {
          alert("🛡 Immunity activated! No penalty applied in this turn");
        }

        if (data.skillUsed === "VACCINE") {
          alert("💉 Vaccine activated! Infection cured & no life lost");
        }

      })
      .catch(err => console.error("Turn check error:", err));
  }
  checkTurn();
  setInterval(checkTurn, 2000);

  // =========================
  // 🎯 TURN SYSTEM
  // =========================
  function updateTurnUI() {
    const turnText = document.getElementById("turnText");
    const rollBtn = document.getElementById("rollDiceBtn");

    if (Number(window.MY_PLAYER_ID) === Number(window.CURRENT_TURN)) {

      if (hasRolled) {
        //YOU already rolled
        turnText.innerText = "🎲 You rolled! Scan the QR code and answer the question";
        rollBtn.disabled = true;
        rollBtn.style.opacity = "0.5";
      } else {
        // YOUR TURN
        turnText.innerText = "🟢 Your Turn! Roll the dice 🎲";
        rollBtn.disabled = false;
        rollBtn.style.opacity = "1";
      }

    } else {
      // OTHER PLAYER TURN
      turnText.innerText = "⏳ Waiting for other player...";
      rollBtn.disabled = true;
      rollBtn.style.opacity = "0.5";
    }
  }
  updateTurnUI();

  // =========================
  // ❤️ HEART SYSTEM
  // =========================
  function updateHearts(lives) {
    const hearts = document.querySelectorAll(".heart");

    hearts.forEach((heart, index) => {
      heart.classList.toggle("lost", index >= lives);
    });

    if (lives < 3) {
      document.body.classList.add("low-health");
    } else {
      document.body.classList.remove("low-health");
    }
  }

  // =========================
  // 🎲 DICE ANIMATION (FIXED)
  // =========================
  function rollDice(value) {

    // 🔥 RESET animation (important)
    dice.style.animation = "none";
    dice.offsetHeight;

    // 🎬 START ROLL
    dice.style.animation = "rolling 1.2s linear forwards";

    setTimeout(() => {

      let transform = "";

      switch (value) {
        case 1: transform = 'rotateX(0deg) rotateY(0deg)'; break;
        case 2: transform = 'rotateX(-90deg)'; break;
        case 3: transform = 'rotateY(90deg)'; break;
        case 4: transform = 'rotateY(-90deg)'; break;
        case 5: transform = 'rotateX(90deg)'; break;
        case 6: transform = 'rotateX(180deg)'; break;
      }

      dice.style.transform = transform;
      dice.style.animation = "none";

    }, 1200);
  }

  // =========================
  // 🎲 ROLL BUTTON
  // =========================
  
  rollBtn.addEventListener('click', () => {
    if (window.MY_PLAYER_ID != window.CURRENT_TURN) {
      alert("Not your turn!");
      return;
    }

    if (hasRolled) {
      alert("You already rolled!");
      return;
    }

    hasRolled = true;
    rollBtn.disabled = true;
    updateTurnUI(); 

    fetch("/roll-dice", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ game_id: window.GAME_ID })
    })
    .then(res => res.json())
    .then(data => {
      if (data.skillUsed === "SPRINT") {
        alert("⚡ Sprint activated! +2 tiles");
      }

      if (data.isWinner) {
        setTimeout(() => {
          showWinnerPopup(window.MY_PLAYER_ID);
        }, 500);

        return;
      }

      const value = data.dice;
      window.LAST_DICE = value;
      const position = data.position;

      rollDice(value);

      // 🎲 Show result
      document.getElementById("diceResult").innerText =
        `🎲 You rolled ${value}`;

      document.getElementById("positionText").innerText =
        `📍 Position: ${position}`;

      // ✅ ENABLE SCANNER
      canScan = true;
      scanBtn.style.display = "inline-block";
    });
  });

  // =========================
  // 📷 QR SCANNER
  // =========================
  scanBtn.addEventListener("click", () => {

    if (!canScan) {
      alert("Roll dice first!");
      return;
    }

    reader.style.display = "block";

    html5QrCode = new Html5Qrcode("reader");

    html5QrCode.start(
      { facingMode: "environment" },
      { fps: 10, qrbox: 250 },

      (decodedText) => {

        const map = {
          easy: "easy",
          moderate: "moderate",
          hard: "hard",
          extreme: "extreme"
        };

        let difficulty = map[decodedText.trim().toLowerCase()];

        if (!difficulty) {
          alert("Invalid QR!");
          return;
        }

        html5QrCode.stop();
        reader.style.display = "none";
        canScan = false;
        scanBtn.style.display = "none";

        fetch(`/api/question/get/${difficulty}`)
          .then(res => res.json())
          .then(q => {
            if (q.message) {
              alert("No more questions!");
              return;
            }
            showQuestion(q);
          });
      }
    );
  });

  // =========================
  // ❓ SHOW QUESTION
  // =========================
  function showQuestion(q) {
    reader.style.display = "none";
    scanBtn.style.display = "none";

    selectedAnswer = null;

    document.getElementById("answerResult").innerText = "";
    document.getElementById("explanationBox").innerText = "";

    document.querySelectorAll(".option").forEach(btn => {
      btn.disabled = false;
      btn.classList.remove("selected");
      btn.style.display = "block"; 
    });

    document.querySelector(".question-panel").style.display = "block";

    document.getElementById("questionText").innerHTML =
      q.question_text.replace(/\n/g, "<br>");

    setOption("optA", q.option_a, "A");
    setOption("optB", q.option_b, "B");
    setOption("optC", q.option_c, "C");
    setOption("optD", q.option_d, "D");

    window.QID = q.question_id;

    // =========================
    // ⏱ ANSWER TIMER (ADD HERE)
    // =========================
    let timeLimit = 0;
    const difficulty = q.question_difficulty.trim().toLowerCase();

    if (difficulty === "hard") timeLimit = 60;
    if (difficulty === "extreme") timeLimit = 90;

    if (timeLimit > 0) {

      let timeLeft = timeLimit;
      const countdownText = document.getElementById("countdownText");

      // 🔥 clear previous timer
      if (window.answerInterval) {
        clearInterval(window.answerInterval);
      }

      window.answerInterval = setInterval(() => {
        countdownText.innerText = `⏱ Answer within ${timeLeft}s`;
        timeLeft--;

        if (timeLeft <= 0) {
          clearInterval(window.answerInterval);
          alert("⏰ Time's up!");
          // auto submit as wrong
          submitAnswer("TIME_UP");
        }

      }, 1000);
    }

    // =========================
    // 🧠 ERASE SKILL
    // =========================
    fetch(`/api/player/${window.MY_PLAYER_ID}`)
      .then(res => res.json())
      .then(p => {

        if (p.active_skill == 2) {

          alert("🧠 Erase activated! One wrong option removed on next turn");
          const options = ["optA","optB","optC","optD"];

          const correctMap = {
            optA: "A",
            optB: "B",
            optC: "C",
            optD: "D"
          };

          let wrong = options.filter(id => correctMap[id] !== q.question_answer);

          setTimeout(() => {
            const remove = wrong[Math.floor(Math.random() * wrong.length)];
            document.getElementById(remove).style.display = "none";
          }, 100);

          // reset skill
          fetch("/api/skill/reset", { method: "POST" });
        }
      });
  }

  let selectedAnswer = null;

  function setOption(id, text, value) {
    const btn = document.getElementById(id);
    btn.innerText = text;

    btn.onclick = () => {
      selectedAnswer = value;

      // 🔥 REMOVE OLD SELECTION
      document.querySelectorAll(".option").forEach(b => {
        b.classList.remove("selected");
      });

      // 🔥 ADD SELECTED STYLE
      btn.classList.add("selected");
    };
  }

  // =========================
  // ✅ SUBMIT ANSWER
  // =========================
  function submitAnswer(answer) {

    if (window.answerInterval) {
      clearInterval(window.answerInterval);
    }

    const submitBtn = document.getElementById("submitBtn");

    // 🚫 Prevent multiple clicks
    if (submitBtn.disabled) return;

    submitBtn.disabled = true;
    submitBtn.innerText = "Submitting...";

    fetch("/api/question/answer", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        question_id: window.QID,
        answer,
        game_id: window.GAME_ID,
        dice_value: window.LAST_DICE
      })
    })
    .then(res => res.json())
    .then(data => {

      // ✅ SHOW RESULT
      let resultText = data.correct ? "✅ Correct!" : "❌ Wrong!";
      resultText += `<br><br>✅ Correct Answer: ${data.correctAnswer}`;
      document.getElementById("answerResult").innerHTML = resultText;
      
      if (data.givenSkillName) {
        alert(`🎁 You received skill: ${data.givenSkillName}!`);
      }

      document.getElementById("explanationBox").innerHTML =
        "💡 Explanation:<br>" + data.explanation.replace(/\n/g, "<br>");

      // 🔒 disable options
      document.querySelectorAll(".option").forEach(btn => {
        btn.disabled = true;
      });

      // ✅ Change button text
      submitBtn.innerText = "Submitted";

      // 🔄 FORCE REFRESH PLAYER DATA (REAL-TIME)
      fetch(`/api/player/${window.MY_PLAYER_ID}`)
        .then(res => res.json())
        .then(p => {

          console.log("UPDATED PLAYER:", p);

          updateHearts(p.lives);
          document.getElementById("points").innerText = p.points;
          document.getElementById("infection").innerText = p.infection_live;
          document.getElementById("positionText").innerText =
            `📍 Position: ${p.position}`;

          if (p.lives <= 0) {
            showLosePopup();
          }

        });

      // 🛒 SHOW SHOP (FIXED LOGIC)
      if (data.turnNumber % 2 === 0 && shopShownTurn !== data.turnNumber) {
        shopShownTurn = data.turnNumber;
        openShopPopup();
      }

      // ⏱ START COUNTDOWN
      let timeLeft = 20;
      const countdownText = document.getElementById("countdownText");

      const interval = setInterval(() => {
        countdownText.innerText = `Next turn in ${timeLeft}s...`;
        timeLeft--;

        if (timeLeft < 0) {
          clearInterval(interval);

          fetch("/next-turn", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              game_id: window.GAME_ID
            })
          }).then(res => res.json())
            .then(data => {

            if (data.skipped) {
              alert("🚫 Block activated! Next player skipped!");
            }

            // hide question panel
            document.querySelector(".question-panel").style.display = "none";

            // 🔥 RESET SUBMIT BUTTON FOR NEXT TURN
            submitBtn.disabled = false;
            submitBtn.innerText = "Submit";

            // reset UI
            hasRolled = false;
            canScan = false;
            scanBtn.style.display = "none";

            checkTurn();
          });
        }

      }, 1000);

    })
    .catch(err => {
      console.error("❌ Submit error:", err);

      // 🔄 Re-enable button if error
      submitBtn.disabled = false;
      submitBtn.innerText = "Submit";
    });
  }

  document.getElementById("submitBtn").onclick = () => {
    if (!selectedAnswer) {
      alert("Select an answer!");
      return;
    }

    submitAnswer(selectedAnswer);
  };

  const exitBtn = document.getElementById("exitGameBtn");

  if (exitBtn) {
    exitBtn.onclick = () => {
      fetch("/exit-game", { method: "POST" })
        .then(() => {
          window.location.href = "/lobby";
        });
    };
  }

  // =========================
  // 🎒 BACKPACK
  // =========================
  const backpackBtn = document.getElementById("backpackBtn");
  const backpackPanel = document.getElementById("backpackPanel");

    // 🔄 TOGGLE (OPEN / CLOSE)
    backpackBtn.onclick = () => {

    if (backpackPanel.style.display === "block") {
      backpackPanel.style.display = "none";
      return;
    }

    backpackPanel.style.display = "block";

    updateActiveSkill();

    fetch(`/api/player/${window.MY_PLAYER_ID}/skills`)
      .then(res => res.json())
      .then(skills => {
        const list = document.getElementById("skillList");
        list.innerHTML = "";

        skills.forEach(s => {
          const li = document.createElement("li");
          li.innerHTML = `
            ${s.skillName}
            <button id= "use-button" onclick="useSkill(${s.skill_id})">Use</button>
          `;
          list.appendChild(li);
        });
      });
  };

  fetch(`/api/player/${window.MY_PLAYER_ID}`)
  .then(res => res.json())
  .then(p => {

    if (p.active_skill) {
      document.getElementById("activeSkillText").innerText =
        `🔥 Active Skill: ${p.active_skill}`;
    }

  });

  // =========================
  // 📜 RULES POPUP
  // =========================
  const rulesPopup = document.getElementById("rulesPopup");

  document.getElementById("rulesBtn").onclick = () => {
    rulesPopup.style.display = "flex";
  };

  document.getElementById("closeRules").onclick = () => {
    rulesPopup.style.display = "none";
  };

  //Winner popup
  function showWinnerPopup(winnerId, winnerName) {
    const popup = document.getElementById("winnerPopup");
    const text = document.getElementById("winnerText");
    const extra = document.getElementById("extraText");

    popup.style.display = "flex";

    if (Number(winnerId) === Number(window.MY_PLAYER_ID)) {
      text.innerText = "🏆 You are the winner!";
      extra.innerText = "🎉 Congratulations Survivor!";
    } else {
      text.innerText = "💀 You lose!";
      extra.innerText = `${winnerName} has survived the outbreak.`;
    }

    document.getElementById("rollDiceBtn").disabled = true;

    const exitBtn = document.getElementById("exitGameBtn");
    exitBtn.onclick = () => {
      console.log("EXIT CLICKED"); // debug

      fetch("/exit-game", { method: "POST" })
        .then(() => {
          window.location.href = "/lobby";
        })
        .catch(err => console.error("Exit error:", err));
    };
  }
  window.PLAYER_ELIMINATED = false;
  // Lose popup
  function showLosePopup() {
    window.PLAYER_ELIMINATED = true;

    const popup = document.getElementById("winnerPopup");
    const text = document.getElementById("winnerText");
    const extra = document.getElementById("extraText");

    popup.style.display = "flex";

    text.innerText = "☠️ You are eliminated!";
    extra.innerText = "You did not survive the outbreak...";

    document.getElementById("rollDiceBtn").disabled = true;
  }

  // 🛒 OPEN SHOP
  function openShopPopup() {
    document.getElementById("shopPopup").style.display = "flex";

    fetch("/api/skill/random")
      .then(res => res.json())
      .then(skills => {

        displaySkill("skill1", skills[0]);
        displaySkill("skill2", skills[1]);

      });
  }

  // ❌ CLOSE BUTTON
  document.getElementById("closeShop").onclick = () => {
    document.getElementById("shopPopup").style.display = "none";
  };

  function displaySkill(containerId, skill) {
    const div = document.getElementById(containerId);

    div.innerHTML = `
      <h3>${skill.skillName}</h3>
      <p>${skill.descriptions}</p>
      <p>💰 Cost: ${skill.cost_points}</p>
      <button class="buy-btn" onclick="buySkill(${skill.skill_id})">Buy</button>
    `;
  }

  window.useSkill = function(skill_id) {
    // ❌ Not your turn
    if (window.MY_PLAYER_ID != window.CURRENT_TURN) {
      alert("❌ You can only use skills during your turn!");
      return;
    }

    // ❌ Already rolled
    if (hasRolled) {
      alert("❌ Use skill before rolling the dice!");
      return;
    }

    // ✅ allowed
    fetch("/use", {
      method: "POST",
      headers: {"Content-Type":"application/json"},
      body: JSON.stringify({ skill_id })
    })
    .then(res => res.text())
    .then(msg => {
      alert(msg);
      updateActiveSkill();
    });
  };

  window.buySkill = function(skill_id) {
    fetch("/buy", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ skill_id })
    })
    .then(res => res.text())
    .then(msg => {
      document.getElementById("shopMessage").innerText = msg;

      if (msg === "SUCCESS") {
        alert("✅ Purchase successful!");
      } else {
        alert("❌ " + msg);
      }
    });
  };

  function updateActiveSkill() {
    fetch(`/api/player/${window.MY_PLAYER_ID}`)
      .then(res => res.json())
      .then(p => {

        const text = document.getElementById("activeSkillText");

        const skillNames = {
          1: "⚡ Sprint",
          2: "🧠 Erase",
          3: "🛡 Immunity",
          4: "💉 Vaccine",
          5: "🚫 Block"
        };

        if (p.active_skill) {
          text.innerText = `🔥 Active Skill: ${skillNames[p.active_skill]}`;
        } else {
          text.innerText = "";
        }

      });
  }
});
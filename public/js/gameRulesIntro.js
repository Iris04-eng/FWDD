document.addEventListener("DOMContentLoaded", () => {

  const video = document.getElementById("introVideo");
  const rules = document.querySelector(".rules-container");
  const rotate = document.getElementById("rotate-warning");
  const cutscene = document.querySelector(".cutscene-container");
  const dialogueBox = document.getElementById("npc-dialogue");
  const nextBtn = document.getElementById("next-btn");
  const skipBtn = document.getElementById("skipBtn");

  if (!video || !rules || !rotate || !cutscene || !dialogueBox || !nextBtn || !skipBtn) {
    console.error("Missing elements in gameRulesIntro");
    return;
  }

  function checkOrientation() {
    if (window.innerHeight > window.innerWidth) {
      // portrait
      rotate.style.display = "flex";
      video.pause();
    } else {
      rotate.style.display = "none";
      if (!video.ended) {
        video.play().catch(() => {});
      }
    }
  }
  checkOrientation();
  window.addEventListener("resize", checkOrientation);
  video.addEventListener("ended", () => {
    cutscene.style.display = "none";
    rules.style.display = "flex";

    rotate.style.display = "none";

    startDialogue();
  });

  skipBtn.addEventListener("click", () => {
    video.pause();
    cutscene.classList.add("fade-out");

    setTimeout(() => {
      cutscene.style.display = "none";
      rules.style.display = "flex";
      rotate.style.display = "none";

      startDialogue();
    }, 300);

    skipBtn.style.display = "none";
  });

  const messages = [
    "⚠ SYSTEM ONLINE...\nA deadly outbreak has taken over the city.\nOnly those who master Python control flow can survive.",

    "🎯 OBJECTIVE:\nSolve Python logic questions to earn points and stay alive.",

    "🎲 GAMEPLAY:\nRoll the dice to move across the map.\nEach tile gives a different level of challenge.",

    "🟢 NORMAL TILE (Easy):\n✔ Correct: +30 points\n❌ Wrong: No penalty",

    "🟡 SUPPLY TILE (Moderate):\n✔ Correct: +40 points\n🎁 Receive 1 random skill\n❌ Wrong: -10 points",

    "🔴 ZOMBIE ENCOUNTER (Hard):\n✔ Correct: +80 points\n❌ Wrong: Move back 2 tiles\n❌ Lose 30 points\n⏱ Time limit: 1 minute\n⏱ Timeout: Lose 1 life",

    "💀 ZOMBIE ATTACK (Extreme):\n✔ Correct: +100 points\n❌ Wrong: Lose 1 life\n🧟 Become INFECTED\n⏱ Time limit: 1 min 30 sec\n⏱ Timeout: Lose 1 life",

    "🧟 INFECTION:\nLasts for 3 turns\nWrong answers during infection = Lose 1 life",

    "❤️ LIVES:\nYou have 5 lives in total\nLose all lives and you are eliminated",

    "🛒 SHOP:\nAppears every 2 turns\nBuy skills using points",

    "⚡ SKILLS:\nSprint, Erase, Immunity, Vaccine, Block\nUse them wisely to outsmart the outbreak",

    "💡 TIP:\nTrace Python code step by step before answering.",

    "🚀 Stay sharp. Think logically.\nThe outbreak begins NOW."
  ];

  let index = 0;
  let typing = false;
  let typingInterval = null;
  function typeWriter(text) {
    if (typingInterval) clearInterval(typingInterval);

    const words = text.split(" ");
    dialogueBox.innerText = "";

    let i = 0;
    typing = true;

    typingInterval = setInterval(() => {
      dialogueBox.innerText += (i === 0 ? "" : " ") + words[i];
      i++;

      if (i >= words.length) {
        clearInterval(typingInterval);
        typing = false;
      }
    }, 120);
  }

  function startDialogue() {
    index = 0;
    typeWriter(messages[index]);
    index++;
  }

  nextBtn.addEventListener("click", () => {
    if (typing) {
      clearInterval(typingInterval); 
      dialogueBox.innerText = messages[index - 1];
      typing = false;
      return;
    }

    if (index < messages.length) {
      typeWriter(messages[index]);
      index++;

      if (index === messages.length) {
        nextBtn.innerText = "🚀 Start Game";
      }
    } else {
      window.location.href = `/game/${game_id}`;
    }
  });

});
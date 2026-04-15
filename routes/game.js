const express = require("express");
const router = express.Router();

function generateJoinCode() {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

router.post("/exit-game", (req, res) => {
  req.session.player_id = null;
  res.send("ok");
});

module.exports = (db) => {
  router.post("/create-game", (req, res) => {
    if (!req.session.user) return res.redirect("/login");

    const { player_name } = req.body;

    //fallback to username if empty
    const finalName =
      player_name && player_name.trim() !== ""
        ? player_name
        : req.session.user.username;

    const join_code = generateJoinCode();
    const host_user_id = req.session.user.id;

    //CREATE GAME
    db.query(
      "INSERT INTO game (host_user_id, join_code, status) VALUES (?, ?, 'WaitingForPlayers')",
      [host_user_id, join_code],
      (err, result) => {

        if (err) {
          console.error("❌ CREATE GAME ERROR:", err);
          return res.send("Error creating game");
        }

        const game_id = result.insertId;

        //INSERT HOST AS PLAYER
        db.query(
          `INSERT INTO player 
          (user_id, game_id, player_name, position, lives, points, infection_live) 
          VALUES (?, ?, ?, 0, 5, 0, 0)`,
          [host_user_id, game_id, finalName],
          (err2, result2) => {

            if (err2) {
              console.error("❌ INSERT PLAYER ERROR:", err2);
              return res.send("Error inserting player");
            }

            if (!result2) {
              console.error("❌ result2 undefined");
              return res.send("Insert failed");
            }

            const player_id = result2.insertId;

            //SAVE SESSION
            req.session.player_id = player_id;

            //SET FIRST TURN 
            db.query(
              "UPDATE game SET current_turn_player_id = ? WHERE game_id = ?",
              [player_id, game_id],
              (err3) => {

                if (err3) {
                  console.error("❌ SET TURN ERROR:", err3);
                  return res.send("Error setting first turn");
                }

                console.log("✅ Game created successfully!");
                console.log("Game ID:", game_id);
                console.log("First player:", player_id);

                //REDIRECT TO LOBBY
                res.redirect(`/waiting/${game_id}`);
              }
            );
          }
        );
      }
    );
  });

  router.post("/start-game", (req, res) => {
    const { game_id } = req.body;
    db.query(
      "SELECT host_user_id FROM game WHERE game_id = ?",
      [game_id],
      (err, rows) => {
        if (rows[0].host_user_id !== req.session.user.id) {
          return res.send("Not host");
        }
        db.query(
          "UPDATE game SET status = 'WaitingForPlayers' WHERE game_id = ?",
          [game_id],
          () => {
            res.redirect(`/waiting/${game_id}`);
          }
        );
      }
    );
  });

  router.post("/join-game", (req, res) => {
    if (!req.session.user) return res.redirect("/login");
    const { join_code, player_name } = req.body;
    if (!player_name || player_name.trim() === "") {
      return res.render("joinUI", { error: "Name cannot be empty!" });
    }

    db.query(
      "SELECT * FROM game WHERE join_code = ? AND status = 'WaitingForPlayers'",
      [join_code],
      (err, games) => {
        if (err || games.length === 0) {
          return res.render("joinUI", { error: "Invalid or closed game" });
        }

        const game = games[0];

        db.query(
          "SELECT * FROM player WHERE user_id = ? AND game_id = ?",
          [req.session.user.id, game.game_id],
          (errExisting, existing) => {
            
            if (existing.length > 0) {
              db.query(
                "UPDATE player SET player_name = ? WHERE user_id = ? AND game_id = ?",
                [player_name, req.session.user.id, game.game_id],
                () => {
                  req.session.player_id = existing[0].player_id;
                  return res.redirect(`/waiting/${game.game_id}`);
                }
              );
              return; 
            }

            db.query(
              "SELECT * FROM player WHERE game_id = ? AND player_name = ?",
              [game.game_id, player_name],
              (errName, nameCheck) => {
                if (nameCheck.length > 0) {
                  return res.render("joinUI", { error: "Name already taken in this lobby!" });
                }

                db.query(
                  "SELECT COUNT(*) AS count FROM player WHERE game_id = ?",
                  [game.game_id],
                  (errCount, countResult) => {
                    if (countResult[0].count >= 4) {
                      return res.render("joinUI", { error: "Game is full" });
                    }

                    db.query(
                      `INSERT INTO player 
                      (user_id, game_id, player_name, position, lives, points, infection_live) 
                      VALUES (?, ?, ?, 0, 5, 0, 0)`,
                      [req.session.user.id, game.game_id, player_name], 
                      (errInsert, result) => {
                        req.session.player_id = result.insertId;
                        res.redirect(`/waiting/${game.game_id}`);
                      }
                    );
                  }
                );
              }
            );
          }
        );
      }
    );
  });


  router.get("/waiting/:game_id", (req, res) => {
    const game_id = req.params.game_id;

    db.query(
      "SELECT join_code FROM game WHERE game_id = ?",
      [game_id],
      (err, game) => {
        db.query(
          `SELECT p.player_id, p.user_id, p.player_name, g.host_user_id
           FROM player p
           JOIN game g ON p.game_id = g.game_id
           WHERE p.game_id = ?`,
          [game_id],
          (err2, players) => {
            const isHost =
              players.length > 0 &&
              req.session.user &&
              Number(players[0].host_user_id) === Number(req.session.user.id);
            res.render("waitingLobby", {
              joinCode: game[0].join_code,
              players,
              game_id,
              isHost,
              showHeader: true
            });
          }
        );
      }
    );
  });

  router.get("/api/waiting/:game_id", (req, res) => {
    const game_id = req.params.game_id;
    db.query(
      `SELECT p.player_id, p.user_id, p.player_name, g.host_user_id
       FROM player p
       JOIN game g ON p.game_id = g.game_id
       WHERE p.game_id = ?`,
      [game_id],
      (err, players) => {
        if (err) return res.json({ error: true });
        const isHost =
          players.length > 0 &&
          req.session.user &&
          Number(players[0].host_user_id) === Number(req.session.user.id);
        res.json({
          players,
          isHost
        });
      }
    );
  });

  router.post("/auto-start", (req, res) => {
    const { game_id } = req.body;
    db.query(
      "SELECT * FROM player WHERE game_id = ?",
      [game_id],
      (err, players) => {

        if (players.length < 2) {
          return res.status(400).send("Not enough players");
        }
        res.redirect("/game/" + game_id);
      }
    );
  });

  router.post("/roll-dice", (req, res) => {
    const { game_id } = req.body;

    db.query(
      "SELECT current_turn_player_id, winner_player_id FROM game WHERE game_id = ?",
      [game_id],
      (err, rows) => {

        if (!rows || rows.length === 0) {
          return res.status(400).send("Game not found");
        }

        if (rows[0].winner_player_id) {
          return res.status(400).send("Game already ended");
        }

        if (req.session.player_id !== rows[0].current_turn_player_id) {
          return res.status(403).send("Not your turn");
        }

        let dice = Math.floor(Math.random() * 6) + 1;

        db.query(
          "SELECT active_skill FROM player WHERE player_id = ?",
          [req.session.player_id],
          (errSkill, skillRes) => {

            let skillUsed = null;

            // 🧟 Infection countdown
            db.query(
              `UPDATE player 
              SET infection_live = infection_live - 1
              WHERE player_id = ? AND infection_live > 0`,
              [req.session.player_id]
            );

            // 🧟 RESET STATUS WHEN CURED
            db.query(
              "UPDATE player SET status = 'ALIVE' WHERE player_id = ? AND infection_live <= 0 AND lives > 0",
              [req.session.player_id]
            );

            db.query(
              "SELECT position FROM player WHERE player_id = ?",
              [req.session.player_id],
              (errPos, posResult) => {

                let skillUsed = null;
                // 💉 VACCINE (apply at start of turn)
                if (skillRes[0]?.active_skill == 4) {

                  db.query(
                    "SELECT infection_live FROM player WHERE player_id = ?",
                    [req.session.player_id],
                    (err, r) => {

                      if (r[0].infection_live > 0) {
                        db.query(
                          "UPDATE player SET infection_live = 0 WHERE player_id = ?",
                          [req.session.player_id]
                        );
                      } else {
                        db.query(
                          "UPDATE player SET lives = lives + 1 WHERE player_id = ?",
                          [req.session.player_id]
                        );
                      }

                    }
                  );

                  skillUsed = "VACCINE";

                  db.query("UPDATE player SET active_skill = NULL WHERE player_id=?", [req.session.player_id]);
                }

                let currentPos = posResult[0].position;
                let newPos = currentPos + dice;

                // ==========
                // ⚡ SPRINT 
                // ==========
                if (skillRes[0]?.active_skill === 1) {
                  newPos += 2;
                  skillUsed = "SPRINT";

                  db.query("UPDATE player SET active_skill = NULL WHERE player_id=?", [req.session.player_id]);
                }

                // 🎯 Bounce logic
                if (newPos > 30) {
                  const overflow = newPos - 30;
                  newPos = 30 - overflow;
                }

                // 🏆 Winner
                if (newPos === 30) {
                  db.query(
                    "UPDATE game SET winner_player_id = ? WHERE game_id = ?",
                    [req.session.player_id, game_id]
                  );
                }

                // 📊 Update player
                db.query(
                  "UPDATE player SET position = ? WHERE player_id = ?",
                  [newPos, req.session.player_id],
                  () => {
                    res.json({
                      dice: dice,
                      position: newPos,
                      isWinner: newPos === 30,
                      skillUsed: skillUsed
                    });
                  }
                );
              }
            );
          }
        );
      }
    );
  });

  router.get("/game/:game_id", (req, res) => {
    const game_id = req.params.game_id;

    db.query(
      "SELECT current_turn_player_id FROM game WHERE game_id = ?",
      [game_id],
      (err, result) => {

        if (err || result.length === 0) {
          return res.send("Game not found");
        }

        res.render("gamePlay", {
          game_id: game_id,
          player_id: req.session.player_id,
          current_turn_player_id: result[0].current_turn_player_id,
          showHeader: true
        });
      }
    );
  });

  router.get("/current-turn/:game_id", (req, res) => {
    const game_id = req.params.game_id;

    db.query(
      "SELECT current_turn_player_id FROM game WHERE game_id = ?",
      [game_id],
      (err, result) => {
        if (err || result.length === 0) {
          return res.status(400).send("Game not found");
        }

        res.json({
          current_turn: result[0].current_turn_player_id
        });
      }
    );
  });

  router.post("/next-turn", (req, res) => {
    const { game_id } = req.body;
    const player_id = req.session.player_id;

    db.query(
      "SELECT player_id FROM player WHERE game_id = ? ORDER BY player_id",
      [game_id],
      (err, players) => {

        const currentIndex = players.findIndex(
          p => p.player_id === player_id
        );

        db.query(
          "SELECT active_skill FROM player WHERE player_id=?",
          [player_id],
          (err2, skillRes) => {

            let step = 1;

            if (skillRes[0]?.active_skill == 5) {
              step = 2; // skip next player
            }

            const nextIndex = (currentIndex + step) % players.length;
            const nextPlayerId = players[nextIndex].player_id;

            db.query(
              "UPDATE player SET active_skill = NULL WHERE player_id=?",
              [player_id]
            );

            db.query(
              "UPDATE game SET current_turn_player_id = ? WHERE game_id = ?",
              [nextPlayerId, game_id],
              () => res.json({ skipped: step === 2 })
            );
          }
        );
      }
    );
  });

  router.get("/game-winner/:game_id", (req, res) => {
    const game_id = req.params.game_id;

    db.query(
      `
      SELECT p.player_id, p.player_name 
      FROM game g
      JOIN player p ON g.winner_player_id = p.player_id
      WHERE g.game_id = ?
      `,
      [game_id],
      (err, result) => {

        if (err || !result.length) {
          return res.json({ winner: null });
        }

        res.json({
          winner_id: result[0].player_id,
          winner_name: result[0].player_name
        });
      }
    );
  });

  // get player info
  router.get("/api/player/:id", (req, res) => {
    db.query(
      "SELECT * FROM player WHERE player_id=?",
      [req.params.id],
      (err, result) => {
        res.json(result[0]);
      }
    );
  });

  // reset skill (for erase)
  router.post("/api/skill/reset", (req, res) => {
    db.query(
      "UPDATE player SET active_skill = NULL WHERE player_id=?",
      [req.session.player_id],
      () => res.send("reset")
    );
  });

  // 🎒 GET PLAYER SKILLS (FIX MISSING API)
  router.get("/api/player/:id/skills", (req, res) => {
    db.query(
      `SELECT ps.skill_id, s.skillName
      FROM player_skill ps
      JOIN skill s ON ps.skill_id = s.skill_id
      WHERE ps.player_id = ? AND ps.is_skill_used = FALSE`,
      [req.params.id],
      (err, result) => {
        if (err) return res.json([]);
        res.json(result);
      }
    );
  });

  // 🎲 GET RANDOM SKILLS FOR SHOP
  router.get("/api/skill/random", (req, res) => {
    db.query(
      "SELECT * FROM skill ORDER BY RAND() LIMIT 2",
      (err, result) => {
        if (err) {
          console.error("❌ SKILL RANDOM ERROR:", err);
          return res.json([]);
        }
        res.json(result);
      }
    );
  });

  
  return router;

};
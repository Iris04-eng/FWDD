module.exports = (db) => {
  const express = require("express");
  const router = express.Router();

  // =========================
  // ❓ GET QUESTION
  // =========================
  router.get("/get/:difficulty", (req, res) => {
    const difficulty = req.params.difficulty;
    const player_id = req.session.player_id;

    db.query(
      `
      SELECT * FROM question
      WHERE question_difficulty = ?
      AND question_id NOT IN (
        SELECT question_id FROM game_log WHERE player_id = ?
      )
      ORDER BY RAND()
      LIMIT 1
      `,
      [difficulty, player_id],
      (err, result) => {
        if (err) return res.status(500).send(err);

        if (!result.length) {
          return res.json({ message: "No more questions" });
        }

        res.json(result[0]);
      }
    );
  });

  // =========================
  // ✅ ANSWER QUESTION
  // =========================
  router.post("/answer", (req, res) => {
    const { question_id, answer, game_id, dice_value } = req.body;
    const player_id = req.session.player_id;

    db.query(
      "SELECT * FROM question WHERE question_id = ?",
      [question_id],
      (err, result) => {

        if (!result || result.length === 0) {
          return res.status(400).send("Question not found");
        }

        const q = result[0];
        const difficulty = q.question_difficulty.trim().toLowerCase();
        let correct = false;

        if (answer === "TIME_UP") {
          correct = false;
        } else {
          correct =
            q.question_answer.trim().toLowerCase() === answer.trim().toLowerCase();
        }

        // CHECK INFECTION STATUS
        db.query(
          "SELECT infection_live FROM player WHERE player_id = ?",
          [player_id],
          (errInf, infResult) => {

            const infectionLive = infResult[0].infection_live;

            let pointsChange = 0;
            let moveBack = 0;
            let loseLife = 0;
            let giveSkill = false;
            let infected = false;

            // NORMAL RULES
            if (correct) {
              if (difficulty === "easy") pointsChange = 30;
              if (difficulty === "moderate") {
                pointsChange = 40;
                giveSkill = true;
              }
              if (difficulty === "hard") pointsChange = 80;
              if (difficulty === "extreme") pointsChange = 100;

            } else {
              if (difficulty === "moderate") pointsChange = -10;

              if (difficulty === "hard") {
                pointsChange = -30;
                moveBack = 2;
              }

              if (difficulty === "extreme") {
                loseLife = 1;
                infected = true;
              }
            }

            // INFECTION RULE
            if (infectionLive > 0 && !correct) {
              loseLife += 1;
            }

            //SKILL CHECK 
            db.query(
              "SELECT active_skill FROM player WHERE player_id = ?",
              [player_id],
              (errSkill, skillRes) => {

                const skill = skillRes[0]?.active_skill;

                // IMMUNITY
                if (skill == 3) {
                  loseLife = 0;
                  moveBack = 0;

                  console.log("🛡 Immunity applied");

                  db.query("UPDATE player SET active_skill = NULL WHERE player_id=?", [player_id]);
                }

                // VACCINE
                if (skill == 4) {
                  loseLife = 0;
                  infected = false;

                  db.query(
                    "UPDATE player SET infection_live = 0 WHERE player_id = ?",
                    [player_id]
                  );

                  console.log("💉 Vaccine applied");
                }

                // UPDATE PLAYER
                let query = `
                  UPDATE player 
                  SET points = IFNULL(points, 0) + ?, 
                      position = position - ?, 
                      lives = lives - ?
                `;

                if (infected) {
                  query += ", infection_live = 3";
                }

                query += " WHERE player_id = ?";

                db.query(query, [
                  pointsChange,
                  moveBack,
                  loseLife,
                  player_id
                ], (errUpdate, resultUpdate) => {

                  if (errUpdate) {
                    console.error("❌ UPDATE PLAYER ERROR:", errUpdate);
                  } else {
                    console.log("✅ Player updated:", resultUpdate);
                  }

                  // UPDATE STATUS IF DEAD
                  db.query(
                    "UPDATE player SET status = 'DEAD' WHERE player_id = ? AND lives <= 0",
                    [player_id],
                    (errStatus) => {
                      if (errStatus) {
                        console.error("❌ STATUS UPDATE ERROR:", errStatus);
                      } else {
                        console.log("💀 Checked & updated player status");
                      }
                    }
                  );

                  // UPDATE STATUS IF INFECTED
                  db.query(
                    "UPDATE player SET status = 'INFECTED' WHERE player_id = ? AND infection_live > 0 AND lives > 0",
                    [player_id],
                    (errInf) => {
                      if (errInf) {
                        console.error("❌ INFECTED STATUS ERROR:", errInf);
                      } else {
                        console.log("🧟 Player marked as INFECTED if applicable");
                      }
                    }
                  );

                  // CHECK LAST PLAYER STANDING
                  db.query(
                    "SELECT player_id FROM player WHERE game_id = ? AND status != 'DEAD'",
                    [game_id],
                    (errAlive, alivePlayers) => {

                      if (alivePlayers.length === 1) {
                        const winnerId = alivePlayers[0].player_id;

                        db.query(
                          "UPDATE game SET winner_player_id = ? WHERE game_id = ?",
                          [winnerId, game_id],
                          () => {
                            console.log("🏆 Last player wins:", winnerId);
                          }
                        );
                      }

                    }
                  );

                  // GIVE RANDOM SKILL
                  let givenSkillName = null;

                  if (giveSkill) {
                    db.query(
                      "SELECT * FROM skill ORDER BY RAND() LIMIT 1",
                      (err2, skill) => {

                        givenSkillName = skill[0].skillName;

                        db.query(
                          "INSERT INTO player_skill (player_id, skill_id) VALUES (?, ?)",
                          [player_id, skill[0].skill_id]
                        );
                      }
                    );
                  }

                  // TURN NUMBER
                  db.query(
                    `
                    SELECT COUNT(*) AS turn_count 
                    FROM game_log 
                    WHERE game_id = ? AND player_id = ?
                    `,
                    [game_id, player_id],
                    (err2, countRes) => {

                      const turnNumber = countRes[0].turn_count + 1;

                      // INSERT GAME LOG
                      db.query(
                        `
                        INSERT INTO game_log 
                        (game_id, player_id, question_id, turn_number, dice_value, result, life_change)
                        VALUES (?, ?, ?, ?, ?, ?, ?)
                        `,
                        [
                          game_id,
                          player_id,
                          question_id,
                          turnNumber,
                          dice_value,
                          correct ? "Correct" : "Wrong",
                          loseLife * -1
                        ],
                        () => {

                          db.query(
                            "SELECT * FROM player WHERE player_id = ?",
                            [player_id],
                            (err3, updatedPlayer) => {

                              res.json({
                                correct,
                                correctAnswer: q.question_answer,
                                explanation: q.explanation,
                                turnNumber,
                                updatedPlayer: updatedPlayer[0], 
                                givenSkillName,
                                skillUsed: skill
                              });

                            }
                          );

                        }
                      );

                    }
                  );

                });

              }
            );

          }
        );

      }
    );
  });

  return router;
};
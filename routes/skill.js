module.exports = (db) => {
  const express = require("express");
  const router = express.Router();

  // 🎲 GET 2 RANDOM SKILLS
  router.get("/random", (req, res) => {
    db.query(
      "SELECT * FROM skill ORDER BY RAND() LIMIT 2",
      (err, result) => {
        if (err) return res.status(500).send("DB error");
        res.json(result);
      }
    );
  });

  // 🛒 BUY SKILL
  router.post("/buy", (req, res) => {
    const player_id = req.session.player_id;
    const { skill_id } = req.body;

    // 🔥 CHECK MAX 3 SKILLS
    db.query(
      "SELECT COUNT(*) AS total FROM player_skill WHERE player_id = ? AND is_skill_used = FALSE",
      [player_id],
      (err, r) => {

        if (err) {
          console.error(err);
          return res.send("Error checking skills");
        }

        if (r[0].total >= 3) {
          return res.send("Max 3 skills reached");
        }

        // 🔥 GET COST
        db.query(
          "SELECT cost_points FROM skill WHERE skill_id = ?",
          [skill_id],
          (err2, skill) => {

            if (err2 || !skill.length) {
              console.error(err2);
              return res.send("Skill not found");
            }

            const cost = skill[0].cost_points;

            // 🔥 CHECK PLAYER POINTS
            db.query(
              "SELECT points FROM player WHERE player_id = ?",
              [player_id],
              (err3, p) => {

                if (err3 || !p.length) {
                  console.error(err3);
                  return res.send("Player not found");
                }

                console.log("PLAYER POINTS:", p[0].points, "COST:", cost);

                if (p[0].points < cost) {
                  return res.send("Not enough points");
                }

                // 💰 DEDUCT POINTS
                db.query(
                  "UPDATE player SET points = points - ? WHERE player_id = ?",
                  [cost, player_id],
                  (err4) => {

                    if (err4) {
                      console.error(err4);
                      return res.send("Error deducting points");
                    }

                    // 🎒 ADD SKILL
                    db.query(
                      "INSERT INTO player_skill (player_id, skill_id, is_skill_used) VALUES (?, ?, FALSE)",
                      [player_id, skill_id],
                      (err5) => {

                        if (err5) {
                          console.error(err5);
                          return res.send("Error adding skill");
                        }

                        // ✅ SUCCESS
                        return res.send("SUCCESS");
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

  // USE SKILL
  router.post("/use", (req, res) => {
    const player_id = req.session.player_id;
    const { skill_id } = req.body;

    db.query(
      "SELECT * FROM player_skill WHERE player_id=? AND skill_id=? AND is_skill_used=FALSE",
      [player_id, skill_id],
      (err, result) => {

        if (err || !result.length) {
          return res.send("Skill not available");
        }

        const playerSkillId = result[0].player_skill_id;

        // MARK AS USED
        db.query(
          "UPDATE player_skill SET is_skill_used=TRUE WHERE player_skill_id=?",
          [playerSkillId],
          (err2) => {

            if (err2) return res.send("Error using skill");

            let message = "Skill activated!";

            // APPLY SKILL EFFECT

            // Sprint
            if (skill_id == 1) {
              db.query(
                "UPDATE player SET active_skill = 1 WHERE player_id = ?",
                [player_id]
              );
              message = "⚡ Sprint activated! +2 tiles";
            }

            // Erase
            if (skill_id == 2) {
              db.query(
                "UPDATE player SET active_skill = 2 WHERE player_id = ?",
                [player_id]
              );
              message = "🧠 Erase activated! One wrong option will be removed";
            }

            // Immunity
            if (skill_id == 3) {
              db.query(
                "UPDATE player SET active_skill = 3 WHERE player_id = ?",
                [player_id]
              );
              message = "🛡 Immunity activated! No penalty this turn";
            }

            // Vaccine
            if (skill_id == 4) {
              db.query(
                "UPDATE player SET active_skill = 4 WHERE player_id = ?",
                [player_id]
              );

              message = "💉 Vaccine ready!";
            }

            // Block 
            if (skill_id == 5) {
              db.query(
                "UPDATE player SET active_skill = 5 WHERE player_id = ?",
                [player_id]
              );
              message = "🚫 Block activated! Next player will skip turn";
            }

            res.send(message);
          }
        );

      }
    );
  });
    return router;
};
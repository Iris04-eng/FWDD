const express = require("express");
const router = express.Router();

module.exports = (db) => {
  router.get('/check-session', (req, res) => {
    if (req.session.user) {
      res.json({ loggedIn: true });
    } else {
      res.json({ loggedIn: false });
    }
  });
  
  router.post("/login", (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).render("login", {
        message: "Please provide username and password"
      });
    }

    const userQuery = "SELECT * FROM user WHERE username = ?";
    
    db.query(userQuery, [username], (error, results) => {
      if (error) {
        console.error("Database error:", error);
        return res.status(500).render("login", { message: "Server error." });
      }

      if (results.length === 0 || password !== results[0].password) {
        return res.status(401).render("login", {
          message: "Invalid username or password"
        });
      }

      const user = results[0];
      req.session.user = {
        id: user.user_id,
        username: user.username,
        email: user.email
      };

      console.log(`✓ User logged in: ${username}`);
      return res.redirect("/lobby");
    });
  });

  router.post("/register", (req, res) => {
    const { username, email, password } = req.body;
    if (!username || !email || !password) {
      return res.status(400).render("register", { message: "Please provide all fields" });
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(email)) {
      return res.status(400).render("register", {
        message: "Please enter a valid email address (e.g. name@example.com)."
      });
    }
    const checkQuery = "SELECT username, email FROM user WHERE username = ? OR email = ?";
    db.query(checkQuery, [username, email], (error, results) => {
      if (error) {
        console.error("Database error:", error);
        return res.status(500).render("register", { message: "Server error." });
      }
      if (results.length > 0) {
        const existingUser = results[0];
        if (existingUser.username.toLowerCase() === username.toLowerCase()) {
          return res.status(400).render("register", { message: "Username is already taken." });
        } 
        if (existingUser.email.toLowerCase() === email.toLowerCase()) {
          return res.status(400).render("register", { message: "Email is already registered." });
        }
      }
      const insertQuery = "INSERT INTO user (username, email, password) VALUES (?, ?, ?)";
      db.query(insertQuery, [username, email, password], (error, results) => {
        if (error) {
          console.error("INSERT error:", error);
          return res.status(500).render("register", { message: "Error creating account." });
        }
        console.log(`✓ New user registered: ${username}`);
        req.session.user = {
          id: results.insertId,
          username: username,
          email: email
        };
        return res.redirect("/lobby");
      });
    });
  });

  router.get("/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        console.error("Session destroy error:", err);
        return res.status(500).send("Error logging out");
      }
      console.log(`✓ User logged out`);
      return res.redirect("/");
    });
  });

  return router;
};

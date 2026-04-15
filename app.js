// 1. IMPORT DEPENDENCIES
const express = require("express");
const path = require("path");
const mysql = require("mysql2");
const session = require("express-session");
const http = require("http");
const { Server } = require("socket.io");

// 2. INITIALIZE EXPRESS APP
const app = express();

// 3. DATABASE CONFIGURATION
const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "Iris2004@",
  database: "FWDD_assignment"
});

// Connect to database
db.connect((err) => {
  if (err) {
    console.error("Database connection failed:", err.message);
    return;
  }
  console.log("Connected to FWDD_assignment database");
});

// 4. MIDDLEWARE CONFIGURATION
app.use(express.static(path.join(__dirname, "public")));

// Body parser for form data
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 5. SESSION CONFIGURATION
app.use(session({
  secret: "zombiegame", 
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false, maxAge: 1000 * 60 * 60 * 24 } 
}));

app.use((req, res, next) => {
  res.locals.user = req.session.user;
  next();
});

// 6. VIEW ENGINE SETUP
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "pug");

// 7. AUTHENTICATION & GAME ROUTES
const authRoutes = require("./routes/authenticate")(db);
app.use("/auth", authRoutes);

const gameRoutes = require("./routes/game")(db);
app.use("/", gameRoutes);

const questionRoutes = require("./routes/question")(db);
app.use("/api/question", questionRoutes);

const skillRoutes = require("./routes/skill")(db);
app.use("/", skillRoutes);

// 8. PAGE ROUTES 
app.get("/", (req, res) => {
  res.render("mainPage");
});

app.get("/mainPage", (req, res) => {
  res.render("mainPage");
});

app.get('/login', (req, res) => {
  res.render('login');
});

app.get('/register', (req, res) => {
  res.render('register');
});

app.get('/lobby', (req, res) => {
  res.render('lobby', { showHeader: true });
});

app.get('/join', (req, res) => {
  res.render('joinUI', { showHeader: true });
});

app.get("/gameRulesIntro/:game_id", (req, res) => {
  res.render("gameRulesIntro", {
    game_id: req.params.game_id,
    showHeader: false
  });
});

// app.get("/game/:game_id", (req, res) => {
//   res.render("gamePlay", {
//     game_id: req.params.game_id,
//     player_id: req.session.player_id,
//     showHeader: true
//   });
// });

// 9. START SERVER
const PORT = 3000;

const server = http.createServer(app);
const io = new Server(server);

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  // join game room
  socket.on("joinRoom", (game_id) => {
    socket.join(game_id);
    console.log(`Socket ${socket.id} joined room ${game_id}`);
  });

  socket.on("startGame", (game_id) => {
    console.log("Game starting for room:", game_id);

    io.to(game_id).emit("gameStarted", game_id);
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });
});

server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
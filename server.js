require("dotenv").config();
const express = require("express");
const connectToDb = require("./config/db");
const router = require("./routes/auth");
const cookieParser = require("cookie-parser");
const helmet = require("helmet");
const morgan = require("morgan");
const cors = require("cors");
const { Server } = require("socket.io");
const http = require("http");
const { v4: uuidv4 } = require("uuid");
const activeRooms = new Map();
const authorise = require("./middlewares/auth");
const jsonwebtoken = require("jsonwebtoken");

const app = express();

app.use(
  cors({
    origin: process.env.CLIENT_ORIGIN || "http://localhost:3000", 
    credentials: true, 
  })
);
app.use(cookieParser());
app.use(helmet());
app.use(express.json());
app.use(morgan("dev"));
app.use("/app", router);


connectToDb(process.env.MONGODB_URI);

app.post("/create-room", authorise, (req, res) => {
  try {
    const roomId = uuidv4();
    activeRooms.set(roomId, {
      participants: new Set(),
      createdAt: Date.now(),
    });
    return res.status(200).json({ roomId });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Internal server error" });
  }
});

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_ORIGIN || "http://localhost:3000",
    methods: ["GET", "POST"],
  },
});

io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  if (!token) {
    return next(new Error("Authorization failed: No token provided"));
  }

  try {
    const decoded = jsonwebtoken.verify(token, process.env.JWT_SECRET);
    socket.user = decoded; 
    next();
  } catch (err) {
    console.error("JWT verification failed:", err);
    next(new Error("Authorization failed: Invalid token"));
  }
});

io.on("connection", (socket) => {
  console.log("New user connected:", socket.id);

  socket.on("join-room", (roomId) => {
    if (!activeRooms.has(roomId)) {
      return socket.emit("error", "Room does not exist");
    }

    const room = activeRooms.get(roomId);
    room.participants.add(socket.id);
    socket.roomId = roomId;
    socket.join(roomId);
    socket.to(roomId).emit("user-joined", socket.id);
    console.log(`User ${socket.id} joined room ${roomId}`);
  });

  socket.on("disconnect", () => {
    const roomId = socket.roomId;
    if (!roomId || !activeRooms.has(roomId)) return;

    const room = activeRooms.get(roomId);
    room.participants.delete(socket.id);

    io.to(roomId).emit("user-disconnected", socket.id);
    console.log(`User ${socket.id} disconnected from room ${roomId}`);

    if (room.participants.size === 0) {
      activeRooms.delete(roomId);
      console.log(`Room ${roomId} deleted`);
    }
  });
});

server.listen(process.env.PORT, () => {
  console.log(`Server running on port: ${process.env.PORT}`);
});
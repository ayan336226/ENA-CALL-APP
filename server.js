// server.js
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const path = require("path");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*" }
});

app.use(express.static(path.join(__dirname, "public")));

// map userId -> socketId
const userSocketMap = new Map();

io.on("connection", (socket) => {
  console.log("🔌 Socket connected:", socket.id);

  // Register a userId when client connects (so server knows which socket belongs to which user)
  socket.on("register", (userId) => {
    userSocketMap.set(userId, socket.id);
    socket.userId = userId;
    console.log("➡️ Registered:", userId, "->", socket.id);
  });

  // When caller wants to call a userId
  socket.on("call-user", (data) => {
    const targetSocketId = userSocketMap.get(data.toUserId);
    if (targetSocketId) {
      io.to(targetSocketId).emit("incoming-call", {
        fromUserId: data.fromUserId,
        offer: data.offer
      });
    } else {
      // target offline or not registered
      socket.emit("user-offline", { toUserId: data.toUserId });
    }
  });

  // Answering the call (send answer back to caller)
  socket.on("answer-call", (data) => {
    const targetSocketId = userSocketMap.get(data.toUserId);
    if (targetSocketId) {
      io.to(targetSocketId).emit("call-answered", {
        fromUserId: data.fromUserId,
        answer: data.answer
      });
    }
  });

  // ICE candidates forwarding
  socket.on("send-candidate", (data) => {
    const targetSocketId = userSocketMap.get(data.toUserId);
    if (targetSocketId) {
      io.to(targetSocketId).emit("candidate", {
        fromUserId: data.fromUserId,
        candidate: data.candidate
      });
    }
  });

  socket.on("disconnect", () => {
    console.log("❌ Socket disconnected:", socket.id);
    // Remove any userId mapped to this socket
    for (const [uid, sid] of userSocketMap.entries()) {
      if (sid === socket.id) {
        userSocketMap.delete(uid);
        console.log("🗑️ Removed mapping:", uid);
        break;
      }
    }
  });
});

server.listen(3000, () => console.log("🚀 Server running on http://localhost:3000"));

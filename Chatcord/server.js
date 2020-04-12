const path = require("path");
const http = require("http");
const express = require("express");
const socketio = require("socket.io");
const formatMessage = require("./utils/messages");
const {
  userJoin,
  getCurrentUser,
  userLeave,
  getRoomUsers
} = require("./utils/users");

const app = express();
const server = http.createServer(app);
const io = socketio(server);

const botName = "Chatcord Bot";

// Set static folder
app.use(express.static(path.join(__dirname, "public")));

// Run when client connects
io.on("connection", socket => {
  socket.on("joinRoom", ({ username, room }) => {
    const user = userJoin(socket.id, username, room);

    socket.join(user.room);

    socket.emit("message", formatMessage(botName, "Welcome to ChatCord!")); // Shows to ONLY main client

    // Broadcast when a user connects (shows to all people EXCEPT main client)
    socket.broadcast
      .to(user.room)
      .emit(
        "message",
        formatMessage(botName, `${user.username} has joined the chat`)
      );
  });

  // Listen for chatMessage
  socket.on("chatMessage", msg => {
    const user = getCurrentUser(socket.id);

    io.to(user.room).emit("message", formatMessage(user.username, msg));
  });

  // Run when client disconnects
  socket.on("disconnect", () => {
    const user = getCurrentUser(socket.id);
    userLeave(user.id);

    if (user) {
      // Broadcast to ALL people
      io.to(user.room).emit(
        "message",
        formatMessage(botName, `A ${user.username} has left the chat`)
      );
    }
  });
});

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => console.log(`Server running on port ${PORT}`));

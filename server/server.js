// server.js

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log('✅ MongoDB connected'))
    .catch(err => console.error('❌ MongoDB connection error:', err));

// Socket.IO Setup
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "http://localhost:3000",
        methods: ["GET", "POST"]
    }
});

const aliases = {}; // Store user aliases
const userSockets = {}; // Map user alias to socket.id

// Handle user connection
io.on('connection', (socket) => {
    console.log(`🟢 User connected: ${socket.id}`);

    // Assign alias on connection
    const alias = `User_${Math.floor(Math.random() * 10000)}`;
    aliases[socket.id] = alias;
    userSockets[alias] = socket.id;

    socket.emit('assign_alias', { alias });
    console.log(`🆔 Alias assigned: ${alias}`);

    // Handle Direct Messages
    socket.on('send_direct_message', ({ targetUser, content }) => {
        if (!targetUser || !content) {
            console.log('❌ Invalid direct message request');
            return;
        }

        const targetSocketId = userSockets[targetUser];
        if (targetSocketId) {
            io.to(targetSocketId).emit('receive_direct_message', {
                sender: aliases[socket.id],
                content,
            });
            console.log(`📤 Direct message from ${aliases[socket.id]} to ${targetUser}: ${content}`);
        } else {
            console.log(`❌ Target user ${targetUser} not found`);
        }
    });

    // Handle Disconnect
    socket.on('disconnect', () => {
        console.log(`❌ User disconnected: ${socket.id}`);
        delete userSockets[aliases[socket.id]];
        delete aliases[socket.id];
    });
});

// Basic Route
app.get('/', (req, res) => {
    res.send('✅ Anonymous Chat App Backend is Running');
});

// Start Server
server.listen(PORT, () => {
    console.log(`✅ Server is running on port ${PORT}`);
});

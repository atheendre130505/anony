// src/pages/Chat.js

import React, { useState, useEffect } from 'react';
import io from 'socket.io-client';

const socket = io('http://localhost:5000'); // Connect to backend

function Chat() {
    const [message, setMessage] = useState('');
    const [messages, setMessages] = useState([]);
    const [alias, setAlias] = useState('');
    const [targetUser, setTargetUser] = useState(''); // User to send messages to

    useEffect(() => {
        // Assign alias on connection
        socket.on('assign_alias', (data) => {
            setAlias(data.alias);
        });

        // Receive Direct Messages
        socket.on('receive_direct_message', (data) => {
            setMessages((prev) => [
                ...prev,
                { sender: data.sender, content: data.content, type: 'direct' }
            ]);
        });

        return () => {
            socket.off('assign_alias');
            socket.off('receive_direct_message');
        };
    }, []);

    // 🟢 Send Direct Message
    const sendDirectMessage = () => {
        if (!message.trim() || !targetUser) {
            alert('Enter a message and target user alias');
            return;
        }

        socket.emit('send_direct_message', { targetUser, content: message });

        setMessages((prev) => [
            ...prev,
            { sender: 'You (Direct)', content: message, type: 'direct' }
        ]);
        setMessage('');
    };

    return (
        <div>
            <h1>🔒 Anonymous Chat</h1>
            <h3>Your Alias: {alias}</h3>

            {/* Direct Chat Section */}
            <div>
                <h4>📥 Direct Chat</h4>
                <input
                    value={targetUser}
                    onChange={(e) => setTargetUser(e.target.value)}
                    placeholder="Target User Alias"
                />
                <button onClick={sendDirectMessage}>Send Direct Message</button>
            </div>

            {/* Chat Messages */}
            <div style={{ border: '1px solid black', height: '300px', overflowY: 'scroll', marginTop: '20px' }}>
                {messages.map((msg, index) => (
                    <p key={index}>
                        <strong>{msg.sender}:</strong> {msg.content}
                    </p>
                ))}
            </div>

            {/* Message Input */}
            <input
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Type your message"
            />
        </div>
    );
}

export default Chat;

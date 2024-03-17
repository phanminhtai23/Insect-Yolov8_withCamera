const express = require('express');
require('dotenv').config()
const cors = require('cors');
const app = express();
const port = process.env.PORT || 3000;
const path = require('path');
const hostname = process.env.HOST_NAME;
const fs = require('fs');

app.use(cors());
app.use(express.static(path.join(__dirname, '../src/public')))


app.get('/', (req, res) => {
    res.send("index.html");
});

// Route để lấy thông tin người dùng theo ID
app.get('/api/users/:id', (req, res) => {
    fs.readFile('C:/Users/MINH TAI/Desktop/Nhận dạng côn trùng hại lúa/code/tensorflow/sever1/src/public/data/data.json', 'utf8', (err, data) => {
        if (err) {
            console.error('Error reading file:', err);
            return;
        }
        const users = JSON.parse(data);
        const userId = parseInt(req.params.id);
        const user = users.find(user => user.id === userId);
        if (user) {
            res.json(user);
            console.log("sever tra data", user);
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    });
});


app.listen(port, hostname, () => {
    console.log(`Server is running on http://${hostname}:${port}`);
});

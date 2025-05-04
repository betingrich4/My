require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();
app.use(cors());
app.use(express.json());

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI || 'mongodb+srv://ellyongiro8:<db_password>@cluster0.tyxcmm9.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0', {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
.then(() => console.log('Connected to MongoDB'))
.catch(err => console.error('MongoDB connection error:', err));

// User Schema
const userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    phoneNumber: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    theme: { type: String, default: 'light' },
    createdAt: { type: Date, default: Date.now }
});

// Message Schema
const messageSchema = new mongoose.Schema({
    sender: { type: String, required: true },
    receiver: { type: String, required: true },
    text: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
    read: { type: Boolean, default: false }
});

const User = mongoose.model('User', userSchema);
const Message = mongoose.model('Message', messageSchema);

// Authentication Middleware
const authenticate = async (req, res, next) => {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) return res.status(401).send('Access denied');

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret');
        req.user = await User.findById(decoded._id);
        next();
    } catch (err) {
        res.status(400).send('Invalid token');
    }
};

// Routes
app.post('/api/register', async (req, res) => {
    try {
        const { username, phoneNumber, password } = req.body;
        
        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);
        
        const user = new User({
            username,
            phoneNumber,
            password: hashedPassword
        });
        
        await user.save();
        
        // Generate token
        const token = jwt.sign({ _id: user._id }, process.env.JWT_SECRET || 'your_jwt_secret');
        
        res.status(201).send({ user, token });
    } catch (err) {
        res.status(400).send(err.message);
    }
});

app.post('/api/login', async (req, res) => {
    try {
        const { username, phoneNumber, password } = req.body;
        const user = await User.findOne({ 
            $or: [{ username }, { phoneNumber }] 
        });
        
        if (!user) throw new Error('User not found');
        
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) throw new Error('Invalid credentials');
        
        const token = jwt.sign({ _id: user._id }, process.env.JWT_SECRET || 'your_jwt_secret');
        res.send({ user, token });
    } catch (err) {
        res.status(400).send(err.message);
    }
});

app.get('/api/messages', authenticate, async (req, res) => {
    try {
        const messages = await Message.find({
            $or: [
                { sender: req.user.username },
                { receiver: req.user.username }
            ]
        }).sort('timestamp');
        
        res.send(messages);
    } catch (err) {
        res.status(500).send(err.message);
    }
});

app.post('/api/messages', authenticate, async (req, res) => {
    try {
        const { receiver, text } = req.body;
        
        const message = new Message({
            sender: req.user.username,
            receiver,
            text
        });
        
        await message.save();
        res.status(201).send(message);
    } catch (err) {
        res.status(400).send(err.message);
    }
});

app.put('/api/user/theme', authenticate, async (req, res) => {
    try {
        const { theme } = req.body;
        req.user.theme = theme;
        await req.user.save();
        res.send(req.user);
    } catch (err) {
        res.status(400).send(err.message);
    }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

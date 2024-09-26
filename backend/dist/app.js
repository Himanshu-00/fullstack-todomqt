"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const body_parser_1 = __importDefault(require("body-parser"));
const cors_1 = __importDefault(require("cors"));
const mqtt_1 = __importDefault(require("mqtt"));
const redis_1 = require("redis");
const mongodb_1 = require("mongodb");
const app = (0, express_1.default)();
const mqttClient = mqtt_1.default.connect('mqtt://broker.hivemq.com'); // Public broker
const mongoUri = 'mongodb+srv://assignment_user:HCgEj5zv8Hxwa4xO@test-cluster.6f94f5o.mongodb.net/assignment?retryWrites=true&w=majority';
const mongoClient = new mongodb_1.MongoClient(mongoUri);
const dbName = 'assignment';
let db;
const TASK_CACHE_KEY = 'FULLSTACK_TASK_HIMANSHU';
// Configure Redis for RedisLabs
const redisClient = (0, redis_1.createClient)({
    url: 'redis://default:dssYpBnYQrl01GbCGVhVq2e4dYvUrKJB@redis-12675.c212.ap-south-1-1.ec2.cloud.redislabs.com:12675',
});
// Middleware
app.use((0, cors_1.default)());
app.use(body_parser_1.default.json());
// Initialize Redis client
redisClient.connect()
    .then(() => {
    console.log('Connected to Redis');
})
    .catch(err => console.error('Redis Connection Error:', err));
// Connect to MongoDB
mongoClient.connect()
    .then(client => {
    db = client.db(dbName);
    console.log('Connected to MongoDB');
})
    .catch(err => console.error('MongoDB Connection Error:', err));
// MQTT setup
mqttClient.on('connect', () => {
    console.log('MQTT Connected');
    mqttClient.subscribe('/add', (err) => {
        if (!err) {
            console.log('Subscribed to /add');
        }
    });
});
// MQTT message handler
mqttClient.on('message', (topic, message) => __awaiter(void 0, void 0, void 0, function* () {
    if (topic === '/add') {
        const task = message.toString();
        yield addTaskToCache(task);
    }
}));
const addTaskToCache = (task) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const cachedTasks = yield redisClient.get(TASK_CACHE_KEY);
        let tasks = cachedTasks ? JSON.parse(cachedTasks) : [];
        tasks.push(task);
        if (tasks.length > 50) {
            // Move tasks to MongoDB if more than 50
            yield db.collection('assignment_himanshu').insertMany(tasks.map((t) => ({ task: t })));
            tasks = [];
        }
        // Store updated tasks in Redis
        yield redisClient.set(TASK_CACHE_KEY, JSON.stringify(tasks));
    }
    catch (error) {
        console.error('Error adding task:', error);
    }
});
// Add new task endpoint
app.post('/addTask', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { task } = req.body;
    if (!task) {
        return res.status(400).json({ error: 'Task is required' });
    }
    try {
        yield addTaskToCache(task);
        res.status(201).json({ message: 'Task added successfully', task });
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to add task' });
    }
}));
// Fetch all tasks from Redis and MongoDB
app.get('/fetchAllTasks', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const cachedTasks = yield redisClient.get(TASK_CACHE_KEY);
        let tasks = cachedTasks ? JSON.parse(cachedTasks) : [];
        // Fetch tasks from MongoDB
        const mongoTasks = yield db.collection('assignment_himanshu').find().toArray();
        mongoTasks.forEach((taskDoc) => tasks.push(taskDoc.task));
        res.json({ tasks });
    }
    catch (error) {
        res.status(500).send('Error fetching tasks');
    }
}));
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

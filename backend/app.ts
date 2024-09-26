import express, { Request, Response } from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import mqtt from 'mqtt';
import { createClient } from 'redis';
import { MongoClient } from 'mongodb';

const app = express();
const mqttClient = mqtt.connect('mqtt://broker.hivemq.com'); // Public broker
const mongoUri = 'mongodb+srv://assignment_user:HCgEj5zv8Hxwa4xO@test-cluster.6f94f5o.mongodb.net/assignment?retryWrites=true&w=majority';
const mongoClient = new MongoClient(mongoUri);
const dbName = 'assignment';
let db: any;

const TASK_CACHE_KEY = 'FULLSTACK_TASK_HIMANSHU';

// Configure Redis for RedisLabs
const redisClient = createClient({
    url: 'redis://default:dssYpBnYQrl01GbCGVhVq2e4dYvUrKJB@redis-12675.c212.ap-south-1-1.ec2.cloud.redislabs.com:12675',
});

// Middleware
app.use(cors());
app.use(bodyParser.json());

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
mqttClient.on('message', async (topic: string, message: Buffer) => {
    if (topic === '/add') {
        const task = message.toString();
        await addTaskToCache(task);
    }
});

const addTaskToCache = async (task: string): Promise<void> => {
    try {
        const cachedTasks = await redisClient.get(TASK_CACHE_KEY);
        let tasks: string[] = cachedTasks ? JSON.parse(cachedTasks) : [];

        tasks.push(task);

        if (tasks.length > 50) {
            // Move tasks to MongoDB if more than 50
            await db.collection('assignment_himanshu').insertMany(tasks.map((t: string) => ({ task: t })));
            tasks = [];
        }

        // Store updated tasks in Redis
        await redisClient.set(TASK_CACHE_KEY, JSON.stringify(tasks));
    } catch (error) {
        console.error('Error adding task:', error);
    }
};

// Add new task endpoint
app.post('/addTask', async (req: Request, res: Response) => {
    const { task } = req.body;
    if (!task) {
        return res.status(400).json({ error: 'Task is required' });
    }

    try {
        await addTaskToCache(task);
        res.status(201).json({ message: 'Task added successfully', task });
    } catch (error) {
        res.status(500).json({ error: 'Failed to add task' });
    }
});

// Fetch all tasks from Redis and MongoDB
app.get('/fetchAllTasks', async (req: Request, res: Response) => {
    try {
        const cachedTasks = await redisClient.get(TASK_CACHE_KEY);
        let tasks: string[] = cachedTasks ? JSON.parse(cachedTasks) : [];

        // Fetch tasks from MongoDB
        const mongoTasks = await db.collection('assignment_himanshu').find().toArray();
        mongoTasks.forEach((taskDoc: any) => tasks.push(taskDoc.task));

        res.json({ tasks });
    } catch (error) {
        res.status(500).send('Error fetching tasks');
    }
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

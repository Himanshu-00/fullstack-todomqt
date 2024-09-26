import express from 'express';
import { createClient } from 'redis';
import { MongoClient } from 'mongodb';

const router = express.Router();

// Create Redis client using promises (v4)
const redisClient = createClient({
  url: 'redis://default:dssYpBnYQrl01GbCGVhVq2e4dYvUrKJB@redis-12675.c212.ap-south-1-1.ec2.cloud.redislabs.com:12675',
});

// Ensure Redis is connected
redisClient.on('error', (err) => console.log('Redis Client Error', err));
redisClient.connect();

// MongoDB setup (without deprecated options)
const mongoClient = new MongoClient('mongodb+srv://assignment_user:HCgEj5zv8Hxwa4xO@test-cluster.6f94f5o.mongodb.net/');

let collection: any;
mongoClient.connect().then(() => {
  const db = mongoClient.db('assignment');
  collection = db.collection('assignment_Himanshu'); // Correctly setting the collection
});

// Middleware to parse JSON
router.use(express.json());

// Fetch all tasks
router.get('/fetchAllTasks', async (req, res) => {
  try {
    const cachedTasks = await redisClient.get('FULLSTACK_TASK_Himanshu');
    if (cachedTasks) {
      return res.json({ tasks: JSON.parse(cachedTasks) });
    } else {
      const tasks = await collection.find().toArray();
      return res.json({ tasks });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch tasks' });
  }
});

// Add new task
router.post('/addTask', async (req, res) => {
  const { task } = req.body;
  if (!task) {
    return res.status(400).json({ error: 'Task is required' });
  }

  try {
    const cachedTasks = await redisClient.get('FULLSTACK_TASK_Himanshu');
    let tasks = cachedTasks ? JSON.parse(cachedTasks) : [];

    tasks.push(task);

    if (tasks.length > 50) {
      await collection.insertMany(tasks.map(t => ({ task: t })));
      await redisClient.del('FULLSTACK_TASK_Himanshu'); // Clear Redis cache
    } else {
      await redisClient.set('FULLSTACK_TASK_Himanshu', JSON.stringify(tasks));
    }

    res.json({ tasks });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to add task' });
  }
});

// Remove task
router.delete('/removeTask', async (req, res) => {
  const { task } = req.body;
  if (!task) {
    return res.status(400).json({ error: 'Task is required' });
  }

  try {
    const cachedTasks = await redisClient.get('FULLSTACK_TASK_Himanshu');
    let tasks = cachedTasks ? JSON.parse(cachedTasks) : [];

    tasks = tasks.filter((t: string) => t !== task);

    await redisClient.set('FULLSTACK_TASK_Himanshu', JSON.stringify(tasks));

    res.json({ tasks });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to remove task' });
  }
});

export default router;

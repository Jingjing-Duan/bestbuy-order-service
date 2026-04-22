const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');

const ordersRouter = require('./routes/orders');
const { connectRabbitMQ } = require('./rabbitmq');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.use('/orders', ordersRouter);

app.get('/', (req, res) => {
  res.send('Order Service is running');
});

mongoose
  .connect(process.env.MONGO_URL)
  .then(async () => {
    console.log('Connected to MongoDB');
    await connectRabbitMQ();

    app.listen(PORT, () => {
      console.log(`Order Service running on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.error('MongoDB connection failed:', error.message);
  });
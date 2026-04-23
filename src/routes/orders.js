const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const { getChannel } = require('../rabbitmq');

// GET all orders
router.get('/', async (req, res) => {
  try {
    const orders = await Order.find().sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET single order
router.get('/:id', async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    res.json(order);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST create order
router.post('/', async (req, res) => {
  try {
    const { customerName, customerEmail, items } = req.body;

    if (!customerName || !customerEmail || !items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    for (const item of items) {
      if (
        !item.sku ||
        !item.name ||
        item.price == null ||
        item.quantity == null
      ) {
        return res.status(400).json({ message: 'Each item must include sku, name, price, and quantity' });
      }
    }

    const totalAmount = items.reduce((sum, item) => {
      return sum + Number(item.price) * Number(item.quantity);
    }, 0);

    const order = new Order({
      customerName,
      customerEmail,
      items,
      totalAmount,
      status: 'Pending'
    });

    const savedOrder = await order.save();

    const channel = getChannel();
    if (channel) {
        channel.publish(
        'order.created',
        '',
        Buffer.from(JSON.stringify(savedOrder))
    );
      console.log('Order sent to RabbitMQ:', savedOrder._id.toString());
    } else {
      console.log('RabbitMQ channel not available');
    }

    res.status(201).json(savedOrder);
  } catch (error) {
    console.error('Create order failed:', error.message);
    res.status(500).json({ message: error.message });
  }
});

// PUT update order status
router.put('/:id', async (req, res) => {
  try {
    const { status } = req.body;

    const allowedStatuses = ['Pending', 'Processing', 'Completed', 'Cancelled'];

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid status value' });
    }

    const updatedOrder = await Order.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );

    if (!updatedOrder) {
      return res.status(404).json({ message: 'Order not found' });
    }

    res.json(updatedOrder);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
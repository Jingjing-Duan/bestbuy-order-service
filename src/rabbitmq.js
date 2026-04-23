const amqp = require('amqplib');

let channel;

async function connectRabbitMQ() {
  try {
    const connection = await amqp.connect(process.env.RABBITMQ_URL);
    channel = await connection.createChannel();

    await channel.assertExchange('order.created', 'fanout', {
      durable: true
    });

    console.log('Connected to RabbitMQ (exchange: order.created)');
  } catch (error) {
    console.error('RabbitMQ connection failed:', error.message);
  }
}

function getChannel() {
  return channel;
}

module.exports = {
  connectRabbitMQ,
  getChannel
};
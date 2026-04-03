import express, { Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(helmet());
app.use(cors());
app.use(express.json());

app.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    service: 'brightcart-api',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

app.get('/products', (req: Request, res: Response) => {
  res.json({
    success: true,
    data: [
      { id: 1, name: 'Wireless Headphones', price: 99.99, category: 'Electronics', stock: 50 },
      { id: 2, name: 'Running Shoes',        price: 59.99, category: 'Sports',      stock: 30 },
      { id: 3, name: 'Coffee Maker',         price: 49.99, category: 'Kitchen',     stock: 20 },
      { id: 4, name: 'Backpack',             price: 39.99, category: 'Accessories', stock: 100 },
      { id: 5, name: 'Desk Lamp',            price: 29.99, category: 'Home',        stock: 45 },
      { id: 6, name: 'Yoga Mat',             price: 24.99, category: 'Sports',      stock: 60 },
    ],
  });
});

app.post('/orders', (req: Request, res: Response) => {
  const { items, customerId } = req.body;
  if (!items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ success: false, message: 'No items in order' });
  }
  const order = {
    id: `ORD-${Date.now()}`,
    customerId: customerId || 'guest',
    items,
    status: 'pending',
    createdAt: new Date().toISOString(),
    total: items.reduce((sum: number, item: any) => sum + item.price, 0),
  };
  console.log(`New order: ${order.id}`);
  res.status(201).json({ success: true, data: order });
});

app.use((req: Request, res: Response) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

app.listen(PORT, () => {
  console.log(`BrightCart API running on port ${PORT}`);
});

export default app;
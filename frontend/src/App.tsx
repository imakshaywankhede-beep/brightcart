import React, { useState, useEffect } from 'react';

interface Product {
  id: number;
  name: string;
  price: number;
  category: string;
}

const mockProducts: Product[] = [
  { id: 1, name: 'Wireless Headphones', price: 99.99, category: 'Electronics' },
  { id: 2, name: 'Running Shoes',       price: 59.99, category: 'Sports' },
  { id: 3, name: 'Coffee Maker',        price: 49.99, category: 'Kitchen' },
  { id: 4, name: 'Backpack',            price: 39.99, category: 'Accessories' },
  { id: 5, name: 'Desk Lamp',           price: 29.99, category: 'Home' },
  { id: 6, name: 'Yoga Mat',            price: 24.99, category: 'Sports' },
];

function App() {
  const [cart, setCart] = useState<Product[]>([]);
  const [apiStatus, setApiStatus] = useState<string>('checking...');
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetch('/api/health')
      .then(res => res.json())
      .then(data => setApiStatus(data.status))
      .catch(() => setApiStatus('API not connected — normal in local dev'));
  }, []);

  const addToCart = (product: Product) => {
    setCart(prev => [...prev, product]);
  };

  const filtered = mockProducts.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ fontFamily: 'sans-serif', maxWidth: 900, margin: '0 auto', padding: 24 }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32, borderBottom: '2px solid #eee', paddingBottom: 16 }}>
        <h1 style={{ margin: 0, color: '#232f3e' }}>BrightCart</h1>
        <div style={{ background: '#ff9900', color: 'white', padding: '8px 16px', borderRadius: 20, fontWeight: 'bold' }}>
          Cart: {cart.length} items
        </div>
      </div>

      {/* API Status */}
      <div style={{ background: '#f0f8ff', border: '1px solid #b0d4f1', borderRadius: 8, padding: '10px 16px', marginBottom: 24, fontSize: 14 }}>
        API Status: <strong>{apiStatus}</strong>
      </div>

      {/* Search */}
      <input
        type="text"
        placeholder="Search products..."
        value={search}
        onChange={e => setSearch(e.target.value)}
        style={{ width: '100%', padding: '10px 14px', fontSize: 16, borderRadius: 8, border: '1px solid #ddd', marginBottom: 24, boxSizing: 'border-box' }}
      />

      {/* Product Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 20 }}>
        {filtered.map(product => (
          <div key={product.id} style={{ border: '1px solid #eee', borderRadius: 12, padding: 20, background: 'white', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
            <div style={{ fontSize: 12, color: '#888', marginBottom: 6, textTransform: 'uppercase' }}>{product.category}</div>
            <div style={{ fontSize: 17, fontWeight: 600, marginBottom: 8 }}>{product.name}</div>
            <div style={{ fontSize: 22, color: '#b12704', fontWeight: 'bold', marginBottom: 16 }}>${product.price}</div>
            <button
              onClick={() => addToCart(product)}
              style={{ width: '100%', padding: '10px 0', background: '#ff9900', border: 'none', borderRadius: 8, fontWeight: 'bold', fontSize: 14, cursor: 'pointer' }}
            >
              Add to Cart
            </button>
          </div>
        ))}
      </div>

      {/* Cart Summary */}
      {cart.length > 0 && (
        <div style={{ marginTop: 40, padding: 24, background: '#fafafa', borderRadius: 12, border: '1px solid #eee' }}>
          <h3 style={{ marginTop: 0 }}>Cart Summary</h3>
          {cart.map((item, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #eee' }}>
              <span>{item.name}</span>
              <span>${item.price}</span>
            </div>
          ))}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 12, fontWeight: 'bold', fontSize: 18 }}>
            <span>Total</span>
            <span>${cart.reduce((sum, item) => sum + item.price, 0).toFixed(2)}</span>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
import { collection, addDoc, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { db } from './firebase';

// ─────────────────────────────────────────────
// 100 SA products with image URLs
// Images come from Unsplash (free, no attribution needed)
// ─────────────────────────────────────────────
const PRODUCTS = [
  // ── GROCERIES: Bread & Cereals ──
  { name: 'White Bread 700g',          price: 18,  store: 'Shoprite',   color: 'white',  size: '700g', category: 'groceries', imageUrl: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=200&h=200&fit=crop' },
  { name: 'Brown Bread 700g',          price: 20,  store: 'Checkers',   color: 'brown',  size: '700g', category: 'groceries', imageUrl: 'https://images.unsplash.com/photo-1549931319-a545dcf3bc73?w=200&h=200&fit=crop' },
  { name: 'Whole Wheat Bread',         price: 24,  store: 'Pick n Pay', color: 'brown',  size: '700g', category: 'groceries', imageUrl: 'https://images.unsplash.com/photo-1585478259715-2d9d16ce8ef1?w=200&h=200&fit=crop' },
  { name: 'Corn Flakes 500g',          price: 55,  store: 'Checkers',   color: 'yellow', size: '500g', category: 'groceries', imageUrl: 'https://images.unsplash.com/photo-1521483451569-e33803c0330c?w=200&h=200&fit=crop' },
  { name: 'Oats 1kg',                  price: 42,  store: 'Shoprite',   color: 'white',  size: '1kg',  category: 'groceries', imageUrl: 'https://images.unsplash.com/photo-1517673132405-a56a62b18caf?w=200&h=200&fit=crop' },
  { name: 'Mielie Meal 2.5kg',         price: 45,  store: 'Shoprite',   color: 'yellow', size: '2.5kg',category: 'groceries', imageUrl: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=200&h=200&fit=crop' },
  { name: 'Rice 2kg',                  price: 45,  store: 'Checkers',   color: 'white',  size: '2kg',  category: 'groceries', imageUrl: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=200&h=200&fit=crop' },
  { name: 'Pasta Spaghetti 500g',      price: 22,  store: 'Pick n Pay', color: 'yellow', size: '500g', category: 'groceries', imageUrl: 'https://images.unsplash.com/photo-1551462147-ff29053bfc14?w=200&h=200&fit=crop' },
  { name: 'Sugar 1kg',                 price: 28,  store: 'Shoprite',   color: 'white',  size: '1kg',  category: 'groceries', imageUrl: 'https://images.unsplash.com/photo-1581432347431-1e6a6b95b1b0?w=200&h=200&fit=crop' },
  { name: 'Salt 500g',                 price: 12,  store: 'Checkers',   color: 'white',  size: '500g', category: 'groceries', imageUrl: 'https://images.unsplash.com/photo-1518110925495-ddfc0f5e2e08?w=200&h=200&fit=crop' },

  // ── GROCERIES: Dairy & Eggs ──
  { name: 'Full Cream Milk 2L',        price: 22,  store: 'Pick n Pay', color: 'white',  size: '2L',   category: 'groceries', imageUrl: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=200&h=200&fit=crop' },
  { name: 'Low Fat Milk 2L',           price: 24,  store: 'Checkers',   color: 'blue',   size: '2L',   category: 'groceries', imageUrl: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=200&h=200&fit=crop' },
  { name: 'Eggs (6 pack)',             price: 25,  store: 'Shoprite',   color: 'brown',  size: '6',    category: 'groceries', imageUrl: 'https://images.unsplash.com/photo-1518569656558-1f25e69d93d7?w=200&h=200&fit=crop' },
  { name: 'Eggs (12 pack)',            price: 45,  store: 'Checkers',   color: 'brown',  size: '12',   category: 'groceries', imageUrl: 'https://images.unsplash.com/photo-1518569656558-1f25e69d93d7?w=200&h=200&fit=crop' },
  { name: 'Cheddar Cheese 400g',       price: 65,  store: 'Pick n Pay', color: 'yellow', size: '400g', category: 'groceries', imageUrl: 'https://images.unsplash.com/photo-1486297678162-eb2a19b0a32d?w=200&h=200&fit=crop' },
  { name: 'Yogurt 1L',                 price: 38,  store: 'Checkers',   color: 'white',  size: '1L',   category: 'groceries', imageUrl: 'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=200&h=200&fit=crop' },
  { name: 'Butter 500g',               price: 85,  store: 'Shoprite',   color: 'yellow', size: '500g', category: 'groceries', imageUrl: 'https://images.unsplash.com/photo-1589985270826-4b7bb135bc9d?w=200&h=200&fit=crop' },
  { name: 'Amasi 1L',                  price: 28,  store: 'Pick n Pay', color: 'white',  size: '1L',   category: 'groceries', imageUrl: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=200&h=200&fit=crop' },

  // ── GROCERIES: Meat & Protein ──
  { name: 'Chicken Breast 1kg',        price: 95,  store: 'Checkers',   color: 'pink',   size: '1kg',  category: 'groceries', imageUrl: 'https://images.unsplash.com/photo-1604503468506-a8da13d82791?w=200&h=200&fit=crop' },
  { name: 'Beef Mince 500g',           price: 89,  store: 'Shoprite',   color: 'red',    size: '500g', category: 'groceries', imageUrl: 'https://images.unsplash.com/photo-1588347818036-558601350947?w=200&h=200&fit=crop' },
  { name: 'Boerewors 1kg',             price: 115, store: 'Pick n Pay', color: 'red',    size: '1kg',  category: 'groceries', imageUrl: 'https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?w=200&h=200&fit=crop' },
  { name: 'Tinned Tuna 170g',          price: 32,  store: 'Checkers',   color: 'silver', size: '170g', category: 'groceries', imageUrl: 'https://images.unsplash.com/photo-1611171711791-b34fa42e9fc2?w=200&h=200&fit=crop' },
  { name: 'Baked Beans 410g',          price: 22,  store: 'Shoprite',   color: 'brown',  size: '410g', category: 'groceries', imageUrl: 'https://images.unsplash.com/photo-1588164537573-7e5c0d0fd15e?w=200&h=200&fit=crop' },
  { name: 'Sardines 400g',             price: 28,  store: 'Pick n Pay', color: 'silver', size: '400g', category: 'groceries', imageUrl: 'https://images.unsplash.com/photo-1611171711791-b34fa42e9fc2?w=200&h=200&fit=crop' },
  { name: 'Russian Sausages 500g',     price: 68,  store: 'Checkers',   color: 'red',    size: '500g', category: 'groceries', imageUrl: 'https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?w=200&h=200&fit=crop' },
  { name: 'Chicken Drumsticks 1kg',    price: 75,  store: 'Shoprite',   color: 'pink',   size: '1kg',  category: 'groceries', imageUrl: 'https://images.unsplash.com/photo-1604503468506-a8da13d82791?w=200&h=200&fit=crop' },

  // ── GROCERIES: Fruit & Veg ──
  { name: 'Bananas 1kg',               price: 25,  store: 'Shoprite',   color: 'yellow', size: '1kg',  category: 'groceries', imageUrl: 'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=200&h=200&fit=crop' },
  { name: 'Apples 1kg',                price: 32,  store: 'Checkers',   color: 'red',    size: '1kg',  category: 'groceries', imageUrl: 'https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?w=200&h=200&fit=crop' },
  { name: 'Oranges 1kg',               price: 28,  store: 'Pick n Pay', color: 'orange', size: '1kg',  category: 'groceries', imageUrl: 'https://images.unsplash.com/photo-1547514701-42782101795e?w=200&h=200&fit=crop' },
  { name: 'Tomatoes 1kg',              price: 26,  store: 'Shoprite',   color: 'red',    size: '1kg',  category: 'groceries', imageUrl: 'https://images.unsplash.com/photo-1546470427-227df1e73d7c?w=200&h=200&fit=crop' },
  { name: 'Onions 1kg',                price: 22,  store: 'Checkers',   color: 'brown',  size: '1kg',  category: 'groceries', imageUrl: 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=200&h=200&fit=crop' },
  { name: 'Potatoes 2kg',              price: 42,  store: 'Pick n Pay', color: 'brown',  size: '2kg',  category: 'groceries', imageUrl: 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=200&h=200&fit=crop' },
  { name: 'Carrots 1kg',               price: 20,  store: 'Shoprite',   color: 'orange', size: '1kg',  category: 'groceries', imageUrl: 'https://images.unsplash.com/photo-1598170845058-32b9d6a5da37?w=200&h=200&fit=crop' },
  { name: 'Spinach Bunch',             price: 18,  store: 'Checkers',   color: 'green',  size: '1',    category: 'groceries', imageUrl: 'https://images.unsplash.com/photo-1576045057995-568f588f82fb?w=200&h=200&fit=crop' },
  { name: 'Cabbage Head',              price: 22,  store: 'Pick n Pay', color: 'green',  size: '1',    category: 'groceries', imageUrl: 'https://images.unsplash.com/photo-1550989460-0adf9ea622e2?w=200&h=200&fit=crop' },
  { name: 'Lettuce Head',              price: 20,  store: 'Shoprite',   color: 'green',  size: '1',    category: 'groceries', imageUrl: 'https://images.unsplash.com/photo-1622206151226-18ca2c9ab4a1?w=200&h=200&fit=crop' },

  // ── GROCERIES: Drinks ──
  { name: 'Tea Bags (100)',            price: 55,  store: 'Checkers',   color: 'brown',  size: '100',  category: 'groceries', imageUrl: 'https://images.unsplash.com/photo-1564890369478-c89ca6d9cde9?w=200&h=200&fit=crop' },
  { name: 'Instant Coffee 200g',       price: 78,  store: 'Shoprite',   color: 'brown',  size: '200g', category: 'groceries', imageUrl: 'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=200&h=200&fit=crop' },
  { name: 'Rooibos Tea 80 bags',       price: 62,  store: 'Pick n Pay', color: 'red',    size: '80',   category: 'groceries', imageUrl: 'https://images.unsplash.com/photo-1564890369478-c89ca6d9cde9?w=200&h=200&fit=crop' },
  { name: 'Orange Juice 1.5L',         price: 42,  store: 'Checkers',   color: 'orange', size: '1.5L', category: 'groceries', imageUrl: 'https://images.unsplash.com/photo-1613478223719-2ab802602423?w=200&h=200&fit=crop' },
  { name: 'Coca-Cola 2L',              price: 28,  store: 'Shoprite',   color: 'red',    size: '2L',   category: 'groceries', imageUrl: 'https://images.unsplash.com/photo-1554866585-cd94860890b7?w=200&h=200&fit=crop' },
  { name: 'Still Water 5L',            price: 32,  store: 'Pick n Pay', color: 'blue',   size: '5L',   category: 'groceries', imageUrl: 'https://images.unsplash.com/photo-1523362628745-0c100150b504?w=200&h=200&fit=crop' },
  { name: 'Oros 2L',                   price: 58,  store: 'Checkers',   color: 'orange', size: '2L',   category: 'groceries', imageUrl: 'https://images.unsplash.com/photo-1613478223719-2ab802602423?w=200&h=200&fit=crop' },
  { name: 'Energade 500ml',            price: 22,  store: 'Shoprite',   color: 'blue',   size: '500ml',category: 'groceries', imageUrl: 'https://images.unsplash.com/photo-1622543925917-763c34d1a86e?w=200&h=200&fit=crop' },

  // ── GROCERIES: Snacks ──
  { name: 'Simba Chips 125g',          price: 22,  store: 'Shoprite',   color: 'yellow', size: '125g', category: 'groceries', imageUrl: 'https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=200&h=200&fit=crop' },
  { name: 'Nik Naks 135g',             price: 20,  store: 'Checkers',   color: 'orange', size: '135g', category: 'groceries', imageUrl: 'https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=200&h=200&fit=crop' },
  { name: 'Chocolate Bar 80g',         price: 18,  store: 'Pick n Pay', color: 'brown',  size: '80g',  category: 'groceries', imageUrl: 'https://images.unsplash.com/photo-1511381939415-e44015466834?w=200&h=200&fit=crop' },
  { name: 'Biscuits 200g',             price: 28,  store: 'Shoprite',   color: 'brown',  size: '200g', category: 'groceries', imageUrl: 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=200&h=200&fit=crop' },
  { name: 'Peanuts 200g',              price: 35,  store: 'Checkers',   color: 'brown',  size: '200g', category: 'groceries', imageUrl: 'https://images.unsplash.com/photo-1567892737950-30c4db37cd89?w=200&h=200&fit=crop' },
  { name: 'Popcorn 100g',              price: 18,  store: 'Pick n Pay', color: 'yellow', size: '100g', category: 'groceries', imageUrl: 'https://images.unsplash.com/photo-1578849278619-e73505e9610f?w=200&h=200&fit=crop' },
  { name: 'Jelly Sweets 150g',         price: 25,  store: 'Shoprite',   color: 'mixed',  size: '150g', category: 'groceries', imageUrl: 'https://images.unsplash.com/photo-1582058091505-f87a2e55a40f?w=200&h=200&fit=crop' },
  { name: 'Rusks 500g',                price: 48,  store: 'Checkers',   color: 'brown',  size: '500g', category: 'groceries', imageUrl: 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=200&h=200&fit=crop' },

  // ── GROCERIES: Oils & Condiments ──
  { name: 'Cooking Oil 750ml',         price: 38,  store: 'Pick n Pay', color: 'yellow', size: '750ml',category: 'groceries', imageUrl: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=200&h=200&fit=crop' },
  { name: 'Sunflower Oil 2L',          price: 75,  store: 'Checkers',   color: 'yellow', size: '2L',   category: 'groceries', imageUrl: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=200&h=200&fit=crop' },
  { name: 'Tomato Sauce 700ml',        price: 42,  store: 'Shoprite',   color: 'red',    size: '700ml',category: 'groceries', imageUrl: 'https://images.unsplash.com/photo-1608219992759-8d74ed8d76eb?w=200&h=200&fit=crop' },
  { name: 'Mayonnaise 750g',           price: 55,  store: 'Checkers',   color: 'white',  size: '750g', category: 'groceries', imageUrl: 'https://images.unsplash.com/photo-1608219992759-8d74ed8d76eb?w=200&h=200&fit=crop' },
  { name: 'Vinegar 750ml',             price: 22,  store: 'Pick n Pay', color: 'brown',  size: '750ml',category: 'groceries', imageUrl: 'https://images.unsplash.com/photo-1587143129033-c5895d89e4f0?w=200&h=200&fit=crop' },
  { name: 'Peanut Butter 400g',        price: 62,  store: 'Shoprite',   color: 'brown',  size: '400g', category: 'groceries', imageUrl: 'https://images.unsplash.com/photo-1621607512022-6aecc4fed814?w=200&h=200&fit=crop' },

  // ── TOILETRIES ──
  { name: 'Colgate Toothpaste 100ml',  price: 32,  store: 'Clicks',     color: 'white',  size: '100ml',category: 'toiletries', imageUrl: 'https://images.unsplash.com/photo-1607613009820-a29f7bb81c04?w=200&h=200&fit=crop' },
  { name: 'Toothbrush Soft',           price: 25,  store: 'Clicks',     color: 'blue',   size: '1',    category: 'toiletries', imageUrl: 'https://images.unsplash.com/photo-1607613009820-a29f7bb81c04?w=200&h=200&fit=crop' },
  { name: 'Dove Soap Bar 100g',        price: 18,  store: 'Clicks',     color: 'white',  size: '100g', category: 'toiletries', imageUrl: 'https://images.unsplash.com/photo-1600857544200-b2f666a9a2ec?w=200&h=200&fit=crop' },
  { name: 'Lux Soap 175g',             price: 22,  store: 'Shoprite',   color: 'pink',   size: '175g', category: 'toiletries', imageUrl: 'https://images.unsplash.com/photo-1600857544200-b2f666a9a2ec?w=200&h=200&fit=crop' },
  { name: 'Roll-On Deodorant 50ml',    price: 35,  store: 'Clicks',     color: 'blue',   size: '50ml', category: 'toiletries', imageUrl: 'https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?w=200&h=200&fit=crop' },
  { name: 'Shampoo 400ml',             price: 65,  store: 'Clicks',     color: 'white',  size: '400ml',category: 'toiletries', imageUrl: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=200&h=200&fit=crop' },
  { name: 'Conditioner 400ml',         price: 65,  store: 'Clicks',     color: 'white',  size: '400ml',category: 'toiletries', imageUrl: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=200&h=200&fit=crop' },
  { name: 'Toilet Paper (9 pack)',     price: 68,  store: 'Shoprite',   color: 'white',  size: '9',    category: 'toiletries', imageUrl: 'https://images.unsplash.com/photo-1584556812952-905ffd0c611a?w=200&h=200&fit=crop' },
  { name: 'Toilet Paper (18 pack)',    price: 125, store: 'Checkers',   color: 'white',  size: '18',   category: 'toiletries', imageUrl: 'https://images.unsplash.com/photo-1584556812952-905ffd0c611a?w=200&h=200&fit=crop' },
  { name: 'Sanitary Pads 10s',         price: 42,  store: 'Clicks',     color: 'white',  size: '10',   category: 'toiletries', imageUrl: 'https://images.unsplash.com/photo-1583947215259-38e31be8751f?w=200&h=200&fit=crop' },
  { name: 'Face Wash 150ml',           price: 55,  store: 'Clicks',     color: 'white',  size: '150ml',category: 'toiletries', imageUrl: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=200&h=200&fit=crop' },
  { name: 'Body Lotion 400ml',         price: 62,  store: 'Clicks',     color: 'white',  size: '400ml',category: 'toiletries', imageUrl: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=200&h=200&fit=crop' },
  { name: 'Razors (5 pack)',           price: 48,  store: 'Shoprite',   color: 'blue',   size: '5',    category: 'toiletries', imageUrl: 'https://images.unsplash.com/photo-1621607512022-6aecc4fed814?w=200&h=200&fit=crop' },
  { name: 'Shaving Cream 200ml',       price: 42,  store: 'Clicks',     color: 'white',  size: '200ml',category: 'toiletries', imageUrl: 'https://images.unsplash.com/photo-1621607512022-6aecc4fed814?w=200&h=200&fit=crop' },
  { name: 'Hand Sanitizer 500ml',      price: 55,  store: 'Checkers',   color: 'clear',  size: '500ml',category: 'toiletries', imageUrl: 'https://images.unsplash.com/photo-1584744982491-665216d95f8b?w=200&h=200&fit=crop' },

  // ── CLOTHING ──
  { name: 'Black Hoodie',              price: 299, store: 'Takealot',   color: 'black',  size: 'M',    category: 'clothing', imageUrl: 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=200&h=200&fit=crop' },
  { name: 'Grey Hoodie',               price: 299, store: 'Takealot',   color: 'grey',   size: 'L',    category: 'clothing', imageUrl: 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=200&h=200&fit=crop' },
  { name: 'White T-Shirt',             price: 89,  store: 'Mr Price',   color: 'white',  size: 'M',    category: 'clothing', imageUrl: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=200&h=200&fit=crop' },
  { name: 'Black T-Shirt',             price: 89,  store: 'Mr Price',   color: 'black',  size: 'L',    category: 'clothing', imageUrl: 'https://images.unsplash.com/photo-1503341504253-dff4815485f1?w=200&h=200&fit=crop' },
  { name: 'Navy T-Shirt',              price: 89,  store: 'Mr Price',   color: 'navy',   size: 'M',    category: 'clothing', imageUrl: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=200&h=200&fit=crop' },
  { name: 'Blue Jeans',                price: 349, store: 'Mr Price',   color: 'blue',   size: '32',   category: 'clothing', imageUrl: 'https://images.unsplash.com/photo-1542272604-787c3835535d?w=200&h=200&fit=crop' },
  { name: 'Black Jeans',               price: 349, store: 'Mr Price',   color: 'black',  size: '32',   category: 'clothing', imageUrl: 'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=200&h=200&fit=crop' },
  { name: 'Running Sneakers',          price: 599, store: 'Takealot',   color: 'black',  size: '9',    category: 'clothing', imageUrl: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=200&h=200&fit=crop' },
  { name: 'White Sneakers',            price: 549, store: 'Takealot',   color: 'white',  size: '8',    category: 'clothing', imageUrl: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=200&h=200&fit=crop' },
  { name: 'Grey Socks (3 pack)',       price: 59,  store: 'Mr Price',   color: 'grey',   size: 'M',    category: 'clothing', imageUrl: 'https://images.unsplash.com/photo-1586350977771-b3b0abd50c82?w=200&h=200&fit=crop' },
  { name: 'Black Socks (5 pack)',      price: 79,  store: 'Mr Price',   color: 'black',  size: 'L',    category: 'clothing', imageUrl: 'https://images.unsplash.com/photo-1586350977771-b3b0abd50c82?w=200&h=200&fit=crop' },
  { name: 'Baseball Cap',              price: 129, store: 'Mr Price',   color: 'black',  size: '1',    category: 'clothing', imageUrl: 'https://images.unsplash.com/photo-1588850561407-ed78c282e89b?w=200&h=200&fit=crop' },
  { name: 'Beanie',                    price: 79,  store: 'Mr Price',   color: 'grey',   size: '1',    category: 'clothing', imageUrl: 'https://images.unsplash.com/photo-1576871337622-98d48d1cf531?w=200&h=200&fit=crop' },
  { name: 'Backpack',                  price: 349, store: 'Takealot',   color: 'black',  size: '1',    category: 'clothing', imageUrl: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=200&h=200&fit=crop' },
  { name: 'Sports Shorts',             price: 149, store: 'Mr Price',   color: 'black',  size: 'M',    category: 'clothing', imageUrl: 'https://images.unsplash.com/photo-1591195853828-11db59a44f6b?w=200&h=200&fit=crop' },

  // ── STATIONERY ──
  { name: 'Notebook A5',               price: 25,  store: 'CNA',        color: 'black',  size: 'A5',   category: 'stationery', imageUrl: 'https://images.unsplash.com/photo-1531346878377-a5be20888e57?w=200&h=200&fit=crop' },
  { name: 'Notebook A4',               price: 45,  store: 'CNA',        color: 'black',  size: 'A4',   category: 'stationery', imageUrl: 'https://images.unsplash.com/photo-1531346878377-a5be20888e57?w=200&h=200&fit=crop' },
  { name: 'Blue Pen (5 pack)',         price: 20,  store: 'CNA',        color: 'blue',   size: '5',    category: 'stationery', imageUrl: 'https://images.unsplash.com/photo-1583485088034-697b5bc54ccd?w=200&h=200&fit=crop' },
  { name: 'Black Pen (5 pack)',        price: 20,  store: 'CNA',        color: 'black',  size: '5',    category: 'stationery', imageUrl: 'https://images.unsplash.com/photo-1583485088034-697b5bc54ccd?w=200&h=200&fit=crop' },
  { name: 'Pencils (10 pack)',         price: 25,  store: 'CNA',        color: 'yellow', size: '10',   category: 'stationery', imageUrl: 'https://images.unsplash.com/photo-1583485088034-697b5bc54ccd?w=200&h=200&fit=crop' },
  { name: 'Eraser',                    price: 8,   store: 'CNA',        color: 'white',  size: '1',    category: 'stationery', imageUrl: 'https://images.unsplash.com/photo-1531346878377-a5be20888e57?w=200&h=200&fit=crop' },
  { name: 'Ruler 30cm',                price: 12,  store: 'CNA',        color: 'clear',  size: '30cm', category: 'stationery', imageUrl: 'https://images.unsplash.com/photo-1588072432836-e10032774350?w=200&h=200&fit=crop' },
  { name: 'Highlighter Set',           price: 42,  store: 'CNA',        color: 'mixed',  size: '4',    category: 'stationery', imageUrl: 'https://images.unsplash.com/photo-1583485088034-697b5bc54ccd?w=200&h=200&fit=crop' },
  { name: 'A4 Paper Ream',             price: 89,  store: 'CNA',        color: 'white',  size: '500',  category: 'stationery', imageUrl: 'https://images.unsplash.com/photo-1586075010923-2dd4570fb338?w=200&h=200&fit=crop' },
  { name: 'Stapler',                   price: 45,  store: 'CNA',        color: 'black',  size: '1',    category: 'stationery', imageUrl: 'https://images.unsplash.com/photo-1588072432836-e10032774350?w=200&h=200&fit=crop' },
  { name: 'Scissors',                  price: 35,  store: 'CNA',        color: 'silver', size: '1',    category: 'stationery', imageUrl: 'https://images.unsplash.com/photo-1588072432836-e10032774350?w=200&h=200&fit=crop' },
  { name: 'Glue Stick',                price: 15,  store: 'CNA',        color: 'white',  size: '1',    category: 'stationery', imageUrl: 'https://images.unsplash.com/photo-1588072432836-e10032774350?w=200&h=200&fit=crop' },

  // ── ELECTRONICS ──
  { name: 'USB Flash Drive 32GB',      price: 149, store: 'Takealot',   color: 'black',  size: '32GB', category: 'electronics', imageUrl: 'https://images.unsplash.com/photo-1618410320928-25228d811631?w=200&h=200&fit=crop' },
  { name: 'USB Flash Drive 64GB',      price: 199, store: 'Takealot',   color: 'black',  size: '64GB', category: 'electronics', imageUrl: 'https://images.unsplash.com/photo-1618410320928-25228d811631?w=200&h=200&fit=crop' },
  { name: 'Phone Charger Cable',       price: 79,  store: 'Takealot',   color: 'white',  size: '1m',   category: 'electronics', imageUrl: 'https://images.unsplash.com/photo-1583863788434-e58a36330cf0?w=200&h=200&fit=crop' },
  { name: 'Earphones Wired',           price: 99,  store: 'Takealot',   color: 'black',  size: '1',    category: 'electronics', imageUrl: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=200&h=200&fit=crop' },
  { name: 'Power Bank 10000mAh',       price: 299, store: 'Takealot',   color: 'black',  size: '10000mAh', category: 'electronics', imageUrl: 'https://images.unsplash.com/photo-1609091839311-d5365f9ff1c5?w=200&h=200&fit=crop' },
  { name: 'LED Desk Lamp',             price: 189, store: 'Takealot',   color: 'white',  size: '1',    category: 'electronics', imageUrl: 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=200&h=200&fit=crop' },
  { name: 'Mouse Wireless',            price: 249, store: 'Takealot',   color: 'black',  size: '1',    category: 'electronics', imageUrl: 'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=200&h=200&fit=crop' },
  { name: 'Laptop Sleeve 15"',         price: 199, store: 'Takealot',   color: 'black',  size: '15"',  category: 'electronics', imageUrl: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=200&h=200&fit=crop' },
];

// Run this once to fill the products collection
export async function seedProducts() {
  console.log('🌱 Seeding products...');

  const existing = await getDocs(collection(db, 'products'));
  for (const d of existing.docs) {
    await deleteDoc(doc(db, 'products', d.id));
  }
  console.log(`🗑️  Cleared ${existing.docs.length} old products`);

  for (const p of PRODUCTS) {
    await addDoc(collection(db, 'products'), p);
  }

  console.log(`✅ Added ${PRODUCTS.length} products`);
}
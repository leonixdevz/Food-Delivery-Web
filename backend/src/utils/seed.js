const dotenv = require('dotenv');
const connectDB = require('../config/db');
const User = require('../models/User');
const Restaurant = require('../models/Restaurant');

dotenv.config();

const sampleRestaurants = [
  {
    slug: 'chicken-republic',
    name: 'Chicken Republic',
    cuisine: 'Fast food • Nigerian classics',
    description: 'Crispy fried chicken, indulgent burgers, and crowd-pleasing comfort meals delivered hot.',
    rating: '4.4',
    time: '30–40 min',
    distance: '1.8 km',
    fee: '₦800',
    contact: '+234 814 000 0000',
    hours: '10:00am – 11:00pm daily',
    area: 'Lagos Mainland and Island',
    image: '../images/Jollof Rice With Chicken.jpeg',
    menu: [
      { name: 'Grilled Chicken Combo', category: 'chicken', price: 4500, image: '../images/Chicken 3.jpeg', desc: 'Tender grilled chicken with rice and sauce.' },
      { name: 'Spicy Chicken Bucket', category: 'chicken', price: 6800, image: '../images/Chicken Fried Chicken Recipe.jpeg', desc: 'Crispy fried chicken for your family feast.' },
      { name: 'Chicken Burger', category: 'burgers', price: 2800, image: '../images/Chicken 4.jpeg', desc: 'Juicy chicken burger with crunchy fries.' },
      { name: 'Rice & Chicken Box', category: 'rice', price: 3500, image: '../images/Jollof Rice With Chicken.jpeg', desc: 'Flavor-packed rice with chicken and sauce.' },
      { name: 'Coke Bottle', category: 'drinks', price: 900, image: '../images/Coca Cola - Katrin Leo Pako.jpeg', desc: 'Chilled Coca-Cola to refresh your meal.' },
      { name: '7Up Bottle', category: 'drinks', price: 900, image: '../images/7up.jpeg', desc: 'Crisp 7Up soda for a refreshing lift.' },
      { name: 'Fanta Bottle', category: 'drinks', price: 900, image: '../images/MOSCOW, RUSSIA-APRIL 4, 2014_ Can Of Coca Cola Company Soft Drink Fanta Orange On Ice_ Fanta Is A Gl.jpeg', desc: 'Sweet Fanta orange soda for a bright finish.' },
      { name: 'Iced Tea', category: 'drinks', price: 700, image: '../images/zobo.jpeg', desc: 'Chilled lemon iced tea to refresh your meal.' }
    ]
  },
  {
    slug: 'mama-put-restaurant',
    name: 'Mama Put Restaurant',
    cuisine: 'Traditional Nigerian • Home-style',
    description: 'Warm Nigerian specialty dishes with rich flavors, made for everyday comfort.',
    rating: '4.7',
    time: '25–35 min',
    distance: '1.2 km',
    fee: '₦500',
    contact: '+234 814 000 0100',
    hours: '10:00am – 10:30pm daily',
    area: 'Lagos Mainland and Lekki',
    image: '../images/Fried Rice.jpeg',
    menu: [
      { name: 'Amala & Ewedu', category: 'swallow', price: 3800, image: '../images/images (1).jpeg', desc: 'Smooth amala with ewedu and assorted meat.' },
      { name: 'Egusi Soup Combo', category: 'soups', price: 4900, image: '../images/images.jpeg', desc: 'Rich egusi soup with pounded yam and meat.' },
      { name: 'Jollof Rice Plate', category: 'rice', price: 4200, image: '../images/Jollof Rice With Chicken.jpeg', desc: 'Party-style jollof rice with chicken.' },
      { name: 'Pounded Yam & Vegetable Soup', category: 'food', price: 4500, image: '../images/images (1).jpeg', desc: 'Soft pounded yam with a richly seasoned vegetable soup.' },
      { name: 'Kunu', category: 'drinks', price: 1000, image: '../images/kunu pepper.jpeg', desc: 'A traditional non-alcoholic drink with a creamy grain taste.' },
      { name: 'Fresh Zobo Drink', category: 'drinks', price: 500, image: '../images/zobo.jpeg', desc: 'Refreshing hibiscus drink for a cooling finish.' },
      { name: 'Coke Bottle', category: 'drinks', price: 850, image: '../images/Coca cola.jpeg', desc: 'A classic chilled Coca-Cola to enjoy with your meal.' },
      { name: '7Up Bottle', category: 'drinks', price: 850, image: '../images/7up.jpeg', desc: 'Crisp 7Up soda for a refreshing lift.' }
    ]
  },
  {
    slug: 'pizza-hub',
    name: 'Pizza Hub',
    cuisine: 'Pizza • Fresh oven-baked',
    description: 'Classic pizza slices and hearty toppings made fresh in every oven run.',
    rating: '4.3',
    time: '25–35 min',
    distance: '2.1 km',
    fee: '₦700',
    contact: '+234 814 000 0200',
    hours: '11:00am – 11:00pm daily',
    area: 'Ikeja, Yaba and Lekki',
    image: '../images/Delicious%20pizza.jpeg',
    menu: [
      { name: 'Pepperoni Pizza', category: 'pizza', price: 5400, image: '../images/Pizza%20on%20white%20background.jpeg', desc: 'Cheesy pepperoni pizza baked to golden perfection.' },
      { name: 'Margherita Pizza', category: 'pizza', price: 4900, image: '../images/Delicious%20pizza.jpeg', desc: 'A classic pizza with basil, mozzarella, and tomato.' },
      { name: 'Chicken Tikka Pizza', category: 'food', price: 6000, image: '../images/Delicious%20pizza.jpeg', desc: 'A spicy pizza with grilled chicken and peppers.' },
      { name: 'Chocolate Lava Cake', category: 'desserts', price: 2600, image: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?auto=format&fit=crop&w=900&q=80', desc: 'Warm chocolate cake with a soft, melted center.' },
      { name: 'Coke Bottle', category: 'drinks', price: 850, image: '../images/Coca%20cola.jpeg', desc: 'Chilled Coca-Cola for a classic pairing.' },
      { name: '7Up Bottle', category: 'drinks', price: 850, image: '../images/7up.jpeg', desc: 'Crisp 7Up soda to refresh your order.' },
      { name: 'Sprite Bottle', category: 'drinks', price: 850, image: '../images/Sprite.jpeg', desc: 'A crisp lemon-lime soda for a refreshing finish.' },
      { name: 'Iced Tea', category: 'drinks', price: 700, image: '../images/zobo.jpeg', desc: 'Chilled lemon iced tea for a refreshing pairing.' }
    ]
  },
  {
    slug: 'burger-king',
    name: 'Burger King',
    cuisine: 'Burgers • Grill house',
    description: 'Savory grilled burgers, loaded fries, and premium comfort meals for every craving.',
    rating: '4.1',
    time: '20–30 min',
    distance: '1.6 km',
    fee: '₦600',
    contact: '+234 814 000 0300',
    hours: '10:00am – 10:00pm daily',
    area: 'Yaba, Surulere and Ikeja',
    image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=1200&q=80',
    menu: [
      { name: 'Classic Burger', category: 'burgers', price: 3000, image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=900&q=80', desc: 'A juicy burger with fresh lettuce and tomato.' },
      { name: 'Double Cheese Burger', category: 'burgers', price: 4200, image: 'https://images.unsplash.com/photo-1550317138-10000687a72b?auto=format&fit=crop&w=900&q=80', desc: 'Loaded with melted cheese and flame-grilled beef.' },
      { name: 'Loaded Fries With Ketchup', category: 'snacks', price: 1500, image: '../images/fries.jpeg', desc: 'Crunchy, seasoned fries with a rich dipping sauce.' },
      { name: 'Jollof Rice Box', category: 'food', price: 3500, image: '../images/Jollof Rice With Chicken.jpeg', desc: 'A hearty jollof rice box served with a piece of chicken.' },
      { name: 'Coke Bottle', category: 'drinks', price: 900, image: '../images/Coca%20cola.jpeg', desc: 'Refreshing Coca-Cola to pair with your burger.' },
      { name: '7Up Bottle', category: 'drinks', price: 900, image: '../images/7up.jpeg', desc: 'Light 7Up soda for a crisp finish.' },
      { name: 'Vanilla Milkshake', category: 'drinks', price: 1200, image: '../images/zobo.jpeg', desc: 'Creamy vanilla milkshake with whipped cream.' },
      { name: 'Iced Tea', category: 'drinks', price: 700, image: '../images/zobo.jpeg', desc: 'Lemon iced tea to cool your meal.' }
    ]
  },
  {
    slug: 'buka-hut',
    name: 'Buka Hut',
    cuisine: 'Smoky Nigerian kitchen',
    description: 'A local favorite for suya, rice bowls, grilled meats, and savory side dishes.',
    rating: '4.5',
    time: '35–45 min',
    distance: '2.5 km',
    fee: '₦900',
    contact: '+234 814 000 0400',
    hours: '9:30am – 11:30pm daily',
    area: 'Surulere, Festac and Island',
    image: '../images/noodles 2.jpeg',
    menu: [
      { name: 'Small Chops with Meat', category: 'food', price: 7500, image: '../images/chops.jpeg', desc: 'A platter of spiced small chops with meat bites and fried treats.' },
      { name: 'Jollof Rice', category: 'food', price: 1500, image: '../images/Jollof Rice With Chicken.jpeg', desc: 'Golden, rich jollof rice served with a hearty side.' },
      { name: 'Goat Meat Suya', category: 'food', price: 6200, image: 'https://images.unsplash.com/photo-1559847844-5315695dadae?auto=format&fit=crop&w=900&q=80', desc: 'Smoky grilled goat meat served with onions and peppers.' },
      { name: 'Grilled Chicken Rice Bowl', category: 'food', price: 4200, image: '../images/Jollof Rice With Chicken.jpeg', desc: 'Smoky grilled chicken served over seasoned rice.' },
      { name: 'Fresh Zobo Drink', category: 'drinks', price: 500, image: '../images/zobo.jpeg', desc: 'A refreshing hibiscus drink to cool down the meal.' },
      { name: 'Kunu', category: 'drinks', price: 700, image: '../images/kunu.jpeg', desc: 'A cool traditional grain drink with a smooth finish.' },
      { name: 'Coke Bottle', category: 'drinks', price: 900, image: '../images/Coca%20cola.jpeg', desc: 'Chilled Coca-Cola to refresh your meal.' },
      { name: '7Up Bottle', category: 'drinks', price: 900, image: '../images/7up.jpeg', desc: 'Crisp 7Up soda for a refreshing lift.' }
    ]
  }
];

const seed = async () => {
  try {
    await connectDB();
    const sequelize = connectDB.sequelize;

    await sequelize.transaction(async (t) => {
      await User.destroy({ where: {}, transaction: t });
      await Restaurant.destroy({ where: {}, transaction: t });

      const adminUser = await User.create({
        name: 'Foodie Admin',
        email: 'admin@foodie.com',
        password: 'password123',
        role: 'admin'
      }, { transaction: t });

      const restaurantsToCreate = sampleRestaurants.map(r => ({
        ...r
      }));

      await Restaurant.bulkCreate(restaurantsToCreate, { transaction: t });

      console.log('Database seeded successfully');
      console.log('Admin user created:', adminUser.email);
    });

    process.exit(0);
  } catch (error) {
    console.error('Seed failed:', error.message);
    process.exit(1);
  }
};

seed();

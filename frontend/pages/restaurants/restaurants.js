function normalizeRestaurantImagePath(imagePath) {
  if (!imagePath) return imagePath;
  if (/^https?:\/\//i.test(imagePath) || imagePath.startsWith('data:')) return encodeURI(imagePath);
  let normalized = imagePath.trim();
  // Strip project-relative prefixes: "../", "./", a leading "/", "images/",
  // and an already-resolved "assets/images/" so paths saved by other pages
  // (e.g. "/assets/images/Chicken 3.jpeg") don't get double-prefixed.
  normalized = normalized.replace(/^(\.\.\/|\.\/)+/, '');
  if (normalized.startsWith('/')) normalized = normalized.slice(1);
  normalized = normalized.replace(/^images\//, '').replace(/^assets\/images\//, '');
  try {
    normalized = decodeURI(normalized);
  } catch (error) {
    // ignore invalid encoded sequences and keep original string
  }
  return `/assets/images/${encodeURI(normalized)}`;
}



function normalizePrice(price) {
  return formatPrice(parsePrice(price));
}

function normalizeRestaurants(restaurants) {
  return restaurants.map((restaurant) => ({
    ...restaurant,
    menu: Array.isArray(restaurant.menu)
      ? restaurant.menu.map((item) =>
          typeof item === 'string'
            ? { name: item, category: 'other', price: '₦0', image: '', desc: '' }
            : { ...item, category: String(item.category || 'food').trim().toLowerCase() || 'food' }
        )
      : []
  }));
}

function matchesMenuCategory(item, selectedCategory) {
  if (!selectedCategory) return true;

  const normalizedSelected = String(selectedCategory).trim().toLowerCase();
  const normalizedItemCategory = String(item.category || 'food').trim().toLowerCase();

  if (!normalizedSelected || normalizedSelected === 'all') return true;
  if (normalizedItemCategory === normalizedSelected) return true;
  if (normalizedItemCategory === 'food') return true;
  return false;
}

const defaultRestaurants = [
  {
    slug: "chicken-republic",
    name: "Chicken Republic",
    cuisine: "Fast food • Nigerian classics",
    description: "Crispy fried chicken, indulgent burgers, and crowd-pleasing comfort meals delivered hot.",
    rating: "4.4",
    time: "30–40 min",
    distance: "1.8 km",
    fee: "₦800",
    contact: "+234 814 000 0000",
    hours: "10:00am – 11:00pm daily",
    area: "Lagos Mainland and Island",
    image: "/assets/images/Jollof Rice With Chicken.jpeg",
    menu: [
      { name: "Grilled Chicken Combo", category: "chicken", price: "₦4,500", image: "/assets/images/Chicken 3.jpeg", desc: "Tender grilled chicken with rice and sauce." },
      { name: "Spicy Chicken Bucket", category: "chicken", price: "₦6,800", image: "/assets/images/Chicken Fried Chicken Recipe.jpeg", desc: "Crispy fried chicken for your family feast." },
      { name: "Chicken Burger", category: "burgers", price: "₦2,800", image: "/assets/images/Chicken 4.jpeg", desc: "Juicy chicken burger with crunchy fries." },
      { name: "Rice & Chicken Box", category: "rice", price: "₦3,500", image: "/assets/images/Jollof Rice With Chicken.jpeg", desc: "Flavor-packed rice with chicken and sauce." },
      // { name: "Crispy Chicken Wings", category: "chicken", price: "₦3,900", image: "/assets/images/Jollof Rice With Chicken.jpeg", desc: "Finger-licking wings tossed in spicy seasoning." },
      { name: "Loaded Fries & Ketchup", category: "snacks", price: "₦3,000", image: "/assets/images/fries.jpeg", desc: "Crispy fries with crunchy chicken nuggets and dip." },
      // NOTE: several older image files (iced-tea.jpeg, plantain-chips.jpeg, …) do not exist on disk;
      // those dishes are mapped to existing assets so cards never fall back to a placeholder.
      // { name: "Family Chicken Feast", category: "chicken", price: "₦8,200", image: "/assets/images/Jollof Rice With Chicken.jpeg", desc: "A large combo for sharing with crispy chicken, rice, and sides." },
      // { name: "Hot Wings Combo", category: "snacks", price: "₦4,200", image: "/assets/images/daisy.jpeg", desc: "Extra spicy wings with a creamy dip and fries." },
      { name: "Sausage Roll", category: "snacks", price: "₦800", image: "/assets/images/Sausage%20Roll%20Recipe%20(Picnic%20Idea).jpeg", desc: "Warm sausage roll with flaky pastry and savory filling." },
      { name: "Sneaker Chocolate", category: "snacks", price: "₦1,000", image: "/assets/images/Sneaker%20Chocolate.jpeg", desc: "Rich chocolate snack bar with a crunchy bite." },
      { name: "Iced Tea", category: "drinks", price: "₦700", image: "/assets/images/zobo.jpeg", desc: "Chilled lemon iced tea to refresh your meal." },
      { name: "Plantain Chips", category: "snacks", price: "₦600", image: "/assets/images/fries.jpeg", desc: "Crunchy plantain chips lightly salted." },
      { name: "Coleslaw", category: "sides", price: "₦500", image: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=900&q=80", desc: "Fresh cabbage coleslaw with a creamy dressing." },
      { name: "Chocolate Milkshake", category: "drinks", price: "₦1,200", image: "/assets/images/kunu.jpeg", desc: "Thick chocolate milkshake topped with cream." },
      { name: "Classic Jollof Rice", category: "rice", price: "₦3,900", image: "/assets/images/Jollof Rice With Chicken.jpeg", desc: "Spicy jollof rice served with chicken and plantain." },
      { name: "Coke Bottle", category: "drinks", price: "₦900", image: "/assets/images/Coca Cola - Katrin Leo Pako.jpeg", desc: "Chilled Coca-Cola to refresh your meal." },
      { name: "7Up Bottle", category: "drinks", price: "₦900", image: "/assets/images/7up.jpeg", desc: "Crisp 7Up soda for a refreshing lift." },
      { name: "Fanta Bottle", category: "drinks", price: "₦900", image: "/assets/images/MOSCOW, RUSSIA-APRIL 4, 2014_ Can Of Coca Cola Company Soft Drink Fanta Orange On Ice_ Fanta Is A Gl.jpeg", desc: "Sweet Fanta orange soda for a bright finish." },
      { name: "Stir-Fry Noodles", category: "noodles", price: "₦3,500", image: "/assets/images/stir fry noodles.jpeg", desc: "Savory noodles tossed with chicken and veggies." }
    ]
  },
  {
    slug: "mama-put-restaurant",
    name: "Mama Put Restaurant",
    cuisine: "Traditional Nigerian • Home-style",
    description: "Warm Nigerian specialty dishes with rich flavors, made for everyday comfort.",
    rating: "4.7",
    time: "25–35 min",
    distance: "1.2 km",
    fee: "₦500",
    contact: "+234 814 000 0100",
    hours: "10:00am – 10:30pm daily",
    area: "Lagos Mainland and Lekki",
    image: "/assets/images/Fried Rice.jpeg",
    menu: [
      { name: "Amala & Ewedu", category: "swallow", price: "₦3,800", image: "/assets/images/images%20(1).jpeg", desc: "Smooth amala with ewedu and assorted meat." },
      { name: "Egusi Soup Combo", category: "soups", price: "₦4,900", image: "/assets/images/images.jpeg", desc: "Rich egusi soup with pounded yam and meat." },
      { name: "Jollof Rice Plate", category: "rice", price: "₦4,200", image: "/assets/images/Jollof Rice With Chicken.jpeg", desc: "Party-style jollof rice with chicken." },
      { name: "Fried Rice", category: "soups", price: "₦3,200", image: "/assets/images/Fried Rice.jpeg", desc: "Hot and spicy pepper soup with fish or chicken." },
      { name: "Kunu", category: "drinks", price: "₦1,000", image: "/assets/images/kunu pepper.jpeg", desc: "A traditional non-alcoholic drink with a creamy grain taste." },
      { name: "Garden Salad Plate", category: "salads", price: "₦2,900", image: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=900&q=80", desc: "Fresh salad with cucumber, tomatoes, and avocado." },
      { name: "Zobo Bottle", category: "drinks", price: "₦700", image: "/assets/images/zobo.jpeg", desc: "Chilled zobo made with hibiscus and ginger." },
      { name: "Pepper Soup (Small)", category: "soups", price: "₦1,200", image: "/assets/images/images.jpeg", desc: "Light pepper soup to warm the stomach." },
      { name: "Plantain (Fried)", category: "sides", price: "₦600", image: "/assets/images/fries.jpeg", desc: "Fried ripe plantain to complement your meal." },
      { name: "Protein Salad", category: "salads", price: "₦2,500", image: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=900&q=80", desc: "Mixed greens with egg, tuna and beans." },
      { name: "Semo & Afang", category: "swallow", price: "₦4,800", image: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=900&q=80", desc: "Smooth semo with afang soup and assorted meat." },
      { name: "Yam Porridge", category: "rice", price: "₦3,600", image: "/assets/images/images.jpeg", desc: "Creamy yam porridge with fish and aromatic peppers." },
      { name: "Banga Soup Pack", category: "soups", price: "₦4,700", image: "https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=900&q=80", desc: "Traditional banga soup served with fresh starch and meat." },
      { name: "Fried Rice Plate", category: "rice", price: "₦4,300", image: "/assets/images/Fried Rice.jpeg", desc: "Party-style jollof rice served with sides." },
      { name: "Coke Bottle", category: "drinks", price: "₦850", image: "/assets/images/Coca%20cola.jpeg", desc: "A classic chilled Coca-Cola to enjoy with your meal." },
      { name: "7Up Bottle", category: "drinks", price: "₦850", image: "/assets/images/7up.jpeg", desc: "Crisp 7Up soda for a refreshing lift." },
      { name: "Spicy Noodles Bowl", category: "noodles", price: "₦3,900", image: "/assets/images/noodles%202.jpeg", desc: "Hot noodles with vegetables and rich spices." }
    ]
  },
  {
    slug: "pizza-hub",
    name: "Pizza Hub",
    cuisine: "Pizza • Fresh oven-baked",
    description: "Classic pizza slices and hearty toppings made fresh in every oven run.",
    rating: "4.3",
    time: "25–35 min",
    distance: "2.1 km",
    fee: "₦700",
    contact: "+234 814 000 0200",
    hours: "11:00am – 11:00pm daily",
    area: "Ikeja, Yaba and Lekki",
    image: "/assets/images/Delicious%20pizza.jpeg",
    menu: [
      { name: "Pepperoni Pizza", category: "pizza", price: "₦5,400", image: "/assets/images/Pizza%20on%20white%20background.jpeg", desc: "Cheesy pepperoni pizza baked to golden perfection." },
      { name: "Margherita Pizza", category: "pizza", price: "₦4,900", image: "/assets/images/Delicious%20pizza.jpeg", desc: "A classic pizza with basil, mozzarella, and tomato." },
      { name: "Meat Lovers Pizza", category: "pizza", price: "₦6,300", image: "/assets/images/Delicious%20pizza.jpeg", desc: "Loaded with premium meats and extra cheese." },
      { name: "Veggie Pizza", category: "pizza", price: "₦4,700", image: "/assets/images/Delicious%20pizza.jpeg", desc: "Fresh vegetables and a creamy cheese finish." },
      { name: "Chicken Tikka Pizza", category: "pizza", price: "₦6,000", image: "/assets/images/Delicious%20pizza.jpeg", desc: "A spicy pizza with grilled chicken and peppers." },
      { name: "Chocolate Lava Cake", category: "desserts", price: "₦2,600", image: "https://images.unsplash.com/photo-1606313564200-e75d5e30476c?auto=format&fit=crop&w=900&q=80", desc: "Warm chocolate cake with a soft melt-in-the-mouth center." },
      { name: "Garlic Bread", category: "sides", price: "₦900", image: "/assets/images/Sausage%20Roll%20Recipe%20(Picnic%20Idea).jpeg", desc: "Toasted garlic bread with herb butter." },
      { name: "BBQ Chicken Wings", category: "snacks", price: "₦2,800", image: "/assets/images/TASTY FRIED CHICKEN IN 2025.jpeg", desc: "Sticky BBQ wings with a side of dip." },
      { name: "Iced Cappuccino", category: "drinks", price: "₦1,500", image: "/assets/images/kunu.jpeg", desc: "Chilled cappuccino with a coffee kick." },
      { name: "Fruit Salad", category: "desserts", price: "₦1,200", image: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=900&q=80", desc: "Seasonal fruit bowl with a light syrup." },
      { name: "Vanilla Ice Cream", category: "desserts", price: "₦1,800", image: "https://images.unsplash.com/photo-1570197788417-0e82375c9371?auto=format&fit=crop&w=900&q=80", desc: "Sweet frozen treat with a creamy vanilla finish." },
      { name: "Brownie Slice", category: "desserts", price: "₦2,200", image: "https://images.unsplash.com/photo-1606313564200-e75d5e30476c?auto=format&fit=crop&w=900&q=80", desc: "A rich brownie served warm with chocolate drizzle." },
      { name: "Fried Rice Bowl", category: "rice", price: "₦3,800", image: "/assets/images/Jollof Rice With Chicken.jpeg", desc: "Flavorful fried rice with vegetables and chicken." },
      { name: "Coke Bottle", category: "drinks", price: "₦850", image: "/assets/images/Coca%20cola.jpeg", desc: "Chilled Coca-Cola for a classic pairing." },
      { name: "7Up Bottle", category: "drinks", price: "₦850", image: "/assets/images/7up.jpeg", desc: "Crisp 7Up soda to refresh your order." },
      { name: "Sprite Bottle", category: "drinks", price: "₦850", image: "/assets/images/Sprite.jpeg", desc: "A sweet orange soda to finish your meal." },
      { name: "Chicken Noodles", category: "noodles", price: "₦3,700", image: "/assets/images/noodles.jpeg", desc: "Comforting noodles with seasoned chicken and greens." }
    ]
  },
  {
    slug: "burger-king",
    name: "Burger King",
    cuisine: "Burgers • Grill house",
    description: "Savory grilled burgers, loaded fries, and premium comfort meals for every craving.",
    rating: "4.1",
    time: "20–30 min",
    distance: "1.6 km",
    fee: "₦600",
    contact: "+234 814 000 0300",
    hours: "10:00am – 10:00pm daily",
    area: "Yaba, Surulere and Ikeja",
    image:
      "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=1200&q=80",
    menu: [
      { name: "Classic Burger", category: "burgers", price: "₦3,000", image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=900&q=80", desc: "A juicy burger with fresh lettuce and tomato." },
      { name: "Double Cheese Burger", category: "burgers", price: "₦4,200", image: "https://images.unsplash.com/photo-1550317138-10000687a72b?auto=format&fit=crop&w=900&q=80", desc: "Loaded with melted cheese and flame-grilled beef." },
      { name: "Loaded Fries With Ketchup", category: "snacks", price: "₦1,500", image: "/assets/images/fries.jpeg", desc: "Crunchy, seasoned fries with a rich dipping sauce." },
      { name: "Burger Combo", category: "burgers", price: "₦4,800", image: "https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=900&q=80", desc: "Burger with fries and a chilled soft drink." },
      { name: "Smoky BBQ Burger", category: "burgers", price: "₦5,500", image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=900&q=80", desc: "A grilled burger packed with smoky barbecue sauce." },
      { name: "Chicken Bacon Burger", category: "burgers", price: "₦6,000", image: "https://images.unsplash.com/photo-1550317138-10000687a72b?auto=format&fit=crop&w=900&q=80", desc: "Crispy chicken and bacon layered for maximum flavor." },
      { name: "Crispy Chicken Wrap", category: "burgers", price: "₦6,500", image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=900&q=80", desc: "A spicy chicken wrap with lettuce, sauce, and crunchy fries." },
      { name: "Cheesy Fries", category: "snacks", price: "₦2,400", image: "/assets/images/images%20(1).jpeg", desc: "Golden fries topped with melted cheese and herbs." },
      { name: "Onion Rings", category: "snacks", price: "₦900", image: "/assets/images/fries.jpeg", desc: "Crispy battered onion rings with dip." },
      { name: "Vanilla Milkshake", category: "drinks", price: "₦1,200", image: "/assets/images/kunu.jpeg", desc: "Creamy vanilla milkshake with whipped cream." },
      { name: "Mozzarella Sticks", category: "snacks", price: "₦1,800", image: "/assets/images/Sausage%20Roll%20Recipe%20(Picnic%20Idea).jpeg", desc: "Fried mozzarella sticks with marinara." },
      { name: "Iced Tea", category: "drinks", price: "₦700", image: "/assets/images/zobo.jpeg", desc: "Lemon iced tea to cool your meal." },
      { name: "Jollof Rice Box", category: "rice", price: "₦3,500", image: "/assets/images/Jollof Rice With Chicken.jpeg", desc: "A hearty jollof rice box served with a piece of chicken." },
      { name: "Coke Bottle", category: "drinks", price: "₦900", image: "/assets/images/Coca%20cola.jpeg", desc: "Refreshing Coca-Cola to pair with your burger." },
      { name: "7Up Bottle", category: "drinks", price: "₦900", image: "/assets/images/7up.jpeg", desc: "Light 7Up soda for a crisp finish." },
      { name: "Spicy Noodles", category: "noodles", price: "₦3,800", image: "/assets/images/noodles.jpeg", desc: "Spicy noodles with beef, peppers, and onions." }
    ]
  },
  {
    slug: "buka-hut",
    name: "Buka Hut",
    cuisine: "Smoky Nigerian kitchen",
    description: "A local favorite for suya, rice bowls, grilled meats, and savory side dishes.",
    rating: "4.5",
    time: "35–45 min",
    distance: "2.5 km",
    fee: "₦900",
    contact: "+234 814 000 0400",
    hours: "9:30am – 11:30pm daily",
    area: "Surulere, Festac and Island",
    image: "/assets/images/noodles 2.jpeg",
    menu: [
      // { name: "Suya Platter", category: "grill", price: "₦5,600", image: "https://images.unsplash.com/photo-1559847844-5315695dadae?auto=format&fit=crop&w=900&q=80", desc: "Spiced grilled beef with onions and peppers." },
      // { name: "Boiled Yam & Egg Sauce", category: "rice", price: "₦3,600", image: "/assets/images/images%20(1).jpeg", desc: "Comfort food with rich egg sauce and herbs." },
      { name: "Small Chops with Meat", category: "Dessert", price: "₦7,500", image: "/assets/images/chops.jpeg", desc: "A deeply spiced chops with spring rolls, puff puff, samosa with spiced meats made for meat lovers." },
      { name: "Jollof Rice", category: "Jollof Rice", price: "₦1,500", image: "/assets/images/Jollof Rice With Chicken.jpeg", desc: "Golden plantain paired with spicy grilled meat." },
      { name: "Spicy Noodles Bowl", category: "noodles", price: "₦1,500", image: "/assets/images/noodles 2.jpeg", desc: "Stir-fried noodles with peppers and a savory Nigerian twist." },
      { name: "Fresh Zobo Drink", category: "drinks", price: "₦500", image: "/assets/images/zobo.jpeg", desc: "A refreshing hibiscus drink to cool down the meal." },
      { name: "Kunu", category: "drinks", price: "₦700", image: "/assets/images/kunu.jpeg", desc: "A fizzy fruit blend with citrus notes and a chilled finish." },
      { name: "Coke Bottle", category: "drinks", price: "₦900", image: "/assets/images/Coca%20cola.jpeg", desc: "Chilled Coca-Cola to refresh your meal." },
      { name: "Suya Skewers", category: "grill", price: "₦1,200", image: "https://images.unsplash.com/photo-1559847844-5315695dadae?auto=format&fit=crop&w=900&q=80", desc: "Spiced suya skewers with onions and pepper." },
      { name: "Small Pepper Soup", category: "soups", price: "₦1,000", image: "/assets/images/images.jpeg", desc: "A light pepper soup perfect as a starter." },
      { name: "Fried Plantain", category: "sides", price: "₦600", image: "/assets/images/fries.jpeg", desc: "Sweet fried plantain as a side." },
      { name: "Zobo Bottle", category: "drinks", price: "₦700", image: "/assets/images/zobo.jpeg", desc: "Hibiscus zobo served chilled." },
      { name: "Monster Drink", category: "drinks", price: "₦900", image: "/assets/images/Monster.jpeg", desc: "Sweet Fanta orange soda to brighten your order." },
      { name: "7Up Bottle", category: "drinks", price: "₦900", image: "/assets/images/7up.jpeg", desc: "Crisp 7Up soda for a refreshing lift." },
      { name: "Goat Meat Suya", category: "grill", price: "₦6,200", image: "https://images.unsplash.com/photo-1559847844-5315695dadae?auto=format&fit=crop&w=900&q=80", desc: "Smoky grilled goat meat served with onions and peppers." },
      { name: "Nigerian Fruit Punch", category: "drinks", price: "₦1,700", image: "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=900&q=80", desc: "A chilled blend of orange, pineapple, and tropical fruit." }
    ]
  }
];

async function fetchRestaurantsFromApi() {
  const localRestaurants = normalizeRestaurants(defaultRestaurants);

  try {
    const response = await fetch('/api/restaurants');
    if (!response.ok) {
      throw new Error('Backend restaurant API returned an error.');
    }
    const apiRestaurants = await response.json();
    const normalizedApiRestaurants = normalizeRestaurants(Array.isArray(apiRestaurants) ? apiRestaurants : []);

    const map = new Map();
    localRestaurants.forEach((restaurant) => map.set(String(restaurant.slug), restaurant));
    normalizedApiRestaurants.forEach((restaurant) => {
      if (restaurant && restaurant.slug) {
        const localRestaurant = map.get(String(restaurant.slug));
        map.set(String(restaurant.slug), {
          ...localRestaurant,
          ...restaurant,
          menu: Array.isArray(restaurant.menu) && restaurant.menu.length >= (localRestaurant?.menu?.length || 0)
            ? restaurant.menu
            : localRestaurant?.menu || restaurant.menu
        });
      }
    });

    return Array.from(map.values());
  } catch (error) {
    console.warn('Restaurant API unavailable, using local fallback.', error);
    return localRestaurants;
  }
}

async function initRestaurantPage() {
  const params = new URLSearchParams(window.location.search);
  const restaurantSlug = params.get('restaurant') || 'chicken-republic';
  const selectedCategory = params.get('category');
  const restaurants = await fetchRestaurantsFromApi();
  const selectedRestaurant = restaurants.find((item) => item.slug === restaurantSlug) || restaurants[0];
  const categoryTitle = document.querySelector('.section-label');
  const menuItems = selectedCategory
    ? selectedRestaurant.menu.filter((item) => matchesMenuCategory(item, selectedCategory))
    : selectedRestaurant.menu;
  const visibleMenuItems = menuItems.length > 0 ? menuItems : selectedRestaurant.menu;

  const restaurantHero = document.getElementById('restaurantHero');
  const restaurantName = document.getElementById('restaurantName');
  const restaurantCuisine = document.getElementById('restaurantCuisine');
  const restaurantDescription = document.getElementById('restaurantDescription');
  const restaurantRating = document.getElementById('restaurantRating');
  const restaurantTime = document.getElementById('restaurantTime');
  const restaurantDistance = document.getElementById('restaurantDistance');
  const restaurantFee = document.getElementById('restaurantFee');
  const restaurantContact = document.getElementById('restaurantContact');
  const restaurantHours = document.getElementById('restaurantHours');
  const restaurantArea = document.getElementById('restaurantArea');
  const menuGrid = document.getElementById('restaurantMenu');

  if (restaurantHero) {
    restaurantHero.style.backgroundImage = `url(${normalizeRestaurantImagePath(selectedRestaurant.image)})`;
  }
  if (restaurantName) restaurantName.textContent = selectedRestaurant.name;
  if (restaurantCuisine) restaurantCuisine.textContent = selectedRestaurant.cuisine;
  if (restaurantDescription) restaurantDescription.textContent = selectedRestaurant.description;
  if (restaurantRating) restaurantRating.textContent = selectedRestaurant.rating;
  if (restaurantTime) restaurantTime.textContent = selectedRestaurant.time;
  if (restaurantDistance) restaurantDistance.textContent = selectedRestaurant.distance;
  if (restaurantFee) restaurantFee.textContent = selectedRestaurant.fee;
  if (restaurantContact) restaurantContact.textContent = `Call ${selectedRestaurant.name} at ${selectedRestaurant.contact}`;
  if (restaurantHours) restaurantHours.textContent = `Open ${selectedRestaurant.hours}`;
  if (restaurantArea) restaurantArea.textContent = `Serving ${selectedRestaurant.area}`;

  if (selectedCategory && categoryTitle) {
    categoryTitle.textContent = selectedCategory.charAt(0).toUpperCase() + selectedCategory.slice(1);
  }

  // Quotes inside the data URI must be percent-encoded: this string is embedded
  // in a double-quoted onerror="..." attribute, and raw quotes break the JS.
  const fallbackImage = 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 900 600%22%3E%3Crect width=%22900%22 height=%22600%22 fill=%22%23f8f4ef%22/%3E%3Ctext x=%2250%25%22 y=%2250%25%22 dominant-baseline=%22middle%22 text-anchor=%22middle%22 fill=%22%236e5a4e%22 font-family=%22Inter,sans-serif%22 font-size=%2248%22%3EFood+photo%3C/text%3E%3C/svg%3E';
  // Render function for menu items (used by filters)
  function renderMenu(items) {
    if (!menuGrid) return;
    const toRender = Array.isArray(items) ? items : [];
    const menuHtml = toRender
      .map((item) => {
        const imageSrc = normalizeRestaurantImagePath(item.image) || fallbackImage;
        const priceText = normalizePrice(item.price);
        const safeName = escapeHtml(item.name);
        const safeDesc = escapeHtml(item.desc || '');
        const safeCategory = escapeHtml(item.category || '');
        const safeImage = escapeHtml(imageSrc);
        return `
      <article class="menu-card" data-name="${safeName}" data-price="${priceText}" data-image="${safeImage}" data-category="${safeCategory}" data-desc="${safeDesc}">
        <div class="menu-image" role="button" tabindex="0">
          <img src="${safeImage}" alt="${safeName}" loading="lazy" onerror="this.onerror=null;this.src='${fallbackImage}';" />
        </div>
        <div class="menu-body">
          <h4>${safeName}</h4>
          <p>${safeDesc}</p>
          <div class="card-bottom">
            <span class="price">${priceText}</span>
            <button class="add-btn" type="button">Add to cart</button>
          </div>
        </div>
      </article>
    `;
      })
      .join('');

    menuGrid.innerHTML = menuHtml || '<p class="menu-empty-message">No menu items are available at this time.</p>';
  }

  // Initial render of the complete restaurant menu
  renderMenu(visibleMenuItems);

  // Build category links dynamically from the restaurant's menu
  const categoriesContainer = document.querySelector('.sidebar-categories');
  function buildCategoryLinks() {
    if (!categoriesContainer) return;

    // compute category counts and unique set
    const counts = {};
    selectedRestaurant.menu.forEach((item) => {
      const cat = String(item.category || 'food').trim().toLowerCase();
      if (!cat) return;
      counts[cat] = (counts[cat] || 0) + 1;
    });

    // Build sorted categories (exclude empty), keep '' as All Menu first
    const otherCats = Object.keys(counts).filter((c) => counts[c] > 0).sort((a, b) => a.localeCompare(b));
    const cats = [''].concat(otherCats);

    // Render category links with counts
    categoriesContainer.innerHTML = '<span class="sidebar-label">CATEGORIES</span>';
    cats.forEach((cat) => {
      const a = document.createElement('a');
      a.className = 'category-link';
      a.dataset.category = cat;
      a.href = '#';
      if (cat === '') {
        a.textContent = 'All Menu';
      } else {
        const label = cat.charAt(0).toUpperCase() + cat.slice(1);
        a.textContent = `${label} (${counts[cat] || 0})`;
      }
      categoriesContainer.appendChild(a);
    });

    // wire up behavior for the new links
    const categoryLinks = document.querySelectorAll('.category-link');
    function updateCategoryLinks() {
      categoryLinks.forEach((link) => {
        const category = link.dataset.category;
        const searchParams = new URLSearchParams(window.location.search);
        searchParams.set('restaurant', restaurantSlug);

        if (category) {
          searchParams.set('category', category);
        } else {
          searchParams.delete('category');
        }

        link.href = `index.html?${searchParams.toString()}`;
        link.classList.toggle('active', selectedCategory === category || (!selectedCategory && category === ''));
      });
    }

    updateCategoryLinks();
  }

  buildCategoryLinks();

  // Mobile filters: populate and wire behaviour
  const mobileFilters = document.getElementById('mobileFilters');
  const mobileCategorySelect = document.getElementById('mobileCategorySelect');
  const mobilePriceSelect = document.getElementById('mobilePriceSelect');

  function showMobileFiltersIfNeeded() {
    if (!mobileFilters) return;
    if (window.innerWidth <= 768) {
      mobileFilters.style.display = 'block';
    } else {
      mobileFilters.style.display = 'none';
    }
  }

  // populate category select
  if (mobileCategorySelect) {
    // clear except first
    // compute counts to show in option labels
    const counts = {};
    selectedRestaurant.menu.forEach((item) => {
      const cat = String(item.category || 'food').trim().toLowerCase();
      if (!cat) return;
      counts[cat] = (counts[cat] || 0) + 1;
    });

    mobileCategorySelect.innerHTML = '<option value="">All</option>';
    const cats = Object.keys(counts).filter((c) => counts[c] > 0).sort((a, b) => a.localeCompare(b));
    cats.forEach((cat) => {
      const opt = document.createElement('option');
      opt.value = cat;
      opt.textContent = `${cat.charAt(0).toUpperCase() + cat.slice(1)} (${counts[cat] || 0})`;
      if (selectedCategory && String(selectedCategory).trim().toLowerCase() === cat) {
        opt.selected = true;
      }
      mobileCategorySelect.appendChild(opt);
    });
    // ensure All is selected when no category provided
    if (!selectedCategory) mobileCategorySelect.value = '';
  }

  function matchesPriceRange(item, range) {
    if (!range || range === 'all') return true;
    const p = parsePrice(item.price);
    if (range === 'under-1000') return p < 1000;
    if (range === '1000-3000') return p >= 1000 && p <= 3000;
    if (range === 'above-3000') return p > 3000;
    return true;
  }

  function applyMobileFilters() {
    const cat = mobileCategorySelect ? mobileCategorySelect.value : '';
    const priceRange = mobilePriceSelect ? mobilePriceSelect.value : 'all';
    const filtered = selectedRestaurant.menu.filter((item) => {
      return matchesMenuCategory(item, cat) && matchesPriceRange(item, priceRange);
    });
    renderMenu(filtered);
  }

  if (mobileCategorySelect) mobileCategorySelect.addEventListener('change', applyMobileFilters);
  if (mobilePriceSelect) mobilePriceSelect.addEventListener('change', applyMobileFilters);
  window.addEventListener('resize', showMobileFiltersIfNeeded);
  showMobileFiltersIfNeeded();

  if (menuGrid) {
    menuGrid.addEventListener('click', (event) => {
      const button = event.target.closest('.add-btn');
      if (!button) return;

      const card = button.closest('.menu-card');
      if (!card) return;

      const previewItem = {
        name: card.dataset.name,
        price: card.dataset.price,
        image: card.dataset.image,
        category: card.dataset.category,
        desc: card.dataset.desc,
        restaurant: restaurantSlug
      };

      window.sessionStorage.setItem('previewItem', JSON.stringify(previewItem));

      const previewUrl = new URL('/pages/menu/index.html', window.location.origin);
      previewUrl.searchParams.set('restaurant', restaurantSlug);
      previewUrl.searchParams.set('name', previewItem.name);
      previewUrl.searchParams.set('price', previewItem.price);
      previewUrl.searchParams.set('image', previewItem.image);
      previewUrl.searchParams.set('category', previewItem.category);
      previewUrl.searchParams.set('desc', previewItem.desc);

      window.location.href = previewUrl.toString();
    });
  }

  // Rebuild category links if restaurant or selection changes
  buildCategoryLinks();
}

initRestaurantPage();

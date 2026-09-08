/**
 * Catalog vocabulary the seed generator draws from.
 *
 * Kept as plain data (not generated strings) so product names read like a
 * real store's. "Aurelia Vantage 14 Ultrabook" is something a participant
 * will recognise as a product; "Product 4021" is not, and a store full of
 * placeholder text quietly teaches people that demo data doesn't matter.
 */

/** Money is stored in **minor units** (paise) as integers — never floats. */
export const CURRENCY = { code: 'INR', symbol: '₹', locale: 'en-IN', minorPerMajor: 100 };

export const CATEGORIES = [
  { slug: 'electronics', name: 'Electronics', children: [
    { slug: 'laptops', name: 'Laptops' },
    { slug: 'smartphones', name: 'Smartphones' },
    { slug: 'headphones', name: 'Headphones' },
    { slug: 'cameras', name: 'Cameras' },
    { slug: 'tablets', name: 'Tablets' },
    { slug: 'monitors', name: 'Monitors' },
  ]},
  { slug: 'home-kitchen', name: 'Home & Kitchen', children: [
    { slug: 'cookware', name: 'Cookware' },
    { slug: 'appliances', name: 'Appliances' },
    { slug: 'furniture', name: 'Furniture' },
    { slug: 'bedding', name: 'Bedding' },
    { slug: 'lighting', name: 'Lighting' },
  ]},
  { slug: 'apparel', name: 'Apparel', children: [
    { slug: 'mens-clothing', name: "Men's Clothing" },
    { slug: 'womens-clothing', name: "Women's Clothing" },
    { slug: 'footwear', name: 'Footwear' },
    { slug: 'bags', name: 'Bags' },
    { slug: 'watches', name: 'Watches' },
  ]},
  { slug: 'sports-outdoors', name: 'Sports & Outdoors', children: [
    { slug: 'fitness', name: 'Fitness' },
    { slug: 'cycling', name: 'Cycling' },
    { slug: 'camping', name: 'Camping' },
    { slug: 'running', name: 'Running' },
  ]},
  { slug: 'beauty-health', name: 'Beauty & Health', children: [
    { slug: 'skincare', name: 'Skincare' },
    { slug: 'haircare', name: 'Haircare' },
    { slug: 'fragrance', name: 'Fragrance' },
    { slug: 'supplements', name: 'Supplements' },
  ]},
  { slug: 'books-media', name: 'Books & Media', children: [
    { slug: 'fiction', name: 'Fiction' },
    { slug: 'non-fiction', name: 'Non-fiction' },
    { slug: 'technical', name: 'Technical' },
    { slug: 'kids-books', name: "Kids' Books" },
  ]},
  { slug: 'toys-games', name: 'Toys & Games', children: [
    { slug: 'board-games', name: 'Board Games' },
    { slug: 'puzzles', name: 'Puzzles' },
    { slug: 'building-sets', name: 'Building Sets' },
    { slug: 'outdoor-play', name: 'Outdoor Play' },
  ]},
  { slug: 'grocery', name: 'Grocery', children: [
    { slug: 'coffee-tea', name: 'Coffee & Tea' },
    { slug: 'snacks', name: 'Snacks' },
    { slug: 'pantry', name: 'Pantry' },
    { slug: 'beverages', name: 'Beverages' },
  ]},
];

export const BRANDS = [
  'Aurelia', 'Northwind', 'Kestrel', 'Lumen', 'Vantage', 'Halcyon', 'Meridian',
  'Corvus', 'Salient', 'Ironwood', 'Bellweather', 'Cobalt', 'Marigold', 'Thicket',
  'Perigee', 'Alder & Co', 'Quill', 'Sundara', 'Tessellate', 'Verdant',
  'Brightside', 'Foundry', 'Palisade', 'Zephyr',
];

/**
 * Per-subcategory naming parts: a product line, a model/qualifier, and the
 * noun. Combined as "{Brand} {line} {model} {noun}".
 */
export const NAMING = {
  laptops:          { line: ['Vantage', 'Studio', 'Nomad', 'Forge', 'Slate'], model: ['13', '14', '15', '16', 'Pro', 'Air'], noun: ['Ultrabook', 'Laptop', 'Notebook'] },
  smartphones:      { line: ['Pulse', 'Nova', 'Edge', 'Arc'], model: ['5', '6', '7', 'Pro', 'Lite', 'Max'], noun: ['Smartphone', 'Phone'] },
  headphones:       { line: ['Hush', 'Resonance', 'Drift', 'Cadence'], model: ['ANC', 'Studio', 'Sport', 'Open'], noun: ['Headphones', 'Earbuds', 'Over-Ear Headset'] },
  cameras:          { line: ['Aperture', 'Frame', 'Prism'], model: ['R5', 'X2', 'Mini', 'Pro'], noun: ['Mirrorless Camera', 'Compact Camera', 'Action Camera'] },
  tablets:          { line: ['Canvas', 'Slate', 'Folio'], model: ['8', '10', '11', 'Pro'], noun: ['Tablet', 'Drawing Tablet'] },
  monitors:         { line: ['Clarity', 'Panorama', 'Vista'], model: ['24', '27', '32', 'UltraWide'], noun: ['Monitor', 'Display'] },
  cookware:         { line: ['Hearth', 'Ember', 'Cast'], model: ['5-Piece', '3-Piece', 'Deep', 'Classic'], noun: ['Cookware Set', 'Skillet', 'Saucepan', 'Dutch Oven'] },
  appliances:       { line: ['Whisk', 'Brew', 'Chill'], model: ['Compact', 'Pro', 'Family'], noun: ['Blender', 'Air Fryer', 'Coffee Maker', 'Food Processor'] },
  furniture:        { line: ['Alcove', 'Bramble', 'Loft'], model: ['Two-Seater', 'Compact', 'Extendable'], noun: ['Armchair', 'Bookshelf', 'Dining Table', 'Desk'] },
  bedding:          { line: ['Cloudspun', 'Linenfold', 'Quietude'], model: ['King', 'Queen', 'Single'], noun: ['Duvet Set', 'Bedsheet Set', 'Pillow Pair'] },
  lighting:         { line: ['Glow', 'Beacon', 'Lantern'], model: ['Warm', 'Adjustable', 'Smart'], noun: ['Floor Lamp', 'Table Lamp', 'Pendant Light'] },
  'mens-clothing':  { line: ['Everyday', 'Trailhead', 'Weekender'], model: ['Slim', 'Relaxed', 'Classic'], noun: ['Oxford Shirt', 'Chinos', 'Merino Sweater', 'Field Jacket'] },
  'womens-clothing':{ line: ['Everyday', 'Atelier', 'Weekender'], model: ['Tailored', 'Relaxed', 'Wrap'], noun: ['Blouse', 'Midi Dress', 'Knit Cardigan', 'Trousers'] },
  footwear:         { line: ['Stride', 'Cobble', 'Terra'], model: ['Low', 'Mid', 'Trail'], noun: ['Sneakers', 'Chelsea Boots', 'Loafers', 'Sandals'] },
  bags:             { line: ['Haul', 'Commuter', 'Voyage'], model: ['20L', '30L', 'Compact'], noun: ['Backpack', 'Tote', 'Duffel', 'Sling Bag'] },
  watches:          { line: ['Chronos', 'Meridian', 'Tide'], model: ['38mm', '40mm', '42mm', 'Automatic'], noun: ['Watch', 'Chronograph', 'Field Watch'] },
  fitness:          { line: ['Core', 'Grip', 'Flexion'], model: ['Adjustable', 'Set', 'Pro'], noun: ['Dumbbell Set', 'Resistance Bands', 'Yoga Mat', 'Kettlebell'] },
  cycling:          { line: ['Draft', 'Peloton', 'Cadence'], model: ['Road', 'Gravel', 'Commuter'], noun: ['Helmet', 'Bike Light Set', 'Cycling Gloves', 'Floor Pump'] },
  camping:          { line: ['Basecamp', 'Ridgeline', 'Timber'], model: ['2-Person', '4-Person', 'Ultralight'], noun: ['Tent', 'Sleeping Bag', 'Camp Stove', 'Headlamp'] },
  running:          { line: ['Tempo', 'Split', 'Horizon'], model: ['Neutral', 'Stability', 'Trail'], noun: ['Running Shoes', 'Running Vest', 'Compression Socks'] },
  skincare:         { line: ['Dewpoint', 'Clarify', 'Renew'], model: ['Daily', 'Night', 'Gentle'], noun: ['Moisturiser', 'Serum', 'Cleanser', 'Sunscreen SPF 50'] },
  haircare:         { line: ['Silkline', 'Root', 'Verve'], model: ['Repair', 'Volume', 'Hydrate'], noun: ['Shampoo', 'Conditioner', 'Hair Oil', 'Leave-in Mask'] },
  fragrance:        { line: ['Vetiver', 'Cedarline', 'Bloom'], model: ['Eau de Parfum', 'Eau de Toilette'], noun: ['Fragrance 50ml', 'Fragrance 100ml'] },
  supplements:      { line: ['Vital', 'Foundation', 'Daily'], model: ['60-count', '90-count', '120-count'], noun: ['Multivitamin', 'Omega-3', 'Vitamin D3', 'Protein Powder'] },
  fiction:          { line: ['The Salt Road', 'Northern Light', 'A Quiet Machine', 'The Lantern Keeper'], model: [''], noun: ['— A Novel', '— Paperback', '— Hardcover'] },
  'non-fiction':    { line: ['On Deep Work', 'The Long Game', 'Cities and Salt', 'Making Things'], model: [''], noun: ['— Paperback', '— Hardcover'] },
  technical:        { line: ['Designing Data Systems', 'Practical React', 'The Pragmatic Path', 'Systems at Scale'], model: ['2nd Edition', '3rd Edition', ''], noun: ['— Technical Reference'] },
  'kids-books':     { line: ['Where the Kites Go', 'Ollie and the Ocean', 'Ten Sleepy Foxes'], model: [''], noun: ['— Picture Book', '— Board Book'] },
  'board-games':    { line: ['Harbourmaster', 'Silk & Spice', 'Cartographers Guild'], model: ['Base Game', 'Deluxe', 'Expansion'], noun: ['Board Game', 'Strategy Game'] },
  puzzles:          { line: ['Coastline', 'Night Market', 'Alpine Pass'], model: ['500-Piece', '1000-Piece', '2000-Piece'], noun: ['Jigsaw Puzzle'] },
  'building-sets':  { line: ['Skyline', 'Rover', 'Workshop'], model: ['240-Piece', '580-Piece', '1200-Piece'], noun: ['Building Set', 'Construction Kit'] },
  'outdoor-play':   { line: ['Skyward', 'Splash', 'Meadow'], model: ['Junior', 'Family'], noun: ['Kite', 'Water Slide', 'Badminton Set', 'Frisbee Set'] },
  'coffee-tea':     { line: ['Single Origin', 'House Blend', 'Highland'], model: ['250g', '500g', '1kg'], noun: ['Coffee Beans', 'Ground Coffee', 'Assam Tea', 'Green Tea'] },
  snacks:           { line: ['Roasted', 'Spiced', 'Honey'], model: ['200g', '400g'], noun: ['Almonds', 'Cashews', 'Trail Mix', 'Granola Bars'] },
  pantry:           { line: ['Cold-Pressed', 'Stone-Ground', 'Aged'], model: ['500ml', '1L', '1kg'], noun: ['Olive Oil', 'Basmati Rice', 'Balsamic Vinegar', 'Wholewheat Flour'] },
  beverages:        { line: ['Sparkling', 'Cold-Pressed', 'Botanical'], model: ['6-Pack', '12-Pack'], noun: ['Sparkling Water', 'Fruit Juice', 'Iced Tea', 'Kombucha'] },
};

/** Realistic price bands per subcategory, in MAJOR units (₹). */
export const PRICE_BANDS = {
  laptops: [42000, 240000], smartphones: [11000, 165000], headphones: [1200, 42000],
  cameras: [28000, 320000], tablets: [12000, 130000], monitors: [9000, 95000],
  cookware: [900, 24000], appliances: [1800, 55000], furniture: [3500, 90000],
  bedding: [1200, 18000], lighting: [800, 22000],
  'mens-clothing': [700, 12000], 'womens-clothing': [700, 14000], footwear: [1200, 22000],
  bags: [900, 28000], watches: [2200, 180000],
  fitness: [500, 26000], cycling: [400, 18000], camping: [900, 38000], running: [1500, 20000],
  skincare: [350, 7500], haircare: [250, 4200], fragrance: [1500, 16000], supplements: [400, 5500],
  fiction: [199, 899], 'non-fiction': [299, 1299], technical: [599, 3400], 'kids-books': [149, 799],
  'board-games': [800, 7500], puzzles: [400, 3200], 'building-sets': [900, 14000], 'outdoor-play': [250, 6500],
  'coffee-tea': [250, 3800], snacks: [120, 1600], pantry: [150, 3200], beverages: [180, 2400],
};

/** Which variant axes a subcategory uses. Drives the S7 variant-matrix lab. */
export const VARIANT_AXES = {
  laptops: [{ name: 'Memory', values: ['16GB', '24GB', '32GB'] }, { name: 'Storage', values: ['512GB', '1TB', '2TB'] }],
  smartphones: [{ name: 'Storage', values: ['128GB', '256GB', '512GB'] }, { name: 'Colour', values: ['Midnight', 'Silver', 'Sage'] }],
  tablets: [{ name: 'Storage', values: ['64GB', '128GB', '256GB'] }],
  monitors: [{ name: 'Size', values: ['24"', '27"', '32"'] }],
  headphones: [{ name: 'Colour', values: ['Black', 'Ivory', 'Navy'] }],
  cameras: [{ name: 'Kit', values: ['Body Only', 'With 18-55mm', 'With 24-70mm'] }],
  'mens-clothing': [{ name: 'Size', values: ['S', 'M', 'L', 'XL', 'XXL'] }, { name: 'Colour', values: ['Charcoal', 'Ecru', 'Olive', 'Navy'] }],
  'womens-clothing': [{ name: 'Size', values: ['XS', 'S', 'M', 'L', 'XL'] }, { name: 'Colour', values: ['Blush', 'Ink', 'Sage', 'Rust'] }],
  footwear: [{ name: 'Size', values: ['6', '7', '8', '9', '10', '11'] }, { name: 'Colour', values: ['White', 'Black', 'Tan'] }],
  bags: [{ name: 'Colour', values: ['Black', 'Olive', 'Sand'] }],
  watches: [{ name: 'Strap', values: ['Leather', 'Steel', 'Nylon'] }],
  bedding: [{ name: 'Size', values: ['Single', 'Queen', 'King'] }, { name: 'Colour', values: ['White', 'Slate', 'Sand'] }],
  running: [{ name: 'Size', values: ['6', '7', '8', '9', '10', '11'] }],
  fitness: [{ name: 'Weight', values: ['4kg', '8kg', '12kg', '16kg'] }],
  'coffee-tea': [{ name: 'Grind', values: ['Whole Bean', 'Filter', 'Espresso'] }],
};

export const REVIEW_TITLES = [
  'Exactly what I needed', 'Good, with one caveat', 'Better than expected',
  'Solid value for money', 'Does the job', 'Would buy again',
  'Not quite right for me', 'Arrived quickly, works well', 'Great build quality',
  'Disappointed with the finish', 'Perfect fit', 'A bit overpriced',
];

export const REVIEW_BODIES = [
  'Used it daily for three weeks now and it has held up well. No complaints so far.',
  'The quality is good but the sizing runs small — order one size up.',
  'Delivery was quick and packaging was solid. The product matches the photos.',
  'Works as described. Setup took about ten minutes and was straightforward.',
  'Good value at this price point, though I have seen better finishes elsewhere.',
  'Second one I have bought. The first lasted two years of heavy use.',
  'Does what it says. Nothing remarkable, nothing wrong with it either.',
  'Slight colour difference from the listing photo, but I am happy with it.',
  'Very pleased. The build feels considerably more expensive than it was.',
  'Returned the first unit with a fault; the replacement has been flawless.',
];

/**
 * Within a subcategory, nouns differ wildly in price — running shoes and
 * compression socks share the "running" band but not the same shelf. This
 * scales the band per noun so the store doesn't advertise ₹6,699 socks.
 * Anything not listed scales by 1.
 */
export const NOUN_PRICE_SCALE = {
  'Compression Socks': 0.10, 'Running Vest': 0.35,
  'Cycling Gloves': 0.22, 'Bike Light Set': 0.28, 'Floor Pump': 0.4,
  'Headlamp': 0.15, 'Camp Stove': 0.4, 'Sleeping Bag': 0.5,
  'Resistance Bands': 0.12, 'Yoga Mat': 0.2, 'Kettlebell': 0.55,
  'Skillet': 0.35, 'Saucepan': 0.3, 'Dutch Oven': 0.7,
  'Blender': 0.4, 'Coffee Maker': 0.5, 'Air Fryer': 0.7, 'Food Processor': 0.6,
  'Desk': 0.6, 'Bookshelf': 0.4, 'Armchair': 0.7,
  'Pillow Pair': 0.18, 'Bedsheet Set': 0.5,
  'Table Lamp': 0.4, 'Pendant Light': 0.6,
  'Sling Bag': 0.3, 'Tote': 0.4, 'Duffel': 0.7,
  'Sandals': 0.45, 'Loafers': 0.8,
  'Frisbee Set': 0.15, 'Kite': 0.2, 'Badminton Set': 0.5,
};

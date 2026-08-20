export type MenuItem = {
    name: string;
    desc?: string;
    price: string | number;
    type?: 'veg' | 'nonveg';
};

export type MenuSection = {
    id: string;
    title: string;
    note?: string;
    items: MenuItem[];
};

// Transcribed from the printed à la carte menu ("Menu Print Final", Aug 2026),
// the same edition served at /menu.pdf. Prices and the dish list must stay in
// step with that PDF — when the kitchen reprints, update both together.

// ─── BREAKFAST ────────────────────────────────────────────────────────────────

export const BREAKFAST: MenuSection[] = [
    {
        id: 'south-indian',
        title: 'South Indian Favourites',
        items: [
            { name: 'Idly', desc: 'Served with sambar, tomato chutney and coconut chutney', price: 345, type: 'veg' },
            { name: 'Vada', desc: 'Served with sambar, tomato chutney and coconut chutney', price: 265, type: 'veg' },
            { name: 'Choice of Dosa', desc: 'Plain roast / ghee roast, served with sambar, tomato chutney and coconut chutney', price: 305, type: 'veg' },
            { name: 'Masala Dosa', desc: 'Served with sambar, tomato chutney, coconut chutney and gunpowder', price: 345, type: 'veg' },
            { name: 'Appam', desc: '3 appam served with vegetable stew', price: 345, type: 'veg' },
            { name: 'Choice of Uttapam', desc: 'Served with sambar, tomato chutney, coconut chutney', price: 345, type: 'veg' },
            { name: 'Choice of Paratha', desc: 'Aloo / Paneer / Gobi — Indian flat breads filled with flavourful stuffing, pan fried, served with curd and pickle', price: 345, type: 'veg' },
            { name: 'Poori Bhaji', desc: 'Deep fried rounds flour served with potato masala curry — the famous subcontinent breakfast', price: 345, type: 'veg' },
        ],
    },
    {
        id: 'continental',
        title: 'Continental & American',
        items: [
            { name: 'Continental Breakfast', desc: 'Choice of seasonal fresh fruit juice, fresh cut fruits and served toast with preserves, tea or coffee', price: 465, type: 'veg' },
            { name: 'English Breakfast', desc: 'Choice of seasonal fresh fruit juice, fresh cut fruit, eggs prepared by your choice served with bacon or sausages, grilled tomatoes, hash browns, baked beans toast, tea or coffee', price: 675, type: 'nonveg' },
            { name: 'Breakfast Cereals', desc: 'Choice of cereals served with hot or cold milk and honey', price: 345, type: 'veg' },
            { name: 'Eggs to Order', desc: 'Boiled, poached, fried or scrambled eggs served with toast and preserves', price: 345, type: 'nonveg' },
        ],
    },
    {
        id: 'fruits-juice',
        title: 'Fruits & Juices',
        items: [
            { name: 'Seasonal Fresh Fruit Juice', price: 285, type: 'veg' },
            { name: 'Seasonal Fresh Cut Fruit Platter', price: 345, type: 'veg' },
        ],
    },
];

// ─── LUNCH & DINNER ──────────────────────────────────────────────────────────

export const LUNCH_DINNER: MenuSection[] = [
    {
        id: 'salads',
        title: 'Salads',
        items: [
            { name: 'Greek Salad', desc: 'A combination of feta cheese, garden fresh vegetables blended in lemon juice and olive oil dressing', price: 345, type: 'veg' },
            { name: 'Watermelon and Feta Salad', desc: 'Watermelon medallions laminated with feta and parmesan cheese ornamented with microgreens', price: 345, type: 'veg' },
            { name: 'Classic Caesar Salad — Vegetarian', desc: 'Assorted lettuce, croutons, vegetable with traditional cheese and caesar dressing', price: 345, type: 'veg' },
            { name: 'Classic Caesar Salad — Non-Vegetarian', desc: 'Assorted lettuce, croutons, chicken with traditional cheese and caesar dressing', price: 395, type: 'nonveg' },
            { name: 'Chicken Tikka Salad with Assorted Green', desc: 'Charcoal grilled chicken tikka pieces tossed with assorted lettuce greens and mint sauce dressing', price: 465, type: 'nonveg' },
        ],
    },
    {
        id: 'soups',
        title: 'Soups',
        items: [
            { name: 'Tomato and Basil Soup', desc: 'A healthy and nutritious soup with basil flavour', price: 285, type: 'veg' },
            { name: 'Mushroom and Cheese Soup', desc: 'Fresh button mushrooms soup with fresh cream and cheese', price: 285, type: 'veg' },
            { name: 'Almond and Broccoli Soup', desc: 'Herbs scented purée of broccoli mixed with almond flakes, chopped garlic, olive oil and finished with cream', price: 285, type: 'veg' },
            { name: 'Creamy Saffron Velouté Chicken Soup', desc: 'Rich and creamy velouté chicken soup with saffron', price: 345, type: 'nonveg' },
            { name: 'Sweet Corn Vegetable Soup', price: 265, type: 'veg' },
            { name: 'Sweet Corn Chicken Soup', desc: 'A hearty soup with a choice of mixed vegetables and sweetcorn in a warm and comforting broth', price: 285, type: 'nonveg' },
            { name: 'Hot and Sour Vegetable Soup', price: 285, type: 'veg' },
            { name: 'Hot and Sour Chicken Soup', desc: 'Tangy and spicy Chinese inspired soup with a mix of vegetables or chicken in bold flavour', price: 345, type: 'nonveg' },
            { name: 'Wonton Vegetable Soup', price: 285, type: 'veg' },
            { name: 'Wonton Chicken Soup', desc: 'Regional style Chinese dumpling soup, choice of vegetable or chicken flavoured with garlic and sesame oil', price: 345, type: 'nonveg' },
            { name: 'Badami Shorba Murgh / Gosht', desc: 'A flavourful Indian chicken/mutton soup rich in proteins, perfected with assorted desi spices slow cooked with almonds and saffron', price: '345 / 395', type: 'nonveg' },
            { name: 'Tom Yum Phak (Vegetable)', price: 285, type: 'veg' },
            { name: 'Tom Yum Kai (Chicken) / Goong (Prawns)', desc: 'Spicy and sour hot Thai coconut soup with mushrooms flavoured with galangal, basil leaves and kaffir lime, served with your choice of tender shrimps, chicken or diced vegetables', price: '345 / 395', type: 'nonveg' },
        ],
    },
    {
        id: 'tandoor',
        title: 'Appetizers from the Tandoor',
        items: [
            { name: 'Dahi Ke Kebab', desc: 'Desi spice infused pan-fried dumplings made with hung curd and cottage cheese, served with mint chutney and house relish', price: 465, type: 'veg' },
            { name: 'Paneer Tikka (Laal Mirch / Pudina)', desc: 'Silky smooth cottage cheese cubes marinated in your choice of flavours — red chilli or mint, barbecued in our clay oven', price: 445, type: 'veg' },
            { name: 'Tandoori Malai Broccoli', desc: 'Marinated in Indian rustic masala with a touch of hung curd, roasted in clay pot oven, served with mint chutney', price: 515, type: 'veg' },
            { name: 'Tandoori Malai Gobi', desc: 'Marinated in Indian rustic masala with a touch of hung curd, roasted in clay pot oven, served with mint chutney', price: 395, type: 'veg' },
            { name: 'Fruit Kebab', desc: 'Big chunks of selected fruits lightly spiced and finished in clay oven', price: 465, type: 'veg' },
            { name: 'Chicken Laal Masala Tikka', desc: 'Chicken cubes marinated with red chilli concocted with spices and yoghurt, cooked on skewers in tandoor', price: 675, type: 'nonveg' },
            { name: 'Chicken Tikka Pudinna', desc: 'Chicken cubes marinated with mint, concocted with spices and yoghurt, cooked on skewers in tandoor', price: 685, type: 'nonveg' },
            { name: 'Chicken Malai Tikka', desc: 'Chicken cubes marinated with cream, concocted with spices and yoghurt, cooked on skewers in tandoor', price: 729, type: 'nonveg' },
            { name: 'Kasundi Fish Tikka', desc: 'Fish marinated with delicious Bengali mustard sauce, served with mint chutney', price: 865, type: 'nonveg' },
            { name: 'Tandoori Prawns (Laal Mirch / Ajwain)', desc: 'Prawns marinated with your choice of flavours — red chilli or ajwain, cooked on skewers in tandoor', price: 865, type: 'nonveg' },
            { name: 'Tandoori Malai Prawns', desc: 'Prawns marinated with cream, concocted with spices and yoghurt, cooked on skewers in tandoor', price: 865, type: 'nonveg' },
        ],
    },
    {
        id: 'south-indian-starters',
        title: 'From Very Own South Indian',
        items: [
            { name: 'Chicken / Beef / Prawns', desc: 'Ularthu, Coconut Fry, Porichathu — pick your choice cooked in South Indian flavours', price: '475 / 515 / 735', type: 'nonveg' },
            { name: 'Kozhi Kurumulagu', desc: 'Tender pieces of chicken cooked with onion and finished with black pepper', price: 485, type: 'nonveg' },
            { name: 'Cauliflower 65', desc: 'A crispy South Indian appetiser deep fried to perfection', price: 395, type: 'veg' },
            { name: 'Chicken 65 / Prawns 65', desc: 'A crispy South Indian appetiser deep fried to perfection', price: '485 / 735', type: 'nonveg' },
        ],
    },
    {
        id: 'pan-asian-starters',
        title: 'From the Pan Asian',
        items: [
            { name: 'Stir Fried Vegetable', desc: 'Assorted vegetables sautéed with bell pepper, garlic, soya and sesame oil', price: 445, type: 'veg' },
            { name: 'Stir Fried Chicken / Prawns', desc: 'Sautéed with bell pepper, garlic, soya and sesame oil', price: '585 / 735', type: 'nonveg' },
            { name: 'Paneer with Exotic Vegetable', desc: 'Deep fried paneer tossed with shiitake, wood ear and fresh mushrooms stir fried with ginger, garlic, red chillies and finished with veg oyster sauce', price: 475, type: 'veg' },
            { name: 'Salt and Pepper Mushroom / Babycorn', desc: 'Crispy batter fried mushroom or fresh babycorn tossed with garlic and coarse black pepper', price: 475, type: 'veg' },
            { name: 'Peri Peri Prawn Torpedo', desc: 'Fiery marinated jumbo prawns batter fried with panko bread crumbs, served with sambal oelek and wasabi mayonnaise', price: 735, type: 'nonveg' },
            { name: 'Banbang Cauliflower', desc: 'American & Sichuan version butter fried cauliflower tossed with mayonnaise, chilli sauce, topped with chilli flakes and spring onion', price: 475, type: 'veg' },
            { name: 'Banbang Chicken', desc: 'American & Sichuan version butter fried chicken tossed with mayonnaise, chilli sauce, topped with chilli flakes and spring onion', price: 605, type: 'nonveg' },
        ],
    },
    {
        id: 'western',
        title: 'Western Main Course',
        items: [
            { name: 'Butter Garlic Grilled (King Fish / Prawns)', desc: 'Olive oil, lime juice and herbs marinated choice of fish or prawns, grilled and served with any potato preparation and sautéed vegetables', price: 1085, type: 'nonveg' },
            { name: 'Grilled Chicken Steak with Mushroom Wine De-Glaze Pepper Sauce', desc: 'Chicken breast marinated with olive oil and continental herbs, grilled, served with potato preparation and sautéed vegetables', price: 975, type: 'nonveg' },
            { name: 'Stroganoff — Chicken or Beef', desc: 'Chicken & beef strips cooked with mushroom and bell pepper sauce, served with herbed rice', price: 875, type: 'nonveg' },
            { name: 'Grilled Beef Tenderloin Fillet', desc: 'Grilled fillet of tenderloin beef served with roasted garlic, sautéed vegetables, potato preparation and choice of mushroom or pepper sauce', price: 1025, type: 'nonveg' },
            { name: 'Fish and Chips', desc: 'Fish fillet fried in tempura batter served with chunky chips and tartar sauce', price: 685, type: 'nonveg' },
            { name: 'Cauliflower and Broccoli Baked with Creamy Three Cheese Sauce', desc: 'Cauliflower and broccoli florets cooked with creamy béchamel sauce and baked with parmesan, yellow cheddar and amul cheese', price: 635, type: 'veg' },
        ],
    },
    {
        id: 'pan-asian-main',
        title: 'Pan Asian Main Course',
        items: [
            { name: 'Thai Vegetable Curry', desc: 'Choice of Thai green, red or yellow curry — traditional Thai style served with coconut basil rice, steam rice or jasmine rice', price: 525, type: 'veg' },
            { name: 'Chicken / Prawns Curry', desc: 'Choice of Thai green, red or yellow curry — traditional Thai style served with coconut basil rice, steam rice or jasmine rice', price: '625 / 735', type: 'nonveg' },
            { name: 'Sweet and Sour Chicken / Prawns', desc: 'Batter fried sliced chicken breast stir fried with juicy chunks of pineapple, onions, green, red & yellow peppers wok flashed in classic Chinese sweet & sour sauce', price: '625 / 735', type: 'nonveg' },
            { name: 'Vegetable Manchurian', desc: 'Vegetable balls cooked in Manchurian gravy', price: 395, type: 'veg' },
            { name: 'Paneer Manchurian', desc: 'Cottage cheese balls cooked in Manchurian gravy', price: 485, type: 'veg' },
            { name: 'Vegetable Fried Rice', desc: 'Traditional rice with vegetable and spring onion in Chinese dynasty preparation', price: 395, type: 'veg' },
            { name: 'Chicken / Mixed Fried Rice', desc: 'Traditional rice with chicken or mixed non-veg and spring onion in Chinese dynasty preparation', price: '485 / 675', type: 'nonveg' },
            { name: 'Wild Mushroom and Corn Fried Rice', price: 475, type: 'veg' },
            { name: 'Vegetable Hakka Noodles', desc: 'Traditional noodles with vegetable and spring onion in Chinese dynasty preparation', price: 395, type: 'veg' },
            { name: 'Chicken / Mixed Hakka Noodles', desc: 'Traditional noodles with chicken, prawns or mixed non-veg and spring onion in Chinese dynasty preparation', price: '475 / 685', type: 'nonveg' },
            { name: 'Choice of Vegetable (Chilly / Manchurian / Dragon)', desc: 'Fried to a crispy perfection and enveloped in a tantalising Chinese soya garlic sauce', price: 475, type: 'veg' },
            { name: 'Choice of Chicken / Prawns (Chilly / Manchurian / Dragon)', desc: 'Succulent pieces of chicken or prawns fried to a crispy perfection and enveloped in a tantalising Chinese soya garlic sauce', price: '605 / 735', type: 'nonveg' },
        ],
    },
    {
        id: 'pasta',
        title: 'The Pasta & Family',
        note: 'Select your pasta — Spaghetti / Penne / Fusilli · Whole Wheat Pasta — Penne / Spaghetti',
        items: [
            { name: 'Pesto Cream Exotic Vegetable Pasta', desc: 'Pasta with homemade basil pesto, fresh cream, cheese and exotic vegetable', price: 475, type: 'veg' },
            { name: 'Pasta in Mushroom Cheese Sauce', desc: 'Finished with fresh button mushroom slices, fresh cream, and parmesan', price: 475, type: 'veg' },
            { name: 'Spaghetti Bolognese', desc: 'Pasta cooked with minced beef tenderloin and tomato herbs', price: 635, type: 'nonveg' },
            { name: 'Aglio e Olio — Vegetable', desc: 'Delicious dry pasta tossed in garlic olive oil, spiced up with Italian herbs and chili flakes, sprinkled with parsley and parmigiana cheese', price: 475, type: 'veg' },
            { name: 'Aglio e Olio — Chicken / Prawns', desc: 'Delicious dry pasta tossed in garlic olive oil, spiced up with Italian herbs and chili flakes, sprinkled with parsley and parmigiana cheese', price: '635 / 735', type: 'nonveg' },
            { name: 'Arrabbiata — Vegetable', desc: 'Spicy sauce made from garlic, tomatoes, and dried red chilli peppers', price: 475, type: 'veg' },
            { name: 'Arrabbiata — Chicken / Prawns', desc: 'Spicy sauce made from garlic, tomatoes, and dried red chilli peppers', price: '575 / 735', type: 'nonveg' },
        ],
    },
    {
        id: 'kerala',
        title: 'Kerala Main Course',
        items: [
            { name: 'Vadakkan Veg Khorma', desc: 'Mix vegetable curry in a mild coconut gravy from North Kerala', price: 445, type: 'veg' },
            { name: 'Tharavu Mappas', desc: 'Duck prepared in coconut based gravy in Kuttanadan style', price: 675, type: 'nonveg' },
            { name: 'Meen Pollichathu', desc: 'King fish darne marinated with Kerala spices and masala wrapped in banana leaves grilled on tawa', price: 985, type: 'nonveg' },
            { name: 'Chemmeen Kizhi', desc: 'Sautéed prawns with onion tomato masala wrapped in banana leaf', price: 735, type: 'nonveg' },
            { name: 'Meen Mulakittathu', desc: 'King fish cubes simmered in spicy onion, tomato and tamarind sauce', price: 635, type: 'nonveg' },
            { name: 'Alleppey Meen Curry', desc: 'Classic and homely king fish cubes curry made using ground coconut paste, spiced up in chilli and raw mango', price: 635, type: 'nonveg' },
            { name: 'Kanthari Fish', desc: 'Tasty and spicy fish fry simmered in spicy coconut sauce', price: 795, type: 'nonveg' },
            { name: 'Kozhi Varutharacha Curry', desc: 'An absolute flavourful country style chicken preparation in roasted and ground coconut sauce', price: 635, type: 'nonveg' },
        ],
    },
    {
        id: 'kerala-biriyani',
        title: 'Kerala Biriyani, Rice & Breads',
        note: 'Fragrant kaima rice Malabari style, served with pappad, pickle and raita',
        items: [
            { name: 'Vegetable Biriyani', price: 475, type: 'veg' },
            { name: 'Chicken Biriyani', price: 635, type: 'nonveg' },
            { name: 'Fish Biriyani', price: 875, type: 'nonveg' },
            { name: 'Prawns Biriyani', price: 895, type: 'nonveg' },
            { name: 'Beef Biriyani', price: 735, type: 'nonveg' },
            { name: 'Mutton Biriyani', price: 1025, type: 'nonveg' },
            { name: 'Appam (1 piece)', price: 55, type: 'veg' },
            { name: 'Kerala Paratha (1 piece)', price: 105, type: 'veg' },
            { name: 'Boiled Rice / Ghee Rice', price: 225, type: 'veg' },
        ],
    },
    {
        id: 'north-indian',
        title: 'North Indian Main Course',
        items: [
            { name: 'Mixed Vegetable Jaipuri', desc: 'Mixed vegetable mixed with spicy Indian masala and finished with crispy roasted papad', price: 395, type: 'veg' },
            { name: 'Dal Makhani', desc: 'Slow cooked black lentils cooked with chilly paste, tomato and Indian spices', price: 395, type: 'veg' },
            { name: 'Dal Tadka / Lasooni', desc: 'Traditional yellow lentil, served as per your choice', price: 315, type: 'veg' },
            { name: 'Paneer Butter Masala', desc: 'Cottage cheese cooked with tomato and cashewnut gravy, finished with cream and butter', price: 525, type: 'veg' },
            { name: 'Paneer Lababdar', desc: 'Cottage cheese dices in rich tomato gravy with dried fenugreek leaves and butter', price: 525, type: 'veg' },
            { name: 'Choice of Aloo (Gobi / Jeera / Capsicum)', desc: 'Potato dry fry with Indian spices', price: 475, type: 'veg' },
            { name: 'Kadai Subzi', desc: 'Mix vegetables in onion tomato gravy and finish with crushed whole spices', price: 445, type: 'veg' },
            { name: 'Kumb Muttor Masala', desc: 'Mushroom and green peas cooked with perfection of traditional Indian gravy', price: 475, type: 'veg' },
            { name: 'Butter Chicken', desc: 'Charcoal flavour roasted boneless chicken pieces cooked in rich tomato, cashewnut gravy, finished with cream and butter', price: 675, type: 'nonveg' },
            { name: 'Murgh Methi', desc: 'An all-time favourite — chicken cooked with methi infused and chef special gravy', price: 585, type: 'nonveg' },
            { name: 'Murgh Tikka Masala', desc: 'Tender chicken chunks marinated leisurely cooked in deep, rich gravy of fresh crème, butter, tomato and spices', price: 675, type: 'nonveg' },
            { name: 'Mutton Rogan Josh', desc: 'A fiery smokey lamb curry cooked in a variety of masalas with a burst of red chillies, straight from Kashmir', price: 1035, type: 'nonveg' },
            { name: 'Mutton Bhuna Masala', desc: 'Slow cooked meat pieces with Indian spices and our very own chef special gravy', price: 1065, type: 'nonveg' },
            { name: 'North Indian Fish / Prawns Masala', desc: 'North Indian style choice of fish or prawns masala', price: '735 / 865', type: 'nonveg' },
        ],
    },
    {
        id: 'north-indian-rice',
        title: 'North Indian Biriyani, Rice & Breads',
        note: 'Choice of any meat — chicken, fish, mutton — chef special masala cooked with meat and rice, served with chutney, pickle and raita',
        items: [
            { name: 'Vegetable Biriyani', price: 555, type: 'veg' },
            { name: 'Chicken / Fish Biriyani', price: '635 / 735', type: 'nonveg' },
            { name: 'Mutton / Prawns Biriyani', price: '1035 / 875', type: 'nonveg' },
            { name: 'Jeera Rice / Peas Pulao', price: 455, type: 'veg' },
            { name: 'Dry Fruit Pulao / Kashmiri Pulao', price: 525, type: 'veg' },
            { name: 'Choice of Naan / Kulcha', price: 125, type: 'veg' },
            { name: 'Tandoori Roti', price: 105, type: 'veg' },
            { name: 'Phulka (3 pieces)', price: 165, type: 'veg' },
            { name: 'Chapati (1 piece)', price: 65, type: 'veg' },
            { name: 'Lachha Paratha', price: '225 / 195', type: 'veg' },
            { name: 'Cheese Naan', price: '225 / 195', type: 'veg' },
            { name: 'Stuffed Kulcha', price: '225 / 195', type: 'veg' },
        ],
    },
    {
        id: 'desserts',
        title: 'Desserts',
        items: [
            { name: 'Tiramisu', desc: 'A classic Italian dessert consisting of layers of mascarpone cheese and coffee soaked ladyfinger biscuits', price: 455, type: 'nonveg' },
            { name: 'Saffron Panna Cotta', desc: 'Light silky custard mildly spiced with saffron', price: 465, type: 'veg' },
            { name: 'Cheese Cake (White Chocolate / Blue Berry)', desc: 'Creamy white chocolate or blueberry cheese cake served with berry compote', price: 525, type: 'veg' },
            { name: 'Chocolate Walnut Brownie', desc: 'A rich brownie served with vanilla ice-cream and chocolate sauce', price: 525, type: 'nonveg' },
            { name: 'Pastry of the Day', price: 465, type: 'veg' },
            { name: 'Payasam of the Day', price: 295, type: 'veg' },
            { name: 'Gajar Ka Halwa', price: 345, type: 'veg' },
            { name: 'Freshly Cut Seasonal Fruit Bowl', desc: 'Served with hill honey and flavoured yoghurt', price: 395, type: 'veg' },
            { name: 'Choice of Ice Crème (Two Scoops)', desc: 'Served with choice of topping', price: 345, type: 'veg' },
        ],
    },
];

// ─── BEVERAGES ────────────────────────────────────────────────────────────────

export const BEVERAGES: MenuSection[] = [
    {
        id: 'soft-drinks',
        title: 'Soft Beverages',
        items: [
            { name: 'Mineral Water 1 Lit', price: 65 },
            { name: 'Sparkling Water', price: 375 },
            { name: 'Aerated Drinks', desc: 'Coke / Diet Coke / Sprite / Fanta / Soda Water', price: 165 },
            { name: 'Ginger Ale / Tonic Water', price: 185 },
            { name: 'Energy Drink — Red Bull', price: 315 },
            { name: 'Choice of Milk Shakes', desc: 'Vanilla / Chocolate / Strawberry — availability depends on flavours', price: 295, type: 'veg' },
            { name: 'Fresh Lime Juice / Soda', price: 125, type: 'veg' },
            { name: 'Lassi (Sweet or Salted) / Buttermilk', price: 185, type: 'veg' },
            { name: 'Milk', price: 245, type: 'veg' },
            { name: 'Hot Chocolate', price: 245, type: 'veg' },
            { name: 'Horlicks / Boost', price: 245, type: 'veg' },
            { name: 'Selection of Coffee', desc: 'South Indian filter coffee / black coffee / cappuccino / cafe latte', price: 245, type: 'veg' },
            { name: 'Selection of Tea', desc: 'Masala chai / ready-made tea / peppermint tea / chamomile tea / darjeeling tea / english breakfast tea / green tea with tulsi / assam tea / earl grey tea / lemon tea / ginger tea', price: 245, type: 'veg' },
        ],
    },
    {
        id: 'mocktails',
        title: 'Mocktails',
        note: 'Fruity, smooth and creamy — our heavenly blends designed to keep you cool and give you the energy boost you need.',
        items: [
            { name: 'Strawberry Basil Lemonade', desc: 'Strawberry hulled purée and sugar syrup blended with lemon juice and basil leaves', price: 335, type: 'veg' },
            { name: 'Watermelon Mint Cooler', desc: 'Fresh watermelon, lemon juice, mint leaves sparkling with water or soda', price: 335, type: 'veg' },
            { name: 'Classic Mojito', desc: 'A stormy blend of fresh lemon wedges, mint leaves, sugar syrup finished with crushed ice', price: 335, type: 'veg' },
            { name: 'Virgin Piña Colada', desc: 'Fresh pineapple juice mixed with coconut milk and finished with crushed ice', price: 335, type: 'veg' },
            { name: 'Margarita', desc: 'Orange juice mixed with sugar syrup, limeade, soda and finished with a dash of coarse salt', price: 335, type: 'veg' },
            { name: 'Pineapple Ginger Sparkler', desc: 'A sublime combination of pineapple juice, ginger ale and lemon juice with crushed ice', price: 335, type: 'veg' },
        ],
    },
];

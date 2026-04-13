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

// ─── BREAKFAST ────────────────────────────────────────────────────────────────

export const BREAKFAST: MenuSection[] = [
    {
        id: 'south-indian',
        title: 'South Indian Favourites',
        items: [
            { name: 'Idly', desc: 'Served with sambar, tomato chutney and coconut chutney', price: 280, type: 'veg' },
            { name: 'Vada', desc: 'Served with sambar, tomato chutney and coconut chutney', price: 230, type: 'veg' },
            { name: 'Choice of Dosa', desc: 'Plain roast / ghee roast, served with sambar, tomato chutney and coconut chutney', price: 260, type: 'veg' },
            { name: 'Masala Dosa', desc: 'Served with sambar, tomato chutney, coconut chutney and gunpowder', price: 300, type: 'veg' },
            { name: 'Appam', desc: '3 appam served with vegetable stew', price: 285, type: 'veg' },
            { name: 'Choice of Uttapam', desc: 'Served with sambar, tomato chutney, coconut chutney', price: 300, type: 'veg' },
            { name: 'Choice of Paratha', desc: 'Aloo / Paneer / Gobi — Indian flat breads filled with flavourful stuffing, pan fried, served with curd and pickle', price: 300, type: 'veg' },
            { name: 'Poori Bhaji', desc: 'Deep fried rounds flour served with potato masala curry — the famous subcontinent breakfast', price: 285, type: 'veg' },
        ],
    },
    {
        id: 'continental',
        title: 'Continental & American',
        items: [
            { name: 'Continental Breakfast', desc: 'Choice of seasonal fresh fruit juice, fresh cut fruits and served toast with preserves, tea or coffee', price: 400 },
            { name: 'English Breakfast', desc: 'Choice of seasonal fresh fruit juice, fresh cut fruit, eggs prepared by your choice served with bacon or sausages, grilled tomatoes, hash browns, baked beans toast, tea or coffee', price: 600 },
            { name: 'Breakfast Cereals', desc: 'Choice of cereals served with hot or cold milk and honey', price: 300, type: 'veg' },
            { name: 'Eggs to Order', desc: 'Boiled, poached, fried or scrambled eggs served with toast and preserves', price: 300 },
            { name: 'Pancake', desc: 'An American breakfast staple, served with a range of toppings', price: 250, type: 'veg' },
        ],
    },
    {
        id: 'fruits-juice',
        title: 'Fruits & Juices',
        items: [
            { name: 'Seasonal Fresh Fruit Juice / Healthy Fresh Juice', price: 250, type: 'veg' },
            { name: 'Seasonal Fresh Cut Fruit Platter', price: 300, type: 'veg' },
        ],
    },
];

// ─── LUNCH & DINNER ──────────────────────────────────────────────────────────

export const LUNCH_DINNER: MenuSection[] = [
    {
        id: 'salads',
        title: 'Salads',
        items: [
            { name: 'Greek Salad', desc: 'A combination of feta cheese, garden fresh vegetable blended in lemon juice and olive oil dressing', price: 300, type: 'veg' },
            { name: 'Orange and Mixed Lettuce Salad', desc: 'Classic orange segments, onion slice, mixed with various lettuce tossed with honey lemon dressing', price: 300, type: 'veg' },
            { name: 'Watermelon and Feta Salad', desc: 'Watermelon medallions laminated with feta and parmesan cheese ornamented with microgreens', price: 300, type: 'veg' },
            { name: 'Raw Mango and Cashewnut Salad', desc: 'Julienne cuts of raw mango tossed with South Indian curry leaf dressing and topped with fried cashewnut', price: 300, type: 'veg' },
            { name: 'Classic Caesar Salad — Vegetable', desc: 'Assorted lettuce, croutons, vegetable with traditional cheese and caesar dressing', price: 300, type: 'veg' },
            { name: 'Classic Caesar Salad — Chicken', desc: 'Assorted lettuce, croutons, chicken with traditional cheese and caesar dressing', price: 350, type: 'nonveg' },
            { name: 'Grilled Shrimp Niçoise Salad', desc: 'An American speciality made with shrimp, boiled eggs, poached green beans, tomatoes, green olives and tiny potatoes drizzled with Dijon vinaigrette', price: 400, type: 'nonveg' },
            { name: 'Chicken Tikka Salad with Assorted Green', desc: 'Charcoal grilled chicken tikka pieces tossed with assorted lettuce greens and mint sauce dressing', price: 400, type: 'nonveg' },
            { name: 'Seafood Salad', desc: 'Assorted seafood cubes, lettuce tossed with thousand island dressing', price: 400, type: 'nonveg' },
        ],
    },
    {
        id: 'soups',
        title: 'Soups',
        items: [
            { name: 'Tomato and Basil Soup', desc: 'A healthy and nutritious soup with basil flavoured', price: 250, type: 'veg' },
            { name: 'Mushroom and Cheese Soup', desc: 'Fresh button mushrooms soup with fresh cream and cheese', price: 250, type: 'veg' },
            { name: 'Almond and Broccoli Soup', desc: 'Herbs scented purée of broccoli mixed with almond flakes, chopped garlic, olive oil and finished with cream', price: 250, type: 'veg' },
            { name: 'Mulligatawny Vegetable', desc: 'Traditional Indian origin soup — spiced puréed lentil, served with lemon wedges and boiled rice', price: 250, type: 'veg' },
            { name: 'Sweet Corn Vegetable Soup', price: 200, type: 'veg' },
            { name: 'Hot and Sour Vegetable Soup', price: 250, type: 'veg' },
            { name: 'Wonton Vegetable Soup', price: 250, type: 'veg' },
            { name: 'Tom Yum Phak (Vegetable)', desc: 'Spicy and sour hot Thai coconut soup with mushrooms flavoured with galangal, basil leaves and kaffir lime', price: 250, type: 'veg' },
            { name: 'Creamy Saffron Velouté Chicken Soup', desc: 'Rich and creamy velouté chicken soup with saffron', price: 300, type: 'nonveg' },
            { name: 'Mulligatawny Chicken', desc: 'Traditional Indian origin soup — spiced puréed lentil, served with lemon wedges and boiled rice', price: 300, type: 'nonveg' },
            { name: 'Sweet Corn Chicken Soup', desc: 'A hearty soup with chicken and sweetcorn in a warm and comforting broth', price: 250, type: 'nonveg' },
            { name: 'Hot and Sour Chicken Soup', desc: 'Tangy and spicy Chinese inspired soup with chicken in bold flavour', price: 300, type: 'nonveg' },
            { name: 'Wonton Chicken Soup', desc: 'Regional style Chinese dumpling soup, choice of chicken flavoured with garlic and sesame oil', price: 300, type: 'nonveg' },
            { name: 'Badami Shorba Murgh / Gosht', desc: 'A flavourful Indian chicken/mutton soup rich in proteins, perfected with assorted desi spices slow cooked with almonds and saffron', price: '300 / 350', type: 'nonveg' },
            { name: 'Tom Yum Kai (Chicken) / Goong (Prawns)', desc: 'Spicy and sour hot Thai coconut soup with mushrooms flavoured with galangal, basil leaves and kaffir lime', price: '300 / 330', type: 'nonveg' },
        ],
    },
    {
        id: 'tandoor',
        title: 'Appetizers from the Tandoor',
        items: [
            { name: 'Chesse Hara Bhara Kebab', desc: 'Minced green vegetable kebab stuffed with cheese — an all time favourite', price: 350, type: 'veg' },
            { name: 'Paneer Tikka', desc: 'Laal Mirch / Pudina — silky smooth cottage cheese cubes marinated in your choice of flavours, barbecued in our clay oven', price: 380, type: 'veg' },
            { name: 'Tandoori Malai Gobi', price: 350, type: 'veg' },
            { name: 'Tandoori Malai Broccoli', desc: 'Marinated in Indian rustic masala with a touch of hung curd, roasted in clay pot oven, served with mint chutney', price: 450, type: 'veg' },
            { name: 'Bharwan Phaldari Aloo', desc: 'Potatoes marinated with hung curd, cream and spices, stuffed with fine chopped fruits, nuts and ground spices, barbecued in skewers', price: 450, type: 'veg' },
            { name: 'Dahi Ke Kebab', desc: 'Desi spice infused pan-fried dumplings made with hung curd and cottage cheese, served with mint chutney and house relish', price: 400, type: 'veg' },
            { name: 'Fruit Kebab', desc: 'Big chunks of selected fruits lightly spiced and finished in clay oven', price: 400, type: 'veg' },
            { name: 'Chicken Laal Masala Tikka', desc: 'Chicken cubes marinated with red chilli concocted with spices and yoghurt, cooked on skewers in tandoor', price: 600, type: 'nonveg' },
            { name: 'Chicken Tikka Pudina', desc: 'Chicken cubes marinated with mint, concocted with spices and yoghurt, cooked on skewers in tandoor', price: 600, type: 'nonveg' },
            { name: 'Chicken Malai Tikka', desc: 'Chicken cubes marinated with cream, concocted with spices and yoghurt, cooked on skewers in tandoor', price: 650, type: 'nonveg' },
            { name: 'Kasundi Fish Tikka', desc: 'Fish marinated with delicious Bengali mustard sauce, served with mint chutney', price: 750, type: 'nonveg' },
            { name: 'Tandoori Prawns (Laal Mirch / Ajwain)', desc: 'Medium prawns marinated with your choice of flavours — red chili or ajwain, cooked on skewers in tandoor', price: 750, type: 'nonveg' },
            { name: 'Tandoori Malai Prawns', desc: 'Medium prawns marinated with cream, concocted with spices and yoghurt, cooked on skewers in tandoor', price: 750, type: 'nonveg' },
            { name: 'Mutton Sheek Kebab', desc: 'Minced lamb immixed with our secret desi spice mix, layered on skewer, cooked in charcoal oven, served with mint chutney', price: 900, type: 'nonveg' },
        ],
    },
    {
        id: 'south-indian-starters',
        title: 'From Very Own South Indian',
        items: [
            { name: 'Cauliflower 65', desc: 'A crispy South Indian appetiser deep fried to perfection', price: 350, type: 'veg' },
            { name: 'Chicken 65 / Prawns 65', desc: 'A crispy South Indian appetiser deep fried to perfection', price: '420 / 650', type: 'nonveg' },
            { name: 'Chicken / Beef / Prawns', desc: 'Ularthu, Coconut Fry, Porichathu — pick your choice cooked in South Indian flavours', price: '420 / 480 / 650', type: 'nonveg' },
            { name: 'Kozhi Kurumulagu', desc: 'Tender pieces of chicken cooked with onion and finished with black pepper', price: 420, type: 'nonveg' },
        ],
    },
    {
        id: 'pan-asian-starters',
        title: 'From the Pan Asian',
        items: [
            { name: 'Thai Honey Chilli Potatoes', desc: 'Crispy potato wedges tossed with Thai bird eye chillies, honey and soya sauce', price: 300, type: 'veg' },
            { name: 'Stir Fried Vegetable', desc: 'Assorted vegetable sautéed with bell pepper, garlic, soya and sesame oil', price: 380, type: 'veg' },
            { name: 'Tofu with Exotic Mushrooms', desc: 'Deep fried tofu tossed with shiitake, wood ear and fresh mushrooms stir fried with ginger, garlic, red chillies and finished with veg oyster sauce', price: 500, type: 'veg' },
            { name: 'Paneer with Exotic Vegetable', desc: 'Deep fried paneer tossed with shiitake, wood ear and fresh mushrooms stir fried with ginger, garlic, red chillies and finished with veg oyster sauce', price: 400, type: 'veg' },
            { name: 'Salt and Pepper Mushroom / Babycorn', desc: 'Crispy batter fried mushroom or fresh babycorn tossed with garlic and coarse black pepper', price: 400, type: 'veg' },
            { name: 'Banbang Cauliflower', desc: 'American & Sichuan version butter fried cauliflower tossed with mayonnaise, chilli sauce, topped with chilli flakes and spring onion', price: 400, type: 'veg' },
            { name: 'Stir Fried Chicken / Prawns', desc: 'Assorted vegetable sautéed with bell pepper, garlic, soya and sesame oil', price: '520 / 650', type: 'nonveg' },
            { name: 'Peri Peri Prawn Torpedo', desc: 'Fiery marinated jumbo prawns batter fried with panko bread crumbs, served with sambal oelek and wasabi mayonnaise', price: 650, type: 'nonveg' },
            { name: 'Chicken / Prawns on Tossed', desc: 'Minced chicken or prawns mixed with Asian herbs, deep fried and served with schezwan sauce', price: '500 / 650', type: 'nonveg' },
            { name: 'Banbang Chicken', desc: 'American & Sichuan version butter fried chicken tossed with mayonnaise, chilli sauce, topped with chilli flakes and spring onion', price: 550, type: 'nonveg' },
        ],
    },
    {
        id: 'western',
        title: 'Western Main Course',
        items: [
            { name: 'Cauliflower and Broccoli Baked with Creamy Three Cheese Sauce', desc: 'Cauliflower and broccoli florets cooked with creamy béchamel sauce and baked with parmesan, yellow cheddar and amul cheese', price: 550, type: 'veg' },
            { name: 'Fish and Chips', desc: 'Fish fillet fried in tempura batter served with chunky chips and tartar sauce', price: 600, type: 'nonveg' },
            { name: 'Polo Caravela', desc: 'Spinach and cheese sautéed in tender chicken breast, a tarragon cream sauce, served with steam pasta', price: 800, type: 'nonveg' },
            { name: 'Grilled Chicken Steak', desc: 'With mushroom wine de-glaze pepper sauce — chicken breast marinated with olive oil and continental herbs, grilled, served with potato preparation and sautéed vegetables', price: 850, type: 'nonveg' },
            { name: 'Grilled Beef Tenderloin Fillet', desc: 'Grilled fillet of tenderloin beef served with roasted garlic, sautéed vegetables, potato preparation and choice of mushroom or pepper sauce', price: 900, type: 'nonveg' },
            { name: 'Butter Garlic Grilled King Fish / Prawns', desc: 'Olive oil, lime juice and herbs marinated choice of fish or prawns, grilled and served with any potato preparation and sautéed vegetables', price: 950, type: 'nonveg' },
            { name: 'Stroganoff — Chicken / Beef', desc: 'Chicken & beef strips cooked with mushroom and bell pepper sauce, served with herbed rice', price: 750, type: 'nonveg' },
        ],
    },
    {
        id: 'pan-asian-main',
        title: 'Pan Asian Main Course',
        items: [
            { name: 'Thai Vegetable Curry', desc: 'Choice of Thai green, red or yellow curry — traditional Thai style served with coconut basil rice, steam rice or jasmine rice', price: 450, type: 'veg' },
            { name: 'Vegetable Manchurian', desc: 'Vegetable balls cooked in Manchurian gravy', price: 350, type: 'veg' },
            { name: 'Paneer Manchurian', desc: 'Cottage cheese balls cooked in Manchurian gravy', price: 400, type: 'veg' },
            { name: 'Vegetable Fried Rice', desc: 'Traditional rice with vegetable, spring onion in Chinese dynasty preparation', price: 350, type: 'veg' },
            { name: 'Wild Mushroom and Corn Fried Rice', price: 400, type: 'veg' },
            { name: 'Vegetable Hakka Noodles', desc: 'Traditional noodles with vegetable and spring onion in Chinese dynasty preparation', price: 350, type: 'veg' },
            { name: 'Vegetable / Chicken / Prawns (Chilly / Manchurian / Dragon)', desc: 'Fried to a crispy perfection and enveloped in Chinese soya garlic sauce', price: '400 / 550 / 650', type: 'nonveg' },
            { name: 'Chicken / Prawns Curry', desc: 'Choice of Thai green, red or yellow curry — traditional Thai style served with coconut basil rice, steam rice or jasmine rice', price: '550 / 650', type: 'nonveg' },
            { name: 'Sweet and Sour Chicken / Prawns', desc: 'Batter fried chicken breast stir fried with pineapple, onions, green, red & yellow peppers in classic Chinese sweet & sour sauce', price: '550 / 650', type: 'nonveg' },
            { name: 'Chicken / Mixed Fried Rice', desc: 'Traditional rice with chicken/prawns, spring onion in Chinese dynasty preparation', price: '400 / 600', type: 'nonveg' },
            { name: 'Chicken / Mixed Hakka Noodles', desc: 'Traditional noodles with chicken/prawns and spring onion in Chinese dynasty preparation', price: '400 / 600', type: 'nonveg' },
            { name: 'Beef Stir Fry with Honey and Black Pepper Sauce', desc: 'Hong Kong style beef fillets with ground black pepper & oyster sauce', price: 750, type: 'nonveg' },
        ],
    },
    {
        id: 'pasta',
        title: 'The Pasta & Family',
        note: 'Select your pasta — Spaghetti / Penne / Fusilli · Whole Wheat Pasta — Penne / Spaghetti',
        items: [
            { name: 'Pasta Puttanesca', desc: 'Pasta tossed with capers, olives, tomatoes, garlic, chilli flakes and tomato sauce', price: 400, type: 'veg' },
            { name: 'Pesto Cream Exotic Vegetable Pasta', desc: 'Pasta with homemade basil pesto, fresh cream, cheese and exotic vegetable', price: 400, type: 'veg' },
            { name: 'Pasta in Mushroom Cheese Sauce', desc: 'Finished with fresh button mushroom slices, fresh cream, and parmesan', price: 400, type: 'veg' },
            { name: 'Aglio e Olio — Vegetable', desc: 'Dry pasta tossed in garlic olive oil, spiced up with Italian herbs and chili flakes, sprinkled with parsley and parmigiana cheese', price: 400, type: 'veg' },
            { name: 'Arrabbiata — Vegetable', desc: 'Spicy sauce made from garlic, tomatoes, and dried red chilli peppers', price: 400, type: 'veg' },
            { name: 'Spaghetti Bolognese', desc: 'Pasta cooked with minced beef tenderloin and tomato herbs', price: 550, type: 'nonveg' },
            { name: 'Aglio e Olio — Chicken / Prawns', desc: 'Dry pasta tossed in garlic olive oil, Italian herbs and chili flakes, sprinkled with parsley and parmigiana cheese', price: '550 / 650', type: 'nonveg' },
            { name: 'Arrabbiata — Chicken / Prawns', desc: 'Spicy sauce made from garlic, tomatoes, and dried red chilli peppers', price: '500 / 650', type: 'nonveg' },
            { name: 'Pasta in Tangy Seafood Balls Sauce', desc: 'Assorted basil and garlic flavour seafood minced steamy balls tossed with tomato sauce and served with pasta', price: 750, type: 'nonveg' },
        ],
    },
    {
        id: 'kerala',
        title: 'Kerala Main Course',
        items: [
            { name: 'Vadakkan Veg Khorma', desc: 'Mix vegetable curry in a mild coconut gravy from North Kerala', price: 380, type: 'veg' },
            { name: 'Meen Mulakittathu', desc: 'King fish cubes simmered in spicy onion, tomato and tamarind sauce', price: 550, type: 'nonveg' },
            { name: 'Alappey Meen Curry', desc: 'Classic and homely king fish cubes curry made using ground coconut paste, spiced up in chilli and raw mango', price: 550, type: 'nonveg' },
            { name: 'Kozhi Varutharacha Curry', desc: 'Country style chicken preparation in roasted and grounded coconut sauce', price: 550, type: 'nonveg' },
            { name: 'Kuttanadan Tharavu Kurumulagu', desc: 'Kuttanadan style dry duck roast spiced up with stone crushed black pepper and chef special masala', price: 550, type: 'nonveg' },
            { name: 'Tharavu Mappas', desc: 'Duck prepared in coconut based gravy in Kuttanadan style', price: 580, type: 'nonveg' },
            { name: 'Chemmeen Kizhi', desc: 'Sautéed prawns with onion tomato masala wrapped in banana leaf', price: 650, type: 'nonveg' },
            { name: 'Karimundan Roast — Fish / Beef', desc: 'Tender beef or fish spiced with black pepper and slow cooked with coconut slices in thick bottom vessel', price: '650 / 650', type: 'nonveg' },
            { name: 'Kanthari Fish', desc: 'Tasty and spicy fish fry simmered in spicy coconut sauce', price: 700, type: 'nonveg' },
            { name: 'Meen Pollichathu', desc: 'King fish darne marinated with Kerala spices and masala wrapped in banana leaves grilled on tawa', price: 850, type: 'nonveg' },
            { name: 'Adu Koorkka Curry', desc: 'Lamb medallions and Chinese potatoes stewed in curry in flavoured coconut gravy', price: 850, type: 'nonveg' },
        ],
    },
    {
        id: 'kerala-biriyani',
        title: 'Kerala Biriyani, Rice & Breads',
        items: [
            { name: 'Vegetable Biriyani', desc: 'Fragrant kaima rice Malabari style, served with pappad, pickle and raita', price: 400, type: 'veg' },
            { name: 'Appam (1 piece)', price: 50, type: 'veg' },
            { name: 'Kerala Paratha (1 piece)', price: 90, type: 'veg' },
            { name: 'Boiled Rice / Ghee Rice', price: '200 / 250', type: 'veg' },
            { name: 'Executive Meal', price: 299 },
            { name: 'Chicken Biriyani', desc: 'Fragrant kaima rice Malabari style, served with pappad, pickle and raita', price: 550, type: 'nonveg' },
            { name: 'Beef Biriyani', price: 650, type: 'nonveg' },
            { name: 'Prawns Biriyani', price: 650, type: 'nonveg' },
            { name: 'Fish Biriyani', price: 750, type: 'nonveg' },
            { name: 'Mutton Biriyani', price: 900, type: 'nonveg' },
        ],
    },
    {
        id: 'north-indian',
        title: 'North Indian Main Course',
        items: [
            { name: 'Dal Tadka / Lasooni', desc: 'Traditional yellow lentil, served as per your choice', price: 250, type: 'veg' },
            { name: 'Dal Makhani', desc: 'Slow cooked black lentils cooked with chilli paste, tomato and Indian spices', price: 300, type: 'veg' },
            { name: 'Choice of Aloo (Gobi / Jeera / Capsicum)', desc: 'Potato dry fry with Indian spices', price: 330, type: 'veg' },
            { name: 'Mixed Vegetable Jaipuri', desc: 'Mixed vegetable mixed with spicy Indian masala and finished with crispy roasted papad', price: 350, type: 'veg' },
            { name: 'Kadai Subzi', desc: 'Mix vegetables in onion tomato gravy finished with crushed whole spices', price: 350, type: 'veg' },
            { name: 'Paneer Butter Masala', desc: 'Cottage cheese cooked with tomato and cashewnut gravy, finished with cream and butter', price: 400, type: 'veg' },
            { name: 'Paneer Lababdar', desc: 'Cottage cheese dices in rich tomato gravy with dried fenugreek leaves and butter', price: 400, type: 'veg' },
            { name: 'Zaffarni Subzi Khorma', desc: 'Vegetables cooked in saffron and cashew nut cream sauce', price: 400, type: 'veg' },
            { name: 'Kumb Muttor Masala', desc: 'Mushroom and green peas cooked with perfection of traditional Indian gravy', price: 400, type: 'veg' },
            { name: 'Vegetable Navratan Korma', desc: 'Rich creamy luxurious curry dish mixed with vegetable and dry fruits', price: 500, type: 'veg' },
            { name: 'Malai Kofta', desc: 'Dumplings made with grated cottage cheese, green chillies, cardamom powder simmered with onion and cashew creamy gravy', price: 500, type: 'veg' },
            { name: 'Murgh Methi', desc: 'An all time favourite chicken cooked with methi infused and chef special gravy', price: 500, type: 'nonveg' },
            { name: 'Butter Chicken', desc: 'Charcoal flavour roasted boneless chicken pieces cooked in rich tomato, cashewnut gravy, finished with cream and butter', price: 550, type: 'nonveg' },
            { name: 'Murgh Tikka Masala', desc: 'Tender chicken chunks marinated leisurely cooked in deep, rich gravy of fresh crème, butter, tomato and spices', price: 600, type: 'nonveg' },
            { name: 'Prawns Malai Curry', desc: 'Jumbo prawns cooked in rich Indian white gravy', price: 650, type: 'nonveg' },
            { name: 'North Indian Fish / Prawns Masala', desc: 'North Indian style choice of fish or prawns masala', price: '750 / 650', type: 'nonveg' },
            { name: 'Mutton Rogan Josh', desc: 'A fiery smokey lamb curry cooked in a variety of masalas with a burst of red chillies, straight from Kashmir', price: 900, type: 'nonveg' },
            { name: 'Mutton Bhuna Masala', desc: 'Slow cooked meat pieces with Indian spices and our very own chef special gravy', price: 900, type: 'nonveg' },
        ],
    },
    {
        id: 'north-indian-rice',
        title: 'North Indian Biriyani, Rice & Breads',
        note: 'Choose any meat — Chicken, Fish, Mutton, Chef Special — masala cooked with rice, served with chutney, pickle and raita',
        items: [
            { name: 'Vegetable Biriyani', price: 400, type: 'veg' },
            { name: 'Jeera Rice / Peas Pulao', price: 230, type: 'veg' },
            { name: 'Dry Fruit Pulao / Kashmiri Pulao', price: 400, type: 'veg' },
            { name: 'Choice of Naan / Kulcha', price: 90, type: 'veg' },
            { name: 'Tandoori Roti', price: 90, type: 'veg' },
            { name: 'Phulka (3 pieces)', price: 110, type: 'veg' },
            { name: 'Chapati (1 piece)', price: 50, type: 'veg' },
            { name: 'Lachha Paratha', price: 110, type: 'veg' },
            { name: 'Cheese Naan', price: 200, type: 'veg' },
            { name: 'Stuffed Kulcha', price: 150, type: 'veg' },
            { name: 'Chicken / Fish Biriyani', price: '550 / 750', type: 'nonveg' },
            { name: 'Mutton / Prawns Biriyani', price: '900 / 650', type: 'nonveg' },
            { name: 'Keema Naan', desc: 'Indian spiced roasted chicken mince stuffed in naan dough, cooked to perfection in clay oven', price: 200, type: 'nonveg' },
        ],
    },
    {
        id: 'desserts',
        title: 'Desserts',
        items: [
            { name: 'Payasam of the Day', price: 250, type: 'veg' },
            { name: 'Almond Crème Brûlée', desc: 'Almond powder, egg yolk and sugar caramelised with fresh cream', price: 300, type: 'veg' },
            { name: 'Gajar Ka Halwa', price: 300, type: 'veg' },
            { name: 'Choice of Ice Crème (Two Scoops)', desc: 'Served with choice of topping', price: 300, type: 'veg' },
            { name: 'Freshly Cut Seasonal Fruit Bowl', desc: 'Served with hill honey and flavoured yoghurt', price: 350, type: 'veg' },
            { name: 'Tiramisu', desc: 'A classic Italian dessert consisting layers of mascarpone cheese and coffee soaked ladyfinger biscuits', price: 350, type: 'veg' },
            { name: 'Saffron Panna Cotta', desc: 'Light silky custard mildly spiced with saffron', price: 400, type: 'veg' },
            { name: 'Pastry of the Day', price: 400, type: 'veg' },
            { name: 'Sachertorte', desc: 'A classic Viennese dessert with layers of chocolate and apricot jam', price: 450, type: 'veg' },
            { name: 'Cheese Cake — White Chocolate / Blue Berry', desc: 'Creamy white chocolate or blueberry cheese cake served with berry compote', price: 450, type: 'veg' },
            { name: 'Chocolate Walnut Brownie', desc: 'A rich brownie served with vanilla ice-cream and chocolate sauce', price: 450, type: 'veg' },
        ],
    },
];

// ─── BEVERAGES ────────────────────────────────────────────────────────────────

export const BEVERAGES: MenuSection[] = [
    {
        id: 'soft-drinks',
        title: 'Soft Beverages',
        items: [
            { name: 'Mineral Water 1 Lit', price: 100 },
            { name: 'Aerated Water', desc: 'Coca Cola / Coke Diet / Sprite / Fanta / Soda Water', price: 100 },
            { name: 'Ginger Ale / Tonic Water', price: 150 },
            { name: 'Fresh Lime Juice / Soda', price: 90 },
            { name: 'Lassi (Sweet or Salted) / Buttermilk', price: 150, type: 'veg' },
            { name: 'Milk', price: 150, type: 'veg' },
            { name: 'Hot Chocolate', price: 200, type: 'veg' },
            { name: 'Energy Drink — Red Bull', price: 200 },
            { name: 'Choice of Milk Shakes', desc: 'Vanilla / Chocolate / Strawberry', price: 250, type: 'veg' },
            { name: 'Health Drinks', desc: 'Horlicks / Boost', price: 175, type: 'veg' },
            { name: 'Selection of Coffee', desc: 'South Indian Filter Coffee / Black Coffee', price: 120, type: 'veg' },
            { name: 'Selection of Tea', desc: 'Green Tea / Black Tea / Fruit Infusions / Masala Chai / Ready-Made Tea', price: 120, type: 'veg' },
        ],
    },
    {
        id: 'mocktails',
        title: 'Mocktails',
        note: 'Fruity, smooth and creamy — our heavenly blends designed to keep you cool and give you the energy boost you need.',
        items: [
            { name: 'Strawberry Basil Lemonade', desc: 'Strawberry hulled purée and sugar syrup blended with lemon juice and basil leaves', price: 250, type: 'veg' },
            { name: 'Watermelon Mint Cooler', desc: 'Fresh watermelon, lemon juice, mint leaves sparkling with water or soda', price: 250, type: 'veg' },
            { name: 'Classic Mojito', desc: 'A stormy blend of fresh lemon wedges, mint leaves, sugar syrup finished with crushed ice', price: 250, type: 'veg' },
            { name: 'Virgin Piña Colada', desc: 'Fresh pineapple juice mixed with coconut milk and finished with crushed ice', price: 250, type: 'veg' },
            { name: 'Margarita', desc: 'Orange juice mixed with sugar syrup, limeade, soda and finished with a dash of coarse salt', price: 250, type: 'veg' },
            { name: 'Pineapple Ginger Sparkler', desc: 'A sublime combination of pineapple juice, ginger ale and lemon juice with crushed ice', price: 250, type: 'veg' },
        ],
    },
];

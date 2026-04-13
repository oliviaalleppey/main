import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import StickyBookButton from '@/components/sticky-book-button';
import WhatsAppWidget from '@/components/whatsapp-widget';

const VEG = () => (
    <span className="inline-flex items-center justify-center w-4 h-4 border-2 border-green-600 rounded-sm flex-shrink-0">
        <span className="w-2 h-2 rounded-full bg-green-600" />
    </span>
);

const NONVEG = () => (
    <span className="inline-flex items-center justify-center w-4 h-4 border-2 border-red-600 rounded-sm flex-shrink-0">
        <span className="w-2 h-2 rounded-full bg-red-600" />
    </span>
);

type MenuItem = {
    name: string;
    desc?: string;
    price: string | number;
    type?: 'veg' | 'nonveg';
};

type MenuSection = {
    title: string;
    items: MenuItem[];
};

const FOOD: MenuSection[] = [
    {
        title: 'Sandwiches',
        items: [
            {
                name: 'Tomato, Cucumber & Cheese Sandwich',
                desc: 'A refreshing combination of tomatoes, cucumber and cheese, served with coleslaw and potato fries or wedges',
                price: 300,
                type: 'veg',
            },
            {
                name: 'Bun N Patties',
                desc: 'Toasted sesame bun, vegetable pattie, salad with cheese, served with coleslaw and potato fries or wedges',
                price: 380,
                type: 'veg',
            },
            {
                name: 'Jumbo Sandwich',
                desc: 'Sandwich made with wasabi mayonnaise, lettuce, grilled pineapple, tomato, cheddar cheese, served with coleslaw and potato fries or wedges',
                price: 400,
            },
            {
                name: 'Chicken & Cheese Sandwich',
                desc: 'Sandwich made with chicken and lettuce mayo, finished with cheese slice, served with coleslaw and potato fries or wedges',
                price: 400,
                type: 'nonveg',
            },
            {
                name: 'Bun N Patties',
                desc: 'Toasted sesame bun, choice of chicken or beef patties, salad and cheese, served with coleslaw and potato fries or wedges',
                price: 450,
                type: 'nonveg',
            },
            {
                name: 'Jumbo Sandwich',
                desc: 'Sandwich made with chicken and wasabi mayonnaise, lettuce, tomato, cheddar cheese, served with coleslaw and potato fries or wedges',
                price: 500,
                type: 'nonveg',
            },
        ],
    },
    {
        title: 'Bites & Sides',
        items: [
            { name: 'French Fries', price: 200 },
            { name: 'Nuggets', price: 350, type: 'veg' },
            { name: 'Potato Wedges', price: 250, type: 'veg' },
            { name: 'Crispy Onion Rings', price: 250, type: 'veg' },
            { name: 'Mini Spring Rolls', price: 350, type: 'veg' },
            { name: 'Chicken Nuggets', price: 450, type: 'nonveg' },
            { name: 'Mini Spring Rolls', price: 400, type: 'nonveg' },
            {
                name: 'Crumbled Fried Chicken / Fish',
                desc: 'Finger strips of chicken or fish marinated with chef\'s special spices, crumbled and deep fried, served with tartar dip',
                price: 450,
                type: 'nonveg',
            },
        ],
    },
    {
        title: 'Desserts',
        items: [
            {
                name: 'Gulab Jamun',
                desc: 'All time favourite Indian dessert topping with almond flakes',
                price: 200,
                type: 'veg',
            },
            {
                name: 'Freshly Cut Seasonal Fruit Platter',
                desc: 'Served with hill honey and flavoured yoghurt',
                price: 300,
                type: 'veg',
            },
            {
                name: 'Choice Of Ice Creams',
                desc: 'Two scoops, served with choice of topping',
                price: 300,
                type: 'veg',
            },
        ],
    },
];

const BEVERAGES: MenuSection[] = [
    {
        title: 'Coffee',
        items: [
            { name: 'Cappuccino', price: 190 },
            { name: 'Cafe Latte', price: 190 },
            { name: 'Espresso', desc: 'Single Shot / Double Shot', price: '150 / 190' },
            { name: 'Caffè Macchiato', price: 190 },
            { name: 'Caffè Americano', price: 150 },
            { name: 'Caramel Latte', price: 200 },
            { name: 'Mocha Chocolate', price: 230 },
            { name: 'Mochaccino', price: 230 },
            { name: 'Frappuccino', price: 200 },
            { name: 'Flat White', price: 200 },
            {
                name: 'Extra Toppings',
                desc: 'Caramel Syrup / Hazelnut Syrup / Toffee Nut Syrup / Vanilla Syrup',
                price: 50,
            },
        ],
    },
    {
        title: 'Cold & Soft Drinks',
        items: [
            { name: 'Mineral Water 1 Lit', price: 100 },
            { name: 'Aerated Water', desc: 'Coca Cola / Coke Diet / Sprite / Fanta / Soda Water', price: 100 },
            { name: 'Ginger Ale / Tonic Water', price: 150 },
            { name: 'Energy Drink — Red Bull', price: 200 },
            { name: 'Choice Of Fresh Juice', price: 250 },
            { name: 'Choice Of Milk Shakes', desc: 'Vanilla / Chocolate / Strawberry', price: 250 },
            { name: 'Fresh Lime Juice / Soda', price: 150 },
            { name: 'Lassi / Buttermilk', desc: 'Sweet or Salted', price: 180 },
            { name: 'Milk', price: 150 },
            { name: 'Hot Chocolate', price: 200 },
            { name: 'Healthy Drinks', desc: 'Horlicks / Boost', price: 205 },
            {
                name: 'Selection Of Tea',
                desc: 'Green Tea / Black Tea / Fruit Infusions / Masala Chai / Ready-Made Tea',
                price: 150,
            },
        ],
    },
];

function MenuRow({ item }: { item: MenuItem }) {
    return (
        <div className="flex items-start gap-3 py-3.5 border-b border-[#EAE2D6] last:border-0">
            <div className="mt-0.5 w-5 flex-shrink-0">
                {item.type === 'veg' && <VEG />}
                {item.type === 'nonveg' && <NONVEG />}
            </div>
            <div className="flex-1 min-w-0">
                <p className="text-[#2C2318] font-medium text-[0.93rem] leading-snug">{item.name}</p>
                {item.desc && (
                    <p className="text-[#7A6A58] text-[0.75rem] mt-0.5 leading-relaxed">{item.desc}</p>
                )}
            </div>
            <p className="text-[#5C3D1E] font-semibold text-[0.93rem] tabular-nums whitespace-nowrap flex-shrink-0 pt-0.5">
                ₹{item.price}
            </p>
        </div>
    );
}

function Section({ section }: { section: MenuSection }) {
    return (
        <div>
            <div className="flex items-center gap-3 mb-1">
                <span className="w-1 h-5 bg-[#8B5C2A] rounded-full" />
                <h3 className="text-[0.7rem] tracking-[0.32em] uppercase text-[#8B5C2A] font-semibold">{section.title}</h3>
            </div>
            <div className="mt-1">
                {section.items.map((item, i) => (
                    <MenuRow key={`${item.name}-${i}`} item={item} />
                ))}
            </div>
        </div>
    );
}

export default function BrewBiteMenuPage() {
    return (
        <>
            <main className="min-h-screen bg-[#FAF6F0]">

                {/* Hero */}
                <section className="relative bg-[#2C1A0E] overflow-hidden">
                    <div className="absolute inset-0 opacity-[0.07]"
                        style={{ backgroundImage: 'radial-gradient(circle at 20% 50%, #C8935A 0%, transparent 60%), radial-gradient(circle at 80% 20%, #8B5C2A 0%, transparent 55%)' }}
                    />
                    <div className="relative max-w-4xl mx-auto px-6 py-14 md:py-20 text-center">
                        <Link
                            href="/dining"
                            className="inline-flex items-center gap-1.5 text-[#C8935A]/70 hover:text-[#C8935A] text-[0.7rem] tracking-[0.28em] uppercase mb-10 transition-colors"
                        >
                            <ArrowLeft className="w-3 h-3" />
                            Back to Dining
                        </Link>

                        {/* Logo wordmark */}
                        <div className="mb-3">
                            <p className="text-[#C8935A] text-[0.68rem] tracking-[0.4em] uppercase mb-4">Olivia International, Alleppey</p>
                            <div className="inline-flex flex-col items-center gap-0">
                                <span className="font-serif text-5xl md:text-6xl font-bold text-white tracking-tight leading-none">Brew</span>
                                <div className="flex items-center gap-2 my-0.5">
                                    <span className="w-8 h-[1px] bg-[#C8935A]" />
                                    <span className="text-[#C8935A] text-sm font-light italic">&amp;</span>
                                    <span className="w-8 h-[1px] bg-[#C8935A]" />
                                </div>
                                <span className="font-serif text-5xl md:text-6xl font-bold text-white tracking-tight leading-none">Bite</span>
                            </div>
                            <p className="text-[#C8935A]/80 text-[0.65rem] tracking-[0.55em] uppercase mt-4">Coffee Shop</p>
                        </div>

                        <div className="mt-8 flex items-center justify-center gap-3">
                            <span className="w-12 h-[1px] bg-[#C8935A]/40" />
                            <p className="text-white/50 text-[0.72rem] tracking-[0.2em] uppercase">À La Carte Menu</p>
                            <span className="w-12 h-[1px] bg-[#C8935A]/40" />
                        </div>
                    </div>
                </section>

                {/* Tax note */}
                <div className="bg-[#F3ECE3] border-b border-[#E4D8C8] py-2 px-6 text-center">
                    <p className="text-[#9A8570] text-[0.68rem] tracking-[0.15em] uppercase">All prices in Indian Rupees · Taxes applicable</p>
                </div>

                {/* Menu body */}
                <div className="max-w-5xl mx-auto px-5 md:px-10 py-10 md:py-14">

                    {/* Veg / Non-veg legend */}
                    <div className="flex items-center gap-6 mb-10 pb-6 border-b border-[#E4D8C8]">
                        <p className="text-[#9A8570] text-[0.7rem] tracking-[0.2em] uppercase">Guide</p>
                        <div className="flex items-center gap-2">
                            <VEG />
                            <span className="text-[#5A4A38] text-xs">Vegetarian</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <NONVEG />
                            <span className="text-[#5A4A38] text-xs">Non-Vegetarian</span>
                        </div>
                    </div>

                    {/* ── FOOD ── */}
                    <div className="mb-12">
                        <div className="flex items-center gap-4 mb-8">
                            <div className="flex-1 h-[1px] bg-[#D9CBBA]" />
                            <h2 className="font-serif text-2xl md:text-3xl text-[#2C1A0E] tracking-tight px-2">Food</h2>
                            <div className="flex-1 h-[1px] bg-[#D9CBBA]" />
                        </div>
                        <div className="grid md:grid-cols-2 gap-x-12 gap-y-8">
                            {FOOD.map(section => (
                                <Section key={section.title} section={section} />
                            ))}
                        </div>
                    </div>

                    {/* Divider */}
                    <div className="my-10 flex items-center gap-4">
                        <div className="flex-1 h-[1px] bg-[#D9CBBA]" />
                        <span className="text-[#C8935A] text-base">☕</span>
                        <div className="flex-1 h-[1px] bg-[#D9CBBA]" />
                    </div>

                    {/* ── BEVERAGES ── */}
                    <div>
                        <div className="flex items-center gap-4 mb-8">
                            <div className="flex-1 h-[1px] bg-[#D9CBBA]" />
                            <h2 className="font-serif text-2xl md:text-3xl text-[#2C1A0E] tracking-tight px-2">Beverages</h2>
                            <div className="flex-1 h-[1px] bg-[#D9CBBA]" />
                        </div>
                        <div className="grid md:grid-cols-2 gap-x-12 gap-y-8">
                            {BEVERAGES.map(section => (
                                <Section key={section.title} section={section} />
                            ))}
                        </div>
                    </div>

                    {/* Footer note */}
                    <div className="mt-14 pt-8 border-t border-[#E4D8C8] text-center">
                        <p className="text-[#9A8570] text-[0.72rem] leading-relaxed">
                            Please inform your server of any food allergies or dietary requirements.<br />
                            All prices are subject to applicable taxes.
                        </p>
                        <div className="mt-6 flex items-center justify-center gap-3">
                            <span className="w-8 h-[1px] bg-[#C8935A]/50" />
                            <p className="text-[#8B5C2A] text-[0.65rem] tracking-[0.35em] uppercase font-medium">Brew &amp; Bite · Olivia International · Alappuzha</p>
                            <span className="w-8 h-[1px] bg-[#C8935A]/50" />
                        </div>
                    </div>
                </div>

            </main>
            <StickyBookButton />
            <WhatsAppWidget />
        </>
    );
}

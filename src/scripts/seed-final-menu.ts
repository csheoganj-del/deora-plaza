
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

function slugify(text: string) {
    return text.toString().toLowerCase()
        .replace(/\s+/g, '-')           // Replace spaces with -
        .replace(/[^\w\-]+/g, '')       // Remove all non-word chars
        .replace(/\-\-+/g, '-')         // Replace multiple - with single -
        .replace(/^-+/, '')             // Trim - from start
        .replace(/-+$/, '');            // Trim - from end
}

const menuData = [
    {
        category: "BLOOM SPECIAL THALI",
        items: [
            { name: "Bloom Special Thali (Min 5 Members)", price: 300 }
        ]
    },
    {
        category: "SANDWICH",
        items: [
            { name: "Garlic Bread", price: 179 },
            { name: "Cheese Garlic Bread", price: 199 },
            { name: "Cheese Chilli Garlic Bread", price: 210 },
            { name: "Veg Sandwich & French Fry", price: 89 },
            { name: "Veg Cheese Sandwich", price: 99 },
            { name: "Veg Grilled Sandwich", price: 129 },
            { name: "Veg Cheese Grilled Sandwich", price: 159 },
            { name: "Bread Butter Cheese Sandwich", price: 59 },
            { name: "Extra Cheese Added", price: 30 },
            { name: "French Fry Peri Peri", price: 189 },
            { name: "French Fry Crispy", price: 199 },
            { name: "French Fry Salty", price: 189 },
            { name: "Bombay Sandwich", price: 99 },
            { name: "Paneer Sandwich", price: 169 }
        ]
    },
    {
        category: "TANDOORI STARTER & KABAB",
        items: [
            { name: "Paneer Tikka", price: 269 },
            { name: "Achari Paneer Tikka", price: 239 },
            { name: "Malai Paneer Tikka", price: 299 },
            { name: "Mushroom Tikka Dry", price: 240 },
            { name: "Stuff Aloo Tikka Dry", price: 240 },
            { name: "Hara Bhara Kabab", price: 199 },
            { name: "Corn Kabab", price: 219 },
            { name: "Tandoori Sizzler", price: 320 },
            { name: "Malai Soya Chap", price: 259 },
            { name: "Tandoori Soya Chap", price: 199 },
            { name: "Achari Soya Chap", price: 209 },
            { name: "Soya Chap Dry", price: 240 },
            { name: "Crispy Corn", price: 230 }
        ]
    },
    {
        category: "CHINESE START",
        items: [
            { name: "Manchurian Dry", price: 199 },
            { name: "Manchurian Gravy", price: 199 },
            { name: "Veg Cheese Chowmein", price: 160 },
            { name: "Paneer Chilli Dry", price: 239 },
            { name: "Paneer Chilli Gravy", price: 239 },
            { name: "Paneer Manchurian", price: 220 },
            { name: "Mushroom Chilli Dry", price: 200 },
            { name: "Honey Chilli Potato", price: 170 },
            { name: "Honey Chilli", price: 289 },
            { name: "Veg Crispy", price: 160 },
            { name: "Chinese Bhel", price: 150 },
            { name: "Hakka Noodles", price: 150 },
            { name: "Noodles", price: 169 },
            { name: "Schezwan Noodles", price: 179 },
            { name: "Veg Noodles", price: 150 },
            { name: "Spring Roll (2 Pc)", price: 200 },
            { name: "Maggi Amul Butter", price: 100 },
            { name: "Manchurian Noodles", price: 160 },
            { name: "Mushroom Salt & Pepper Fry", price: 220 },
            { name: "Veg Maggi", price: 70 },
            { name: "Tandoori Maggi", price: 100 },
            { name: "Paneer Maggi", price: 110 },
            { name: "Cheese Maggi", price: 99 },
            { name: "White Sauce Pasta", price: 199 },
            { name: "Red Sauce Pasta", price: 189 },
            { name: "Tandoori Pasta", price: 140 },
            { name: "Makhani Pasta", price: 130 },
            { name: "Mix Sauce Pasta", price: 199 },
            { name: "Chilli Mushroom", price: 239 },
            { name: "Chilli Potato", price: 199 }
        ]
    },
    {
        category: "BURGER",
        items: [
            { name: "Veg Burger", price: 59 },
            { name: "Tandoori Burger", price: 108 },
            { name: "Veg Cheese Burger", price: 109 },
            { name: "Paneer Burger Spicy", price: 120 },
            { name: "Aloo Tikki Burger", price: 80 },
            { name: "Veg Grilled Burger", price: 100 }
        ]
    },
    {
        category: "PIZZA",
        items: [
            { name: "Margherita Pizza (Small)", price: 179 },
            { name: "Margherita Pizza (Big)", price: 210 },
            { name: "Farm House Pizza (Small)", price: 209 },
            { name: "Farm House Pizza (Big)", price: 279 },
            { name: "Veg Cheese Pizza (Small)", price: 179 },
            { name: "Veg Cheese Pizza (Big)", price: 229 },
            { name: "Paneer Tikka Pizza (Small)", price: 199 },
            { name: "Paneer Tikka Pizza (Big)", price: 249 },
            { name: "Double Cheese Pizza", price: 190 },
            { name: "Tomato Pizza", price: 180 },
            { name: "Jain Pizza", price: 190 },
            { name: "Italian Pizza", price: 200 },
            { name: "Mexican Pizza", price: 210 },
            { name: "Otc Pizza", price: 175 },
            { name: "Tandoori Paneer Pizza", price: 220 },
            { name: "Golden Corn Pizza", price: 200 },
            { name: "Onion Paneer Pizza", price: 160 },
            { name: "Sweet Corn Pizza", price: 180 },
            { name: "Tandoori Pizza", price: 230 },
            { name: "Kakhani Pizza", price: 240 }
        ]
    },
    {
        category: "RICE & CHINESE RICE",
        items: [
            { name: "Steam Rice", price: 90 },
            { name: "Fried Rice", price: 179 },
            { name: "Jeera Rice", price: 120 },
            { name: "Veg Pulao", price: 150 },
            { name: "Paneer Pulao", price: 190 },
            { name: "Veg Biryani", price: 180 },
            { name: "Veg Cheese Biryani", price: 210 },
            { name: "Veg Hyderabadi Biryani", price: 180 },
            { name: "Veg Handi Biryani", price: 190 },
            { name: "Chinese Fried Rice", price: 150 },
            { name: "Schezwan Fried Rice", price: 169 },
            { name: "Veg Fried Rice", price: 150 },
            { name: "Manchurian Fried Rice", price: 190 },
            { name: "Bloom Special Rice", price: 210 }
        ]
    },
    {
        category: "SOUP",
        items: [
            { name: "Tomato Soup", price: 129 },
            { name: "Manchow Soup", price: 109 },
            { name: "Hot & Sour Soup", price: 119 },
            { name: "Sweet Corn Soup", price: 99 },
            { name: "Veg Soup", price: 140 },
            { name: "Lemon Coriander Soup", price: 130 }
        ]
    },
    {
        category: "SPECIAL VEG CONTINENTAL",
        items: [
            { name: "Dum Aloo", price: 180 },
            { name: "Bhindi Pyaz", price: 140 },
            { name: "Bhindi Fry", price: 150 },
            { name: "Bhindi Masala", price: 150 },
            { name: "Spl Haldi (Winter)", price: 250 },
            { name: "Mix Veg", price: 140 },
            { name: "Veg Patiyala", price: 190 },
            { name: "Veg Handi", price: 190 },
            { name: "Veg Makhan Wala", price: 200 }
        ]
    },
    {
        category: "INDIAN STARTER / SIDES",
        items: [
            { name: "Roasted Papad", price: 17 },
            { name: "Masala Papad", price: 45 },
            { name: "Fry Masala Papad", price: 55 },
            { name: "Fry Papad", price: 40 },
            { name: "Papad Churi (Pure Ghee)", price: 89 },
            { name: "Roasted Khichiya", price: 30 },
            { name: "Masala Khichiya", price: 80 },
            { name: "Cheese Masala Khichiya", price: 90 },
            { name: "Paneer Masala Khichiya", price: 75 },
            { name: "Fry Masala Khichiya", price: 70 },
            { name: "Butter Khichiya", price: 40 },
            { name: "Green Salad", price: 59 },
            { name: "Ring Onion Salad", price: 59 },
            { name: "Kachumber Salad", price: 79 },
            { name: "Extra Cheese", price: 20 },
            { name: "Extra Ghee (10 ml)", price: 20 },
            { name: "Paneer Pakoda", price: 200 },
            { name: "Cheese Pakoda", price: 300 },
            { name: "Bundi Raita", price: 69 },
            { name: "Veg Raita", price: 69 },
            { name: "Pineapple Raita", price: 69 }
        ]
    },
    {
        category: "BLOOM SPECIAL (MAIN COURSE)",
        items: [
            { name: "Navratan Korma (Sweet)", price: 210 },
            { name: "Kaju Curry (Sweet)", price: 250 },
            { name: "Kaju Butter Masala", price: 250 },
            { name: "Khoya Kaju (Sweet)", price: 260 },
            { name: "Malai Kofta", price: 210 },
            { name: "Veg Kofta", price: 200 },
            { name: "Mushroom Masala", price: 240 },
            { name: "Cheese Angri", price: 240 },
            { name: "Veg Pahadi", price: 230 }
        ]
    },
    {
        category: "SPECIAL VEG",
        items: [
            { name: "Paneer Fried Rice", price: 180 },
            { name: "Mushroom Fried Rice", price: 180 },
            { name: "Dal Fry", price: 120 },
            { name: "Dal Tadka in Ghee", price: 150 },
            { name: "Dal Makhani", price: 170 },
            { name: "Fry Dal Cure", price: 130 },
            { name: "Chana Masala", price: 130 },
            { name: "Kari Pakoda", price: 140 },
            { name: "Methi Malai Matar", price: 180 },
            { name: "Methi Masala", price: 170 },
            { name: "Lahsuniya Batata", price: 170 },
            { name: "Aloo Gobhi", price: 130 },
            { name: "Gobhi Matar", price: 130 },
            { name: "Aloo Pyaz", price: 130 },
            { name: "Aloo Chhole", price: 130 },
            { name: "Aloo Palak", price: 130 },
            { name: "Sev Tomato", price: 130 },
            { name: "Sev Pyaz", price: 130 },
            { name: "Sev Masala", price: 130 },
            { name: "Aloo Jeera Fry", price: 130 }
        ]
    },
    {
        category: "SPECIAL PANEER",
        items: [
            { name: "Palak Paneer", price: 200 },
            { name: "Chhole Paneer", price: 200 },
            { name: "Shahi Paneer", price: 210 },
            { name: "Paneer Butter Masala", price: 240 },
            { name: "Paneer Toofani", price: 240 },
            { name: "Cheese Butter Masala", price: 240 },
            { name: "Paneer Cheese Butter Masala", price: 250 },
            { name: "Handi Paneer", price: 210 },
            { name: "Kadai Paneer", price: 210 },
            { name: "Paneer Tikka Masala", price: 210 },
            { name: "Paneer Bhurji", price: 230 },
            { name: "Matar Paneer", price: 200 },
            { name: "Paneer Do Pyaza", price: 200 },
            { name: "Kaju Paneer", price: 260 },
            { name: "Khoya Paneer (Sweet)", price: 260 },
            { name: "Paneer Pasanda", price: 220 },
            { name: "Paneer Makhani", price: 240 },
            { name: "Paneer Kofta", price: 240 },
            { name: "Mushroom Paneer", price: 240 },
            { name: "Veg Kolhapuri", price: 210 },
            { name: "Paneer Lababdar", price: 250 },
            { name: "Paneer Patiyala", price: 250 },
            { name: "Paneer Rajwadi", price: 280 },
            { name: "Paneer Rajasthani", price: 250 },
            { name: "Paneer Amritsari", price: 240 }
        ]
    },
    {
        category: "PARATHA",
        items: [
            { name: "Plain Paratha", price: 49 },
            { name: "Butter Paratha", price: 59 },
            { name: "Aloo Paratha", price: 79 },
            { name: "Pyaaz Paratha", price: 79 },
            { name: "Paneer Paratha", price: 99 },
            { name: "Gobhi Paratha", price: 79 },
            { name: "Mix Paratha", price: 99 },
            { name: "Lachha Paratha", price: 65 }
        ]
    },
    {
        category: "NAAN",
        items: [
            { name: "Naan Plain", price: 45 },
            { name: "Naan Butter", price: 55 },
            { name: "Cheese Butter Naan", price: 75 },
            { name: "Garlic Naan", price: 75 },
            { name: "Cheese Garlic Naan", price: 80 },
            { name: "Butter Kulcha", price: 65 }
        ]
    },
    {
        category: "CHAPATI / TANDOORI ROTI",
        items: [
            { name: "Tukad Plain", price: 40 },
            { name: "Tukad Ghee", price: 50 },
            { name: "Chapati Plain", price: 15 },
            { name: "Chapati Butter", price: 17 },
            { name: "Tandoori Roti", price: 20 },
            { name: "Tandoori Butter Roti", price: 22 },
            { name: "Missi Roti", price: 60 }
        ]
    },
    {
        category: "DESSERTS",
        items: [
            { name: "Raj Bhog Ice Cream", price: 50 },
            { name: "American Nuts Ice Cream", price: 60 },
            { name: "Butter Scotch Ice Cream", price: 59 },
            { name: "Chocolate Ice Cream", price: 69 },
            { name: "Vanilla Ice Cream", price: 49 },
            { name: "Sweet (2 Pc)", price: 30 }
        ]
    },
    {
        category: "HOT & COLD BEVERAGE",
        items: [
            { name: "Cold Coffee", price: 149 },
            { name: "Cold Coffee with Ice Cream", price: 189 },
            { name: "Hot Coffee", price: 59 },
            { name: "Hot Chocolate", price: 70 },
            { name: "Cookie Tea", price: 30 },
            { name: "Masala Tea", price: 49 },
            { name: "Black Tea", price: 39 }
        ]
    },
    {
        category: "MILK SHAKE & JUICE",
        items: [
            { name: "Oreo Shake", price: 169 },
            { name: "KitKat Shake", price: 179 },
            { name: "Chocolate Shake", price: 159 },
            { name: "Strawberry Shake", price: 130 },
            { name: "Pineapple Shake", price: 130 },
            { name: "Orange Juice", price: 120 },
            { name: "Pineapple Juice", price: 110 },
            { name: "Apple Juice", price: 130 },
            { name: "Mixed Fruit Juice", price: 140 },
            { name: "Butter Scotch Shake", price: 169 },
            { name: "Butter Milk", price: 25 },
            { name: "Lassi", price: 50 }
        ]
    },
    {
        category: "MOCKTAIL",
        items: [
            { name: "Mint Mojito", price: 140 },
            { name: "Blue Lagoon", price: 149 },
            { name: "Watermelon Mojito", price: 140 },
            { name: "Pulse Mint Mojito", price: 140 },
            { name: "Sunny Setup", price: 160 },
            { name: "Punch Mel", price: 179 },
            { name: "Fresh Lemon Soda", price: 99 },
            { name: "Virgin Mojito", price: 139 }
        ]
    },
    {
        category: "WATER",
        items: [
            { name: "Water Bottle 250 ml", price: 10 },
            { name: "Water Bottle 750 ml", price: 30 }
        ]
    }
];

async function seedMenu() {
    console.log('Starting menu update...');

    // 1. Delete all existing items
    console.log('Deleting existing menu items...');
    const { error: itemsDeleteError } = await supabase
        .from('menu_items')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete everything

    if (itemsDeleteError) {
        console.error('Error deleting items:', itemsDeleteError);
        return;
    }

    // 2. Delete all existing categories
    console.log('Deleting existing categories...');
    const { error: categoriesDeleteError } = await supabase
        .from('categories')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000');

    if (categoriesDeleteError) {
        console.error('Error deleting categories:', categoriesDeleteError);
        return;
    }

    console.log('Cleaned up old menu. Inserting new data...');

    // 3. Loop through data and create categories + items
    let totalItems = 0;

    for (const catData of menuData) {
        // Create Category
        const { data: category, error: catError } = await supabase
            .from('categories')
            .insert({
                name: catData.category,
                slug: slugify(catData.category) // ADDED: slug generation
            })
            .select()
            .single();

        if (catError) {
            console.error(`Error creating category ${catData.category}:`, catError);
            continue;
        }

        // Create Items for this category
        const itemsToInsert = catData.items.map(item => ({
            name: item.name,
            price: item.price,
            category: catData.category,
            category_id: category.id,
            isAvailable: true,
            businessUnit: 'cafe',
            description: item.name // Using name as description for now
        }));

        const { error: itemsError } = await supabase
            .from('menu_items')
            .insert(itemsToInsert);

        if (itemsError) {
            console.error(`Error inserting items for ${catData.category}:`, itemsError);
        } else {
            console.log(`✅ Created category "${catData.category}" with ${itemsToInsert.length} items`);
            totalItems += itemsToInsert.length;
        }
    }

    console.log(`🎉 Menu update complete! Added ${totalItems} items.`);
}

seedMenu();

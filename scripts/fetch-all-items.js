import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const API_BASE_URL = 'https://metaforge.app/api/arc-raiders/items';
const ITEMS_PER_PAGE = 100;

async function fetchAllItems() {
  const allItems = [];
  let page = 1;
  let hasNextPage = true;

  console.log('Fetching all items from dataset API...');

  while (hasNextPage) {
    try {
      const url = `${API_BASE_URL}?page=${page}&limit=${ITEMS_PER_PAGE}&sortOrder=asc`;
      console.log(`Fetching page ${page}...`);
      
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.data && Array.isArray(data.data)) {
        allItems.push(...data.data);
        const pagination = data.pagination || {};
        console.log(`  Fetched ${data.data.length} items (Total: ${allItems.length})`);
        console.log(`  Pagination: Page ${pagination.page || page}/${pagination.totalPages || '?'} (Total: ${pagination.total || '?'} items)`);
        
        hasNextPage = pagination.hasNextPage || false;
        page++;
      } else {
        console.log('No more data available');
        hasNextPage = false;
      }
    } catch (error) {
      console.error(`Error fetching page ${page}:`, error.message);
      hasNextPage = false;
    }
  }

  console.log(`\nTotal items fetched: ${allItems.length}`);
  return allItems;
}

function mergeItems(apiItems, existingItems) {
  const merged = { ...existingItems };
  
  // Create a map of API items by normalized name for easy lookup
  const apiItemsMap = new Map();
  apiItems.forEach(item => {
    if (item.name) {
      const normalizedName = item.name.toLowerCase();
      if (!apiItemsMap.has(normalizedName)) {
        apiItemsMap.set(normalizedName, item);
      }
    }
  });

  // Update existing items with image data from API
  Object.keys(merged).forEach(itemName => {
    const normalizedName = itemName.toLowerCase();
    const apiItem = apiItemsMap.get(normalizedName);
    
    if (apiItem && apiItem.icon) {
      // Add or update the image URL
      merged[itemName] = {
        ...merged[itemName],
        image: apiItem.icon
      };
    }
  });

  // Add API items that don't exist in our current data
  apiItems.forEach(item => {
    if (item.name && !merged[item.name]) {
      // Check if it exists with different casing
      const normalizedName = item.name.toLowerCase();
      const existingKey = Object.keys(merged).find(
        key => key.toLowerCase() === normalizedName
      );
      
      if (!existingKey) {
        // New item - add it with image data if available
        merged[item.name] = {};
        if (item.icon) {
          merged[item.name].image = item.icon;
        }
      }
    }
  });

  return merged;
}

async function main() {
  try {
    // Read existing items.json
    const itemsPath = path.join(__dirname, '..', 'items.json');
    let existingItems = {};
    
    if (fs.existsSync(itemsPath)) {
      const existingData = fs.readFileSync(itemsPath, 'utf8');
      existingItems = JSON.parse(existingData);
      console.log(`Loaded ${Object.keys(existingItems).length} existing items`);
    }

    // Fetch all items from API
    const apiItems = await fetchAllItems();
    
    // Merge with existing data
    const mergedItems = mergeItems(apiItems, existingItems);
    
    // Count items with images
    const itemsWithImages = Object.values(mergedItems).filter(item => item.image).length;
    
    // Sort items alphabetically
    const sortedItems = {};
    Object.keys(mergedItems)
      .sort((a, b) => a.localeCompare(b))
      .forEach(key => {
        sortedItems[key] = mergedItems[key];
      });
    
    // Write merged data
    fs.writeFileSync(
      itemsPath,
      JSON.stringify(sortedItems, null, 2),
      'utf8'
    );
    
    console.log(`\n✅ Successfully merged ${Object.keys(sortedItems).length} items`);
    console.log(`   - Existing items: ${Object.keys(existingItems).length}`);
    console.log(`   - New items from API: ${Object.keys(sortedItems).length - Object.keys(existingItems).length}`);
    console.log(`   - Items with images: ${itemsWithImages}`);
    console.log(`\nSaved to: ${itemsPath}`);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

main();


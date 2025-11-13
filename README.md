# Item Search - Project Greed

A React-based search interface for finding item information from your game data.

## Features

- **Search for items by name** - Fast, case-insensitive search with autocomplete suggestions
- **Visual Item Identification** - Items display with their icons/images for easy recognition:
  - Item images in search results and autocomplete dropdown
  - Images in Recyclable Items browser
  - Images in Expedition-1 Requirements
  - Default placeholder for items without images
- **View item status across multiple categories**:
  - **Safe to Recycle** - Items that can be safely recycled
  - **Keep for Quests** - Items needed for quests (with required amounts)
  - **Keep for Projects** - Items needed for projects (with required amounts)
  - **Station Upgrades** - Items required for station upgrades (with station name, level, and amount)
  - **Scrappy Levels** - Items required for Scrappy level upgrades (with level and amount)
  - **Blueprint Recipes** - Items used in blueprint crafting recipes (with workshop, level, and other ingredients)
- **Total Amount Summary** (Toggleable) - Shows a highlighted summary card with the total amount required across Projects, Station Upgrades, and Scrappy Levels (Blueprints excluded)
- **Recyclable Items Browser** - Quick access modal to view all recyclable items at a glance, with search functionality, item images, and click-to-search integration
- **Expedition-1 Requirements** - View all stages and requirements for the Expedition-1 Project, including item requirements with images and category-based credit requirements
- **Settings Menu** - Accessible via the settings icon next to the search box, allows you to toggle extra features and access additional tools
- Items can appear in multiple categories simultaneously
- Modern, responsive UI with Material Design icons

## Getting Started

### Installation

```bash
npm install
```

### Running the Development Server

```bash
npm run dev
```

The app will be available at `http://localhost:5173` (or the next available port).

### Building for Production

```bash
npm run build
```

## Usage

1. Enter an item name in the search box (e.g., "Accordion", "Leaper Pulse Unit")
   - Use the autocomplete dropdown to quickly select items (items show with their icons)
   - Click "Search" or press Enter to search
2. View the item's comprehensive information:
   - **Item Image** - Visual representation of the item (or placeholder if not available)
   - **Safe to Recycle** - Green card indicating the item can be recycled
   - **Keep for Quests** - Shows the required amount for quests
   - **Keep for Projects** - Shows the required amount for projects
   - **Station Upgrades** - Lists all stations and levels that require this item
   - **Scrappy Levels** - Lists all Scrappy levels that require this item
   - **Blueprint Recipes** - Shows all blueprints that use this item, including other required ingredients
3. **Enable Total Amount Summary** (Optional):
   - Click the settings icon (⚙️) next to the search box
   - Toggle "Total Amount Summary" to see a highlighted card with the total amount required
   - The total includes: Projects + Station Upgrades + Scrappy Levels (Blueprints are excluded)
   - Your preference is saved in your browser's localStorage
4. **View Recyclable Items** (Optional):
   - Click the settings icon (⚙️) next to the search box
   - Select "♻️ View Recyclable Items" from the settings menu
   - A modal will open showing all recyclable items in a searchable grid with item images
   - Use the search box in the modal to filter items
   - Click any item to search for it and automatically close the modal
   - Click outside the modal or use the close button (X) to dismiss
5. **View Expedition-1 Requirements** (Optional):
   - Click the settings icon (⚙️) next to the search box
   - Select "🚀 Expedition-1 Requirements" from the settings menu
   - A modal will open showing all 6 stages of the Expedition-1 Project
   - Each stage displays its description and required items with images and amounts
   - Stage 5 (Load Stage) shows category-based credit requirements instead of specific items
   - Click any item requirement to search for it and automatically close the modal
   - Click outside the modal or use the close button (X) to dismiss

## Examples

- **Accordion**: Shows as "Safe to Recycle"
- **Leaper Pulse Unit**: 
  - Shows as "Keep for Quests" (amount: 1)
  - Shows as "Keep for Projects" (amount: 3)
  - Shows "Required for Station Upgrades" (e.g., Utility Station Level 3, amount: 4)
  - With Total Summary enabled: Shows total of 7 (3 + 4, excluding quests and blueprints)
- **Battery**: Shows as "Keep for Projects" (amount: 30)

## Data Structure

The app uses multiple JSON data files:
- **`items.json`** - Consolidated file combining:
  - `safe_to_recycle.json`
  - `keep_for_quests.json`
  - `keep_for_projects.json`
  - All items from the [dataset API](https://metaforge.app/api/arc-raiders/items)
  - Item images from the dataset API (stored in the `image` field)
- **`stations.json`** - Station upgrade requirements
- **`scrappy.json`** - Scrappy level requirements
- **`blueprints.json`** - Blueprint crafting recipes
- **`expedition.json`** - Expedition-1 Project stages and requirements
- **`public/images/item-placeholder.svg`** - Default placeholder image for items without images

Items are indexed by name, and each item can have multiple category flags with associated amounts where applicable. Items also include image URLs from the dataset API for visual identification. The app also searches across station upgrades, scrappy levels, and blueprint recipes to provide comprehensive item information.

### Updating Items from API

To fetch the latest items from the dataset API and merge them with your existing category data:

```bash
npm run fetch-items
```

This script will:
1. Fetch all items from the dataset API (handling pagination automatically)
2. Merge them with your existing `items.json` file
3. Preserve all your existing category information (safe_to_recycle, keep_for_quests, keep_for_projects)
4. Add image URLs from the API to items (stored in the `image` field)
5. Add any new items found in the API
6. Display a summary showing how many items received images

Items found in the API but without category information will show as "found in database" with a message indicating no category info is available. Items without images from the API will use a default placeholder image in the UI.

## Technical Details

- **Framework**: React 18 with Vite
- **Icons**: Material Design icons via `react-icons`
- **Images**: Item images from dataset API CDN with local placeholder fallback
- **Storage**: Settings preferences are stored in browser localStorage
- **Client-Side Processing**: All calculations and data processing happen client-side for fast performance
- **Responsive Design**: Mobile-friendly interface that adapts to different screen sizes
- **Image Handling**: Automatic fallback to placeholder for missing or broken images

## Credits

- **Item Data & Images**: Item data and images provided by the [MetaForge ARC Raiders Dataset API](https://metaforge.app/api/arc-raiders/items)
- **Favicon/Icon Design**: Based on ARC Raiders Key Art & Graphic Design by [Robert Sammelin](https://www.pinterest.com/pin/arc-raiders-key-art-graphic-design--465911523961206075/)
- **Icons**: Material Design Icons from [react-icons](https://react-icons.github.io/react-icons/)


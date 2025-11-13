# Item Search - Project Greed

A React-based search interface for finding item information from your game data.

## Features

- **Search for items by name** - Fast, case-insensitive search with autocomplete suggestions
- **View item status across multiple categories**:
  - **Safe to Recycle** - Items that can be safely recycled
  - **Keep for Quests** - Items needed for quests (with required amounts)
  - **Keep for Projects** - Items needed for projects (with required amounts)
  - **Station Upgrades** - Items required for station upgrades (with station name, level, and amount)
  - **Scrappy Levels** - Items required for Scrappy level upgrades (with level and amount)
  - **Blueprint Recipes** - Items used in blueprint crafting recipes (with workshop, level, and other ingredients)
- **Total Amount Summary** (Toggleable) - Shows a highlighted summary card with the total amount required across Projects, Station Upgrades, and Scrappy Levels (Blueprints excluded)
- **Settings Menu** - Accessible via the settings icon next to the search box, allows you to toggle extra features
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
   - Use the autocomplete dropdown to quickly select items
   - Click "Search" or press Enter to search
2. View the item's comprehensive information:
   - **Safe to Recycle** - Green card indicating the item can be recycled
   - **Keep for Quests** - Shows the required amount for quests
   - **Keep for Projects** - Shows the required amount for projects
   - **Station Upgrades** - Lists all stations and levels that require this item
   - **Scrappy Levels** - Lists all Scrappy levels that require this item
   - **Blueprint Recipes** - Shows all blueprints that use this item, including other required ingredients
3. **Enable Total Amount Summary** (Optional):
   - Click the settings icon (⚙️) next to the search box
   - Toggle "Show Total Amount Summary" to see a highlighted card with the total amount required
   - The total includes: Projects + Station Upgrades + Scrappy Levels (Blueprints are excluded)
   - Your preference is saved in your browser's localStorage

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
  - All items from the [MetaForge ARC Raiders API](https://metaforge.app/api/arc-raiders/items)
- **`stations.json`** - Station upgrade requirements
- **`scrappy.json`** - Scrappy level requirements
- **`blueprints.json`** - Blueprint crafting recipes

Items are indexed by name, and each item can have multiple category flags with associated amounts where applicable. The app also searches across station upgrades, scrappy levels, and blueprint recipes to provide comprehensive item information.

### Updating Items from API

To fetch the latest items from the MetaForge API and merge them with your existing category data:

```bash
npm run fetch-items
```

This script will:
1. Fetch all items from the MetaForge API (handling pagination automatically)
2. Merge them with your existing `items.json` file
3. Preserve all your existing category information (safe_to_recycle, keep_for_quests, keep_for_projects)
4. Add any new items found in the API

Items found in the API but without category information will show as "found in database" with a message indicating no category info is available.

## Technical Details

- **Framework**: React 18 with Vite
- **Icons**: Material Design icons via `react-icons`
- **Storage**: Settings preferences are stored in browser localStorage
- **Client-Side Processing**: All calculations and data processing happen client-side for fast performance
- **Responsive Design**: Mobile-friendly interface that adapts to different screen sizes

## Credits

- **Favicon/Icon Design**: Based on ARC Raiders Key Art & Graphic Design by [Robert Sammelin](https://www.pinterest.com/pin/arc-raiders-key-art-graphic-design--465911523961206075/)
- **Icons**: Material Design Icons from [react-icons](https://react-icons.github.io/react-icons/)


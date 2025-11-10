# Item Search - Project Greed

A React-based search interface for finding item information from your game data.

## Features

- Search for items by name
- View item status across multiple categories:
  - **Safe to Recycle** - Items that can be safely recycled
  - **Keep for Quests** - Items needed for quests (with required amounts)
  - **Keep for Projects** - Items needed for projects (with required amounts)
- Items can appear in multiple categories simultaneously
- Case-insensitive search
- Modern, responsive UI

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
2. Click "Search" or press Enter
3. View the item's status:
   - If the item is safe to recycle, it will show a green card
   - If the item is needed for quests/projects, it will show the required amount
   - Items can appear in multiple categories at once

## Examples

- **Accordion**: Shows as "Safe to Recycle"
- **Leaper Pulse Unit**: Shows as "Keep for Quests" (amount: 1) and "Keep for Projects" (amount: 3)
- **Battery**: Shows as "Keep for Projects" (amount: 30)

## Data Structure

The app uses a consolidated `items.json` file that combines data from:
- `safe_to_recycle.json`
- `keep_for_quests.json`
- `keep_for_projects.json`
- All items from the [MetaForge ARC Raiders API](https://metaforge.app/api/arc-raiders/items)

Items are indexed by name, and each item can have multiple category flags with associated amounts where applicable.

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

## Deployment to GitHub Pages

This project is configured for automatic deployment to GitHub Pages using GitHub Actions.

### Automatic Deployment (Recommended)

1. **Enable GitHub Pages in your repository:**
   - Go to your repository on GitHub
   - Navigate to **Settings** → **Pages**
   - Under **Source**, select **GitHub Actions**

2. **Push to main/master branch:**
   - The GitHub Actions workflow will automatically build and deploy your app
   - The workflow runs on every push to `main` or `master` branch
   - Your app will be available at: `https://[your-username].github.io/[repository-name]/`

### Manual Deployment (Alternative)

If you prefer to deploy manually:

```bash
npm install -g gh-pages
npm run deploy
```

### Local Testing

To test the GitHub Pages build locally:

```bash
npm run build
npm run preview
```

The app will be available at `http://localhost:4173` (or the next available port).


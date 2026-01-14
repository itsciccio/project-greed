import { useState, useEffect, useRef } from 'react'
import { MdSettings, MdClose, MdKeyboardReturn } from 'react-icons/md'
import itemsData from '../items.json'
import stationsData from '../stations.json'
import scrappyLevelsData from '../scrappy.json'
import blueprintsData from '../blueprints.json'
import projectsData from '../projects.json'
import questsData from '../quests.json'
import { trackPageView } from './utils/analytics'
import TwitchSidebar from './components/TwitchSidebar'
import './App.css'

// Total Summary Card Component
function TotalSummaryCard({ originalTotal, totalAmount, checkedUpgrades, marginTop = false }) {
  if (originalTotal <= 0) return null

  return (
    <div className="total-summary-card" style={marginTop ? { marginTop: '16px' } : {}}>
      <div className="total-summary-header">
        <span className="total-summary-icon">📊</span>
        <span className="total-summary-label">Total Amount Required</span>
      </div>
      <div className="total-summary-amount">
        {totalAmount > 0 ? (
          <>
            <strong>{totalAmount}</strong>
            {originalTotal !== totalAmount && originalTotal > 0 && (
              <span className="total-summary-original">
                <span className="total-summary-original-label">Original:</span>
                <span className="total-summary-original-value">{originalTotal}</span>
              </span>
            )}
          </>
        ) : (
          <div className="total-summary-complete">
            <strong>0</strong>
            <span className="total-summary-complete-message">All items collected!</span>
            {originalTotal !== totalAmount && originalTotal > 0 && (
              <span className="total-summary-original">
                <span className="total-summary-original-label">Original:</span>
                <span className="total-summary-original-value">{originalTotal}</span>
              </span>
            )}
          </div>
        )}
      </div>
      <div className="total-summary-note">
        Includes: Quests, Projects, Station Upgrades, and Scrappy Levels (Blueprints excluded)
        {originalTotal !== totalAmount && originalTotal > 0 && (
          <span className="total-summary-upgrade-note">
            <br />✓ Excludes items from completed upgrades in your checklist
          </span>
        )}
      </div>
    </div>
  )
}

function App() {
  const [searchTerm, setSearchTerm] = useState('')
  const [results, setResults] = useState(null)
  const [showDropdown, setShowDropdown] = useState(false)
  const [highlightedIndex, setHighlightedIndex] = useState(-1)
  const [isSearching, setIsSearching] = useState(false)
  const [showSettingsDropdown, setShowSettingsDropdown] = useState(false)
  const [showTotalSummary, setShowTotalSummary] = useState(() => {
    // Load from localStorage, default to false
    const saved = localStorage.getItem('showTotalSummary')
    return saved ? JSON.parse(saved) : false
  })
  const [showRecyclableModal, setShowRecyclableModal] = useState(false)
  const [recyclableSearchTerm, setRecyclableSearchTerm] = useState('')
  const [showUpgradeChecklistModal, setShowUpgradeChecklistModal] = useState(false)
  const [checkedUpgrades, setCheckedUpgrades] = useState(() => {
    // Load from localStorage, default to empty object
    const saved = localStorage.getItem('checkedUpgrades')
    return saved ? JSON.parse(saved) : {}
  })
  const [upgradeChecklistTab, setUpgradeChecklistTab] = useState(() => {
    // Load from localStorage, default to 'stations'
    const saved = localStorage.getItem('upgradeChecklistTab')
    return saved || 'stations'
  })
  const [selectedProjectId, setSelectedProjectId] = useState(() => {
    // Load from localStorage, default to first project if available
    const saved = localStorage.getItem('selectedProjectId')
    return saved || (projectsData.projects.length > 0 ? projectsData.projects[0].id : null)
  })
  const searchInputRef = useRef(null)
  const dropdownRef = useRef(null)
  const settingsRef = useRef(null)
  const dropdownManuallyClosed = useRef(false)
  const prevSearchTermRef = useRef('')

  // Update upgrade checklist tab and save to localStorage
  const updateUpgradeChecklistTab = (tab) => {
    setUpgradeChecklistTab(tab)
    localStorage.setItem('upgradeChecklistTab', tab)
  }

  // Update selected project and save to localStorage
  const updateSelectedProjectId = (projectId) => {
    setSelectedProjectId(projectId)
    localStorage.setItem('selectedProjectId', projectId)
  }

  // Track page view on component mount
  useEffect(() => {
    trackPageView()
  }, [])

  // Ensure selectedProjectId is set when projects are available
  useEffect(() => {
    if (projectsData.projects.length > 0 && !selectedProjectId) {
      updateSelectedProjectId(projectsData.projects[0].id)
    }
  }, [])

  // Get all item names
  const allItems = Object.keys(itemsData)

  // Get all recyclable items
  const recyclableItems = Object.keys(itemsData).filter(itemName => 
    itemsData[itemName]?.safe_to_recycle === true
  ).sort()

  // Filter recyclable items based on search term
  const filteredRecyclableItems = recyclableSearchTerm.trim()
    ? recyclableItems.filter(item =>
        item.toLowerCase().includes(recyclableSearchTerm.toLowerCase())
      )
    : recyclableItems

  // Filter items based on search term
  const filteredItems = searchTerm.trim()
    ? allItems.filter(item =>
        item.toLowerCase().includes(searchTerm.toLowerCase())
      ).slice(0, 10) // Limit to 10 suggestions
    : []

  // Handle input change
  const handleInputChange = (e) => {
    const value = e.target.value
    setSearchTerm(value)
    setIsSearching(false) // Reset search flag when user types
    // Reset manual close flag when user types
    if (value.trim().length > 0) {
      dropdownManuallyClosed.current = false
    }
    // Clear results when user starts typing a new search
    if (results && value.trim() === '') {
      setResults(null)
    }
  }

  // Handle item selection from dropdown
  const selectItem = (itemName) => {
    setSearchTerm(itemName)
    setShowDropdown(false)
    setHighlightedIndex(-1)
    setIsSearching(true)
    performSearch(itemName)
  }

  // Find where an item is required in stations
  const findStationRequirements = (itemName) => {
    const requirements = []
    
    stationsData.stations.forEach(station => {
      station.levels.forEach(level => {
        level.requirements.forEach(req => {
          // Case-insensitive comparison
          if (req.name.toLowerCase() === itemName.toLowerCase()) {
            requirements.push({
              station: station.name,
              level: level.level,
              amount: req.amount
            })
          }
        })
      })
    })
    
    return requirements
  }

  // Find where an item is required for scrappy levels
  const findScrappyLevelRequirements = (itemName) => {
    const requirements = []
    
    scrappyLevelsData.scrappyLevelRequirementsRates.forEach(levelData => {
      levelData.requirements.forEach(req => {
        // Case-insensitive comparison
        if (req.name.toLowerCase() === itemName.toLowerCase()) {
          requirements.push({
            title: levelData.title,
            level: levelData.level,
            amount: req.amount
          })
        }
      })
    })
    
    return requirements
  }

  // Find where an item is required for project stages
  const findProjectStageRequirements = (itemName) => {
    const requirements = []
    
    projectsData.projects.forEach(project => {
      project.stages.forEach(stage => {
        if (stage.requirements) {
          stage.requirements.forEach(req => {
            // Case-insensitive comparison
            if (req.name.toLowerCase() === itemName.toLowerCase()) {
              requirements.push({
                projectId: project.id,
                projectName: project.name,
                stage: stage.stage,
                title: stage.title,
                amount: req.amount
              })
            }
          })
        }
      })
    })
    
    return requirements
  }

  // Find where an item is required for quests
  const findQuestRequirements = (itemName) => {
    const requirements = []
    
    // Normalize item name for matching (convert to lowercase, handle spaces/dashes)
    const normalizedItemName = itemName.toLowerCase().trim()
    const normalizedItemNameDashed = normalizedItemName.replace(/\s+/g, '-')
    const normalizedItemNameSpaced = normalizedItemNameDashed.replace(/-/g, ' ')
    
    questsData.quests.forEach(quest => {
      if (quest.required_items && quest.required_items.length > 0) {
        quest.required_items.forEach(reqItem => {
          // Try to match by item name from items.json first
          const questItemName = reqItem.item?.name || ''
          const questItemId = reqItem.item_id || ''
          
          // Normalize quest item identifiers
          const normalizedQuestItemName = questItemName.toLowerCase().trim()
          const normalizedQuestItemId = questItemId.toLowerCase().trim()
          const normalizedQuestItemIdNoRecipe = normalizedQuestItemId.replace('-recipe', '')
          
          // Match by item name (exact match)
          const nameMatch = normalizedQuestItemName === normalizedItemName
          
          // Match by item_id (exact match or with -recipe suffix removed)
          const idMatch = normalizedQuestItemId === normalizedItemNameDashed || 
                         normalizedQuestItemId === normalizedItemNameSpaced ||
                         normalizedQuestItemIdNoRecipe === normalizedItemNameDashed ||
                         normalizedQuestItemIdNoRecipe === normalizedItemNameSpaced
          
          // Also check if the item exists in items.json with this name
          const itemExistsInItems = Object.keys(itemsData).some(key => 
            key.toLowerCase() === normalizedItemName ||
            key.toLowerCase().replace(/\s+/g, '-') === normalizedItemNameDashed
          )
          
          if (nameMatch || (idMatch && itemExistsInItems)) {
            requirements.push({
              questId: quest.id,
              questName: quest.name,
              amount: parseInt(reqItem.quantity) || 0
            })
          }
        })
      }
    })
    
    return requirements
  }

  // Find blueprints that use an item in their recipe
  const findBlueprintRecipes = (itemName) => {
    const blueprints = []
    
    blueprintsData.blueprints.forEach(blueprint => {
      const itemInRecipe = blueprint.craftingRecipe.find(ingredient =>
        ingredient.name.toLowerCase() === itemName.toLowerCase()
      )
      
      if (itemInRecipe) {
        // Get all other ingredients (excluding the searched item)
        const otherIngredients = blueprint.craftingRecipe.filter(ingredient =>
          ingredient.name.toLowerCase() !== itemName.toLowerCase()
        )
        
        blueprints.push({
          name: blueprint.name,
          workshop: blueprint.workshop,
          level: blueprint.level,
          amount: itemInRecipe.amount,
          otherIngredients: otherIngredients
        })
      }
    })
    
    return blueprints
  }

  // Perform the actual search
  const performSearch = (term) => {
    const trimmedTerm = term.trim()
    
    if (!trimmedTerm) {
      setResults(null)
      return
    }

    // Case-insensitive search
    const itemName = Object.keys(itemsData).find(
      name => name.toLowerCase() === trimmedTerm.toLowerCase()
    )

    // Find station requirements
    const stationRequirements = findStationRequirements(trimmedTerm)
    
    // Find scrappy level requirements
    const scrappyLevelRequirements = findScrappyLevelRequirements(trimmedTerm)
    
    // Find project stage requirements
    const projectStageRequirements = findProjectStageRequirements(trimmedTerm)
    
    // Find quest requirements
    const questRequirements = findQuestRequirements(trimmedTerm)
    
    // Find blueprint recipes
    const blueprintRecipes = findBlueprintRecipes(trimmedTerm)

    if (itemName) {
      setResults({
        name: itemName,
        data: itemsData[itemName],
        stationRequirements: stationRequirements,
        scrappyLevelRequirements: scrappyLevelRequirements,
        projectStageRequirements: projectStageRequirements,
        questRequirements: questRequirements,
        blueprintRecipes: blueprintRecipes
      })
    } else {
      setResults({ 
        name: trimmedTerm, 
        data: null,
        stationRequirements: stationRequirements,
        scrappyLevelRequirements: scrappyLevelRequirements,
        projectStageRequirements: projectStageRequirements,
        questRequirements: questRequirements,
        blueprintRecipes: blueprintRecipes
      })
    }
  }

  // Handle form submission
  const handleSearch = (e) => {
    e.preventDefault()
    setShowDropdown(false)
    setIsSearching(true)
    performSearch(searchTerm)
  }

  // Handle keyboard navigation
  const handleKeyDown = (e) => {
    // Handle arrow keys when there are filtered items available
    if (filteredItems.length > 0 && (e.key === 'ArrowDown' || e.key === 'ArrowUp')) {
      e.preventDefault()
      // Reset manual close flag when navigating
      dropdownManuallyClosed.current = false
      // Show dropdown if it's not visible
      if (!showDropdown && !isSearching) {
        setShowDropdown(true)
      }
      
      if (e.key === 'ArrowDown') {
        setHighlightedIndex(prev =>
          prev < filteredItems.length - 1 ? prev + 1 : prev
        )
      } else if (e.key === 'ArrowUp') {
        setHighlightedIndex(prev => (prev > 0 ? prev - 1 : 0))
      }
      return
    }
    
    // Handle Enter key
    if (e.key === 'Enter') {
      e.preventDefault()
      if (showDropdown && filteredItems.length > 0) {
        // If dropdown is visible, select the highlighted item (or first item if none highlighted)
        const indexToSelect = highlightedIndex >= 0 ? highlightedIndex : 0
        if (indexToSelect < filteredItems.length) {
          selectItem(filteredItems[indexToSelect])
        }
      } else {
        // If dropdown is not visible, perform regular search
        handleSearch(e)
      }
      return
    }
    
    // Handle Escape key
    if (e.key === 'Escape' && showDropdown) {
      e.preventDefault()
      setShowDropdown(false)
      setHighlightedIndex(-1)
      dropdownManuallyClosed.current = true
    }
  }

  // Update dropdown visibility based on filtered items (only if not searching)
  useEffect(() => {
    // Don't reopen if user manually closed it
    if (dropdownManuallyClosed.current) {
      return
    }
    
    if (!isSearching && searchTerm.trim().length > 0 && filteredItems.length > 0) {
      const wasHidden = !showDropdown
      const searchTermChanged = prevSearchTermRef.current !== searchTerm
      setShowDropdown(true)
      // Only auto-highlight first item when:
      // 1. Dropdown transitions from hidden to visible, OR
      // 2. Search term changed (user typed new characters)
      // This prevents resetting the highlight when user navigates with arrow keys
      if (wasHidden || searchTermChanged) {
        setHighlightedIndex(0)
      }
      prevSearchTermRef.current = searchTerm
    } else if (filteredItems.length === 0 || isSearching) {
      setShowDropdown(false)
      setHighlightedIndex(-1)
      prevSearchTermRef.current = searchTerm
    }
  }, [filteredItems, searchTerm, isSearching, showDropdown])

  // Scroll highlighted item into view when navigating with arrow keys
  useEffect(() => {
    if (showDropdown && highlightedIndex >= 0 && dropdownRef.current) {
      const highlightedElement = dropdownRef.current.querySelector(
        `.dropdown-item:nth-child(${highlightedIndex + 1})`
      )
      if (highlightedElement) {
        highlightedElement.scrollIntoView({
          behavior: 'smooth',
          block: 'nearest',
          inline: 'nearest'
        })
      }
    }
  }, [highlightedIndex, showDropdown])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target) &&
        searchInputRef.current &&
        !searchInputRef.current.contains(event.target)
      ) {
        setShowDropdown(false)
        setHighlightedIndex(-1)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  const getCategoryInfo = (category, data) => {
    switch (category) {
      case 'safe_to_recycle':
        return { label: 'Safe to Recycle', color: '#10b981', icon: '♻️' }
      default:
        return { label: category, color: '#6b7280', icon: '📦' }
    }
  }

  // Calculate original total amount required (before subtracting checked upgrades)
  const calculateOriginalTotalAmount = (results) => {
    if (!results) return 0
    
    let total = 0
    
    // Add all station requirements
    if (results.stationRequirements) {
      total += results.stationRequirements.reduce((sum, req) => sum + req.amount, 0)
    }
    
    // Add all scrappy level requirements
    if (results.scrappyLevelRequirements) {
      total += results.scrappyLevelRequirements.reduce((sum, req) => sum + req.amount, 0)
    }
    
    // Add all project stage requirements
    if (results.projectStageRequirements) {
      total += results.projectStageRequirements.reduce((sum, req) => sum + req.amount, 0)
    }
    
    // Add all quest requirements
    if (results.questRequirements) {
      total += results.questRequirements.reduce((sum, req) => sum + req.amount, 0)
    }
    
    // Note: Blueprint recipes are excluded from the total
    
    return total
  }

  // Calculate total amount required (excluding blueprints and checked upgrades)
  const calculateTotalAmount = (results) => {
    if (!results) return 0
    
    let total = 0
    
    // Add station requirements (excluding checked upgrades)
    if (results.stationRequirements) {
      total += results.stationRequirements.reduce((sum, req) => {
        // Check if this upgrade is checked off
        const isChecked = checkedUpgrades[`${req.station}_${req.level}`]
        // Only add amount if upgrade is not checked
        return sum + (isChecked ? 0 : req.amount)
      }, 0)
    }
    
    // Add scrappy level requirements (excluding checked upgrades)
    if (results.scrappyLevelRequirements) {
      total += results.scrappyLevelRequirements.reduce((sum, req) => {
        // Check if this scrappy level is checked off
        const isChecked = checkedUpgrades[`scrappy_level_${req.level}`]
        // Only add amount if scrappy level is not checked
        return sum + (isChecked ? 0 : req.amount)
      }, 0)
    }
    
    // Add project stage requirements (excluding checked upgrades)
    if (results.projectStageRequirements) {
      total += results.projectStageRequirements.reduce((sum, req) => {
        // Check if this project stage is checked off
        const isChecked = checkedUpgrades[`project_${req.projectId}_stage_${req.stage}`]
        // Only add amount if project stage is not checked
        return sum + (isChecked ? 0 : req.amount)
      }, 0)
    }
    
    // Add quest requirements (excluding checked quests)
    if (results.questRequirements) {
      total += results.questRequirements.reduce((sum, req) => {
        // Check if this quest is checked off
        const isChecked = checkedUpgrades[`quest_${req.questId}`]
        // Only add amount if quest is not checked
        return sum + (isChecked ? 0 : req.amount)
      }, 0)
    }
    
    // Note: Blueprint recipes are excluded from the total
    
    return total
  }

  // Toggle show total summary setting
  const toggleShowTotalSummary = () => {
    const newValue = !showTotalSummary
    setShowTotalSummary(newValue)
    localStorage.setItem('showTotalSummary', JSON.stringify(newValue))
  }

  // Toggle upgrade checkbox
  const toggleUpgrade = (stationName, level) => {
    const key = `${stationName}_${level}`
    const newCheckedUpgrades = { ...checkedUpgrades }
    const station = stationsData.stations.find(s => s.name === stationName)
    
    if (!station) return
    
    const isCurrentlyChecked = newCheckedUpgrades[key]
    
    if (isCurrentlyChecked) {
      // Unchecking: uncheck this level and all higher levels
      delete newCheckedUpgrades[key]
      station.levels.forEach(l => {
        if (l.level > level) {
          const higherKey = `${stationName}_${l.level}`
          delete newCheckedUpgrades[higherKey]
        }
      })
    } else {
      // Checking: check this level and all lower levels
      newCheckedUpgrades[key] = true
      station.levels.forEach(l => {
        if (l.level < level) {
          const lowerKey = `${stationName}_${l.level}`
          newCheckedUpgrades[lowerKey] = true
        }
      })
    }
    
    setCheckedUpgrades(newCheckedUpgrades)
    localStorage.setItem('checkedUpgrades', JSON.stringify(newCheckedUpgrades))
  }

  // Get emoji for station
  const getStationEmoji = (stationName) => {
    const emojiMap = {
      'Gunsmith': '🔫',
      'Gear Bench': '🎒',
      'Medical Lab': '🏥',
      'Explosives Station': '💣',
      'Utility Station': '🔧',
      'Refiner': '⚗️'
    }
    return emojiMap[stationName] || '🏭'
  }

  // Toggle scrappy level checkbox
  const toggleScrappyLevel = (level) => {
    const key = `scrappy_level_${level}`
    const newCheckedUpgrades = { ...checkedUpgrades }
    const isCurrentlyChecked = newCheckedUpgrades[key]
    
    if (isCurrentlyChecked) {
      // Unchecking: uncheck this level and all higher levels
      delete newCheckedUpgrades[key]
      scrappyLevelsData.scrappyLevelRequirementsRates.forEach(sl => {
        if (sl.level > level) {
          const higherKey = `scrappy_level_${sl.level}`
          delete newCheckedUpgrades[higherKey]
        }
      })
    } else {
      // Checking: check this level and all lower levels
      newCheckedUpgrades[key] = true
      scrappyLevelsData.scrappyLevelRequirementsRates.forEach(sl => {
        if (sl.level < level) {
          const lowerKey = `scrappy_level_${sl.level}`
          newCheckedUpgrades[lowerKey] = true
        }
      })
    }
    
    setCheckedUpgrades(newCheckedUpgrades)
    localStorage.setItem('checkedUpgrades', JSON.stringify(newCheckedUpgrades))
  }

  // Toggle project stage checkbox
  const toggleProjectStage = (projectId, stage) => {
    const key = `project_${projectId}_stage_${stage}`
    const newCheckedUpgrades = { ...checkedUpgrades }
    const project = projectsData.projects.find(p => p.id === projectId)
    
    if (!project) return
    
    const isCurrentlyChecked = newCheckedUpgrades[key]
    
    if (isCurrentlyChecked) {
      // Unchecking: uncheck this stage and all higher stages
      delete newCheckedUpgrades[key]
      project.stages.forEach(s => {
        if (s.stage > stage) {
          const higherKey = `project_${projectId}_stage_${s.stage}`
          delete newCheckedUpgrades[higherKey]
        }
      })
    } else {
      // Checking: check this stage and all lower stages
      newCheckedUpgrades[key] = true
      project.stages.forEach(s => {
        if (s.stage < stage) {
          const lowerKey = `project_${projectId}_stage_${s.stage}`
          newCheckedUpgrades[lowerKey] = true
        }
      })
    }
    
    setCheckedUpgrades(newCheckedUpgrades)
    localStorage.setItem('checkedUpgrades', JSON.stringify(newCheckedUpgrades))
  }

  // Toggle quest checkbox
  const toggleQuest = (questId) => {
    const key = `quest_${questId}`
    const newCheckedUpgrades = { ...checkedUpgrades }
    const isCurrentlyChecked = newCheckedUpgrades[key]
    
    if (isCurrentlyChecked) {
      delete newCheckedUpgrades[key]
    } else {
      newCheckedUpgrades[key] = true
    }
    
    setCheckedUpgrades(newCheckedUpgrades)
    localStorage.setItem('checkedUpgrades', JSON.stringify(newCheckedUpgrades))
  }

  // Check if an item is needed for any checked upgrade
  const isItemNeededForCheckedUpgrade = (itemName) => {
    for (const key in checkedUpgrades) {
      if (checkedUpgrades[key]) {
        // Check station upgrades
        if (key.startsWith('project_')) {
          // Check project stages
          const match = key.match(/^project_([^_]+)_stage_(\d+)$/)
          if (match) {
            const projectId = match[1]
            const stage = parseInt(match[2])
            const project = projectsData.projects.find(p => p.id === projectId)
            if (project) {
              const projectStage = project.stages.find(s => s.stage === stage)
              if (projectStage && projectStage.requirements) {
                const requirement = projectStage.requirements.find(
                  req => req.name.toLowerCase() === itemName.toLowerCase()
                )
                if (requirement) {
                  return true
                }
              }
            }
          }
        } else if (key.startsWith('scrappy_level_')) {
          // Check scrappy levels
          const level = parseInt(key.replace('scrappy_level_', ''))
          const scrappyLevel = scrappyLevelsData.scrappyLevelRequirementsRates.find(
            sl => sl.level === level
          )
          if (scrappyLevel) {
            const requirement = scrappyLevel.requirements.find(
              req => req.name.toLowerCase() === itemName.toLowerCase()
            )
            if (requirement) {
              return true
            }
          }
        } else if (key.startsWith('quest_')) {
          // Check quests
          const questId = key.replace('quest_', '')
          const quest = questsData.quests.find(q => q.id === questId)
          if (quest && quest.required_items) {
            // Normalize item name for matching
            const normalizedItemName = itemName.toLowerCase().trim()
            const normalizedItemNameDashed = normalizedItemName.replace(/\s+/g, '-')
            const normalizedItemNameSpaced = normalizedItemNameDashed.replace(/-/g, ' ')
            
            const requirement = quest.required_items.find(reqItem => {
              const questItemName = reqItem.item?.name || ''
              const questItemId = reqItem.item_id || ''
              
              const normalizedQuestItemName = questItemName.toLowerCase().trim()
              const normalizedQuestItemId = questItemId.toLowerCase().trim()
              const normalizedQuestItemIdNoRecipe = normalizedQuestItemId.replace('-recipe', '')
              
              const nameMatch = normalizedQuestItemName === normalizedItemName
              const idMatch = normalizedQuestItemId === normalizedItemNameDashed || 
                             normalizedQuestItemId === normalizedItemNameSpaced ||
                             normalizedQuestItemIdNoRecipe === normalizedItemNameDashed ||
                             normalizedQuestItemIdNoRecipe === normalizedItemNameSpaced
              
              const itemExistsInItems = Object.keys(itemsData).some(key => 
                key.toLowerCase() === normalizedItemName ||
                key.toLowerCase().replace(/\s+/g, '-') === normalizedItemNameDashed
              )
              
              return nameMatch || (idMatch && itemExistsInItems)
            })
            if (requirement) {
              return true
            }
          }
        } else {
          // Check station upgrades
          // Parse key: "Station Name_Level" -> ["Station Name", "Level"]
          const lastUnderscoreIndex = key.lastIndexOf('_')
          if (lastUnderscoreIndex !== -1) {
            const stationName = key.substring(0, lastUnderscoreIndex)
            const level = parseInt(key.substring(lastUnderscoreIndex + 1))
            const station = stationsData.stations.find(s => s.name === stationName)
            if (station) {
              const levelData = station.levels.find(l => l.level === level)
              if (levelData) {
                const requirement = levelData.requirements.find(
                  req => req.name.toLowerCase() === itemName.toLowerCase()
                )
                if (requirement) {
                  return true
                }
              }
            }
          }
        }
      }
    }
    return false
  }

  // Close settings dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        settingsRef.current &&
        !settingsRef.current.contains(event.target)
      ) {
        setShowSettingsDropdown(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  // Close modals on Escape key
  useEffect(() => {
    const handleEscapeKey = (event) => {
      if (event.key === 'Escape') {
        if (showUpgradeChecklistModal) {
          setShowUpgradeChecklistModal(false)
        }
        if (showRecyclableModal) {
          setShowRecyclableModal(false)
        }
      }
    }

    if (showUpgradeChecklistModal || showRecyclableModal) {
      document.addEventListener('keydown', handleEscapeKey)
      return () => {
        document.removeEventListener('keydown', handleEscapeKey)
      }
    }
  }, [showUpgradeChecklistModal, showRecyclableModal])

  return (
    <div className="app">
      <TwitchSidebar />
      <div className="container">
        <h1 className="title">Project Greed</h1>
        <div className="upgrade-checklist-button-wrapper">
          <button
            className="upgrade-checklist-button"
            onClick={() => {
              updateUpgradeChecklistTab('projects')
              updateSelectedProjectId('expedition')
              setShowUpgradeChecklistModal(true)
            }}
            type="button"
          >
            🔥 Support for the new Expedition is here! 🔥
          </button>
        </div>
        <p className="subtitle">Keep track of the items you need to keep in order to progress, and stop hoarding!</p>
        
        <form onSubmit={handleSearch} className="search-form">
          <div className="search-wrapper">
            <div className="search-input-wrapper">
              <input
                ref={searchInputRef}
                type="text"
                value={searchTerm}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                onFocus={() => {
                  if (!isSearching && filteredItems.length > 0) {
                    setShowDropdown(true)
                  }
                }}
                placeholder="Enter item name (e.g., Accordion, Leaper Pulse Unit)"
                className="search-input"
              />
              {showDropdown && filteredItems.length > 0 && (
                <div ref={dropdownRef} className="dropdown">
                  {filteredItems.map((item, index) => (
                    <div
                      key={item}
                      className={`dropdown-item ${
                        index === highlightedIndex ? 'highlighted' : ''
                      }`}
                      onClick={() => selectItem(item)}
                      onMouseEnter={() => setHighlightedIndex(index)}
                    >
                      <img 
                        src={itemsData[item]?.image || '/images/item-placeholder.svg'} 
                        alt={item}
                        className="dropdown-item-image"
                        onError={(e) => {
                          e.target.src = '/images/item-placeholder.svg';
                        }}
                      />
                      <span className="dropdown-item-text">{item}</span>
                      {index === highlightedIndex && (
                        <span className="dropdown-item-enter-icon">
                          <MdKeyboardReturn />
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="settings-wrapper" ref={settingsRef}>
              <button
                className="settings-button"
                onClick={() => setShowSettingsDropdown(!showSettingsDropdown)}
                aria-label="Settings"
                type="button"
              >
                <MdSettings />
              </button>
              {showSettingsDropdown && (
                <div className="settings-dropdown">
                  <div className="settings-item">
                    <label className="settings-label">
                      <input
                        type="checkbox"
                        checked={showTotalSummary}
                        onChange={toggleShowTotalSummary}
                        className="settings-checkbox"
                      />
                      <span>Total Amount Summary</span>
                    </label>
                  </div>
                  <div className="settings-divider"></div>
                  <div className="settings-item">
                    <button
                      className="settings-menu-button"
                      onClick={() => {
                        setShowRecyclableModal(true)
                        setShowSettingsDropdown(false)
                      }}
                    >
                      <span>♻️ View Recyclable Items</span>
                    </button>
                  </div>
                  <div className="settings-item">
                    <button
                      className="settings-menu-button"
                      onClick={() => {
                        setShowUpgradeChecklistModal(true)
                        setShowSettingsDropdown(false)
                      }}
                    >
                      <span>✅ Checklist</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
          {!results && (
            <button type="submit" className="search-button">
              Search
            </button>
          )}
        </form>

        {results && (
          <div className="results">
            {results.data !== null ? (
              <>
                <div className="item-header">
                  <img 
                    src={results.data?.image || '/images/item-placeholder.svg'} 
                    alt={results.name}
                    className="item-image"
                    onError={(e) => {
                      e.target.src = '/images/item-placeholder.svg';
                    }}
                  />
                  <h2 className="item-name">{results.name}</h2>
                </div>
                {showTotalSummary && (
                  <TotalSummaryCard
                    originalTotal={calculateOriginalTotalAmount(results)}
                    totalAmount={calculateTotalAmount(results)}
                    checkedUpgrades={checkedUpgrades}
                  />
                )}
                {(() => {
                  const hasItemProperties = results.data && Object.keys(results.data).length > 0
                  const hasStationRequirements = results.stationRequirements && results.stationRequirements.length > 0
                  const hasScrappyRequirements = results.scrappyLevelRequirements && results.scrappyLevelRequirements.length > 0
                  const hasProjectRequirements = results.projectStageRequirements && results.projectStageRequirements.length > 0
                  const hasQuestRequirements = results.questRequirements && results.questRequirements.length > 0
                  const hasBlueprintRecipes = results.blueprintRecipes && results.blueprintRecipes.length > 0
                  const hasAnyInfo = hasItemProperties || hasStationRequirements || hasScrappyRequirements || hasProjectRequirements || hasQuestRequirements || hasBlueprintRecipes
                  
                  if (hasAnyInfo) {
                    return (
                      <div className="categories">
                        {results.data?.safe_to_recycle && (
                          <div className="category-card" style={{ borderColor: 'rgba(255, 140, 66, 0.5)' }}>
                            <div className="category-header">
                              <span className="category-icon">♻️</span>
                              <span className="category-label">Safe to Recycle</span>
                            </div>
                          </div>
                        )}
                        
                        {/* Station Requirements */}
                        {hasStationRequirements ? (
                          <div className="category-card" style={{ borderColor: 'rgba(59, 130, 246, 0.6)' }}>
                            <div className="category-header">
                              <span className="category-icon">🏭</span>
                              <span className="category-label">Required for Station Upgrades</span>
                            </div>
                            <div className="station-requirements">
                              {[...results.stationRequirements]
                                .sort((a, b) => {
                                  const aChecked = checkedUpgrades[`${a.station}_${a.level}`]
                                  const bChecked = checkedUpgrades[`${b.station}_${b.level}`]
                                  // Sort: unchecked first, then checked
                                  if (aChecked && !bChecked) return 1
                                  if (!aChecked && bChecked) return -1
                                  return 0
                                })
                                .map((req, index) => {
                                  const isChecked = checkedUpgrades[`${req.station}_${req.level}`]
                                  return (
                                    <div key={`${req.station}-${req.level}-${index}`} className={`station-requirement-item ${isChecked ? 'checked-upgrade' : ''}`}>
                                      <div className="station-name">
                                        {req.station}
                                        {isChecked && <span className="checked-badge">✓ Completed</span>}
                                      </div>
                                      <div className="station-level">Level {req.level}</div>
                                      <div className="station-amount">Amount: <strong>{req.amount}</strong></div>
                                    </div>
                                  )
                                })}
                            </div>
                          </div>
                        ) : (
                          <div className="category-card" style={{ borderColor: 'rgba(107, 114, 128, 0.6)' }}>
                            <div className="category-header">
                              <span className="category-icon">🏭</span>
                              <span className="category-label">Station Requirements</span>
                            </div>
                            <div className="no-station-requirements">
                              Not required for any station upgrades.
                            </div>
                          </div>
                        )}
                        
                        {/* Project Stage Requirements */}
                        {hasProjectRequirements ? (
                          <div className="category-card" style={{ borderColor: 'rgba(255, 140, 66, 0.6)' }}>
                            <div className="category-header">
                              <span className="category-icon">🚀</span>
                              <span className="category-label">Required for Project Stages</span>
                            </div>
                            <div className="station-requirements">
                              {[...results.projectStageRequirements]
                                .sort((a, b) => {
                                  const aChecked = checkedUpgrades[`project_${a.projectId}_stage_${a.stage}`]
                                  const bChecked = checkedUpgrades[`project_${b.projectId}_stage_${b.stage}`]
                                  // Sort: unchecked first, then checked
                                  if (aChecked && !bChecked) return 1
                                  if (!aChecked && bChecked) return -1
                                  return 0
                                })
                                .map((req, index) => {
                                  const isChecked = checkedUpgrades[`project_${req.projectId}_stage_${req.stage}`]
                                  const project = projectsData.projects.find(p => p.id === req.projectId)
                                  const totalStages = project ? project.stages.length : 0
                                  return (
                                    <div key={`project-${req.projectId}-${req.stage}-${index}`} className={`station-requirement-item ${isChecked ? 'checked-upgrade' : ''}`}>
                                      <div className="station-name">
                                        {req.projectName} - {req.title}
                                        {isChecked && <span className="checked-badge">✓ Completed</span>}
                                      </div>
                                      <div className="station-level">
                                        Stage {req.stage}/{totalStages}
                                      </div>
                                      <div className="station-amount">Amount: <strong>{req.amount}</strong></div>
                                    </div>
                                  )
                                })}
                            </div>
                          </div>
                        ) : (
                          <div className="category-card" style={{ borderColor: 'rgba(107, 114, 128, 0.6)' }}>
                            <div className="category-header">
                              <span className="category-icon">🚀</span>
                              <span className="category-label">Project Stage Requirements</span>
                            </div>
                            <div className="no-station-requirements">
                              Not required for any project stages.
                            </div>
                          </div>
                        )}
                        
                        {/* Quest Requirements */}
                        {hasQuestRequirements ? (
                          <div className="category-card" style={{ borderColor: 'rgba(255, 69, 0, 0.6)' }}>
                            <div className="category-header">
                              <span className="category-icon">📋</span>
                              <span className="category-label">Required for Quests</span>
                            </div>
                            <div className="station-requirements">
                              {[...results.questRequirements]
                                .sort((a, b) => {
                                  const aChecked = checkedUpgrades[`quest_${a.questId}`]
                                  const bChecked = checkedUpgrades[`quest_${b.questId}`]
                                  // Sort: unchecked first, then checked
                                  if (aChecked && !bChecked) return 1
                                  if (!aChecked && bChecked) return -1
                                  return 0
                                })
                                .map((req, index) => {
                                  const isChecked = checkedUpgrades[`quest_${req.questId}`]
                                  return (
                                    <div key={`quest-${req.questId}-${index}`} className={`station-requirement-item ${isChecked ? 'checked-upgrade' : ''}`}>
                                      <div className="station-name">
                                        {req.questName}
                                        {isChecked && <span className="checked-badge">✓ Completed</span>}
                                      </div>
                                      <div className="station-amount">Amount: <strong>{req.amount}</strong></div>
                                    </div>
                                  )
                                })}
                            </div>
                          </div>
                        ) : (
                          <div className="category-card" style={{ borderColor: 'rgba(107, 114, 128, 0.6)' }}>
                            <div className="category-header">
                              <span className="category-icon">📋</span>
                              <span className="category-label">Quest Requirements</span>
                            </div>
                            <div className="no-station-requirements">
                              Not required for any quests.
                            </div>
                          </div>
                        )}
                        
                        {/* Scrappy Level Requirements */}
                        {hasScrappyRequirements ? (
                          <div className="category-card" style={{ borderColor: 'rgba(168, 85, 247, 0.6)' }}>
                            <div className="category-header">
                              <span className="category-icon">🐔</span>
                              <span className="category-label">Required for Scrappy Levels</span>
                            </div>
                            <div className="station-requirements">
                              {[...results.scrappyLevelRequirements]
                                .sort((a, b) => {
                                  const aChecked = checkedUpgrades[`scrappy_level_${a.level}`]
                                  const bChecked = checkedUpgrades[`scrappy_level_${b.level}`]
                                  // Sort: unchecked first, then checked
                                  if (aChecked && !bChecked) return 1
                                  if (!aChecked && bChecked) return -1
                                  return 0
                                })
                                .map((req, index) => {
                                  const isChecked = checkedUpgrades[`scrappy_level_${req.level}`]
                                  return (
                                    <div key={`scrappy-${req.level}-${index}`} className={`station-requirement-item ${isChecked ? 'checked-upgrade' : ''}`}>
                                      <div className="station-name">
                                        {req.title}
                                        {isChecked && <span className="checked-badge">✓ Completed</span>}
                                      </div>
                                      <div className="station-level">Level {req.level}</div>
                                      <div className="station-amount">Amount: <strong>{req.amount}</strong></div>
                                    </div>
                                  )
                                })}
                            </div>
                          </div>
                        ) : (
                          <div className="category-card" style={{ borderColor: 'rgba(107, 114, 128, 0.6)' }}>
                            <div className="category-header">
                              <span className="category-icon">🐔</span>
                              <span className="category-label">Scrappy Level Requirements</span>
                            </div>
                            <div className="no-station-requirements">
                              Not required for any scrappy level upgrades.
                            </div>
                          </div>
                        )}
                        
                        {/* Blueprint Recipes */}
                        {hasBlueprintRecipes ? (
                          <div className="category-card" style={{ borderColor: 'rgba(34, 197, 94, 0.6)' }}>
                            <div className="category-header">
                              <span className="category-icon">📜</span>
                              <span className="category-label">Used in Blueprint Recipes</span>
                            </div>
                            <div className="station-requirements">
                              {results.blueprintRecipes.map((blueprint, index) => (
                                <div key={index} className="station-requirement-item">
                                  <div className="station-name">{blueprint.name}</div>
                                  <div className="station-level">{blueprint.workshop} - Level {blueprint.level}</div>
                                  <div className="station-amount">Amount needed: <strong>{blueprint.amount}</strong></div>
                                  {blueprint.otherIngredients.length > 0 && (
                                    <div className="blueprint-ingredients">
                                      <div className="ingredients-label">Other ingredients:</div>
                                      <div className="ingredients-list">
                                        {blueprint.otherIngredients.map((ingredient, ingIndex) => (
                                          <span key={ingIndex} className="ingredient-item">
                                            {ingredient.name} ({ingredient.amount})
                                          </span>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        ) : (
                          <div className="category-card" style={{ borderColor: 'rgba(107, 114, 128, 0.6)' }}>
                            <div className="category-header">
                              <span className="category-icon">📜</span>
                              <span className="category-label">Blueprint Recipes</span>
                            </div>
                            <div className="no-station-requirements">
                              Not used in any blueprint recipes.
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  } else {
                    return (
                      <div className="no-category-info">
                        <p>✅ Item "<strong>{results.name}</strong>" found in database.</p>
                        <p className="info-text">No category information available for this item.</p>
                      </div>
                    )
                  }
                })()}
              </>
            ) : (
              <div className="no-results">
                <p>❌ Item "<strong>{results.name}</strong>" not found in database.</p>
                {showTotalSummary && (
                  <TotalSummaryCard
                    originalTotal={calculateOriginalTotalAmount(results)}
                    totalAmount={calculateTotalAmount(results)}
                    checkedUpgrades={checkedUpgrades}
                    marginTop={true}
                  />
                )}
                {/* Show station requirements even if item not in items.json */}
                {results.stationRequirements && results.stationRequirements.length > 0 && (
                  <div className="category-card" style={{ borderColor: 'rgba(59, 130, 246, 0.6)', marginTop: '16px' }}>
                    <div className="category-header">
                      <span className="category-icon">🏭</span>
                      <span className="category-label">Required for Station Upgrades</span>
                    </div>
                    <div className="station-requirements">
                      {[...results.stationRequirements]
                        .sort((a, b) => {
                          const aChecked = checkedUpgrades[`${a.station}_${a.level}`]
                          const bChecked = checkedUpgrades[`${b.station}_${b.level}`]
                          // Sort: unchecked first, then checked
                          if (aChecked && !bChecked) return 1
                          if (!aChecked && bChecked) return -1
                          return 0
                        })
                        .map((req, index) => {
                          const isChecked = checkedUpgrades[`${req.station}_${req.level}`]
                          return (
                            <div key={`${req.station}-${req.level}-${index}`} className={`station-requirement-item ${isChecked ? 'checked-upgrade' : ''}`}>
                              <div className="station-name">
                                {req.station}
                                {isChecked && <span className="checked-badge">✓ Completed</span>}
                              </div>
                              <div className="station-level">Level {req.level}</div>
                              <div className="station-amount">Amount: <strong>{req.amount}</strong></div>
                            </div>
                          )
                        })}
                    </div>
                  </div>
                )}
                {results.stationRequirements && results.stationRequirements.length === 0 && (
                  <div className="category-card" style={{ borderColor: 'rgba(107, 114, 128, 0.6)', marginTop: '16px' }}>
                    <div className="category-header">
                      <span className="category-icon">🏭</span>
                      <span className="category-label">Station Requirements</span>
                    </div>
                    <div className="no-station-requirements">
                      Not required for any station upgrades.
                    </div>
                  </div>
                )}
                {/* Show project stage requirements even if item not in items.json */}
                {results.projectStageRequirements && results.projectStageRequirements.length > 0 && (
                  <div className="category-card" style={{ borderColor: 'rgba(255, 140, 66, 0.6)', marginTop: '16px' }}>
                    <div className="category-header">
                      <span className="category-icon">🚀</span>
                      <span className="category-label">Required for Project Stages</span>
                    </div>
                    <div className="station-requirements">
                      {[...results.projectStageRequirements]
                        .sort((a, b) => {
                          const aChecked = checkedUpgrades[`project_${a.projectId}_stage_${a.stage}`]
                          const bChecked = checkedUpgrades[`project_${b.projectId}_stage_${b.stage}`]
                          // Sort: unchecked first, then checked
                          if (aChecked && !bChecked) return 1
                          if (!aChecked && bChecked) return -1
                          return 0
                        })
                        .map((req, index) => {
                          const isChecked = checkedUpgrades[`project_${req.projectId}_stage_${req.stage}`]
                          const project = projectsData.projects.find(p => p.id === req.projectId)
                          const totalStages = project ? project.stages.length : 0
                          return (
                            <div key={`project-${req.projectId}-${req.stage}-${index}`} className={`station-requirement-item ${isChecked ? 'checked-upgrade' : ''}`}>
                              <div className="station-name">
                                {req.projectName} - {req.title}
                                {isChecked && <span className="checked-badge">✓ Completed</span>}
                              </div>
                              <div className="station-level">
                                Stage {req.stage}/{totalStages}
                              </div>
                              <div className="station-amount">Amount: <strong>{req.amount}</strong></div>
                            </div>
                          )
                        })}
                    </div>
                  </div>
                )}
                {/* Show quest requirements even if item not in items.json */}
                {results.questRequirements && results.questRequirements.length > 0 && (
                  <div className="category-card" style={{ borderColor: 'rgba(255, 69, 0, 0.6)', marginTop: '16px' }}>
                    <div className="category-header">
                      <span className="category-icon">📋</span>
                      <span className="category-label">Required for Quests</span>
                    </div>
                    <div className="station-requirements">
                      {[...results.questRequirements]
                        .sort((a, b) => {
                          const aChecked = checkedUpgrades[`quest_${a.questId}`]
                          const bChecked = checkedUpgrades[`quest_${b.questId}`]
                          // Sort: unchecked first, then checked
                          if (aChecked && !bChecked) return 1
                          if (!aChecked && bChecked) return -1
                          return 0
                        })
                        .map((req, index) => {
                          const isChecked = checkedUpgrades[`quest_${req.questId}`]
                          return (
                            <div key={`quest-${req.questId}-${index}`} className={`station-requirement-item ${isChecked ? 'checked-upgrade' : ''}`}>
                              <div className="station-name">
                                {req.questName}
                                {isChecked && <span className="checked-badge">✓ Completed</span>}
                              </div>
                              <div className="station-amount">Amount: <strong>{req.amount}</strong></div>
                            </div>
                          )
                        })}
                    </div>
                  </div>
                )}
                {/* Show scrappy level requirements even if item not in items.json */}
                {results.scrappyLevelRequirements && results.scrappyLevelRequirements.length > 0 && (
                  <div className="category-card" style={{ borderColor: 'rgba(168, 85, 247, 0.6)', marginTop: '16px' }}>
                    <div className="category-header">
                      <span className="category-icon">🐔</span>
                      <span className="category-label">Required for Scrappy Levels</span>
                    </div>
                    <div className="station-requirements">
                      {[...results.scrappyLevelRequirements]
                        .sort((a, b) => {
                          const aChecked = checkedUpgrades[`scrappy_level_${a.level}`]
                          const bChecked = checkedUpgrades[`scrappy_level_${b.level}`]
                          // Sort: unchecked first, then checked
                          if (aChecked && !bChecked) return 1
                          if (!aChecked && bChecked) return -1
                          return 0
                        })
                        .map((req, index) => {
                          const isChecked = checkedUpgrades[`scrappy_level_${req.level}`]
                          return (
                            <div key={`scrappy-${req.level}-${index}`} className={`station-requirement-item ${isChecked ? 'checked-upgrade' : ''}`}>
                              <div className="station-name">
                                {req.title}
                                {isChecked && <span className="checked-badge">✓ Completed</span>}
                              </div>
                              <div className="station-level">Level {req.level}</div>
                              <div className="station-amount">Amount: <strong>{req.amount}</strong></div>
                            </div>
                          )
                        })}
                    </div>
                  </div>
                )}
                {results.scrappyLevelRequirements && results.scrappyLevelRequirements.length === 0 && (
                  <div className="category-card" style={{ borderColor: 'rgba(107, 114, 128, 0.6)', marginTop: '16px' }}>
                    <div className="category-header">
                      <span className="category-icon">🐔</span>
                      <span className="category-label">Scrappy Level Requirements</span>
                    </div>
                    <div className="no-station-requirements">
                      Not required for any scrappy level upgrades.
                    </div>
                  </div>
                )}
                {/* Show blueprint recipes even if item not in items.json */}
                {results.blueprintRecipes && results.blueprintRecipes.length > 0 && (
                  <div className="category-card" style={{ borderColor: 'rgba(34, 197, 94, 0.6)', marginTop: '16px' }}>
                    <div className="category-header">
                      <span className="category-icon">📜</span>
                      <span className="category-label">Used in Blueprint Recipes</span>
                    </div>
                    <div className="station-requirements">
                      {results.blueprintRecipes.map((blueprint, index) => (
                        <div key={index} className="station-requirement-item">
                          <div className="station-name">{blueprint.name}</div>
                          <div className="station-level">{blueprint.workshop} - Level {blueprint.level}</div>
                          <div className="station-amount">Amount needed: <strong>{blueprint.amount}</strong></div>
                          {blueprint.otherIngredients.length > 0 && (
                            <div className="blueprint-ingredients">
                              <div className="ingredients-label">Other ingredients:</div>
                              <div className="ingredients-list">
                                {blueprint.otherIngredients.map((ingredient, ingIndex) => (
                                  <span key={ingIndex} className="ingredient-item">
                                    {ingredient.name} ({ingredient.amount})
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {results.blueprintRecipes && results.blueprintRecipes.length === 0 && (
                  <div className="category-card" style={{ borderColor: 'rgba(107, 114, 128, 0.6)', marginTop: '16px' }}>
                    <div className="category-header">
                      <span className="category-icon">📜</span>
                      <span className="category-label">Blueprint Recipes</span>
                    </div>
                    <div className="no-station-requirements">
                      Not used in any blueprint recipes.
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Recyclable Items Modal */}
        {showRecyclableModal && (
          <div className="modal-overlay" onClick={() => setShowRecyclableModal(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2 className="modal-title">
                  <span className="modal-icon">♻️</span>
                  Recyclable Items
                  <span className="modal-count">({filteredRecyclableItems.length})</span>
                </h2>
                <button
                  className="modal-close-button"
                  onClick={() => setShowRecyclableModal(false)}
                  aria-label="Close"
                >
                  <MdClose />
                </button>
              </div>
              <div className="modal-search-wrapper">
                <input
                  type="text"
                  value={recyclableSearchTerm}
                  onChange={(e) => setRecyclableSearchTerm(e.target.value)}
                  placeholder="Search recyclable items..."
                  className="modal-search-input"
                  autoFocus
                />
              </div>
              <div className="modal-body">
                {filteredRecyclableItems.length > 0 ? (
                  <div className="recyclable-items-list">
                    {filteredRecyclableItems.map((itemName) => (
                      <div
                        key={itemName}
                        className="recyclable-item"
                        onClick={() => {
                          setSearchTerm(itemName)
                          setShowRecyclableModal(false)
                          setIsSearching(true)
                          performSearch(itemName)
                        }}
                      >
                        <img 
                          src={itemsData[itemName]?.image || '/images/item-placeholder.svg'} 
                          alt={itemName}
                          className="recyclable-item-image"
                          onError={(e) => {
                            e.target.src = '/images/item-placeholder.svg';
                          }}
                        />
                        <span>{itemName}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="modal-empty-state">
                    <p>No recyclable items found matching "{recyclableSearchTerm}"</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Upgrade Checklist Modal */}
        {showUpgradeChecklistModal && (
          <div className="modal-overlay upgrade-checklist-modal-overlay" onClick={() => setShowUpgradeChecklistModal(false)}>
            <div className="modal-content upgrade-checklist-modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2 className="modal-title">
                  <span className="modal-icon">✅</span>
                  Upgrade Checklist
                </h2>
                <button
                  className="modal-close-button"
                  onClick={() => setShowUpgradeChecklistModal(false)}
                  aria-label="Close"
                >
                  <MdClose />
                </button>
              </div>
              <div className="modal-body upgrade-checklist-modal-body">
                <p className="upgrade-checklist-description">
                  Check off upgrades you've completed. Items needed for already completed upgrades are then excluded from the search results.
                </p>
                <div className="upgrade-checklist-tabs">
                  <button
                    className={`upgrade-checklist-tab ${upgradeChecklistTab === 'stations' ? 'active' : ''}`}
                    onClick={() => updateUpgradeChecklistTab('stations')}
                    type="button"
                  >
                    🏭 Stations
                  </button>
                  <button
                    className={`upgrade-checklist-tab ${upgradeChecklistTab === 'projects' ? 'active' : ''}`}
                    onClick={() => {
                      updateUpgradeChecklistTab('projects')
                      // Reset to first project when switching to projects tab
                      if (projectsData.projects.length > 0 && !selectedProjectId) {
                        updateSelectedProjectId(projectsData.projects[0].id)
                      }
                    }}
                    type="button"
                  >
                    🚀 Projects
                  </button>
                  <button
                    className={`upgrade-checklist-tab ${upgradeChecklistTab === 'quests' ? 'active' : ''}`}
                    onClick={() => updateUpgradeChecklistTab('quests')}
                    type="button"
                  >
                    📋 Quests
                  </button>
                  <button
                    className={`upgrade-checklist-tab ${upgradeChecklistTab === 'scrappy' ? 'active' : ''}`}
                    onClick={() => updateUpgradeChecklistTab('scrappy')}
                    type="button"
                  >
                    🐔 Scrappy
                  </button>
                </div>
                <div className="upgrade-checklist-list">
                  {upgradeChecklistTab === 'stations' ? (
                    stationsData.stations.map((station) => (
                      <div key={station.name} className="upgrade-station-group">
                        <h3 className="upgrade-station-name">
                          <span className="upgrade-station-emoji">{getStationEmoji(station.name)}</span>
                          {station.name}
                        </h3>
                        <div className="upgrade-levels">
                          {station.levels.map((level) => {
                            const key = `${station.name}_${level.level}`
                            const isChecked = checkedUpgrades[key] || false
                            return (
                              <label key={level.level} className={`upgrade-checkbox-label ${isChecked ? 'checked' : ''}`}>
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={() => toggleUpgrade(station.name, level.level)}
                                  className="upgrade-checkbox"
                                />
                                <div className="upgrade-checkbox-content">
                                  <span className="upgrade-checkbox-text">
                                    Level {level.level}
                                  </span>
                                  <div className="upgrade-requirements-preview">
                                    {level.requirements.map((req, idx) => (
                                      <span key={idx} className="upgrade-requirement-tag">
                                        {req.name} ({req.amount})
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              </label>
                            )
                          })}
                        </div>
                      </div>
                    ))
                  ) : upgradeChecklistTab === 'projects' ? (
                    <>
                      {/* Project Sub-tabs */}
                      <div className="upgrade-checklist-sub-tabs">
                        {projectsData.projects.map((project) => (
                          <button
                            key={project.id}
                            className={`upgrade-checklist-sub-tab ${selectedProjectId === project.id ? 'active' : ''}`}
                            onClick={() => updateSelectedProjectId(project.id)}
                            type="button"
                          >
                            {project.name}
                          </button>
                        ))}
                      </div>
                      {/* Selected Project Stages */}
                      {selectedProjectId && (() => {
                        const project = projectsData.projects.find(p => p.id === selectedProjectId)
                        if (!project) return null
                        return (
                          <div className="upgrade-station-group">
                            <h3 className="upgrade-station-name">
                              <span className="upgrade-station-emoji">🚀</span>
                              {project.name}
                            </h3>
                            {project.stages.map((stage) => {
                              const key = `project_${project.id}_stage_${stage.stage}`
                              const isChecked = checkedUpgrades[key] || false
                              const totalStages = project.stages.length
                              return (
                                <div key={stage.stage} className="upgrade-station-group">
                                  <label className={`upgrade-checkbox-label ${isChecked ? 'checked' : ''}`}>
                                    <input
                                      type="checkbox"
                                      checked={isChecked}
                                      onChange={() => toggleProjectStage(project.id, stage.stage)}
                                      className="upgrade-checkbox"
                                    />
                                    <div className="upgrade-checkbox-content">
                                      <span className="upgrade-checkbox-text">
                                        {stage.title} (Stage {stage.stage}/{totalStages})
                                      </span>
                                      {stage.description && (
                                        <div className="upgrade-checkbox-description">
                                          {stage.description}
                                        </div>
                                      )}
                                      {stage.requirements && stage.requirements.length > 0 && (
                                        <div className="upgrade-requirements-preview">
                                          {stage.requirements.map((req, idx) => (
                                            <span key={idx} className="upgrade-requirement-tag">
                                              {req.name} ({req.amount})
                                            </span>
                                          ))}
                                        </div>
                                      )}
                                      {stage.categoryRequirements && stage.categoryRequirements.length > 0 && (
                                        <div className="upgrade-requirements-preview">
                                          {stage.categoryRequirements.map((req, idx) => (
                                            <span key={idx} className="upgrade-requirement-tag">
                                              {req.credValue.toLocaleString()} Coins worth of {req.category}
                                            </span>
                                          ))}
                                        </div>
                                      )}
                                      {(!stage.requirements || stage.requirements.length === 0) && 
                                       (!stage.categoryRequirements || stage.categoryRequirements.length === 0) && (
                                        <div className="upgrade-requirements-preview">
                                          <span className="upgrade-requirement-tag" style={{ fontStyle: 'italic', opacity: 0.7 }}>
                                            No specific item requirements
                                          </span>
                                        </div>
                                      )}
                                    </div>
                                  </label>
                                </div>
                              )
                            })}
                          </div>
                        )
                      })()}
                    </>
                  ) : upgradeChecklistTab === 'quests' ? (
                    questsData.quests
                      .filter(quest => quest.required_items && quest.required_items.length > 0)
                      .map((quest) => {
                        const key = `quest_${quest.id}`
                        const isChecked = checkedUpgrades[key] || false
                        return (
                          <div key={quest.id} className="upgrade-station-group">
                            <label className={`upgrade-checkbox-label ${isChecked ? 'checked' : ''}`}>
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => toggleQuest(quest.id)}
                                className="upgrade-checkbox"
                              />
                              <div className="upgrade-checkbox-content">
                                <span className="upgrade-checkbox-text">
                                  {quest.name}
                                </span>
                                <div className="upgrade-requirements-preview">
                                  {quest.required_items.map((reqItem, idx) => (
                                    <span key={idx} className="upgrade-requirement-tag">
                                      {reqItem.item?.name || reqItem.item_id} ({reqItem.quantity})
                                    </span>
                                  ))}
                                </div>
                              </div>
                            </label>
                          </div>
                        )
                      })
                  ) : (
                    scrappyLevelsData.scrappyLevelRequirementsRates.map((scrappyLevel) => {
                      const key = `scrappy_level_${scrappyLevel.level}`
                      const isChecked = checkedUpgrades[key] || false
                      return (
                        <div key={scrappyLevel.level} className="upgrade-station-group">
                          <label className={`upgrade-checkbox-label ${isChecked ? 'checked' : ''}`}>
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => toggleScrappyLevel(scrappyLevel.level)}
                              className="upgrade-checkbox"
                            />
                            <div className="upgrade-checkbox-content">
                              <span className="upgrade-checkbox-text">
                                {scrappyLevel.title} (Level {scrappyLevel.level})
                              </span>
                              <div className="upgrade-requirements-preview">
                                {scrappyLevel.requirements.map((req, idx) => (
                                  <span key={idx} className="upgrade-requirement-tag">
                                    {req.name} ({req.amount})
                                  </span>
                                ))}
                              </div>
                            </div>
                          </label>
                        </div>
                      )
                    })
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
      <footer className="footer">
        <div className="footer-content">
          <p>© 2025 ItsCiccio. All rights reserved.</p>
          <p className="privacy-notice">Privacy: This site uses anonymous analytics to track page views. No personal data is collected.</p>
          <div className="support-section">
            <p className="support-text">If this tool helped you, consider supporting it!</p>
            <a 
              href="https://buymeacoffee.com/itsciccio" 
              target="_blank" 
              rel="noopener noreferrer"
              className="bmc-button"
            >
              <span className="bmc-icon">☕</span>
              <span className="bmc-text">Buy me a coffee</span>
            </a>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default App


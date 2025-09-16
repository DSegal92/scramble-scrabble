import { useState, useEffect } from 'react'
import wordListEasy from './wordList.easy.json'
import wordListMedium from './lib/wordlist.medium.json'
import wordListHard from './lib/wordlist.hard.json'
import { Button } from './components/ui/button'
import { Slider } from './components/ui/slider'
import './App.css'

type DifficultyLevel = 'easy' | 'medium' | 'hard'

const App = () => {
  const [letterPool, updateLetterPool] = useState<string[]>([])
  const [letterSwaps, updateLetterSwaps] = useState<[string, string][]>([])
  const [selectedWord, setSelectedWord] = useState<string | null>(null)
  const [selectedWords, setSelectedWords] = useState<string[]>([])
  const [isButtonDisabled, setIsButtonDisabled] = useState(false)
  const [desiredDifficulty, setDesiredDifficulty] = useState<number>(1)
  const [difficultyLevel, setDifficultyLevel] = useState<DifficultyLevel>('easy')

  // Get current wordlist based on difficulty level
  const getCurrentWordList = (): string[] => {
    switch (difficultyLevel) {
      case 'easy':
        return wordListEasy
      case 'medium':
        return wordListMedium
      case 'hard':
        return wordListHard
      default:
        return wordListEasy
    }
  }

  useEffect(() => {
    const currentWordList = getCurrentWordList()
    const uniqueLetters = Array.from(new Set(
      currentWordList.join('').split('').map((letter: string) => letter.toLowerCase())
    )).filter((char: string) => /^[a-z]$/.test(char)).sort((a: string, b: string) => a < b ? -1 : 1)
    updateLetterPool(uniqueLetters)

    // Reset selected words when difficulty level changes
    setSelectedWords([])
    setSelectedWord(null)

    // Check if button should be enabled with current swaps
    const currentSwaps = letterSwaps.flat()
    const wordsAvailable = checkWordsAvailable(currentSwaps, [])
    setIsButtonDisabled(!wordsAvailable)
  }, [difficultyLevel])

  // Monitor letterSwaps changes and update button state
  useEffect(() => {
    const currentSwaps = letterSwaps.flat()
    const wordsAvailable = checkWordsAvailable(currentSwaps, selectedWords)
    setIsButtonDisabled(!wordsAvailable)
  }, [letterSwaps, selectedWords])

  // Helper function to apply letter swaps to a word
  const applyLetterSwaps = (word: string): string => {
    if (!word) return ''

    let swappedWord = word.toLowerCase()

    // Apply each swap to the word
    letterSwaps.forEach(([s1, s2]) => {
      swappedWord = swappedWord.split('').map(letter => {
        if (letter === s1) return s2
        if (letter === s2) return s1
        return letter
      }).join('')
    })

    return swappedWord
  }

  // Helper function to apply letter swaps and track which letters were changed
  const applyLetterSwapsWithHighlight = (word: string): { letter: string; isSwapped: boolean }[] => {
    if (!word) return []

    const originalWord = word.toLowerCase()
    let result = originalWord.split('').map(letter => ({ letter, isSwapped: false }))

    // Apply each swap to the word and track changes
    letterSwaps.forEach(([s1, s2]) => {
      result = result.map(({ letter, isSwapped }) => {
        if (letter === s1) return { letter: s2, isSwapped: true }
        if (letter === s2) return { letter: s1, isSwapped: true }
        return { letter, isSwapped }
      })
    })

    return result
  }

  // Helper function to calculate the difficulty of a specific word
  const getWordDifficulty = (word: string): number => {
    if (!word) return 0
    
    const currentSwaps = letterSwaps.flat()
    let difficulty = 0
    
    word.toLowerCase().split('').forEach(letter => {
      if (currentSwaps.includes(letter)) {
        difficulty++
      }
    })
    
    return difficulty
  }

  // Helper function to check if there are valid words available
  const checkWordsAvailable = (currentSwaps: string[], alreadySelected: string[]): boolean => {
    const currentWordList = getCurrentWordList()
    const wordDifficulties: Record<string, number> = {}

    currentWordList.forEach((word: string) => {
      wordDifficulties[word.toLowerCase()] = 0
    })

    Object.keys(wordDifficulties).forEach(word => {
      word.split('').forEach(letter => {
        if (currentSwaps.includes(letter)) {
          wordDifficulties[word]++
        }
      })
    })

    // Filter out already selected words and find words with difficulty >= 1
    const availableWords = Object.keys(wordDifficulties).filter(
      word => wordDifficulties[word] >= 1 && !alreadySelected.includes(word.toLowerCase())
    )

    return availableWords.length > 0
  }

  // Helper function to get current word difficulties for display
  const getCurrentWordDifficulties = () => {
    const currentWordList = getCurrentWordList()
    const wordDifficulties: Record<string, number> = {}
    const currentSwaps = letterSwaps.flat()

    currentWordList.forEach((word: string) => {
      wordDifficulties[word.toLowerCase()] = 0
    })

    Object.keys(wordDifficulties).forEach(word => {
      word.split('').forEach(letter => {
        if (currentSwaps.includes(letter)) {
          wordDifficulties[word]++
        }
      })
    })

    // Filter out already selected words but include all difficulty levels
    const availableWords = Object.keys(wordDifficulties).filter(
      word => !selectedWords.includes(word.toLowerCase())
    )

    // Create array of {word, difficulty} objects, sorted by difficulty then alphabetically
    return availableWords
      .map(word => ({
        word: currentWordList.find((w: string) => w.toLowerCase() === word) || word,
        difficulty: wordDifficulties[word]
      }))
      .sort((a, b) => {
        if (a.difficulty !== b.difficulty) {
          return b.difficulty - a.difficulty
        }
        return a.word.localeCompare(b.word)
      })
  }

  const createSwap = () => {
    const swap = [...letterPool].sort(() => Math.random() - 0.5)
    const s1 = swap[0]
    const s2 = swap[1]

    const letterPoolWithoutSwaps = letterPool.filter(letter => letter !== s1 && letter !== s2 && letter !== ' ')

    const newSwaps: [string, string][] = [...letterSwaps, [s1, s2]]
    updateLetterSwaps(newSwaps)
    updateLetterPool(letterPoolWithoutSwaps)

    // Check if button should be re-enabled after creating new swap
    const currentSwaps = newSwaps.flat()
    const wordsAvailable = checkWordsAvailable(currentSwaps, selectedWords)
    setIsButtonDisabled(!wordsAvailable)
  }

  const nextLeastDifficultWord = (targetDifficulty: number = desiredDifficulty) => {
    const currentWordList = getCurrentWordList()
    const wordDifficulties: Record<string, number> = {}
    const currentSwaps = letterSwaps.flat()
    console.log(currentSwaps)

    currentWordList.forEach((word: string) => {
      wordDifficulties[word.toLowerCase()] = 0
    })

    Object.keys(wordDifficulties).forEach(word => {
      word.split('').forEach(letter => {
        if (currentSwaps.includes(letter)) {
          wordDifficulties[word]++
        }
      })
    })

    // Filter out already selected words and find words with difficulty >= targetDifficulty
    const availableWords = Object.keys(wordDifficulties).filter(
      word => wordDifficulties[word] <= targetDifficulty && !selectedWords.includes(word.toLowerCase())
    )

    if (availableWords.length === 0) {
      setSelectedWord(null)
      setIsButtonDisabled(true)
      return null // No words with difficulty <= targetDifficulty that haven't been selected
    }

    // Return random word from all available words (difficulty <= targetDifficulty)
    const randomIndex = Math.floor(Math.random() * availableWords.length)
    const selectedWordLower = availableWords[randomIndex]

    // Find the original word from wordList to preserve original casing
    const originalWord = currentWordList.find((word: string) => word.toLowerCase() === selectedWordLower) || selectedWordLower

    setSelectedWord(originalWord)
    setSelectedWords([...selectedWords, selectedWordLower])

    // Check if there are still more words available after this selection
    const remainingWords = availableWords.filter(word => word !== selectedWordLower)
    setIsButtonDisabled(remainingWords.length === 0)

    return originalWord
  }

  // Helper function to get difficulty badge classes and styles
  const getDifficultyBadgeStyles = (difficulty: number) => {
    const baseClasses = "px-2 py-0.5 rounded text-sm"

    if (difficulty === 0) {
      return {
        className: `${baseClasses} bg-gray-100 text-gray-500`,
        style: {}
      }
    }

    // Find the maximum difficulty to normalize the color scale
    const maxDifficulty = Math.max(...wordDifficulties.map(item => item.difficulty), 1)

    // Normalize difficulty to a 0-1 scale (1 being the minimum for colored badges)
    const normalizedDifficulty = Math.min((difficulty - 1) / Math.max(maxDifficulty - 1, 1), 1)

    // Interpolate from green (0) to red (1)
    const red = Math.round(normalizedDifficulty * 255)
    const green = Math.round((1 - normalizedDifficulty) * 255)

    // Create lighter background color for better readability
    const bgRed = Math.round(red * 0.3 + 230)
    const bgGreen = Math.round(green * 0.3 + 230)
    const bgBlue = 230

    return {
      className: `${baseClasses} text-black`,
      style: {
        backgroundColor: `rgb(${bgRed}, ${bgGreen}, ${bgBlue})`
      }
    }
  }

  const wordDifficulties = getCurrentWordDifficulties()

  return (
    <div className="flex flex-col  p-4 h-screen">
      {/* New Top Row: Original, Highlighted Swaps, and Fully Swapped Word */}
      <div className="flex gap-4 p-4 border-b-2 border-gray-300 bg-gray-50">
        {/* Left Column: Original Selected Word */}
        <div className="flex-1 text-center">
          <h2>Original Word</h2>
          {selectedWord ? (
            <div className="my-4">
              <p className="text-3xl font-bold text-blue-600 uppercase">
                {selectedWord}
              </p>
              <p className="text-lg text-gray-600 mt-2">
                Difficulty: <span className="font-bold text-blue-600">{getWordDifficulty(selectedWord)}</span>
              </p>
            </div>
          ) : (
            <p className="text-gray-600 italic text-xl my-4">
              No word selected
            </p>
          )}
        </div>

        {/* Middle Column: Word with Highlighted Swapped Letters */}
        <div className="flex-1 text-center">
          <h2>Swapped Letters Highlighted</h2>
          {selectedWord ? (
            <p className="text-3xl font-bold my-4">
              {applyLetterSwapsWithHighlight(selectedWord).map((letterData, index) => (
                <span
                  key={index}
                  className={letterData.isSwapped ? 'text-red-600 bg-yellow-200 px-1 rounded' : 'text-gray-800'}
                >
                  {letterData.letter.toUpperCase()}
                </span>
              ))}
            </p>
          ) : (
            <p className="text-gray-600 italic text-xl my-4">
              No word selected
            </p>
          )}
        </div>

        {/* Right Column: Word with Letter Swaps Applied */}
        <div className="flex-1 text-center">
          <h2>Word with Swaps Applied</h2>
          {selectedWord ? (
            <p className="text-3xl font-bold text-red-600 my-4">
              {applyLetterSwaps(selectedWord).toUpperCase()}
            </p>
          ) : (
            <p className="text-gray-600 italic text-xl my-4">
              No word selected
            </p>
          )}
        </div>
      </div>

      {/* Letter Swaps Row */}
      <div className="p-4 border-b border-gray-300 bg-gray-50">
        <h3 className="text-lg font-bold mb-2 text-center">Current Letter Swaps</h3>
        <p className="text-center text-3xl">
          {letterSwaps.length > 0
            ? letterSwaps.map(([s1, s2]) => `${s1.toUpperCase()} ↔ ${s2.toUpperCase()}`).join(', ')
            : 'No swaps created yet'
          }
        </p>
      </div>

      {/* Existing Main Content Row */}
      <div className="flex gap-8 flex-1 pt-4">
        {/* Column 1: Previously Selected Words */}
        <div className="flex-1 border-r border-gray-300 pr-4">
          <h2 className="pb-4">Previously Selected Words</h2>
          {selectedWords.length > 0 ? (
            <div className="max-h-screen overflow-y-auto">
              {selectedWords.map((word, index) => (
                <div key={index} className="py-1 border-b border-gray-200">
                  {word}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-600 italic">No words selected yet</p>
          )}
        </div>

        {/* Column 2: Current Word Difficulty Scores */}
        <div className="flex-1 border-r border-gray-300 pr-4">
          <h2 className="pb-4">Available Words & Difficulty Scores</h2>
          {wordDifficulties.length > 0 ? (
            <div className="max-h-[600px] overflow-y-auto">
              {wordDifficulties.map(({ word, difficulty }, index) => (
                <div key={index} className="py-1 border-b border-gray-200 flex justify-between items-center">
                  <span>{word}</span>
                  <span
                    className={getDifficultyBadgeStyles(difficulty).className}
                    style={getDifficultyBadgeStyles(difficulty).style}
                  >
                    {difficulty}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-600 italic">
              No words available (all words have been selected)
            </p>
          )}
        </div>

        {/* Column 3: Current UI */}
        <div className="flex-1 pl-4">
          <h2>Game Controls</h2>

          <div className="mb-4">
            <h3>Available Letters</h3>
            <p className="text-xl font-bold">
              {letterPool.map(letter => letter.toUpperCase()).join(', ')}
            </p>
          </div>


          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-3">
              <label className="text-sm font-bold">Word List Difficulty</label>
              <div className="flex gap-2">
                {(['easy', 'medium', 'hard'] as DifficultyLevel[]).map((level) => (
                  <Button
                    key={level}
                    variant={difficultyLevel === level ? "default" : "outline"}
                    onClick={() => setDifficultyLevel(level)}
                    className="capitalize"
                  >
                    {level}
                  </Button>
                ))}
              </div>
            </div>

            <Button onClick={createSwap} disabled={letterPool.length < 2}>
              Create Letter Swap
            </Button>

            <div className="flex flex-col gap-3">
              <label htmlFor="difficulty-slider" className="text-sm font-bold">
                Desired Difficulty: {desiredDifficulty}
              </label>
              <Slider
                id="difficulty-slider"
                min={1}
                max={15}
                step={1}
                value={[desiredDifficulty]}
                onValueChange={(value) => {setDesiredDifficulty(value[0]); setIsButtonDisabled(false)}}
              className="w-full"
              />
              <div className="flex justify-between text-xs text-gray-500">
                <span>1 (Easy)</span>
                <span>15 (Hard)</span>
              </div>
            </div>

            <Button onClick={() => nextLeastDifficultWord(desiredDifficulty)} disabled={isButtonDisabled}>
              Choose Next Word (Difficulty ≤ {desiredDifficulty})
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default App

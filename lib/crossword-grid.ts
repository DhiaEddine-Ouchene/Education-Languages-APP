type CrosswordEntry = { word: string; clue: string };
export type PlacedWord = { word: string; clue: string; direction: "across" | "down"; row: number; col: number };
export type CrosswordGrid = { gridSize: number; words: PlacedWord[] };

// A simple deterministic crossword placement algorithm
export function buildCrosswordGrid(entries: CrosswordEntry[], maxGridSize: number = 15): CrosswordGrid {
  if (!entries || entries.length === 0) return { gridSize: maxGridSize, words: [] };

  // Sort by length descending to place longest words first
  const sorted = [...entries].sort((a, b) => b.word.length - a.word.length);
  const placedWords: PlacedWord[] = [];
  
  // A simple representation of the grid to check for collisions
  // grid[row][col] = letter (if occupied)
  const grid: Record<string, string> = {};

  const getCell = (r: number, c: number) => grid[`${r},${c}`];
  const setCell = (r: number, c: number, char: string) => { grid[`${r},${c}`] = char; };

  function canPlace(word: string, r: number, c: number, dir: "across" | "down"): boolean {
    if (dir === "across") {
      if (c < 0 || c + word.length > maxGridSize) return false;
      if (r < 0 || r >= maxGridSize) return false;
      
      // Check word cells and adjacent cells
      for (let i = 0; i < word.length; i++) {
        const char = word[i];
        const existing = getCell(r, c + i);
        if (existing && existing !== char) return false; // Collision
        
        // Ensure no adjacent letters to the sides unless they are the intersection
        if (!existing) {
            if (getCell(r - 1, c + i) || getCell(r + 1, c + i)) return false;
        }
      }
      
      // Ensure no adjacent letters at start and end
      if (getCell(r, c - 1) || getCell(r, c + word.length)) return false;

    } else {
      if (r < 0 || r + word.length > maxGridSize) return false;
      if (c < 0 || c >= maxGridSize) return false;
      
      for (let i = 0; i < word.length; i++) {
        const char = word[i];
        const existing = getCell(r + i, c);
        if (existing && existing !== char) return false;
        
        if (!existing) {
             if (getCell(r + i, c - 1) || getCell(r + i, c + 1)) return false;
        }
      }
      
      if (getCell(r - 1, c) || getCell(r + word.length, c)) return false;
    }
    return true;
  }

  function placeWord(wordEntry: CrosswordEntry, r: number, c: number, dir: "across" | "down") {
    const wordStr = wordEntry.word.toUpperCase();
    for (let i = 0; i < wordStr.length; i++) {
      if (dir === "across") setCell(r, c + i, wordStr[i]);
      else setCell(r + i, c, wordStr[i]);
    }
    placedWords.push({ word: wordStr, clue: wordEntry.clue, direction: dir, row: r, col: c });
  }

  // Place first word roughly in the center
  const firstWord = sorted[0];
  const firstR = Math.floor(maxGridSize / 2);
  const firstC = Math.floor((maxGridSize - firstWord.word.length) / 2);
  placeWord(firstWord, firstR, firstC, "across");

  // Place remaining words
  for (let i = 1; i < sorted.length; i++) {
    const entry = sorted[i];
    const wordStr = entry.word.toUpperCase();
    let placed = false;

    // Iterate through all already placed words to find intersection
    for (const pw of placedWords) {
      if (placed) break;
      
      const newDir = pw.direction === "across" ? "down" : "across";

      for (let j = 0; j < wordStr.length; j++) {
        if (placed) break;
        const char = wordStr[j];
        
        for (let k = 0; k < pw.word.length; k++) {
           if (pw.word[k] === char) {
             // Found an intersection point!
             let r = pw.row;
             let c = pw.col;
             
             if (pw.direction === "across") {
                 c += k; // column of the intersection
                 r -= j; // row where the new down word should start
             } else {
                 r += k; // row of the intersection
                 c -= j; // col where the new across word should start
             }
             
             if (canPlace(wordStr, r, c, newDir)) {
                 placeWord(entry, r, c, newDir);
                 placed = true;
                 break;
             }
           }
        }
      }
    }
    
    // If we couldn't intersect it, we could try to place it randomly, but for crosswords we usually just skip it or log it
    if (!placed) {
        console.warn(`Could not place word in crossword: ${wordStr}`);
    }
  }

  // Find tight bounding box
  let minR = maxGridSize, maxR = -1;
  let minC = maxGridSize, maxC = -1;
  
  for (const pw of placedWords) {
      if (pw.direction === "across") {
          minR = Math.min(minR, pw.row);
          maxR = Math.max(maxR, pw.row);
          minC = Math.min(minC, pw.col);
          maxC = Math.max(maxC, pw.col + pw.word.length - 1);
      } else {
          minR = Math.min(minR, pw.row);
          maxR = Math.max(maxR, pw.row + pw.word.length - 1);
          minC = Math.min(minC, pw.col);
          maxC = Math.max(maxC, pw.col);
      }
  }
  
  // Shift words to top-left (0,0)
  const shiftR = minR;
  const shiftC = minC;
  
  for (const pw of placedWords) {
      pw.row -= shiftR;
      pw.col -= shiftC;
  }
  
  const finalRows = maxR - minR + 1;
  const finalCols = maxC - minC + 1;
  const finalGridSize = Math.max(finalRows, finalCols, 8); // At least 8x8
  
  return {
    gridSize: finalGridSize,
    words: placedWords
  };
}

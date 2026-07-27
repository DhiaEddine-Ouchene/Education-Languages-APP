"use client";

import { cn } from "@/lib/utils";

type Props = {
  type: string;
  title: string;
  className?: string;
};

// ── Full mobile-app screenshot SVGs ──
// Each renders a realistic game screen as seen on a phone/tablet,
// with status bar, app header, full game content, and nav controls

const APP_BG = "#f5f6fa";
const CARD_BG = "#ffffff";
const DIVIDER = "#edeff5";
const ACCENT = "#7F77DD";
const ACCENT_LIGHT = "#EEEDFE";
const TEXT_PRI = "#1A1A2E";
const TEXT_SEC = "#8b8fa3";
const SUCCESS = "#1D9E75";
const SUCCESS_LIGHT = "#D1FAE5";
const WARNING = "#F59E0B";
const DANGER = "#EF4444";

function s(tag: string, attrs: string, content = ""): string {
  return `<${tag} ${attrs}>${content}</${tag}>`;
}
function r(attrs: string) { return s("rect", attrs); }
function t(attrs: string, content: string) { return s("text", attrs, content); }
function c(x: number, y: number, r: number, fill: string) { return s("circle", `cx="${x}" cy="${y}" r="${r}" fill="${fill}"`); }

function statusBar(isDark = false): string {
  const fg = isDark ? "white" : TEXT_SEC;
  return `
    ${r(`x="0" y="0" width="600" height="32" fill="${isDark ? '#1a1a2e' : '#ffffff'}"`)}
    ${t(`x="24" y="22" font-family="Arial" font-size="11" font-weight="bold" fill="${fg}"`, "9:41")}
    ${r(`x="540" y="10" width="18" height="10" rx="2" stroke="${fg}" stroke-width="1" fill="none"`)}
    ${r(`x="542" y="12" width="14" height="6" rx="1" fill="${fg}" opacity="0.4"`)}
    ${t(`x="568" y="21" font-family="Arial" font-size="10" fill="${fg}"`, "🔋")}
  `;
}

function appHeader(title: string, back = true): string {
  return `
    ${r(`x="0" y="32" width="600" height="48" fill="#ffffff"`)}
    ${r(`x="0" y="79" width="600" height="1" fill="${DIVIDER}"`)}
    ${back ? t(`x="20" y="64" font-family="Arial" font-size="20" fill="${TEXT_PRI}"`, "←") : ""}
    ${t(`x="${back ? 50 : 30}" y="64" font-family="Arial" font-size="15" font-weight="bold" fill="${TEXT_PRI}"`, title)}
    ${t(`x="560" y="64" font-family="Arial" font-size="10" fill="${TEXT_SEC}"`, "⋮")}
  `;
}

function bottomBar(): string {
  return `
    ${r(`x="0" y="560" width="600" height="40" fill="#ffffff"`)}
    ${r(`x="0" y="559" width="600" height="1" fill="${DIVIDER}"`)}
    ${t(`x="100" y="584" text-anchor="middle" font-family="Arial" font-size="10" fill="${TEXT_SEC}"`, "◀ Prev")}
    ${t(`x="300" y="584" text-anchor="middle" font-family="Arial" font-size="10" fill="${TEXT_SEC}"`, "● ● ● ○ ○")}
    ${t(`x="500" y="584" text-anchor="middle" font-family="Arial" font-size="10" fill="${TEXT_SEC}"`, "Next ▶")}
  `;
}

function primaryBtn(x: number, y: number, w: number, h: number, label: string): string {
  return `
    ${r(`x="${x}" y="${y}" width="${w}" height="${h}" rx="${h/2}" fill="${ACCENT}"`)}
    ${t(`x="${x + w/2}" y="${y + h/2 + 4}" text-anchor="middle" font-family="Arial" font-size="13" font-weight="bold" fill="white"`, label)}
  `;
}

function optionCard(x: number, y: number, w: number, h: number, label: string, sub: string, selected = false): string {
  const bg = selected ? ACCENT_LIGHT : CARD_BG;
  const stroke = selected ? ACCENT : DIVIDER;
  const fg = selected ? ACCENT : TEXT_PRI;
  const sg = selected ? ACCENT : TEXT_SEC;
  return `
    ${r(`x="${x}" y="${y}" width="${w}" height="${h}" rx="10" fill="${bg}" stroke="${stroke}" stroke-width="${selected ? 2 : 1}"`)}
    ${t(`x="${x + 14}" y="${y + h/2 - 4}" font-family="Arial" font-size="13" fill="${fg}"${selected ? ' font-weight="bold"' : ''}`, label)}
    ${sub ? t(`x="${x + 14}" y="${y + h/2 + 14}" font-family="Arial" font-size="10" fill="${sg}"`, sub) : ""}
  `;
}

function renderScreenshot(type: string, title: string = "Game"): string {
  const G = `${ACCENT_LIGHT}`;

  switch (type) {
    // ============ FLASHCARD ============
    case "FLASHCARD":
    case "FLASHCARD_3D":
      return `<svg viewBox="0 0 600 600" xmlns="http://www.w3.org/2000/svg">
        ${r(`x="0" y="0" width="600" height="600" fill="${APP_BG}"`)}
        ${statusBar()}${appHeader("Flashcard")}
        ${t(`x="300" y="120" text-anchor="middle" font-family="Arial" font-size="13" font-weight="bold" fill="${TEXT_PRI}"`, "Tap the card to reveal the translation")}
        ${t(`x="300" y="140" text-anchor="middle" font-family="Arial" font-size="11" fill="${TEXT_SEC}"`, "1 of 8")}
        ${r(`x="80" y="170" width="440" height="310" rx="24" fill="${CARD_BG}" stroke="${ACCENT}" stroke-width="2.5"`)}
        ${t(`x="300" y="280" text-anchor="middle" font-family="Arial" font-size="36" font-weight="bold" fill="${TEXT_PRI}"`, "apple")}
        ${t(`x="300" y="315" text-anchor="middle" font-family="Arial" font-size="13" fill="${TEXT_SEC}"`, "A red or green fruit")}
        ${r(`x="250" y="360" width="100" height="3" rx="1.5" fill="${ACCENT}"`)}
        ${r(`x="270" y="400" width="60" height="60" rx="30" fill="${SUCCESS_LIGHT}"`)}
        ${t(`x="300" y="436" text-anchor="middle" font-family="Arial" font-size="24" fill="${SUCCESS}"`, "✓")}
        ${bottomBar()}
      </svg>`;

    // ============ QUIZ ============
    case "QUIZ":
    case "MULTIPLE_CHOICE_GRAMMAR":
    case "ERROR_SPOTTING":
    case "WORD_IN_CONTEXT":
      return `<svg viewBox="0 0 600 600" xmlns="http://www.w3.org/2000/svg">
        ${r(`x="0" y="0" width="600" height="600" fill="${APP_BG}"`)}
        ${statusBar()}${appHeader("Multiple Choice")}
        ${r(`x="460" y="48" width="120" height="6" rx="3" fill="${DIVIDER}"`)}
        ${r(`x="460" y="48" width="72" height="6" rx="3" fill="${ACCENT}"`)}
        ${t(`x="530" y="60" text-anchor="middle" font-family="Arial" font-size="9" fill="${TEXT_SEC}"`, "2/5")}
        ${t(`x="300" y="120" text-anchor="middle" font-family="Arial" font-size="14" font-weight="bold" fill="${TEXT_PRI}"`, "What does the word \"apple\" mean?")}
        ${t(`x="300" y="142" text-anchor="middle" font-family="Arial" font-size="11" fill="${TEXT_SEC}"`, "Choose the correct answer below")}
        ${optionCard(40, 170, 240, 70, "A) A type of fruit", "A red or green fruit that grows on trees")}
        ${optionCard(320, 170, 240, 70, "B) تفاحة ✓", "The Arabic word for apple", true)}
        ${optionCard(40, 255, 240, 70, "C) A type of vehicle", "Used for transportation")}
        ${optionCard(320, 255, 240, 70, "D) A kitchen tool", "Used for cooking")}
        ${primaryBtn(200, 370, 200, 44, "Submit Answer")}
        ${bottomBar()}
      </svg>`;

    // ============ FILL THE GAP ============
    case "FILL_BLANK":
    case "FILL_GAP_WORD":
    case "FILL_BLANK_GRAMMAR":
      return `<svg viewBox="0 0 600 600" xmlns="http://www.w3.org/2000/svg">
        ${r(`x="0" y="0" width="600" height="600" fill="${APP_BG}"`)}
        ${statusBar()}${appHeader("Fill the Gap")}
        ${t(`x="300" y="120" text-anchor="middle" font-family="Arial" font-size="14" font-weight="bold" fill="${TEXT_PRI}"`, "Complete the sentence below")}
        ${r(`x="40" y="150" width="520" height="70" rx="14" fill="${CARD_BG}" stroke="${DIVIDER}" stroke-width="1.5"`)}
        ${t(`x="70" y="193" font-family="Arial" font-size="18" fill="${TEXT_PRI}"`, "I eat an")}
        ${r(`x="155" y="170" width="90" height="32" rx="8" fill="${ACCENT_LIGHT}" stroke="${ACCENT}" stroke-width="2" stroke-dasharray="4,2"`)}
        ${t(`x="200" y="191" text-anchor="middle" font-family="Arial" font-size="14" font-weight="bold" fill="${ACCENT}"`, "_____")}
        ${t(`x="270" y="193" font-family="Arial" font-size="18" fill="${TEXT_PRI}"`, "every morning.")}
        ${t(`x="300" y="260" text-anchor="middle" font-family="Arial" font-size="11" fill="${TEXT_SEC}"`, "Choose the correct word to fill the gap:")}
        ${optionCard(80, 285, 200, 52, "🍎  Apple", "")}
        ${optionCard(320, 285, 200, 52, "📚  Book", "")}
        ${optionCard(80, 350, 200, 52, "🚗  Car", "")}
        ${optionCard(320, 350, 200, 52, "🐱  Cat", "")}
        ${primaryBtn(200, 430, 200, 44, "Check Answer")}
        ${bottomBar()}
      </svg>`;

    // ============ SENTENCE BUILDER ============
    case "SENTENCE_BUILDER":
      return `<svg viewBox="0 0 600 600" xmlns="http://www.w3.org/2000/svg">
        ${r(`x="0" y="0" width="600" height="600" fill="${APP_BG}"`)}
        ${statusBar()}${appHeader("Sentence Builder")}
        ${t(`x="300" y="120" text-anchor="middle" font-family="Arial" font-size="14" font-weight="bold" fill="${TEXT_PRI}"`, "Arrange the words in the correct order")}
        ${r(`x="40" y="150" width="520" height="80" rx="14" fill="${CARD_BG}" stroke="${ACCENT}" stroke-width="2" stroke-dasharray="6,4"`)}
        ${t(`x="300" y="195" text-anchor="middle" font-family="Arial" font-size="12" fill="${ACCENT}"`, "⬇ Drop the words here to form a sentence")}
        ${r(`x="40" y="260" width="520" height="120" rx="14" fill="${CARD_BG}" stroke="${DIVIDER}" stroke-width="1.5"`)}
        <g transform="translate(60, 280)">
          <rect x="0" y="0" width="64" height="36" rx="8" fill="${ACCENT_LIGHT}" stroke="${ACCENT}" stroke-width="1.5"/>
          <text x="32" y="24" text-anchor="middle" font-family="Arial" font-size="13" font-weight="bold" fill="${ACCENT}">I</text>
        </g>
        <g transform="translate(134, 280)">
          <rect x="0" y="0" width="64" height="36" rx="8" fill="${ACCENT_LIGHT}" stroke="${ACCENT}" stroke-width="1.5"/>
          <text x="32" y="24" text-anchor="middle" font-family="Arial" font-size="13" font-weight="bold" fill="${ACCENT}">go</text>
        </g>
        <g transform="translate(208, 280)">
          <rect x="0" y="0" width="64" height="36" rx="8" fill="${ACCENT_LIGHT}" stroke="${ACCENT}" stroke-width="1.5"/>
          <text x="32" y="24" text-anchor="middle" font-family="Arial" font-size="13" font-weight="bold" fill="${ACCENT}">to</text>
        </g>
        <g transform="translate(282, 280)">
          <rect x="0" y="0" width="72" height="36" rx="8" fill="${ACCENT_LIGHT}" stroke="${ACCENT}" stroke-width="1.5"/>
          <text x="36" y="24" text-anchor="middle" font-family="Arial" font-size="13" font-weight="bold" fill="${ACCENT}">school</text>
        </g>
        <g transform="translate(364, 280)">
          <rect x="0" y="0" width="64" height="36" rx="8" fill="${ACCENT_LIGHT}" stroke="${ACCENT}" stroke-width="1.5"/>
          <text x="32" y="24" text-anchor="middle" font-family="Arial" font-size="13" font-weight="bold" fill="${ACCENT}">every</text>
        </g>
        <g transform="translate(438, 280)">
          <rect x="0" y="0" width="64" height="36" rx="8" fill="${ACCENT_LIGHT}" stroke="${ACCENT}" stroke-width="1.5"/>
          <text x="32" y="24" text-anchor="middle" font-family="Arial" font-size="13" font-weight="bold" fill="${ACCENT}">day</text>
        </g>
        ${t(`x="70" y="440" font-family="Arial" font-size="11" fill="${TEXT_SEC}"`, "💡 A sentence about going to school every day")}
        ${primaryBtn(200, 480, 200, 44, "✓ Check Sentence")}
        ${bottomBar()}
      </svg>`;

    // ============ WORD SCRAMBLE ============
    case "WORD_SCRAMBLE":
      return `<svg viewBox="0 0 600 600" xmlns="http://www.w3.org/2000/svg">
        ${r(`x="0" y="0" width="600" height="600" fill="${APP_BG}"`)}
        ${statusBar()}${appHeader("Word Scramble")}
        ${t(`x="300" y="120" text-anchor="middle" font-family="Arial" font-size="14" font-weight="bold" fill="${TEXT_PRI}"`, "Unscramble the letters to form a word")}
        ${t(`x="300" y="145" text-anchor="middle" font-family="Arial" font-size="12" fill="${TEXT_SEC}"`, "🍎 A red or green fruit")}
        ${r(`x="40" y="180" width="520" height="65" rx="14" fill="${CARD_BG}" stroke="${DIVIDER}" stroke-width="1.5"`)}
        <g transform="translate(85, 195)">
          <rect x="0" y="0" width="56" height="36" rx="8" fill="${CARD_BG}" stroke="${ACCENT}" stroke-width="2"/>
          <text x="28" y="24" text-anchor="middle" font-family="Arial" font-size="16" font-weight="bold" fill="${ACCENT}">P</text>
        </g>
        <g transform="translate(150, 195)">
          <rect x="0" y="0" width="56" height="36" rx="8" fill="${CARD_BG}" stroke="${ACCENT}" stroke-width="2"/>
          <text x="28" y="24" text-anchor="middle" font-family="Arial" font-size="16" font-weight="bold" fill="${ACCENT}">L</text>
        </g>
        <g transform="translate(215, 195)">
          <rect x="0" y="0" width="56" height="36" rx="8" fill="${CARD_BG}" stroke="${ACCENT}" stroke-width="2"/>
          <text x="28" y="24" text-anchor="middle" font-family="Arial" font-size="16" font-weight="bold" fill="${ACCENT}">E</text>
        </g>
        <g transform="translate(280, 195)">
          <rect x="0" y="0" width="56" height="36" rx="8" fill="${CARD_BG}" stroke="${ACCENT}" stroke-width="2"/>
          <text x="28" y="24" text-anchor="middle" font-family="Arial" font-size="16" font-weight="bold" fill="${ACCENT}">A</text>
        </g>
        <g transform="translate(345, 195)">
          <rect x="0" y="0" width="56" height="36" rx="8" fill="${CARD_BG}" stroke="${ACCENT}" stroke-width="2"/>
          <text x="28" y="24" text-anchor="middle" font-family="Arial" font-size="16" font-weight="bold" fill="${ACCENT}">P</text>
        </g>
        <g transform="translate(410, 195)">
          <rect x="0" y="0" width="56" height="36" rx="8" fill="${CARD_BG}" stroke="${ACCENT}" stroke-width="2"/>
          <text x="28" y="24" text-anchor="middle" font-family="Arial" font-size="16" font-weight="bold" fill="${ACCENT}">🔊</text>
        </g>
        ${t(`x="300" y="310" text-anchor="middle" font-family="Arial" font-size="12" fill="${TEXT_SEC}"`, "⬇ Drag the letters into the correct order")}
        ${r(`x="40" y="340" width="520" height="65" rx="14" fill="${ACCENT_LIGHT}" stroke="${ACCENT}" stroke-width="2" stroke-dasharray="4,3"`)}
        ${t(`x="300" y="380" text-anchor="middle" font-family="Arial" font-size="12" fill="${ACCENT}"`, "Drop letters here")}
        ${primaryBtn(200, 450, 200, 44, "Check")}
        ${bottomBar()}
      </svg>`;

    // ============ MEMORY ============
    case "MEMORY":
      return `<svg viewBox="0 0 600 600" xmlns="http://www.w3.org/2000/svg">
        ${r(`x="0" y="0" width="600" height="600" fill="${APP_BG}"`)}
        ${statusBar()}${appHeader("Memory Match")}
        ${t(`x="300" y="115" text-anchor="middle" font-family="Arial" font-size="13" fill="${TEXT_SEC}"`, "Moves: 6  •  Matches: 0  •  Pairs: 4")}
        <g transform="translate(40, 145)">${r(`x="0" y="0" width="120" height="100" rx="14" fill="${ACCENT}" opacity="0.85"`)}${t(`x="60" y="62" text-anchor="middle" font-family="Arial" font-size="32" fill="white"`, "🍎")}</g>
        <g transform="translate(175, 145)">${r(`x="0" y="0" width="120" height="100" rx="14" fill="${ACCENT}" opacity="0.85"`)}${t(`x="60" y="62" text-anchor="middle" font-family="Arial" font-size="32" fill="white"`, "📖")}</g>
        <g transform="translate(310, 145)">${r(`x="0" y="0" width="120" height="100" rx="14" fill="#e5e7eb"`)}${t(`x="60" y="62" text-anchor="middle" font-family="Arial" font-size="28" fill="#ccc"`, "?")}</g>
        <g transform="translate(445, 145)">${r(`x="0" y="0" width="120" height="100" rx="14" fill="#e5e7eb"`)}${t(`x="60" y="62" text-anchor="middle" font-family="Arial" font-size="28" fill="#ccc"`, "?")}</g>
        <g transform="translate(40, 260)">${r(`x="0" y="0" width="120" height="100" rx="14" fill="#e5e7eb"`)}${t(`x="60" y="62" text-anchor="middle" font-family="Arial" font-size="28" fill="#ccc"`, "?")}</g>
        <g transform="translate(175, 260)">${r(`x="0" y="0" width="120" height="100" rx="14" fill="#e5e7eb"`)}${t(`x="60" y="62" text-anchor="middle" font-family="Arial" font-size="28" fill="#ccc"`, "?")}</g>
        <g transform="translate(310, 260)">${r(`x="0" y="0" width="120" height="100" rx="14" fill="${ACCENT}" opacity="0.85"`)}${t(`x="60" y="62" text-anchor="middle" font-family="Arial" font-size="32" fill="white"`, "🍎")}</g>
        <g transform="translate(445, 260)">${r(`x="0" y="0" width="120" height="100" rx="14" fill="#e5e7eb"`)}${t(`x="60" y="62" text-anchor="middle" font-family="Arial" font-size="28" fill="#ccc"`, "?")}</g>
        ${t(`x="300" y="420" text-anchor="middle" font-family="Arial" font-size="12" fill="${TEXT_SEC}"`, "⏱ Time: 1:23")}
      </svg>`;

    // ============ DICTATION / LISTEN ============
    case "DICTATION":
    case "LISTEN_FILL_WORD":
    case "LISTEN_FILL_SENTENCE":
      return `<svg viewBox="0 0 600 600" xmlns="http://www.w3.org/2000/svg">
        ${r(`x="0" y="0" width="600" height="600" fill="${APP_BG}"`)}
        ${statusBar()}${appHeader("Listen and Type")}
        ${t(`x="300" y="115" text-anchor="middle" font-family="Arial" font-size="14" font-weight="bold" fill="${TEXT_PRI}"`, "Listen to the audio and type what you hear")}
        ${t(`x="300" y="135" text-anchor="middle" font-family="Arial" font-size="11" fill="${TEXT_SEC}"`, "1 of 6")}
        <g transform="translate(250, 175)">
          <circle cx="50" cy="50" r="45" fill="${CARD_BG}" stroke="${ACCENT}" stroke-width="2.5"/>
          <polygon points="36,22 36,78 78,50" fill="${ACCENT}"/>
        </g>
        ${r(`x="40" y="260" width="520" height="30" rx="4" fill="${ACCENT}" opacity="0.08"`)}
        ${r(`x="40" y="260" width="350" height="30" rx="4" fill="${ACCENT}" opacity="0.2"`)}
        ${r(`x="40" y="295" width="520" height="8" rx="4" fill="${DIVIDER}"`)}
        ${r(`x="40" y="295" width="310" height="8" rx="4" fill="${ACCENT}" opacity="0.4"`)}
        ${r(`x="40" y="325" width="520" height="60" rx="14" fill="${CARD_BG}" stroke="${DIVIDER}" stroke-width="1.5"`)}
        ${t(`x="60" y="362" font-family="Arial" font-size="14" fill="${TEXT_PRI}"`, "The weather is beautiful today")}
        <rect x="60" y="315" width="2" height="20" fill="${ACCENT}"/>
        ${primaryBtn(200, 420, 200, 44, "Submit")}
        ${bottomBar()}
      </svg>`;

    // ============ ODD ONE OUT ============
    case "ODD_ONE_OUT":
      return `<svg viewBox="0 0 600 600" xmlns="http://www.w3.org/2000/svg">
        ${r(`x="0" y="0" width="600" height="600" fill="${APP_BG}"`)}
        ${statusBar()}${appHeader("Odd One Out")}
        ${t(`x="300" y="115" text-anchor="middle" font-family="Arial" font-size="14" font-weight="bold" fill="${TEXT_PRI}"`, "Which word doesn't belong?")}
        ${t(`x="300" y="135" text-anchor="middle" font-family="Arial" font-size="11" fill="${TEXT_SEC}"`, "Find the word that doesn't fit with the others")}
        <g transform="translate(40, 170)">${r(`x="0" y="0" width="240" height="100" rx="14" fill="${CARD_BG}" stroke="${DIVIDER}" stroke-width="1.5"`)}${t(`x="120" y="40" text-anchor="middle" font-family="Arial" font-size="32"`, "🍎")}${t(`x="120" y="75" text-anchor="middle" font-family="Arial" font-size="14" fill="${TEXT_PRI}"`, "Apple")}</g>
        <g transform="translate(320, 170)">${r(`x="0" y="0" width="240" height="100" rx="14" fill="${CARD_BG}" stroke="${DIVIDER}" stroke-width="1.5"`)}${t(`x="120" y="40" text-anchor="middle" font-family="Arial" font-size="32"`, "🍌")}${t(`x="120" y="75" text-anchor="middle" font-family="Arial" font-size="14" fill="${TEXT_PRI}"`, "Banana")}</g>
        <g transform="translate(40, 285)">${r(`x="0" y="0" width="240" height="100" rx="14" fill="${CARD_BG}" stroke="${DIVIDER}" stroke-width="1.5"`)}${t(`x="120" y="40" text-anchor="middle" font-family="Arial" font-size="32"`, "🥕")}${t(`x="120" y="75" text-anchor="middle" font-family="Arial" font-size="14" fill="${TEXT_PRI}"`, "Carrot")}</g>
        <g transform="translate(320, 285)">${r(`x="0" y="0" width="240" height="100" rx="14" fill="#FEE2E2" stroke="#FCA5A5" stroke-width="2"`)}${t(`x="120" y="40" text-anchor="middle" font-family="Arial" font-size="32"`, "🍇")}${t(`x="120" y="75" text-anchor="middle" font-family="Arial" font-size="14" fill="#DC2626" font-weight="bold"`, "Grape ✗")}</g>
        ${t(`x="300" y="435" text-anchor="middle" font-family="Arial" font-size="11" fill="${TEXT_SEC}"`, "💡 Three are fruits, one is a vegetable")}
        ${primaryBtn(200, 475, 200, 44, "Submit")}
        ${bottomBar()}
      </svg>`;

    // ============ CROSSWORD ============
    case "CROSSWORD":
      return `<svg viewBox="0 0 600 600" xmlns="http://www.w3.org/2000/svg">
        ${r(`x="0" y="0" width="600" height="600" fill="${APP_BG}"`)}
        ${statusBar()}${appHeader("Crossword")}
        ${t(`x="300" y="115" text-anchor="middle" font-family="Arial" font-size="14" font-weight="bold" fill="${TEXT_PRI}"`, "Vocabulary Crossword — 4 words")}
        ${r(`x="30" y="140" width="340" height="280" rx="12" fill="${CARD_BG}" stroke="${DIVIDER}" stroke-width="1"`)}
        ${r(`x="30" y="140" width="60" height="40" rx="0" fill="${ACCENT_LIGHT}"`)}${t(`x="60" y="166" text-anchor="middle" font-family="Arial" font-size="15" font-weight="bold" fill="${ACCENT}"`, "A")}
        ${r(`x="90" y="140" width="60" height="40" rx="0" fill="${ACCENT_LIGHT}"`)}${t(`x="120" y="166" text-anchor="middle" font-family="Arial" font-size="15" font-weight="bold" fill="${ACCENT}"`, "P")}
        ${r(`x="150" y="140" width="60" height="40" rx="0" fill="${ACCENT_LIGHT}"`)}${t(`x="180" y="166" text-anchor="middle" font-family="Arial" font-size="15" font-weight="bold" fill="${ACCENT}"`, "P")}
        ${r(`x="210" y="140" width="60" height="40" rx="0" fill="${ACCENT_LIGHT}"`)}${t(`x="240" y="166" text-anchor="middle" font-family="Arial" font-size="15" font-weight="bold" fill="${ACCENT}"`, "L")}
        ${r(`x="270" y="140" width="60" height="40" rx="0" fill="${ACCENT_LIGHT}"`)}${t(`x="300" y="166" text-anchor="middle" font-family="Arial" font-size="15" font-weight="bold" fill="${ACCENT}"`, "E")}
        ${r(`x="90" y="180" width="60" height="40" rx="0" fill="${CARD_BG}" stroke="${DIVIDER}" stroke-width="0.5"`)}${t(`x="120" y="206" text-anchor="middle" font-family="Arial" font-size="14" fill="${TEXT_PRI}"`, "B")}
        ${r(`x="90" y="220" width="60" height="40" rx="0" fill="${CARD_BG}" stroke="${DIVIDER}" stroke-width="0.5"`)}${t(`x="120" y="246" text-anchor="middle" font-family="Arial" font-size="14" fill="${TEXT_PRI}"`, "O")}
        ${r(`x="90" y="260" width="60" height="40" rx="0" fill="${CARD_BG}" stroke="${DIVIDER}" stroke-width="0.5"`)}${t(`x="120" y="286" text-anchor="middle" font-family="Arial" font-size="14" fill="${TEXT_PRI}"`, "O")}
        ${r(`x="90" y="300" width="60" height="40" rx="0" fill="${CARD_BG}" stroke="${DIVIDER}" stroke-width="0.5"`)}${t(`x="120" y="326" text-anchor="middle" font-family="Arial" font-size="14" fill="${TEXT_PRI}"`, "K")}
        ${t(`x="420" y="165" font-family="Arial" font-size="12" font-weight="bold" fill="${TEXT_PRI}"`, "Across")}
        ${r(`x="420" y="178" width="150" height="26" rx="6" fill="${ACCENT_LIGHT}"`)}${t(`x="430" y="195" font-family="Arial" font-size="10" fill="${ACCENT}"`, "1. A red fruit (5)")}
        ${r(`x="420" y="210" width="150" height="26" rx="6" fill="${ACCENT_LIGHT}"`)}${t(`x="430" y="227" font-family="Arial" font-size="10" fill="${ACCENT}"`, "3. A pet that barks (3)")}
        ${t(`x="420" y="268" font-family="Arial" font-size="12" font-weight="bold" fill="${TEXT_PRI}"`, "Down")}
        ${r(`x="420" y="281" width="150" height="26" rx="6" fill="${ACCENT_LIGHT}"`)}${t(`x="430" y="298" font-family="Arial" font-size="10" fill="${ACCENT}"`, "2. A reading material (4)")}
        ${primaryBtn(200, 460, 200, 44, "Check")}
        ${bottomBar()}
      </svg>`;

    // ============ SYNONYM/MATCHING ============
    case "SYNONYM_ANTONYM":
    case "WORD_MEANING_MATCH":
    case "COLLOCATION_BUILDER":
    case "DRAG_DROP":
      return `<svg viewBox="0 0 600 600" xmlns="http://www.w3.org/2000/svg">
        ${r(`x="0" y="0" width="600" height="600" fill="${APP_BG}"`)}
        ${statusBar()}${appHeader("Matching Game")}
        ${t(`x="300" y="115" text-anchor="middle" font-family="Arial" font-size="14" font-weight="bold" fill="${TEXT_PRI}"`, "Match the items from both columns")}
        ${t(`x="300" y="135" text-anchor="middle" font-family="Arial" font-size="11" fill="${TEXT_SEC}"`, "Tap one item from each side to create a match")}
        <g transform="translate(40, 170)">
          <rect x="0" y="0" width="220" height="52" rx="12" fill="${ACCENT_LIGHT}" stroke="${ACCENT}" stroke-width="1.5"/>
          <text x="110" y="32" text-anchor="middle" font-family="Arial" font-size="14" font-weight="bold" fill="${ACCENT}">Happy</text>
          <text x="200" y="32" text-anchor="middle" font-family="Arial" font-size="12" fill="${ACCENT}">←</text>
        </g>
        <g transform="translate(340, 170)">
          <rect x="0" y="0" width="220" height="52" rx="12" fill="#D1FAE5" stroke="#6EE7B7" stroke-width="2"/>
          <text x="110" y="32" text-anchor="middle" font-family="Arial" font-size="14" font-weight="bold" fill="#047857">Joyful ✓</text>
        </g>
        <g transform="translate(40, 235)">
          <rect x="0" y="0" width="220" height="52" rx="12" fill="${ACCENT_LIGHT}" stroke="${ACCENT}" stroke-width="1.5"/>
          <text x="110" y="32" text-anchor="middle" font-family="Arial" font-size="14" font-weight="bold" fill="${ACCENT}">Big</text>
        </g>
        <g transform="translate(340, 235)">
          <rect x="0" y="0" width="220" height="52" rx="12" fill="${CARD_BG}" stroke="${DIVIDER}" stroke-width="1.5"/>
          <text x="110" y="32" text-anchor="middle" font-family="Arial" font-size="14" fill="${TEXT_PRI}">Small</text>
        </g>
        <g transform="translate(40, 300)">
          <rect x="0" y="0" width="220" height="52" rx="12" fill="${ACCENT_LIGHT}" stroke="${ACCENT}" stroke-width="1.5"/>
          <text x="110" y="32" text-anchor="middle" font-family="Arial" font-size="14" font-weight="bold" fill="${ACCENT}">Hot</text>
        </g>
        <g transform="translate(340, 300)">
          <rect x="0" y="0" width="220" height="52" rx="12" fill="#FEE2E2" stroke="#FCA5A5" stroke-width="2"/>
          <text x="110" y="32" text-anchor="middle" font-family="Arial" font-size="14" font-weight="bold" fill="#DC2626">Cold ⚡</text>
        </g>
        ${primaryBtn(200, 395, 200, 44, "Check Matches")}
        ${bottomBar()}
      </svg>`;

    // ============ DIALOGUE ============
    case "SITUATION_DIALOGUE_FILL":
      return `<svg viewBox="0 0 600 600" xmlns="http://www.w3.org/2000/svg">
        ${r(`x="0" y="0" width="600" height="600" fill="${APP_BG}"`)}
        ${statusBar()}${appHeader("Situational Dialogue")}
        ${t(`x="300" y="115" text-anchor="middle" font-family="Arial" font-size="14" font-weight="bold" fill="${TEXT_PRI}"`, "Complete the conversation")}
        <g transform="translate(35, 145)">
          ${c(16, 16, 16, `${ACCENT}20`)}
          ${t(`x="16" y="21" text-anchor="middle" font-family="Arial" font-size="10" font-weight="bold" fill="${ACCENT}"`, "A")}
          <rect x="38" y="0" width="320" height="36" rx="18" fill="${CARD_BG}" stroke="${DIVIDER}" stroke-width="1"/>
          ${t(`x="52" y="23" font-family="Arial" font-size="13" fill="${TEXT_PRI}"`, "Hello! How ___ you?")}
          <rect x="120" y="8" width="50" height="20" rx="4" fill="${ACCENT_LIGHT}" stroke="${ACCENT}" stroke-width="1" stroke-dasharray="2,2"/>
        </g>
        <g transform="translate(200, 200)">
          ${c(16, 16, 16, "#1D9E7520")}
          ${t(`x="16" y="21" text-anchor="middle" font-family="Arial" font-size="10" font-weight="bold" fill="#1D9E75"`, "B")}
          <rect x="38" y="0" width="320" height="36" rx="18" fill="#D1FAE5" stroke="#6EE7B7" stroke-width="1"/>
          ${t(`x="52" y="23" font-family="Arial" font-size="13" fill="#065F46"`, "I'm fine, thank you!")}
        </g>
        <g transform="translate(35, 255)">
          ${c(16, 16, 16, `${ACCENT}20`)}
          ${t(`x="16" y="21" text-anchor="middle" font-family="Arial" font-size="10" font-weight="bold" fill="${ACCENT}"`, "A")}
          <rect x="38" y="0" width="260" height="36" rx="18" fill="${CARD_BG}" stroke="${DIVIDER}" stroke-width="1"/>
          ${t(`x="52" y="23" font-family="Arial" font-size="13" fill="${TEXT_PRI}"`, "Where ___ you from?")}
          <rect x="100" y="8" width="40" height="20" rx="4" fill="${ACCENT_LIGHT}" stroke="${ACCENT}" stroke-width="1" stroke-dasharray="2,2"/>
        </g>
        <g transform="translate(100, 320)">
          <rect x="0" y="0" width="400" height="50" rx="12" fill="${CARD_BG}" stroke="${DIVIDER}" stroke-width="1"/>
          <text x="20" y="31" font-family="Arial" font-size="12" fill="#ccc">Choose the correct word...</text>
        </g>
        <g transform="translate(50, 400)">
          <rect x="0" y="0" width="150" height="42" rx="10" fill="${ACCENT_LIGHT}" stroke="${ACCENT}" stroke-width="1.5"/>
          <text x="75" y="28" text-anchor="middle" font-family="Arial" font-size="13" font-weight="bold" fill="${ACCENT}">are</text>
        </g>
        <g transform="translate(225, 400)">
          <rect x="0" y="0" width="150" height="42" rx="10" fill="${CARD_BG}" stroke="${DIVIDER}" stroke-width="1"/>
          <text x="75" y="28" text-anchor="middle" font-family="Arial" font-size="13" fill="${TEXT_PRI}">is</text>
        </g>
        <g transform="translate(400, 400)">
          <rect x="0" y="0" width="150" height="42" rx="10" fill="${CARD_BG}" stroke="${DIVIDER}" stroke-width="1"/>
          <text x="75" y="28" text-anchor="middle" font-family="Arial" font-size="13" fill="${TEXT_PRI}">am</text>
        </g>
        ${primaryBtn(200, 475, 200, 44, "Submit")}
        ${bottomBar()}
      </svg>`;

    // ============ VERB CONJUGATION ============
    case "VERB_CONJUGATION":
      return `<svg viewBox="0 0 600 600" xmlns="http://www.w3.org/2000/svg">
        ${r(`x="0" y="0" width="600" height="600" fill="${APP_BG}"`)}
        ${statusBar()}${appHeader("Verb Conjugation")}
        ${t(`x="300" y="115" text-anchor="middle" font-family="Arial" font-size="14" font-weight="bold" fill="${TEXT_PRI}"`, 'Conjugate "to be" in the Past tense')}
        ${r(`x="60" y="145" width="480" height="280" rx="16" fill="${CARD_BG}" stroke="${DIVIDER}" stroke-width="1"`)}
        <g transform="translate(60, 145)">
          ${r(`x="0" y="0" width="240" height="36" rx="16" fill="${ACCENT_LIGHT}"`)}
          ${t(`x="120" y="23" text-anchor="middle" font-family="Arial" font-size="12" font-weight="bold" fill="${ACCENT}"`, "Pronoun")}
          ${r(`x="240" y="0" width="240" height="36" rx="16" fill="${ACCENT_LIGHT}"`)}
          ${t(`x="360" y="23" text-anchor="middle" font-family="Arial" font-size="12" font-weight="bold" fill="${ACCENT}"`, "Conjugation")}
        </g>
        <g transform="translate(60, 181)">
          ${t(`x="120" y="23" text-anchor="middle" font-family="Arial" font-size="14" fill="${TEXT_PRI}"`, "I")}
          <line x1="0" y1="0" x2="480" y2="0" stroke="${DIVIDER}" stroke-width="0.5"/>
          ${r(`x="290" y="4" width="140" height="28" rx="8" fill="${ACCENT_LIGHT}" stroke="${ACCENT}" stroke-width="1.5"`)}
          ${t(`x="360" y="23" text-anchor="middle" font-family="Arial" font-size="13" font-weight="bold" fill="${ACCENT}"`, "was")}
        </g>
        <g transform="translate(60, 215)">
          ${t(`x="120" y="23" text-anchor="middle" font-family="Arial" font-size="14" fill="${TEXT_PRI}"`, "You")}
          ${r(`x="290" y="4" width="140" height="28" rx="8" fill="${CARD_BG}" stroke="${DIVIDER}" stroke-width="1"`)}
          ${t(`x="360" y="23" text-anchor="middle" font-family="Arial" font-size="12" fill="#ccc"`, "______")}
        </g>
        <g transform="translate(60, 249)">
          ${t(`x="120" y="23" text-anchor="middle" font-family="Arial" font-size="14" fill="${TEXT_PRI}"`, "He/She")}
          ${r(`x="290" y="4" width="140" height="28" rx="8" fill="${CARD_BG}" stroke="${DIVIDER}" stroke-width="1"`)}
          ${t(`x="360" y="23" text-anchor="middle" font-family="Arial" font-size="12" fill="#ccc"`, "______")}
        </g>
        <g transform="translate(60, 283)">
          ${t(`x="120" y="23" text-anchor="middle" font-family="Arial" font-size="14" fill="${TEXT_PRI}"`, "We")}
          ${r(`x="290" y="4" width="140" height="28" rx="8" fill="${CARD_BG}" stroke="${DIVIDER}" stroke-width="1"`)}
          ${t(`x="360" y="23" text-anchor="middle" font-family="Arial" font-size="12" fill="#ccc"`, "______")}
        </g>
        <g transform="translate(60, 317)">
          ${t(`x="120" y="23" text-anchor="middle" font-family="Arial" font-size="14" fill="${TEXT_PRI}"`, "They")}
          ${r(`x="290" y="4" width="140" height="28" rx="8" fill="${CARD_BG}" stroke="${DIVIDER}" stroke-width="1"`)}
          ${t(`x="360" y="23" text-anchor="middle" font-family="Arial" font-size="12" fill="#ccc"`, "______")}
        </g>
        ${primaryBtn(200, 460, 200, 44, "Check Answers")}
        ${bottomBar()}
      </svg>`;

    // ============ STORY ============
    case "STORY":
    case "SPEAK_FILL_SENTENCE":
      return `<svg viewBox="0 0 600 600" xmlns="http://www.w3.org/2000/svg">
        ${r(`x="0" y="0" width="600" height="600" fill="${APP_BG}"`)}
        ${statusBar()}${appHeader("Story Builder")}
        ${t(`x="300" y="115" text-anchor="middle" font-family="Arial" font-size="13" font-weight="bold" fill="${TEXT_PRI}"`, "Write a story about your last vacation")}
        ${r(`x="40" y="140" width="520" height="260" rx="16" fill="${CARD_BG}" stroke="${DIVIDER}" stroke-width="1.5"`)}
        ${t(`x="60" y="175" font-family="Arial" font-size="14" font-weight="bold" fill="${TEXT_PRI}"`, "📖 My Summer Vacation")}
        ${t(`x="60" y="210" font-family="Arial" font-size="13" fill="${TEXT_PRI}"`, "Last summer, I went to the beach with my")}
        ${t(`x="60" y="233" font-family="Arial" font-size="13" fill="${TEXT_PRI}"`, "family. The weather was beautiful and the")}
        ${t(`x="60" y="256" font-family="Arial" font-size="13" fill="${TEXT_PRI}"`, "water was warm.")}
        <line x1="60" y1="248" x2="200" y2="248" stroke="${ACCENT}" stroke-width="2" opacity="0.5"/>
        ${t(`x="60" y="290" font-family="Arial" font-size="13" fill="#ccc"`, "Continue writing here...")}
        <line x1="60" y1="300" x2="400" y2="300" stroke="#ccc" stroke-width="1"/>
        <line x1="60" y1="320" x2="350" y2="320" stroke="#ccc" stroke-width="1"/>
        <line x1="60" y1="340" x2="420" y2="340" stroke="#ccc" stroke-width="1"/>
        <line x1="60" y1="360" x2="300" y2="360" stroke="#ccc" stroke-width="1"/>
        ${t(`x="60" y="430" font-family="Arial" font-size="11" fill="${TEXT_SEC}"`, "📝 28 words written  •  Use words: beach, family, vacation")}
        ${primaryBtn(200, 475, 200, 44, "Save Story")}
        ${bottomBar()}
      </svg>`;

    // ============ PICTURE TO WORD ============
    case "PICTURE_TO_WORD":
      return `<svg viewBox="0 0 600 600" xmlns="http://www.w3.org/2000/svg">
        ${r(`x="0" y="0" width="600" height="600" fill="${APP_BG}"`)}
        ${statusBar()}${appHeader("Picture to Word")}
        ${t(`x="300" y="115" text-anchor="middle" font-family="Arial" font-size="14" font-weight="bold" fill="${TEXT_PRI}"`, "Choose the word that matches the picture")}
        ${r(`x="175" y="140" width="250" height="180" rx="24" fill="${CARD_BG}" stroke="${DIVIDER}" stroke-width="1.5"`)}
        <circle cx="300" cy="230" r="55" fill="#FEF3C7"/>
        ${t(`x="300" y="240" text-anchor="middle" font-family="Arial" font-size="50"`, "🍎")}
        ${t(`x="300" y="300" text-anchor="middle" font-family="Arial" font-size="10" fill="${TEXT_SEC}"`, "Upload image")}
        <g transform="translate(40, 345)">
          <rect x="0" y="0" width="240" height="55" rx="12" fill="#D1FAE5" stroke="#6EE7B7" stroke-width="2"/>
          <text x="120" y="34" text-anchor="middle" font-family="Arial" font-size="15" font-weight="bold" fill="#047857">🍎 Apple ✓</text>
        </g>
        <g transform="translate(320, 345)">
          <rect x="0" y="0" width="240" height="55" rx="12" fill="${CARD_BG}" stroke="${DIVIDER}" stroke-width="1.5"/>
          <text x="120" y="34" text-anchor="middle" font-family="Arial" font-size="15" fill="${TEXT_PRI}">📚 Book</text>
        </g>
        <g transform="translate(40, 410)">
          <rect x="0" y="0" width="240" height="55" rx="12" fill="${CARD_BG}" stroke="${DIVIDER}" stroke-width="1.5"/>
          <text x="120" y="34" text-anchor="middle" font-family="Arial" font-size="15" fill="${TEXT_PRI}">🚗 Car</text>
        </g>
        <g transform="translate(320, 410)">
          <rect x="0" y="0" width="240" height="55" rx="12" fill="${CARD_BG}" stroke="${DIVIDER}" stroke-width="1.5"/>
          <text x="120" y="34" text-anchor="middle" font-family="Arial" font-size="15" fill="${TEXT_PRI}">🐱 Cat</text>
        </g>
        ${primaryBtn(200, 490, 200, 44, "Next →")}
        ${bottomBar()}
      </svg>`;

    // ============ MINIMAL PAIR / SPEED ROUND ============
    case "MINIMAL_PAIR":
    case "SPEED_ROUND":
      return `<svg viewBox="0 0 600 600" xmlns="http://www.w3.org/2000/svg">
        ${r(`x="0" y="0" width="600" height="600" fill="${APP_BG}"`)}
        ${statusBar()}${appHeader("Listen and Choose")}
        ${t(`x="300" y="115" text-anchor="middle" font-family="Arial" font-size="14" font-weight="bold" fill="${TEXT_PRI}"`, "Listen to the word and choose the correct option")}
        <g transform="translate(250, 155)">
          <circle cx="50" cy="50" r="42" fill="${CARD_BG}" stroke="${ACCENT}" stroke-width="2.5"/>
          <polygon points="36,22 36,78 78,50" fill="${ACCENT}"/>
        </g>
        <g transform="translate(80, 260)">
          <rect x="0" y="0" width="200" height="90" rx="16" fill="#D1FAE5" stroke="#6EE7B7" stroke-width="2.5"/>
          <text x="100" y="42" text-anchor="middle" font-family="Arial" font-size="20" font-weight="bold" fill="#047857">ship</text>
          <text x="100" y="68" text-anchor="middle" font-family="Arial" font-size="11" fill="#047857">✓ You heard this</text>
        </g>
        <g transform="translate(320, 260)">
          <rect x="0" y="0" width="200" height="90" rx="16" fill="${CARD_BG}" stroke="${DIVIDER}" stroke-width="1.5"/>
          <text x="100" y="42" text-anchor="middle" font-family="Arial" font-size="20" fill="${TEXT_PRI}">sheep</text>
        </g>
        ${t(`x="300" y="410" text-anchor="middle" font-family="Arial" font-size="12" fill="${TEXT_SEC}"`, "⏱ Time remaining: 12 seconds")}
        ${primaryBtn(200, 455, 200, 44, "Confirm")}
        ${bottomBar()}
      </svg>`;

    // ============ DEFAULT ============
    default:
      return `<svg viewBox="0 0 600 600" xmlns="http://www.w3.org/2000/svg">
        ${r(`x="0" y="0" width="600" height="600" fill="${APP_BG}"`)}
        ${statusBar()}${appHeader(title || "Game")}
        ${r(`x="120" y="180" width="360" height="200" rx="20" fill="${CARD_BG}" stroke="${DIVIDER}" stroke-width="1.5"`)}
        ${t(`x="300" y="270" text-anchor="middle" font-family="Arial" font-size="22" font-weight="bold" fill="${TEXT_PRI}"`, title || "Game")}
        ${t(`x="300" y="310" text-anchor="middle" font-family="Arial" font-size="13" fill="${TEXT_SEC}"`, "Interactive Learning Game")}
        ${t(`x="300" y="340" text-anchor="middle" font-family="Arial" font-size="11" fill="${TEXT_SEC}"`, "Configure your game in the builder")}
        ${primaryBtn(200, 420, 200, 44, "Start")}
        ${bottomBar()}
      </svg>`;
  }
}

export function GamePreviewImage({ type, title, className }: Props) {
  const svgContent = renderScreenshot(type, title);

  return (
    <div
      className={cn(
        "overflow-hidden bg-white rounded-xl border border-border/30",
        className
      )}
      dangerouslySetInnerHTML={{ __html: svgContent }}
    />
  );
}

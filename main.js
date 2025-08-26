// --- FEEDBACK LOGIC ---
import * as RANGES from './ranges.js';

function getPlayerPosition() {
  // Returns the position string for the player seat
  let posIdx;
  if (mode === 'drill' && drillPosition) {
    // Map DRILL_POSITIONS to POSITIONS index
    const drillToPositionsIdx = {
      'Dealer': 0,
      'Cutoff': 8, // CU
      'Hi-Jack': 7, // HJ
      'Lo-Jack': 6, // LJ
      'Middle Position': 5, // MP
      'Under the Gun +1': 4, // UTG +1
      'Under the Gun': 3 // UTG
    };
    posIdx = drillToPositionsIdx[drillPosition];
  } else {
    const playerPosIdx = PLAYER_SEAT;
    posIdx = (playerPosIdx - dealerSeat + NUM_SEATS) % NUM_SEATS;
  }
  return POSITIONS[posIdx];
}

function handToString(card1, card2) {
  // Returns hand string like 'AKs', 'QJo', '77', etc.
  const rankOrder = ['A','K','Q','J','T','9','8','7','6','5','4','3','2'];
  let r1 = card1.rank, r2 = card2.rank;
  let s1 = card1.suit, s2 = card2.suit;
  if (rankOrder.indexOf(r2) < rankOrder.indexOf(r1)) {
    [r1, r2] = [r2, r1];
    [s1, s2] = [s2, s1];
  }
  if (r1 === r2) return r1 + r2;
  const suited = s1 === s2 ? 's' : 'o';
  return r1 + r2 + suited;
}

function getRangeForPosition(pos) {
  // Map position to range array from RANGES
  switch (pos) {
    case 'UTG': return RANGES.UTG;
    case 'UTG +1': return RANGES.UTG1;
    case 'MP': return RANGES.MP;
    case 'LJ': return RANGES.LJ;
    case 'HJ': return RANGES.HJ;
    case 'CO': return RANGES.CO;
    case 'CU': return RANGES.CO;
    case 'Dealer': return RANGES.BTN;
    case 'BTN': return RANGES.BTN;
    default: return RANGES.BTN;
  }
}

function handleAction(action) {
  const [card1, card2] = window.currentHand;
  const pos = getPlayerPosition();
  const handStr = handToString(card1, card2);
  const range = getRangeForPosition(pos);
  let correct = false;
  if (action === 'raise') {
    correct = range.includes(handStr);
  } else if (action === 'fold') {
    correct = !range.includes(handStr);
  }
  showFeedback(correct, pos);
}

function showFeedback(isCorrect, pos) {
  const overlay = document.getElementById('feedbackOverlay');
  const title = document.getElementById('feedbackTitle');
  const rangeImgDiv = document.getElementById('rangeImageContainer');
  overlay.style.display = 'flex';
  title.textContent = isCorrect ? 'Correct!' : 'Incorrect :('; 
  rangeImgDiv.style.display = 'none';
  rangeImgDiv.innerHTML = '';
  // Next Hand button
  document.getElementById('nextHandBtn').onclick = () => {
    overlay.style.display = 'none';
    moveDealer();
  };
  // Show Range button
  document.getElementById('showRangeBtn').onclick = () => {
    // Map pos to image file
    const posMap = {
      'Dealer': 'BTN', 'BTN': 'BTN', 'CO': 'CO', 'CU': 'CO', 'HJ': 'HJ', 'LJ': 'LJ', 'MP': 'MP', 'UTG': 'UTG', 'UTG +1': 'UTG1'
    };
    const imgName = posMap[pos] || 'BTN';
    rangeImgDiv.innerHTML = `<img src="assets/ranges/${imgName}.PNG" alt="${imgName} range" />`;
    rangeImgDiv.style.display = 'block';
  };
}

const NUM_SEATS = 9;
const PLAYER_SEAT = 8; // fixed player seat at bottom
const POSITIONS = [
  'Dealer', 'SB', 'BB', 'UTG', 'UTG +1', 'MP', 'LJ', 'HJ', 'CU'
];
const DRILL_POSITIONS = [
  'Dealer', 'Cutoff', 'Hi-Jack', 'Lo-Jack', 'Middle Position', 'Under the Gun +1', 'Under the Gun'
];
let dealerSeat = 0;
let playerSeat = 8; // default to bottom
let mode = 'home'; // 'home', 'drill', 'ring'
let drillPosition = null;

function renderTable() {
  const container = document.getElementById('tableContainer');
    const seatsLayer = document.getElementById('seatsLayer') || document.getElementById('tableContainer');
    // Remove old seats, chips, and position labels
    Array.from(seatsLayer.querySelectorAll('.seat, .chip, .position-label, .player-cards')).forEach(e => e.remove());
  let playerPosIdx = PLAYER_SEAT;
  let localDealerSeat = dealerSeat;
  if (mode === 'drill' && drillPosition) {
    // Map DRILL_POSITIONS to the correct POSITIONS index (abbreviation)
    const drillToPositionsIdx = {
      'Dealer': 0,
      'Cutoff': 8, // CU
      'Hi-Jack': 7, // HJ
      'Lo-Jack': 6, // LJ
      'Middle Position': 5, // MP
      'Under the Gun +1': 4, // UTG +1
      'Under the Gun': 3 // UTG
    };
    let drillIdx = drillToPositionsIdx[drillPosition];
    if (drillIdx === undefined) {
      drillIdx = POSITIONS.findIndex(
        pos => pos.toLowerCase().replace(/\s+/g, '') === drillPosition.toLowerCase().replace(/\s+|\-/g, '')
      );
    }
    // Correct formula: rotate so POSITIONS[PLAYER_SEAT] === drillPosition
    localDealerSeat = (PLAYER_SEAT - drillIdx + NUM_SEATS) % NUM_SEATS;
  }
  // SVG oval params (match ellipse in SVG): cx=190, cy=280, rx=170, ry=250
  const a = 170; // horizontal radius
  const b = 250; // vertical radius
  const centerX = 190;
  const centerY = 280;
  const seatWidth = 44;
  const seatHeight = 44;
  for (let i = 0; i < NUM_SEATS; i++) {
    // Player seat is always at the bottom (angle = Math.PI/2)
    const playerAngle = Math.PI / 2;
    const angle = playerAngle + (2 * Math.PI / NUM_SEATS) * ((i - PLAYER_SEAT + NUM_SEATS) % NUM_SEATS);
    // Place seat exactly on the SVG ellipse edge
    const x = centerX + a * Math.cos(angle) - seatWidth / 2;
    const y = centerY + b * Math.sin(angle) - seatHeight / 2;
    let seat;
    // Apply .dealer class to the correct seat
    let isDealer = (i === localDealerSeat);
    if (i === playerPosIdx) {
      // Draw two random cards for the player
      const suits = [
        { symbol: '♥', color: 'red' },
        { symbol: '♣', color: 'black' },
        { symbol: '♠', color: 'black' },
        { symbol: '♦', color: 'red' }
      ];
      const ranks = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
      // Build deck
      const deck = [];
      for (const suit of suits) {
        for (const rank of ranks) {
          deck.push({ suit: suit.symbol, color: suit.color, rank });
        }
      }
      // Draw two unique cards
      const card1Index = Math.floor(Math.random() * deck.length);
      const card1 = deck.splice(card1Index, 1)[0];
      const card2Index = Math.floor(Math.random() * deck.length);
      const card2 = deck.splice(card2Index, 1)[0];

      // Create a transparent seat for positioning
  seat = document.createElement('div');
  seat.className = isDealer ? 'dealer' : '';
  seat.style.position = 'absolute';
  seat.style.left = x + 'px';
  seat.style.top = y + 'px';
  seat.style.width = '0px';
  seat.style.height = '0px';
  seat.style.zIndex = 300;

      // Card container absolutely positioned over the seat
      const cardContainer = document.createElement('div');
  cardContainer.className = 'player-cards';
  cardContainer.style.position = 'absolute';
  cardContainer.style.left = '-38px'; // move more centered
  cardContainer.style.top = '-45px'; // move up
  cardContainer.style.display = 'flex';
  cardContainer.style.flexDirection = 'row';
  cardContainer.style.alignItems = 'center';
  cardContainer.style.justifyContent = 'center';
  cardContainer.style.zIndex = 300;

  // Card 1
  const card1Div = document.createElement('div');
  card1Div.style.width = '58px';
  card1Div.style.height = '84px';
  card1Div.style.background = '#fff';
  card1Div.style.borderRadius = '7px';
  card1Div.style.border = '2px solid #222';
  card1Div.style.display = 'flex';
  card1Div.style.flexDirection = 'column';
  card1Div.style.alignItems = 'center';
  card1Div.style.justifyContent = 'center';
  card1Div.style.margin = '0 3px';
  card1Div.style.fontSize = '2.2rem';
  card1Div.style.boxShadow = '0 2px 8px #0005';
  card1Div.style.padding = '4px 0 0 0';
  card1Div.innerHTML = `<span style="color:${card1.color};font-size:1.1em;line-height:1;">${card1.rank}</span><span style="color:${card1.color};font-size:0.95em;line-height:1;">${card1.suit}</span>`;

  // Card 2
  const card2Div = document.createElement('div');
  card2Div.style.width = '58px';
  card2Div.style.height = '84px';
  card2Div.style.background = '#fff';
  card2Div.style.borderRadius = '7px';
  card2Div.style.border = '2px solid #222';
  card2Div.style.display = 'flex';
  card2Div.style.flexDirection = 'column';
  card2Div.style.alignItems = 'center';
  card2Div.style.justifyContent = 'center';
  card2Div.style.margin = '0 3px';
  card2Div.style.fontSize = '2.2rem';
  card2Div.style.boxShadow = '0 2px 8px #0005';
  card2Div.style.padding = '4px 0 0 0';
  card2Div.innerHTML = `<span style="color:${card2.color};font-size:1.1em;line-height:1;">${card2.rank}</span><span style="color:${card2.color};font-size:0.95em;line-height:1;">${card2.suit}</span>`;

  cardContainer.appendChild(card1Div);
  cardContainer.appendChild(card2Div);
  seat.appendChild(cardContainer);
    } else {
      seat = document.createElement('div');
      seat.className = 'seat' + (isDealer ? ' dealer' : '');
      seat.style.left = x + 'px';
      seat.style.top = y + 'px';
    }
    seatsLayer.appendChild(seat);
    if (i === localDealerSeat && i !== playerPosIdx) {
      const btn = document.createElement('div');
      btn.className = 'dealer-btn';
      btn.innerText = 'D';
      seat.appendChild(btn);
    }

    // Place a single chip in front of the SB (seat after dealer), 1/4 of the way from seat to center
      if (i === (localDealerSeat + 1) % NUM_SEATS) {
      const chipAngle = playerAngle + (2 * Math.PI / NUM_SEATS) * ((i - PLAYER_SEAT + NUM_SEATS) % NUM_SEATS);
      // Seat position
      const seatX = centerX + a * Math.cos(chipAngle);
      const seatY = centerY + b * Math.sin(chipAngle);
      // Center position
      const centerChipX = centerX;
      const centerChipY = centerY;
      // Chip position: 1/4 of the way from seat to center
      const chipX = seatX + (centerChipX - seatX) * 0.25 - 14;
      const chipY = seatY + (centerChipY - seatY) * 0.25 - 14;
      const chip = document.createElement('div');
      chip.className = 'chip';
      chip.style.left = chipX + 'px';
      chip.style.top = chipY + 'px';
      chip.innerText = '1';
        seatsLayer.appendChild(chip);
    }
    // Place a big blind chip in front of the BB (2 seats after dealer), 1/4 of the way from seat to center
      if (i === (localDealerSeat + 2) % NUM_SEATS) {
      const chipAngle = playerAngle + (2 * Math.PI / NUM_SEATS) * ((i - PLAYER_SEAT + NUM_SEATS) % NUM_SEATS);
      // Seat position
      const seatX = centerX + a * Math.cos(chipAngle);
      const seatY = centerY + b * Math.sin(chipAngle);
      // Center position
      const centerChipX = centerX;
      const centerChipY = centerY;
      // Chip position: 1/4 of the way from seat to center
      const chipX = seatX + (centerChipX - seatX) * 0.25 - 14;
      const chipY = seatY + (centerChipY - seatY) * 0.25 - 14;
      const chip = document.createElement('div');
      chip.className = 'chip';
      chip.style.left = chipX + 'px';
      chip.style.top = chipY + 'px';
      chip.innerText = '2';
        seatsLayer.appendChild(chip);
    }

    // Only show position label in front of player seat
    if (i === playerPosIdx) {
      const label = document.createElement('div');
      label.className = 'position-label';
      const btnRadius = b + 40;
      const btnX = centerX + a * Math.cos(angle) - 35;
      const btnY = centerY + btnRadius * Math.sin(angle) - 16;
      label.style.left = btnX + 'px';
      label.style.top = btnY + 'px';
      // Always show the POSITIONS abbreviation for the player seat
      let posIdx = (playerPosIdx - localDealerSeat + NUM_SEATS) % NUM_SEATS;
      label.innerText = POSITIONS[posIdx];
    seatsLayer.appendChild(label);
    }
  }
}
function moveDealer() {
  if (mode === 'drill') {
    // In drill mode, just deal new cards
    renderTable();
  } else {
    // In ring mode, skip SB and BB positions
    do {
      dealerSeat = (dealerSeat + 1) % NUM_SEATS;
      // Calculate the player's position label for this seat
      const playerPosIdx = PLAYER_SEAT;
      const posIdx = (playerPosIdx - dealerSeat + NUM_SEATS) % NUM_SEATS;
      var posLabel = POSITIONS[posIdx];
    } while (posLabel === 'SB' || posLabel === 'BB');
    renderTable();
  }
}
window.renderTable = renderTable;
window.moveDealer = moveDealer;

// UI logic for home page and mode switching
document.addEventListener('DOMContentLoaded', () => {
  const home = document.getElementById('home');
  const tableContainer = document.getElementById('tableContainer');
  const nextBtn = document.getElementById('nextBtn');
  const drillBtn = document.getElementById('drillBtn');
  const ringBtn = document.getElementById('ringBtn');
  const aboutBtn = document.getElementById('aboutBtn');
  if (aboutBtn) {
    aboutBtn.onclick = () => {
      alert('Holdem Preflop Trainer\n\nCreated for poker study and practice.\n\nChoose a mode to begin!');
    };
  }
  const posSelect = document.getElementById('position-select');
  const backHomeBtn = document.getElementById('backHomeBtn');
  const mainTitle = document.getElementById('main-title');

  function showHome() {
    mode = 'home';
    home.style.display = '';
    tableContainer.style.display = 'none';
    nextBtn.style.display = 'none';
    posSelect.style.display = 'none';
    mainTitle.style.display = '';
  }

  function showTable() {
    home.style.display = 'none';
    tableContainer.style.display = '';
    nextBtn.style.display = '';
    posSelect.style.display = 'none';
    mainTitle.style.display = '';
    renderTable();
  }

  function showPositionSelect() {
    home.style.display = 'none';
    tableContainer.style.display = 'none';
    nextBtn.style.display = 'none';
    posSelect.style.display = 'flex';
    mainTitle.style.display = '';
  }

  drillBtn.onclick = () => {
    showPositionSelect();
  };
  ringBtn.onclick = () => {
    mode = 'ring';
    dealerSeat = 0;
    playerSeat = 8;
    showTable();
  };
  backHomeBtn.onclick = showHome;

  Array.from(document.getElementsByClassName('pos-btn')).forEach(btn => {
    btn.onclick = () => {
      drillPosition = btn.getAttribute('data-pos');
      mode = 'drill';
      dealerSeat = 0;
      showTable();
    };
  });

  nextBtn.onclick = moveDealer;

  showHome();
});

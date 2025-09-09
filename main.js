// --- FEEDBACK LOGIC ---
import * as RANGES from './ranges.js';

function getPlayerPosition() {
  // Returns the position string for the player seat
  let posIdx;
  if (mode === 'drill' && drillPosition) {
    // Map DRILL_POSITIONS to POSITIONS index
    const drillToPositionsIdx = {
      'Dealer': 0,
      'Cutoff': 8, // CO
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
  console.log('Action:', action, '| Position:', pos, '| Hand:', handStr, '| In Range:', range.includes(handStr), '| Range:', range);
    let correct = false;
    totalCount++;
  if (action === 'raise') {
    correct = range.includes(handStr);
  } else if (action === 'fold') {
    correct = !range.includes(handStr);
  }
  showFeedback(correct, pos);
}

function showFeedback(isCorrect, pos) {
  // Remove old feedback if present
  const oldFeedback = document.getElementById('centerFeedback');
  if (oldFeedback) oldFeedback.remove();
  // Create feedback message in center of table
  const tableContainer = document.getElementById('tableContainer');
  const feedbackDiv = document.createElement('div');
  feedbackDiv.id = 'centerFeedback';
  feedbackDiv.style.position = 'absolute';
  feedbackDiv.style.left = '50%';
  feedbackDiv.style.top = '40%';
  feedbackDiv.style.transform = 'translate(-50%, -50%)';
  feedbackDiv.style.background = 'rgba(32,32,32,0.92)';
  feedbackDiv.style.color = isCorrect ? '#1976d2' : '#d32f2f';
  feedbackDiv.style.fontSize = '2.2rem';
  feedbackDiv.style.fontWeight = 'bold';
  feedbackDiv.style.borderRadius = '16px';
  feedbackDiv.style.padding = '1.2rem 2.5rem';
  feedbackDiv.style.zIndex = '1001';
  feedbackDiv.style.textAlign = 'center';
  feedbackDiv.textContent = isCorrect ? 'Correct!' : 'Incorrect';
  tableContainer.appendChild(feedbackDiv);

  // Update score tally and percentage
  if (isCorrect) {
    correctCount++;
  }
  const tally = document.getElementById('scoreTally');
  if (tally) {
    const percent = totalCount > 0 ? Math.round((correctCount / totalCount) * 100) : 0;
    tally.innerHTML = `<span style="font-size:0.7em;font-weight:normal;">Score:</span> ${correctCount} / ${totalCount}  (${percent}%)`;
  }

  // Change buttons: Raise -> Next Hand (blue), Fold -> Show Range (black)
  // Find the action button container reliably
  const actionDiv = Array.from(document.querySelectorAll('#tableContainer > div')).find(div => {
    const btns = div.querySelectorAll('button');
    return btns.length === 2 && btns[0].textContent.match(/Raise|Next Hand/) && btns[1].textContent.match(/Fold|Show Range/);
  });
  if (actionDiv) {
    const [raiseBtn, foldBtn] = actionDiv.querySelectorAll('button');
    if (raiseBtn && foldBtn) {
      // Next Hand button
      raiseBtn.textContent = 'Next Hand';
      raiseBtn.style.background = '#1976d2';
      raiseBtn.style.color = '#fff';
      raiseBtn.disabled = false;
      raiseBtn.onclick = () => {
        // Remove feedback label
        const oldFeedback = document.getElementById('centerFeedback');
        if (oldFeedback) oldFeedback.remove();
        // Remove action buttons for previous hand
        actionDiv.remove();
        if (mode === 'ring') {
          moveDealer();
        } else {
          renderTable();
        }
      };
      // Show Range button
      foldBtn.textContent = 'Show Range';
      foldBtn.style.background = '#222';
      foldBtn.style.color = '#fff';
      foldBtn.disabled = false;
      foldBtn.onclick = () => {
        // Show range image in feedback, larger and with Show Table button
        const posMap = {
          'Dealer': 'BTN', 'BTN': 'BTN', 'CO': 'CO', 'HJ': 'HJ', 'LJ': 'LJ', 'MP': 'MP', 'UTG': 'UTG', 'UTG +1': 'UTG1'
        };
        const imgName = posMap[pos] || 'BTN';
        feedbackDiv.innerHTML = `
          <img src="assets/ranges/${imgName}.PNG" alt="${imgName} range" style="width:340px;max-width:98vw;border-radius:0.7rem;box-shadow:0 2px 16px #0006;">
          <br><button id="showTableBtn" style="margin-top:0.5rem;padding:0.3rem 1.1rem;font-size:0.95rem;background:#1976d2;color:#fff;border:none;border-radius:8px;cursor:pointer;font-weight:bold;">Show Table</button>
        `;
        feedbackDiv.style.color = '#fff';
        // Add Show Table button logic
        setTimeout(() => {
          const showTableBtn = document.getElementById('showTableBtn');
          if (showTableBtn) {
            showTableBtn.onclick = () => {
              feedbackDiv.remove();
            };
          }
        }, 50);
      };
    }
  }
}

const NUM_SEATS = 9;
const PLAYER_SEAT = 8; // fixed player seat at bottom
const POSITIONS = [
  'Dealer', 'SB', 'BB', 'UTG', 'UTG +1', 'MP', 'LJ', 'HJ', 'CO'
];
const DRILL_POSITIONS = [
  'Dealer', 'Cutoff', 'Hi-Jack', 'Lo-Jack', 'Middle Position', 'Under the Gun +1', 'Under the Gun'
];
let dealerSeat = 0;
let playerSeat = 8; // default to bottom
let mode = 'home'; // 'home', 'drill', 'ring'
let drillPosition = null;
let correctCount = 0;
let totalCount = 0;

function renderTable() {
  const container = document.getElementById('tableContainer');
  const seatsLayer = document.getElementById('seatsLayer') || document.getElementById('tableContainer');
  // Remove old seats, chips, dealer buttons, position labels, player cards, and action buttons
  Array.from(seatsLayer.querySelectorAll('.dealer-btn')).forEach(e => e.remove());
  Array.from(seatsLayer.querySelectorAll('.chip')).forEach(e => e.remove());
  Array.from(seatsLayer.querySelectorAll('.seat, .position-label, .player-cards')).forEach(e => e.remove());
  // Remove feedback label if present
  const oldFeedback = document.getElementById('centerFeedback');
  if (oldFeedback) oldFeedback.remove();
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
  const playerAngle = Math.PI / 2;
  for (let i = 0; i < NUM_SEATS; i++) {
    // Player seat is always at the bottom center
    let x, y;
    if (i === PLAYER_SEAT) {
      x = centerX - seatWidth / 2;
      y = centerY + b - seatHeight / 2;
    } else {
      const angle = playerAngle + (2 * Math.PI / NUM_SEATS) * ((i - PLAYER_SEAT + NUM_SEATS) % NUM_SEATS);
      x = centerX + a * Math.cos(angle) - seatWidth / 2;
      y = centerY + b * Math.sin(angle) - seatHeight / 2;
    }
  let seat;
  // Determine seat type
  let isDealer = (i === localDealerSeat);
  let isSB = (i === (localDealerSeat + 1) % NUM_SEATS);
  let isBB = (i === (localDealerSeat + 2) % NUM_SEATS);
  let seatClass = 'seat';
  if (isDealer) seatClass += ' dealer';
  if (i === playerPosIdx) {
      // Draw two random cards for the player
      const suits = [
        { symbol: '♥', color: 'red' },
        { symbol: '♣', color: 'black' },
        { symbol: '♠', color: 'black' },
        { symbol: '♦', color: 'red' }
      ];
      const ranks = ['A', '2', '3', '4', '5', '6', '7', '8', '9', 'T', 'J', 'Q', 'K'];
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

      // Store for checking answer
      window.currentHand = [card1, card2];

      // Create a visible seat for player
      seat = document.createElement('div');
      seat.className = seatClass;
      seat.style.top = y + 'px';
      seat.style.left = x + 'px';
      seat.style.width = seatWidth + 'px';
      seat.style.height = seatHeight + 'px';
      seat.style.zIndex = 300;
      // Only add dealer button for dealer seat
      if (isDealer) {
        const dealerLabel = document.createElement('div');
        dealerLabel.className = 'dealer-btn';
        dealerLabel.innerText = 'D';
        seat.appendChild(dealerLabel);
      }
      seatsLayer.appendChild(seat);

      // Card container absolutely positioned and centered over the seat
      const cardContainer = document.createElement('div');
      cardContainer.className = 'player-cards';
      cardContainer.style.position = 'absolute';
      cardContainer.style.left = (x + seatWidth / 2) + 'px';
      cardContainer.style.top = (y - 60) + 'px';
      cardContainer.style.transform = 'translate(-50%, 0)';
      cardContainer.style.display = 'flex';
      cardContainer.style.flexDirection = 'row';
      cardContainer.style.alignItems = 'center';
      cardContainer.style.justifyContent = 'center';
      cardContainer.style.zIndex = 350;

      // Color-blind friendly suit colors
      const suitColors = {
        '♥': 'red',
        '♠': 'black',
        '♦': 'blue',
        '♣': 'green'
      };

      // Card 1
      const card1Div = document.createElement('div');
      card1Div.className = 'player-card ' + suitColors[card1.suit];
      const card1DisplayRank = card1.rank === 'T' ? '10' : card1.rank;
      card1Div.innerHTML = `
        <span class="card-suit">${card1.suit}</span>
        <span class="card-rank">${card1DisplayRank}</span>
      `;

      // Card 2
      const card2Div = document.createElement('div');
      card2Div.className = 'player-card ' + suitColors[card2.suit];
      const card2DisplayRank = card2.rank === 'T' ? '10' : card2.rank;
      card2Div.innerHTML = `
        <span class="card-suit">${card2.suit}</span>
        <span class="card-rank">${card2DisplayRank}</span>
      `;

      cardContainer.appendChild(card1Div);
      cardContainer.appendChild(card2Div);
      seatsLayer.appendChild(cardContainer);

      // Add Raise/Fold buttons below the player seat
      const actionDiv = document.createElement('div');
      actionDiv.style.position = 'absolute';
      actionDiv.style.left = (x + seatWidth / 2) + 'px';
      actionDiv.style.top = (y + seatHeight + 10) + 'px';
      actionDiv.style.transform = 'translate(-50%, 0)';
      actionDiv.style.display = 'flex';
      actionDiv.style.justifyContent = 'center';
      actionDiv.style.gap = '1.2rem';
      actionDiv.style.zIndex = 351;

      const raiseBtn = document.createElement('button');
      raiseBtn.textContent = 'Raise';
      raiseBtn.style.padding = '0.7rem 2.2rem';
      raiseBtn.style.fontSize = '1.2rem';
      raiseBtn.style.background = '#388e3c';
      raiseBtn.style.color = '#fff';
      raiseBtn.style.border = 'none';
      raiseBtn.style.borderRadius = '8px';
      raiseBtn.style.cursor = 'pointer';
      raiseBtn.style.fontWeight = 'bold';

      const foldBtn = document.createElement('button');
      foldBtn.textContent = 'Fold';
      foldBtn.style.padding = '0.7rem 2.2rem';
      foldBtn.style.fontSize = '1.2rem';
      foldBtn.style.background = '#d32f2f';
      foldBtn.style.color = '#fff';
      foldBtn.style.border = 'none';
      foldBtn.style.borderRadius = '8px';
      foldBtn.style.cursor = 'pointer';
      foldBtn.style.fontWeight = 'bold';

      actionDiv.appendChild(raiseBtn);
      actionDiv.appendChild(foldBtn);
      seatsLayer.appendChild(actionDiv);

      // Button logic
      raiseBtn.onclick = () => handleAction('raise');
      foldBtn.onclick = () => handleAction('fold');
    } else {
      seat = document.createElement('div');
      seat.className = seatClass;
      seat.style.position = 'absolute';
      seat.style.left = x + 'px';
      seat.style.top = y + 'px';
      seat.style.width = seatWidth + 'px';
      seat.style.height = seatHeight + 'px';
      seat.style.zIndex = 300;
      if (isDealer) {
        const dealerLabel = document.createElement('div');
        dealerLabel.className = 'dealer-btn';
        dealerLabel.innerText = 'D';
        seat.appendChild(dealerLabel);
      }
    }
    seatsLayer.appendChild(seat);
    if (i === localDealerSeat && i !== playerPosIdx) {
      const btn = document.createElement('div');
      btn.className = 'dealer-btn';
      btn.innerText = 'D';
      seat.appendChild(btn);
    }

    // Place chips for SB and BB (seats after dealer) in front of their seats
    if (i === (localDealerSeat + 1) % NUM_SEATS || i === (localDealerSeat + 2) % NUM_SEATS) {
      const chipAngle = playerAngle + (2 * Math.PI / NUM_SEATS) * ((i - PLAYER_SEAT + NUM_SEATS) % NUM_SEATS);
      const seatX = centerX + a * Math.cos(chipAngle);
      const seatY = centerY + b * Math.sin(chipAngle);
      const chipX = seatX + 0.25 * (centerX - seatX) - 14;
      const chipY = seatY + 0.25 * (centerY - seatY) - 14;
      const chip = document.createElement('div');
      chip.className = 'chip';
      chip.style.position = 'absolute';
      chip.style.left = chipX + 'px';
      chip.style.top = chipY + 'px';
      chip.style.zIndex = 100;
      chip.innerText = (i === (localDealerSeat + 1) % NUM_SEATS) ? '1' : '2';
      seatsLayer.appendChild(chip);
    }
  }
  // Remove any previous label/tally and create them only once, under the title and above the table
  const oldLabel = document.getElementById('playerSeatLabel');
  if (oldLabel) oldLabel.remove();
  const oldTally = document.getElementById('scoreTally');
  if (oldTally) oldTally.remove();

  // Center position and score labels in the middle of the table
  const tableContainer = document.getElementById('tableContainer');
  const centerLabels = document.createElement('div');
  centerLabels.id = 'centerLabels';
  centerLabels.style.position = 'absolute';
  centerLabels.style.left = '50%';
  centerLabels.style.top = '60%';
  centerLabels.style.transform = 'translate(-50%, -50%)';
  centerLabels.style.display = 'flex';
  centerLabels.style.flexDirection = 'column';
  centerLabels.style.alignItems = 'center';
  centerLabels.style.justifyContent = 'center';
  centerLabels.style.zIndex = 500;

  let posIdx = (playerPosIdx - localDealerSeat + NUM_SEATS) % NUM_SEATS;
  const seatLabel = document.createElement('div');
  seatLabel.id = 'playerSeatLabel';
  seatLabel.style.background = '#fff';
  seatLabel.style.color = '#222';
  seatLabel.style.borderRadius = '8px';
  seatLabel.style.fontSize = '0.85rem';
  seatLabel.style.fontWeight = 'bold';
  seatLabel.style.padding = '4px 14px';
  seatLabel.style.textAlign = 'center';
  seatLabel.style.width = 'fit-content';
  seatLabel.style.margin = '0 0 8px 0';
  seatLabel.innerHTML = `<span style="font-size:0.7em;font-weight:normal;">Position:</span> ${POSITIONS[posIdx]}`;
  centerLabels.appendChild(seatLabel);

  const tally = document.createElement('div');
  tally.id = 'scoreTally';
  tally.style.background = '#fff';
  tally.style.color = '#222';
  tally.style.borderRadius = '8px';
  tally.style.fontSize = '0.85rem';
  tally.style.fontWeight = 'bold';
  tally.style.padding = '4px 14px';
  tally.style.textAlign = 'center';
  tally.style.width = 'fit-content';
  tally.style.margin = '0';
  const percent = totalCount > 0 ? Math.round((correctCount / totalCount) * 100) : 0;
  tally.innerHTML = `<span style="font-size:0.7em;font-weight:normal;">Score:</span> ${correctCount} / ${totalCount}  (${percent}%)`;
  centerLabels.appendChild(tally);

  // Remove any previous centerLabels
  const oldCenterLabels = document.getElementById('centerLabels');
  if (oldCenterLabels) oldCenterLabels.remove();
  tableContainer.appendChild(centerLabels);

  // Dealer glow is now only removed before the next hand in moveDealer
}
function moveDealer() {
  // Remove dealer glow from all seats except the new dealer before rendering the next hand
  const seatsLayer = document.getElementById('seatsLayer') || document.getElementById('tableContainer');
  setTimeout(() => {
    Array.from(seatsLayer.querySelectorAll('.seat.dealer')).forEach(seat => {
      const seatIndex = Array.from(seatsLayer.querySelectorAll('.seat')).indexOf(seat);
      if (seatIndex !== dealerSeat) {
        seat.classList.remove('dealer');
        seat.style.borderColor = '';
        seat.style.boxShadow = '';
      }
    });
  }, 0);
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
    nextBtn.style.display = 'none';
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

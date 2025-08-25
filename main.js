const NUM_SEATS = 9;
const PLAYER_SEAT = 8; // 0-indexed, fixed player seat at bottom
let dealerSeat = 0;
const POSITIONS = [
  'Dealer', 'SB', 'BB', 'UTG', 'UTG +1', 'MP', 'LJ', 'HJ', 'CU'
];

function renderTable() {
  const container = document.getElementById('tableContainer');
  // Remove old seats, chips, and position labels
  Array.from(container.getElementsByClassName('seat')).forEach(e => e.remove());
  Array.from(container.getElementsByClassName('chip')).forEach(e => e.remove());
  Array.from(container.getElementsByClassName('position-label')).forEach(e => e.remove());
  for (let i = 0; i < NUM_SEATS; i++) {
    // Vertically oriented oval: x = centerX + a * cos(angle), y = centerY + b * sin(angle)
    // Player seat is always at the bottom (angle = Math.PI/2)
    const playerAngle = Math.PI / 2;
    const angle = playerAngle + (2 * Math.PI / NUM_SEATS) * ((i - PLAYER_SEAT + NUM_SEATS) % NUM_SEATS);
    const a = 170; // horizontal radius (move seats further out)
    const b = 280; // vertical radius (move seats further out)
    const centerX = 190;
    const centerY = 300;
    const x = centerX + a * Math.cos(angle) - 22;
    const y = centerY + b * Math.sin(angle) - 22;
    const seat = document.createElement('div');
    seat.className = 'seat' + (i === PLAYER_SEAT ? ' player' : '') + (i === dealerSeat ? ' dealer' : '');
    seat.style.left = x + 'px';
    seat.style.top = y + 'px';
    // No seat number text
    if (i === dealerSeat) {
      const btn = document.createElement('div');
      btn.className = 'dealer-btn';
      btn.innerText = 'D';
      seat.appendChild(btn);
    }
    container.appendChild(seat);

    // Place a single chip in front of the SB (seat after dealer), 1/4 of the way from seat to center
    if (i === (dealerSeat + 1) % NUM_SEATS) {
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
      container.appendChild(chip);
    }
    // Place a big blind chip in front of the BB (2 seats after dealer), 1/4 of the way from seat to center
    if (i === (dealerSeat + 2) % NUM_SEATS) {
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
      container.appendChild(chip);
    }

    // Only show position label in front of player seat
    if (i === PLAYER_SEAT) {
      const label = document.createElement('div');
      label.className = 'position-label';
      const btnRadius = b + 40;
      const btnX = centerX + a * Math.cos(angle) - 35;
      const btnY = centerY + btnRadius * Math.sin(angle) - 16;
      label.style.left = btnX + 'px';
      label.style.top = btnY + 'px';
      label.innerText = POSITIONS[(i - dealerSeat + NUM_SEATS) % NUM_SEATS];
      container.appendChild(label);
    }
  }
}
function moveDealer() {
  dealerSeat = (dealerSeat + 1) % NUM_SEATS;
  renderTable();
}
window.renderTable = renderTable;
window.moveDealer = moveDealer;
document.addEventListener('DOMContentLoaded', renderTable);

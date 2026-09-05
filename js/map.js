// MAP VIEW
const map = L.map('map').setView([37, -95], 4);

//BASEMAP
L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
  attribution: '&copy; OpenStreetMap & CartoDB',
  subdomains: 'abcd',
  maxZoom: 19
}).addTo(map);

// ENG + SCO
const SPECIAL_FLAGS = {
  england: '🏴󠁧󠁢󠁥󠁮󠁧󠁿',
  scotland: '🏴󠁧󠁢󠁳󠁣󠁴󠁿',
};

// FLAG EMOJI
function getFlag(code) {
  if (!code) return '🌐';
  const key = code.trim().toLowerCase();
  if (SPECIAL_FLAGS[key]) return SPECIAL_FLAGS[key];
  return code
    .trim()
    .toUpperCase()
    .replace(/./g, char => String.fromCodePoint(127397 + char.charCodeAt()));
}

// STORE MATCHES GLOBALLY
let allMatches = [];

// RENDER MATCHES FOR A CLICKED TEAM
function renderMatches(teamName) {
  const container = document.getElementById('matches-container');
  if (!container) return;

  const teamMatches = allMatches.filter(m =>
    m.home_team === teamName || m.away_team === teamName
  );

  if (teamMatches.length === 0) {
    container.innerHTML = '<p class="no-matches">No matches scheduled</p>';
    return;
  }

  container.innerHTML = `
    <h4 class="matches-title">Matches</h4>
    ${teamMatches.map(m => `
      <div class="match-row">
              <div class="match-date">${m.date}</div>
        <div class="match-teams">
          <span class="match-team">${getFlag(m.home_flag)} ${m.home_team}</span>
          <span class="match-score">${m.score} <span class="match-status">${m.status}</span></span>
          <span class="match-team right">${getFlag(m.away_flag)} ${m.away_team}</span>
        </div>
      </div>
    `).join('')}
  `;
}

// LOAD MATCHES CSV
Papa.parse('data/matches.csv', {
  header: true,
  download: true,
  transformHeader: h => h.replace(/\uFEFF/g, '').trim(),
  complete: function(results) {
    allMatches = results.data;
  },
  error: function(err) {
    console.error('Matches CSV error:', err);
  }
});

// GROUP COLORS
const groupColors = {
  A: "#e41a1c",
  B: "#377eb8",
  C: "#4daf4a",
  D: "#984ea3",
  E: "#ff7f00",
  F: "#ffff33",
  G: "#a65628",
  H: "#f781bf",
  I: "#bcbcbc",
  J: "#92f0a3",
  K: "#81c6f7",
  L: "#000000"
};

const groupLayers = {};

Object.keys(groupColors).forEach(group => {
  groupLayers[group] = L.layerGroup().addTo(map);
});

// LOAD TEAM DATA CSV
Papa.parse('data/team_data.csv', {
  header: true,
  download: true,
  transformHeader: h => h.replace(/\uFEFF/g, '').trim(),

  complete: function(results) {

    console.log("Rows loaded:", results.data.length);

    results.data.forEach(t => {

      if (!t.team) return;

      const flag = getFlag(t.flag);
      const lat = parseFloat(t.lat);
      const lng = parseFloat(t.long);
      const group = (t.group || "").trim();

      if (isNaN(lat) || isNaN(lng)) return;

      const color = groupColors[group] || "gray";

      const marker = L.circleMarker([lat, lng], {
        radius: 6,
        color: "#000000",
        weight: 0.5,
        fillColor: color,
        fillOpacity: 1
      });

      if (groupLayers[group]) {
        marker.addTo(groupLayers[group]);
      }

      marker.on('click', () => {

        document.getElementById('facility-image').src =
          t.facility_img ? `img/${t.facility_img}` : '';

        document.getElementById('facility-name').textContent =
          t.facility || '';

        document.getElementById('team-name').textContent =
          t.team || '';

        document.getElementById('city-name').textContent =
          t.city || '';

        document.getElementById('notes').textContent =
          t.notes || '';

        document.getElementById('team-flag').textContent =
          flag || '';

        document.getElementById('info-panel').classList.remove('hidden');

        // RENDER THIS TEAM'S MATCHES
        renderMatches(t.team);

      });
    });

    // LEGEND
    const activeGroups = new Set(Object.keys(groupColors));

    const legend = L.control({ position: 'topright' });

    legend.onAdd = function () {

      const div = L.DomUtil.create('div', 'legend');
      div.innerHTML = '<h4>Groups</h4>';

      Object.entries(groupColors).forEach(([group, color]) => {

        const row = document.createElement('div');
        row.className = 'legend-item';

        row.innerHTML = `
          <span class="legend-color" style="background:${color}"></span>
          Group ${group}
        `;

        row.addEventListener('click', function () {

          const isOnlyVisible =
            activeGroups.size === 1 &&
            activeGroups.has(group);

          if (isOnlyVisible) {
            Object.keys(groupLayers).forEach(g => {
              map.addLayer(groupLayers[g]);
            });
            activeGroups.clear();
            Object.keys(groupLayers).forEach(g => {
              activeGroups.add(g);
            });
            document.querySelectorAll('.legend-item')
              .forEach(item => item.classList.remove('inactive'));
            return;
          }

          Object.keys(groupLayers).forEach(g => {
            if (g === group) {
              map.addLayer(groupLayers[g]);
              activeGroups.add(g);
            } else {
              map.removeLayer(groupLayers[g]);
              activeGroups.delete(g);
            }
          });

          document.querySelectorAll('.legend-item')
            .forEach(item => item.classList.add('inactive'));

          row.classList.remove('inactive');

        });

        div.appendChild(row);

      });

      return div;
    };

    legend.addTo(map);

  },

  error: function(err) {
    console.error(err);
  }

});
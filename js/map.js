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

// RUNS THE CSV FILE FOR DATA
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
      })
      //.bindPopup(popupContent);

      // Add marker to the correct group layer
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

        //document.getElementById('field-type').textContent =
          //t.field_comp || '';

        document.getElementById('notes').textContent =
          t.notes || '';

        document.getElementById('team-flag').textContent =
          flag || '';

        document
          .getElementById('info-panel')
          .classList.remove('hidden');
      });
    });
  


    // LEGEND
   const activeGroups = new Set(Object.keys(groupColors));

const legend = L.control({
  position: 'topright'
});

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

        document
          .querySelectorAll('.legend-item')
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

      document
        .querySelectorAll('.legend-item')
        .forEach(item => item.classList.add('inactive'));

      row.classList.remove('inactive');

    });

    div.appendChild(row);

  });

  return div;
};

legend.addTo(map);

  }, // end complete

  error: function(err) {
    console.error(err);
  }

}); // end Papa.parse
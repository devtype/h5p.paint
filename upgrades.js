var H5PUpgrades = H5PUpgrades || {};
H5PUpgrades['H5P.Paint'] = (function () {
  var DEFAULT_PALETTE_COLORS = [
    '#e11d48',
    '#ea580c',
    '#ca8a04',
    '#16a34a',
    '#2563eb'
  ];

  function normalizeHexColor(value) {
    if (typeof value !== 'string') {
      return null;
    }
    if (/^#[0-9a-fA-F]{6}$/.test(value)) {
      return value.toLowerCase();
    }
    if (/^[0-9a-fA-F]{6}$/.test(value)) {
      return '#' + value.toLowerCase();
    }
    return null;
  }

  function listToGroup(paletteColors) {
    var group = {};
    var index;

    for (index = 0; index < paletteColors.length && index < 5; index++) {
      var entry = paletteColors[index];
      var color = typeof entry === 'string' ? entry : entry && entry.color;
      color = normalizeHexColor(color);
      if (!color) {
        color = DEFAULT_PALETTE_COLORS[index % DEFAULT_PALETTE_COLORS.length];
      }
      group['color' + (index + 1)] = color;
    }

    for (; index < DEFAULT_PALETTE_COLORS.length; index++) {
      group['color' + (index + 1)] = DEFAULT_PALETTE_COLORS[index];
    }

    return group;
  }

  function trimPaletteGroup(paletteColors) {
    if (!paletteColors || typeof paletteColors !== 'object' || Array.isArray(paletteColors)) {
      return paletteColors;
    }

    var trimmed = {};
    var index;
    for (index = 1; index <= 5; index++) {
      var key = 'color' + index;
      var color = normalizeHexColor(paletteColors[key]);
      if (color) {
        trimmed[key] = color;
      }
    }
    return trimmed;
  }

  return [
    {
      version: { major: 0, minor: 7, patch: 2 },
      up: function (parameters, finished) {
        var brushDefaults = parameters.canvas && parameters.canvas.brushDefaults;
        if (
          brushDefaults
          && brushDefaults.colorMode === 'palette'
          && Array.isArray(brushDefaults.paletteColors)
        ) {
          brushDefaults.paletteColors = listToGroup(brushDefaults.paletteColors);
        }
        finished(null, parameters);
      }
    },
    {
      version: { major: 0, minor: 7, patch: 4 },
      up: function (parameters, finished) {
        var brushDefaults = parameters.canvas && parameters.canvas.brushDefaults;
        if (brushDefaults && brushDefaults.colorMode === 'palette' && brushDefaults.paletteColors) {
          brushDefaults.paletteColors = trimPaletteGroup(brushDefaults.paletteColors);
        }
        finished(null, parameters);
      }
    }
  ];
})();

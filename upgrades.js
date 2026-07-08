var H5PUpgrades = H5PUpgrades || {};
H5PUpgrades['H5P.Paint'] = (function () {
  var DEFAULT_PALETTE_COLORS = [
    '#e11d48',
    '#ea580c',
    '#ca8a04',
    '#16a34a',
    '#2563eb',
    '#7c3aed'
  ];

  function isValidHexColor(value) {
    return typeof value === 'string' && /^#[0-9a-fA-F]{6}$/.test(value);
  }

  function listToGroup(paletteColors) {
    var group = {};
    var index;

    for (index = 0; index < paletteColors.length; index++) {
      var entry = paletteColors[index];
      var color = typeof entry === 'string' ? entry : entry && entry.color;
      if (!isValidHexColor(color)) {
        color = DEFAULT_PALETTE_COLORS[index % DEFAULT_PALETTE_COLORS.length];
      }
      group['color' + (index + 1)] = color;
    }

    for (; index < DEFAULT_PALETTE_COLORS.length; index++) {
      group['color' + (index + 1)] = DEFAULT_PALETTE_COLORS[index];
    }

    return group;
  }

  return [{
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
  }];
})();

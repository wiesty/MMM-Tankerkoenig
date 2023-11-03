Module.register("MMM-Tankerkoenig", {
  defaults: {
    apiKey: "00000000-0000-0000-0000-000000000002",
    updateInterval: 600000,
    stationNames: {
      "24a381e3-0d72-416d-bfd8-b2f65f6e5802": "Esso Tankstelle",
      "474e5046-deaf-4f9b-9a32-9797b778f047": "Total Berlin"
    },
    fuelTypes: ["e5", "e10", "diesel"]
  },

  getStyles: function () {
    return ["MMM-Tankerkoenig.css"];
  },

  // Override start method
  start: function () {
    this.loaded = false;
    this.prices = {};
    this.url = `https://creativecommons.tankerkoenig.de/json/prices.php?apikey=${
      this.config.apiKey
    }&ids=${Object.keys(this.config.stationNames).join(",")}`;
    this.getData();
    setInterval(() => {
      this.getData();
    }, this.config.updateInterval);
  },

  getData: async function () {
    try {
      const response = await fetch(this.url);
      const data = await response.json();

      if (data.ok) {
        this.prices = data.prices;
        this.loaded = true;
        this.updateDom();
      } else {
        Log.error("Fehler beim Abrufen der Daten von Tankerkoenig API.");
      }
    } catch (error) {
      Log.error(`Fehler beim Abrufen der Daten von Tankerkoenig API: ${error}`);
    }
  },

  getHeader: function () {
    return "Tankerk&ouml;nig";
  },

  getDom: function () {
    var wrapper = document.createElement("table");
    wrapper.className = "small tanker-table";

    if (!this.loaded) {
      wrapper.innerHTML = "Lade Spritpreise...";
      wrapper.className = "dimmed light";
      return wrapper;
    }

    // Header Row
    var headerRow = document.createElement("tr");
    var stationNameHeader = document.createElement("th");
    stationNameHeader.innerHTML = "Tankstelle";
    headerRow.appendChild(stationNameHeader);
    var statusHeader = document.createElement("th");
    statusHeader.innerHTML = "Status";
    headerRow.appendChild(statusHeader);

    for (let fuelType of this.config.fuelTypes) {
      var fuelTypeHeader = document.createElement("th");
      fuelTypeHeader.innerHTML = fuelType.toUpperCase();
      headerRow.appendChild(fuelTypeHeader);
    }

    wrapper.appendChild(headerRow);

    // Data Rows
    for (var stationId in this.prices) {
      var stationData = this.prices[stationId];
      var row = document.createElement("tr");

      // Station Name
      var stationName = document.createElement("td");
      stationName.innerHTML = this.config.stationNames[stationId];
      row.appendChild(stationName);

      // Status (open or closed)
      var status = document.createElement("td");
      status.innerHTML = stationData.status === "open" ? "geöffnet ✓" : "geschlossen ✗";
      status.style.color = stationData.status === "open" ? "green" : "red";
      row.appendChild(status);

      // Fuel Prices
      for (let fuelType of this.config.fuelTypes) {
        var fuelPrice = document.createElement("td");
        if (stationData[fuelType] !== undefined) {
          fuelPrice.innerHTML = `${stationData[fuelType].toFixed(2)} €`;
        } else {
          fuelPrice.innerHTML = "-";
        }
        row.appendChild(fuelPrice);
      }

      wrapper.appendChild(row);
    }

    return wrapper;
  }
});

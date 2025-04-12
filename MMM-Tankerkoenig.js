Module.register("MMM-Tankerkoenig", {
  defaults: {
    apiKey: "00000000-0000-0000-0000-000000000002",
    updateInterval: 600000,
    stationNames: {
      "24a381e3-0d72-416d-bfd8-b2f65f6e5802": "Esso Tankstelle",
      "474e5046-deaf-4f9b-9a32-9797b778f047": "Total Berlin"
    },
    fuelTypes: ["e5", "e10", "diesel"],
    sortOptions: {
      sortBy: 'stationOrder', // 'name' | 'price'| 'stationOrder'
      direction: 'asc',       // 'asc' | 'desc'
      fuelType: 'e5'          // used only for sortBy === 'price'
    },
    options: {
      priceRound: "down"      // 'up', 'down', 'none', 'commercial'
    }
  },

  sortStations(prices) {
    let stations = Object.entries(prices)
      .map(([id, data]) => {
        return {
          id,
          ...data,
          name: this.config.stationNames[id] || 'Unknown',
        };
      });

    if (this.config.sortOptions) {
      const { sortBy, direction, fuelType } = this.config.sortOptions;
      if (sortBy === 'name') {
        stations.sort((a, b) =>
          direction === 'asc'
            ? a.name.localeCompare(b.name)
            : b.name.localeCompare(a.name)
        );
      } else if (sortBy === 'price') {
        stations.sort((a, b) => {
          const priceA = typeof a[fuelType] === 'number' ? a[fuelType] : Infinity;
          const priceB = typeof b[fuelType] === 'number' ? b[fuelType] : Infinity;

          return direction === 'asc'
            ? priceA - priceB
            : priceB - priceA;
        });
      } else if (sortBy === 'stationOrder') {
        const nameOrder = Object.keys(this.config.stationNames);
        stations.sort((a, b) =>
          nameOrder.indexOf(a.id) - nameOrder.indexOf(b.id)
        );
      }
    }
    return stations;
  },

  roundPrice(num) {
    let result = num.toFixed(2);

    if (this.config.options.priceRound) {
      switch (this.config.options.priceRound) {
        case "up":
          result = (Math.ceil(num * 100) / 100).toFixed(2);
          break;
        case "down":
          result = (Math.floor(num * 100) / 100).toFixed(2);
          break;
        case "none":
          result = num.toFixed(3);
          break;
        case "commercial":
          result = num.toFixed(2);
      }
    }

    return result;
  },

  getStyles: function () {
    return ["MMM-Tankerkoenig.css"];
  },

  // Override start method
  start: function () {
    this.loaded = false;
    this.stationArray = [];
    this.url = `https://creativecommons.tankerkoenig.de/json/prices.php?apikey=${this.config.apiKey
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
        this.stationArray = this.sortStations(data.prices);
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
    for (var stationData of this.stationArray) {
      var row = document.createElement("tr");

      // Station Name
      var stationName = document.createElement("td");
      stationName.innerHTML = stationData.name;
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
          fuelPrice.innerHTML = `${this.roundPrice(stationData[fuelType])} €`;
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

var data;   // data is a global variable for stock data array
var ovrPL;  // ovrPL is a global variable for realized P/L

// draws the table to div tableDiv
function drawTable() {
    // create table with persistent data
    var tableHTML = "";
    tableHTML += '<table class="table table-striped">';
    tableHTML += '<tr>';
    tableHTML += '<th>ticker</th><th>shares</th><th>averagePx</th><th>lastPx</th><th>PL</th>';
    tableHTML += '</tr>';
    // for each entry in data array, create row
    $.each(data, function (index, value) {
        tableHTML += '<tr>';
        var flag = 0;
        // for each column in row (each field of data entry)
        $.each(value, function (index2, value2) {
            // format each column (case 0 = ticker, case 1 = shares, case 4 = PL)
            switch (flag) {
                case 0:
                    tableHTML += '<td class="tt">' + value2 + '</td>';
                    break;
                case 1:
                    tableHTML += '<td class="ts">' + value2.toLocaleString("en-US", { maximumFractionDigits: 0, minimumFractionDigits: 0 }); + '</td>';
                    break;
                case 4:
                    if (parseFloat(value2) < 0) {
                        tableHTML += '<td class="tred">' + value2.toLocaleString("en-US", { maximumFractionDigits: 2, minimumFractionDigits: 2 }); + '</td>';
                    } else {
                        tableHTML += '<td class="tgreen">' + value2.toLocaleString("en-US", { maximumFractionDigits: 2, minimumFractionDigits: 2 }); + '</td>';
                    }
                    break;
                default:
                    tableHTML += '<td>' + value2.toLocaleString("en-US", { maximumFractionDigits: 2, minimumFractionDigits: 2 }); + '</td>';
                    break;
            }
            flag++;
        });
        // end for
        tableHTML += '</tr>';
    });
    // end for
    tableHTML += '</table>';
    // write table to page (overwrites the div)
    document.getElementById('tableDiv').innerHTML = tableHTML;
}

// draws the Profit/Loss to div plDiv
function drawPL() {
    var plDiv = document.getElementById('plDiv');
    ovrPL < 0 ? plDiv.style.color = 'red' : plDiv.style.color = 'green';
    plDiv.innerHTML = "<h3>Realized P/L: " + ovrPL.toLocaleString("en-US", { maximumFractionDigits: 2, minimumFractionDigits: 2 }); + "</h3>";
}

// draws the UNREALIZED Profit/Loss to div fakePlDiv
function drawFakePL() {
    var plDiv = document.getElementById('fakePlDiv');
    var fakePL = 0;
    // for each entry in holdings array, add up unrealized P/L
    data.forEach(element => {
        fakePL += element.PL;
    });
    fakePL < 0 ? plDiv.style.color = 'red' : plDiv.style.color = 'green';
    plDiv.innerHTML = "<h3>Unrealized P/L: " + fakePL.toLocaleString("en-US", { maximumFractionDigits: 2, minimumFractionDigits: 2 }); + "</h3>";
}

// draws the last time prices were updated to div updatedDiv
function drawUpdateTime() {
    var dString = window.localStorage.getItem('dString');
    var updatedDiv = document.getElementById("updatedDiv");
    updatedDiv.innerHTML = "<p>last updated at " + dString + "</p>";
}

// draws all the elements to the page (overwrites with new changes)
function drawAll() {
    drawPL();
    drawFakePL();
    drawUpdateTime();
    drawTable();
}

window.onload = function () {
    // reads either localStorage or dummy data
    if (window.localStorage.getItem('data') == null) {
        data = JSON.parse(`[
    {
        "ticker": "AAPL",
        "shares": 10,
        "averagePx": 110.25,
        "lastPx": 110.25,
        "PL": 0
        
    },
    {
        "ticker": "AMZN",
        "shares": 10,
        "averagePx": 100.00,
        "lastPx": 100.00,
        "PL": 0
    }]`
        );
    } else {
        data = JSON.parse(window.localStorage.getItem('data'));
    }
    if (window.localStorage.getItem('ovrPL') == undefined) {
        ovrPL = 0;
    } else {
        ovrPL = window.localStorage.getItem('ovrPL');
    }

    // debug
    console.log(data);
    console.log(ovrPL);
    //
    drawAll();
}

// adds holdings to portfolio (existing or new)
function buyOrder() {
    // gets values from form
    var ticker = document.getElementById("tickerVal").value.toUpperCase();
    var shares = document.getElementById("qtyVal").value;
    var price = document.getElementById("priceVal").value;
    // attempts to find existing entry and updates shares and average price
    var found = false;
    data.forEach(element => {
        if (element.ticker == ticker) {
            found = true;
            var newShares = element.shares + parseInt(shares);
            var newPrice = (element.averagePx * element.shares + parseInt(shares) * price) / newShares;
            element.averagePx = newPrice;
            element.shares = newShares;
        }

    });
    // if no existing entry, creates new entry
    if (!found) {
        var newEntry = {
            "ticker": ticker,
            "shares": shares,
            "averagePx": price,
            "lastPx": 0,
            "PL": 0
        };
        data.push(newEntry);
    }
    // updates pages
    save();
    updatePrices();
}

// removes holdings from portfolio and updates rlzd P/L
function sellOrder() {
    // gets values from form
    var ticker = document.getElementById("tickerVal").value.toUpperCase();
    var shares = document.getElementById("qtyVal").value;
    var price = document.getElementById("priceVal").value;
    // attempts to find existing entry and updates shares and average price
    var found = false;
    data.forEach(element => {
        if (element.ticker == ticker) {
            found = true;
            var newShares = element.shares - parseInt(shares);
            //  prevents selling more shares than owned
            if (newShares < 0) {
                alert("You don't have enough shares to sell!");
                return;
            }
            ovrPL = parseFloat(ovrPL) + ((price - element.averagePx) * shares);
            //ovrPL += (element.PL * (shares / element.shares));
            element.shares = newShares;
            if (newShares == 0) {
                // generic array remove function
                const index = data.indexOf(element);
                if (index > -1) { // only splice array when item is found
                    data.splice(index, 1); // 2nd parameter means remove one item only
                }
            }
        }
    });
    // if no existing entry, alerts
    if (!found) {
        alert("Ticker not found (maybe check spelling of ticker)");
    }
    save();
    updatePrices();
}

// updates prices of all holdings
function updatePrices() {
    data.forEach(element => {
        getPriceViaApi(element);
    });
}

// gets/updates current price of ticker from API
function getPriceViaApi(element) {
    var tick = element.ticker;
    // construch url for API call
    var url = 'https://cloud.iexapis.com/stable/stock/' + tick + '/quote?token=pk_b690d064c4d846889899897a577062fe';
    $.getJSON(url, function (data) {
        // updates holdings' lastPx and unrlzd PL
        var currPx = data.iexClose;
        element.lastPx = currPx;
        // console.log(element.ticker + " " + currPx);
        element.PL = (currPx - element.averagePx) * element.shares;
        drawAll();
        save();
    });
}

// saves data to localStorage
function save() {
    window.localStorage.setItem("data", JSON.stringify(data));
    window.localStorage.setItem("ovrPL", ovrPL);
    window.localStorage.setItem("dString", new Date().toISOString());
    drawAll(); // dont know if this is needed 
}



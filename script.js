var data;
var ovrPL;

function drawTable() {
    var tableHTML = "";

    tableHTML += '<table class="table table-striped">';
    tableHTML += '<tr>';
    var flag = 0;

    tableHTML += '<th>ticker</th><th>shares</th><th>averagePx</th><th>lastPx</th><th>PL</th>';

    tableHTML += '</tr>';
    // for each row
    $.each(data, function (index, value) {
        tableHTML += '<tr>';
        var flag = 0;
        // for each column in row
        $.each(value, function (index2, value2) {
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
        // end
        tableHTML += '</tr>';
    });
    // end
    tableHTML += '</table>';
    document.getElementById('tableDiv').innerHTML = tableHTML;
}

function drawPL() {
    var plDiv = document.getElementById('plDiv');
    ovrPL < 0 ? plDiv.style.color = 'red' : plDiv.style.color = 'green';
    plDiv.innerHTML = `<h3>Overall P/L: ${ovrPL}</h3>`;
}

window.onload = function () {
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

    console.log(data);
    console.log(ovrPL);

    drawPL();
    drawTable();
}

    function buyOrder() {
        var ticker = document.getElementById("tickerVal").value.toUpperCase();
        var shares = document.getElementById("qtyVal").value;
        var price = document.getElementById("priceVal").value;
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
        save();
        location.reload();
    }

    function updatePrices() {
        data.forEach(element => {
            getPriceApi(element);
        });

    }

    function getPriceApi(element) {
        var tick = element.ticker;
        var url = 'https://cloud.iexapis.com/stable/stock/' + tick + '/quote?token=pk_b690d064c4d846889899897a577062fe';
        $.getJSON(url, function (data) {
            var currPx = data.iexClose;
            element.lastPx = currPx;
              console.log(element.ticker + " " + currPx);
            element.PL = (currPx - element.averagePx) * element.shares;
            drawTable();
            save();
        });
    }

    function save() {
        window.localStorage.setItem("data", JSON.stringify(data));
        window.localStorage.setItem("ovrPL", ovrPL);
    }



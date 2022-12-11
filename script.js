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
    plDiv.innerHTML = "<h3>Realized P/L: " + ovrPL.toLocaleString("en-US", { maximumFractionDigits: 2, minimumFractionDigits: 2 }); + "</h3>";
}

function drawFakePL() {
    var plDiv = document.getElementById('fakePlDiv');
    var fakePL = 0;
    data.forEach(element => {
        fakePL += element.PL;
    });
    fakePL < 0 ? plDiv.style.color = 'red' : plDiv.style.color = 'green';
    plDiv.innerHTML = "<h3>Unrealized P/L: " + fakePL.toLocaleString("en-US", { maximumFractionDigits: 2, minimumFractionDigits: 2 }); + "</h3>";
}

function drawUpdateTime() {
    var dString = window.localStorage.getItem('dString');
    var updatedDiv = document.getElementById("updatedDiv");
    updatedDiv.innerHTML = "<p>last updated at "+ dString +"</p>";
}

function drawAll() {
    drawPL();
    drawFakePL();
    drawUpdateTime();
    drawTable();
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

    drawAll();
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
        updatePrices();
    }

    function sellOrder() {
        //updatePrices();
        var ticker = document.getElementById("tickerVal").value.toUpperCase();
        var shares = document.getElementById("qtyVal").value;
        var price = document.getElementById("priceVal").value;

        data.forEach(element => {
            if (element.ticker == ticker) {
                found = true;
                var newShares = element.shares - parseInt(shares);
                if (newShares < 0) {
                    alert("You don't have enough shares to sell!");
                    return;
                }
                ovrPL = parseFloat(ovrPL) + ((price - element.averagePx) * shares);
                //ovrPL += (element.PL * (shares / element.shares));
                element.shares = newShares;
                if (newShares == 0) {
                    const index = data.indexOf(element);
                    if (index > -1) { // only splice array when item is found
                        data.splice(index, 1); // 2nd parameter means remove one item only
                    }

                }
            }
        });
        if (!found) {
            alert("Ticker not found");
        }
        save();
        location.reload();
        updatePrices();
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
            drawAll();
            save();
        });
    }

    function save() {
        window.localStorage.setItem("data", JSON.stringify(data));
        window.localStorage.setItem("ovrPL", ovrPL);
        window.localStorage.setItem("dString", new Date().toISOString());
        drawAll();
    }



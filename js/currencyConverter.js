
/**
 * Currency Converter
 * v0.2
 * (c) Kamil Barański
 */

let baseCurrency, currenciesExchangeRates,
    currenciesActiveArray,
    currenciesPriorityDefault,
    headerRow, valueRow,
    statusText, readyMessage,
    timestampTime, timestampParagraph,
    apiKey, apiUrl;

initcurrencyConverter();

function initcurrencyConverter() {
    initializeVariables();
    recreateTable();
    downloadExchangeRates();
    document.querySelector('.js-amount1').focus();
}

function initializeVariables() {
    statusText = document.querySelector('.js-status');
    statusMessage('Trwa inicjalizacja...');
    readyMessage = 'Konwerter gotowy do działania!';

    timestampTime = document.querySelector('.js-timestampTime');
    timestampParagraph = document.querySelector('.js-timestampParagraph');

    currenciesActiveArray = ['USD', 'PLN', 'EUR']
    startingAmount = 100;

    headerRow = document.querySelector('.js-headerRow');
    valueRow = document.querySelector('.js-valueRow');

    updateButton = document.querySelector('.js-downloadExchangeRates');
    updateButton.addEventListener('click', downloadExchangeRates);

    apiKey = 'd7ec26bbd8a1423b886b0454c4cbd0db';
    apiUrl = 'https://openexchangerates.org/api/latest.json?app_id=' + apiKey;

    // backup table
    baseCurrency = 'USD';
    currenciesExchangeRates = {
        USD: 1,
        EUR: 0.888462,
        PLN: 3.9485
    };
    letsAddEurogabki();

    // priority for adding new currencies (for addColumn)
    currenciesPriorityDefault = ['USD', 'EUR', 'PLN', 'EGB', 'GBP', 'CHF'];

    cellHeaderBackgroundColorOpacity = '30';      // '00'-'ff'
    cellValueBackgroundColorOpacity = '70';      // '00'-'ff'
}

function recreateTable() {
    statusMessage('Przygotowuję tabelę...');
    recreateTableHTMLString();
    recreateTableEventListeners();
    colorizeTable();
    statusMessage('Tabela gotowa...');
}

function recreateTableHTMLString() {
    let headerHTMLString = '';
    let valuesHTMLString = '';
    let columnIndex = 1;

    for (let currency of currenciesActiveArray) {
        headerHTMLString += `
		  <th class="currencyConverter__tableCell js-columnHeader${columnIndex}" scope="col">
            Waluta ${columnIndex}
            <select class="currencyConverter__formField js-select${columnIndex}">
              ${createOptionsHTMLString(currency)}
            </select>
            <div class="currencyConverter__plusMinusContainer">
			  <button class="currencyConverter__plusMinusButton js-minus${columnIndex}" type="button"${currenciesActiveArray.length <= 2 ? ' disabled' : ''}>&minus;</button>`
            + `<button class="currencyConverter__plusMinusButton js-plus${columnIndex}" type="button">&plus;</button>
            </div>
          </th>`;

        valuesHTMLString += `
        <td class="currencyConverter__tableCell js-columnValue${columnIndex}">
          Kwota ${columnIndex}
          <input type="number" value="${
            convertToAnyCurrency(startingAmount, currenciesActiveArray[0], currenciesActiveArray[columnIndex - 1]).toFixed(2)
            }" class="currencyConverter__formField js-amount${columnIndex}" step="0.01" placeholder="Wpisz kwotę">
        </td>`;

        columnIndex++
    };
    headerRow.innerHTML = headerHTMLString;
    valueRow.innerHTML = valuesHTMLString;
}

function createOptionsHTMLString(selectedCurrency) {
    let optionsHTMLString = '';
    let currencies = Object.keys(currenciesExchangeRates);
    for (let currency of currencies) {
        optionsHTMLString += `<option${currency === selectedCurrency ? ' selected' : ''}>${currency}</option>`;
    }
    return optionsHTMLString;
}

function colorizeTable() {
    for (let columnIndex = 1; columnIndex <= currenciesActiveArray.length; columnIndex++) {
        colorizeColumn(columnIndex);
    };
}

function colorizeColumn(columnIndex) {
    document.querySelector('.js-columnHeader' + columnIndex).style.backgroundColor = getCurrencyColor(currenciesActiveArray[columnIndex - 1], cellHeaderBackgroundColorOpacity);
    document.querySelector('.js-columnValue' + columnIndex).style.backgroundColor = getCurrencyColor(currenciesActiveArray[columnIndex - 1], cellValueBackgroundColorOpacity);
};

function getCurrencyColor(currency, backgroundColorOpacity) {
    // just in case
    currency = currency.toUpperCase();

    // A = 65; Z = 90; Z - A = 25; [0..25]*10 = [0..250];
    r = (currency.charCodeAt(0) - 65) * 10;
    g = (currency.charCodeAt(1) - 65) * 10;
    b = (currency.charCodeAt(2) - 65) * 10;
    return '#' + decimalToHex(r, 2) + decimalToHex(g, 2) + decimalToHex(b, 2) + backgroundColorOpacity;
}

function decimalToHex(d, padding) {
    let hex = Number(d).toString(16);
    padding = typeof (padding) === "undefined" || padding === null ? padding = 2 : padding;
    while (hex.length < padding) {
        hex = "0" + hex;
    };
    return hex;
}

function recreateTableEventListeners() {
    for (let columnIndex = 1; columnIndex <= currenciesActiveArray.length; columnIndex++) {
        document.querySelector('.js-amount' + columnIndex).addEventListener('input', () => { recalculateForeignValues(eval(columnIndex)); });
        document.querySelector('.js-select' + columnIndex).addEventListener('input', () => { handleCurrencyChange(eval(columnIndex)); });
        document.querySelector('.js-minus' + columnIndex).addEventListener('click', () => { removeColumn(eval(columnIndex)); });
        document.querySelector('.js-plus' + columnIndex).addEventListener('click', () => { addColumn(eval(columnIndex)); });
    };
}

function handleCurrencyChange(columnIndex) {
    currenciesActiveArray.splice(columnIndex - 1, 1, document.querySelector('.js-select' + columnIndex).value);
    colorizeColumn(columnIndex);
    recalculateForeignValues(1);
}

function removeColumn(columnIndex) {
    // we want two columns to stay
    if (currenciesActiveArray.length > 2) {
        if (columnIndex == 1) {
            startingAmount = document.querySelector('.js-amount2').value;
        } else {
            startingAmount = document.querySelector('.js-amount1').value;
        }
        currenciesActiveArray.splice(columnIndex - 1, 1);
        recreateTable();
        statusMessage(readyMessage);
    };
}

function addColumn(columnIndex) {
    // we don't want too many columns, even if they work.
    if (currenciesActiveArray.length < Object.keys(currenciesExchangeRates).length) {
        startingAmount = document.querySelector('.js-amount1').value;
        currenciesActiveArray.splice(columnIndex, 0, findFirstUnusedCurrency());
        recreateTable();
        statusMessage(readyMessage);
    };
}

function findFirstUnusedCurrency() {
    let currenciesPriority = setCurrenciesPriority();
    for (let currency of currenciesPriority) {
        if (!currenciesActiveArray.includes(currency)) {
            return currency;
        };
    };
    return currenciesPriority[0];
};

function setCurrenciesPriority() {
    let temporaryCurrenciesPriority = [];
    // delete priority currencies not found in currenciesExchangeRates
    for (let currency of currenciesPriorityDefault) {
        if (Object.keys(currenciesExchangeRates).includes(currency)) {
            temporaryCurrenciesPriority.push(currency);
        };
    };
    return temporaryCurrenciesPriority.concat(Object.keys(currenciesExchangeRates)).filter(onlyUnique);
}

function onlyUnique(value, index, self) {
    return self.indexOf(value) === index;
}

function recalculateForeignValues(enteredFieldIndex) {
    let enteredAmount = document.querySelector('.js-amount' + enteredFieldIndex).value;
    let enteredCurrency = document.querySelector('.js-select' + enteredFieldIndex).value;
    for (let inputIndex = 1; inputIndex <= currenciesActiveArray.length; inputIndex++) {
        document.querySelector('.js-amount' + inputIndex).value = convertToAnyCurrency(enteredAmount, enteredCurrency, currenciesActiveArray[inputIndex - 1]).toFixed(2);
    };
}

function convertToAnyCurrency(amount, currencyFrom, currencyTo) {
    return convertToForeignCurrency(convertToBaseCurrency(amount, currencyFrom), currencyTo);
}

function convertToBaseCurrency(amount, currencyName) {
    return Number(amount) / Number(currenciesExchangeRates[currencyName]);
}

function convertToForeignCurrency(amount, currencyName) {
    return Number(amount) * Number(currenciesExchangeRates[currencyName]);
}

function downloadExchangeRates() {
    statusMessage('Pobieram kursy walut...');

    setTimeout(() => {

        fetch(apiUrl)
            .then(function (response) {
                if (!response.ok) {
                    // do we need to handle 3xx ?
                    statusMessage(`BŁĄD: Odpowiedź to nie HTTP 200 OK! (${response.status}: ${response.statusText})`, true);
                }
                return response.text();     // but still, there might be something else?
            })
            .then(function (responseText) {
                checkIncomingExchangeRates(responseText);
            })

    }, 200);
}

function checkIncomingExchangeRates(data) {
    let currencyDataArray = parseJSONSafely(data);

    if (currencyDataArray === false) { return statusMessage('BŁĄD: W odpowiedzi nie otrzymaliśmy prawidłowego JSON!', true); }
    if (!currencyDataArray.rates) { return statusMessage('BŁĄD: W odpowiedzi nie otrzymaliśmy wymaganych danych!', true); }

    statusMessage('Kursy walut pobrane; aktualizuję dane...');

    currenciesExchangeRates = currencyDataArray.rates;
    letsAddEurogabki();

    currenciesActiveArray = checkIfAllVisibleCurrenciesAreInExchangeRates();
    recreateTable();

    let currencyDataArrayTimestamp = new Date(Number(currencyDataArray.timestamp) * 1000);
    timestampTime.innerHTML = `<time datetime="${currencyDataArrayTimestamp.toISOString()}">${currencyDataArrayTimestamp.toLocaleString()}</time>. `
        + `Łącznie ${Object.keys(currenciesExchangeRates).length} walut.`;
    timestampParagraph.classList.remove('currencyConverter--warning');
    statusMessage(readyMessage);
}

function letsAddEurogabki() {
    // 50 EGB = 5 PLN
    if (Object.keys(currenciesExchangeRates).includes('PLN')) {
        currenciesExchangeRates['EGB'] = Number(convertToForeignCurrency(10, 'PLN')).toFixed(4);
    };
    // shall we sort it?
};


function statusMessage(message, warning = false) {
    statusText.innerText = message;
    if (warning) {
        statusText.classList.add('currencyConverter--warning');
    } else {
        statusText.classList.remove('currencyConverter--warning');
    };
}

function checkIfAllVisibleCurrenciesAreInExchangeRates() {
    let temporaryCurrenciesArray = [];
    for (let currency of currenciesActiveArray) {
        if (Object.keys(currenciesExchangeRates).includes(currency)) {
            temporaryCurrenciesArray.push(currency);
        }
    }
    return temporaryCurrenciesArray;
}

function parseJSONSafely(str) {
    try {
        return JSON.parse(str);
    }
    catch (e) {
        console.log(e);
        return false;
    };
}

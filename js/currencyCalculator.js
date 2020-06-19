/**
 * Currency Calculator
 * v0.1
 * (c) Kamil Barański
 */

let statusText, timestamp, currency1Select, currency2Select, currency1Input, currency2Input, apiKey, apiUrl, baseCurrency, currenciesExchangeRates;

initCurrencyCalculator();

function initCurrencyCalculator() {
    initializeVariablesAndEventListeners();
    recreateCurrencyNamesInDom();
    downloadExchangeRates();
    currency1Input.focus();
}

function initializeVariablesAndEventListeners() {
    // initialize Variables
    statusText = document.querySelector('.js-status');
    timestampDate = document.querySelector('.js-timestampDate');
    timestampParagraph = document.querySelector('.js-timestampParagraph');
    currency1Select = document.querySelector('.js-currency1');
    currency2Select = document.querySelector('.js-currency2');
    currency1Input = document.querySelector('.js-amount1');
    currency2Input = document.querySelector('.js-amount2');
    apiKey = 'd7ec26bbd8a1423b886b0454c4cbd0db';
    apiUrl = 'https://openexchangerates.org/api/latest.json?app_id=' + apiKey;
    // backup table
    baseCurrency = 'USD';
    currenciesExchangeRates = {
        'USD': 1,
        'EUR': 0.888462,
        'PLN': 3.9485
    };

    // initialize EventListeners
    currency1Select.addEventListener('input', recalculate2);
    currency2Select.addEventListener('input', recalculate1);
    currency1Input.addEventListener('input', recalculate2);
    currency2Input.addEventListener('input', recalculate1);
    document.querySelector('.js-downloadExchangeRates').addEventListener('click', (event) => {
        event.preventDefault();
        downloadExchangeRates();
    });
}

function recalculate1() {
    recalculate(1);
}

function recalculate2() {
    recalculate(2);
}

function recalculate(currencyToCalculate) {
    let currencyFrom = currency1Select;
    let currencyTo = currency2Select;
    let amountFrom = currency1Input;
    let amountTo = currency2Input;
    if (currencyToCalculate === 1) {
        // swap values
        [currencyFrom, currencyTo] = [currencyTo, currencyFrom];
        [amountFrom, amountTo] = [amountTo, amountFrom];
    };

    // first, let's convert to base currency
    baseAmount = Number(amountFrom.value) / Number(currenciesExchangeRates[currencyFrom.value]);

    // I decided informing the user about basevalue isn't important.
    // statusText.innerText = amountFrom.value + ' ' + currencyFrom.value + ' to wartość bazowa: ' + baseAmount.toFixed(2) + ' ' + baseCurrency + '.';
    // statusText.classList.remove('currencyCalculator--warning');


    // then convert base value to destination currency
    destinationAmount = Number(baseAmount) * Number(currenciesExchangeRates[currencyTo.value]);
    amountTo.value = destinationAmount.toFixed(2);
}

function sleep(sleepDuration) {
    var now = new Date().getTime();
    while (new Date().getTime() < now + sleepDuration) { /* do nothing */ };
}

function downloadExchangeRates() {
    statusText.innerText = 'Pobieram kursy walut...';
    statusText.classList.remove('currencyCalculator--warning');
    sleep(200);     // (cause everybody should see something is happening)
    currencyCalculatorApiRequest = new XMLHttpRequest();
    currencyCalculatorApiRequest.open('GET', apiUrl);
    currencyCalculatorApiRequest.onreadystatechange = checkCurrencyCalculatorIncomingApiRequest;
    currencyCalculatorApiRequest.send();
}

function checkCurrencyCalculatorIncomingApiRequest() {
    if (currencyCalculatorApiRequest.readyState == 4) {
        if (currencyCalculatorApiRequest.status !== 200) {
            // todo: handling status 3xx etc.
            recalculate2();
            statusText.innerText = 'BŁĄD: Odpowiedź to nie HTTP 200 OK!';
            statusText.classList.add('currencyCalculator--warning');
            return;
        }
        let currencyDataArray = parseJSONSafely(currencyCalculatorApiRequest.responseText);
        if (currencyDataArray === false) {
            recalculate2();
            statusText.innerText = 'BŁĄD: W odpowiedzi nie otrzymaliśmy prawidłowego JSON!';
            statusText.classList.add('currencyCalculator--warning');
            return;
        }
        if (!currencyDataArray.rates) {
            recalculate2();
            statusText.innerText = 'BŁĄD: W odpowiedzi nie otrzymaliśmy wymaganych danych!';
            statusText.classList.add('currencyCalculator--warning');
            return;
        }
        statusText.innerText = 'Kursy walut pobrane; aktualizuję dane...';
        statusText.classList.remove('currencyCalculator--warning');

        currenciesExchangeRates = currencyDataArray.rates;
        currencyCalculatorApiRequest.kill;

        recreateCurrencyNamesInDom();

        let currencyDataArrayTimestamp = new Date(Number(currencyDataArray.timestamp) * 1000);
        timestampDate.innerText = currencyDataArrayTimestamp.toLocaleString() + '.';
        timestampParagraph.classList.remove('currencyCalculator--warning');
        statusText.innerText = 'Gotowy!';
        statusText.classList.remove('currencyCalculator--warning');
        recalculate2();
    };
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

function recreateCurrencyNamesInDom() {
    let currentSelectedCurrency1 = currency1Select.value;
    let currentSelectedCurrency2 = currency2Select.value;
    currency1Select.innerHTML = '';
    currency2Select.innerHTML = '';
    Object.keys(currenciesExchangeRates).forEach(function (currencyName) {
        currency1Select.appendChild(createOptionElementForSelect(currencyName, currencyName === currentSelectedCurrency1));
        currency2Select.appendChild(createOptionElementForSelect(currencyName, currencyName === currentSelectedCurrency2));
    });
}

function createOptionElementForSelect(value, isSelected) {
    option = document.createElement('OPTION');
    option.value = value;
    option.innerText = value;
    option.selected = isSelected;
    return option;
}

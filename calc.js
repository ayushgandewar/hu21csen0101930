const express = require('express');
const axios = require('axios');
const AUTH_TOKEN = "eyJhbGci0iJIUzI1NiIsInR5cCI6IkpXVCJ9eyJNYXBDbGFpbXMi0nsiZXhwIjoxNzI0NzM4NzI2LCJpYXQi0jE3MjQ3Mzg0MjYsImlzcyI6IkFmZm9yZG11ZC IsImpoaSI6IjA5Yzgw0WQ5LWFjM2EtNGQ0ZS04NTE3LTA0M2Y1ZjJINTAONSIsInN1YiI6ImFnYW5kZXdhQGdp dGFtLmluInosImNvbXBhbn10YW1lIjoiQWZmb3JtYWRhIiwiY2xpZW50SUQi0iIw0WM4MD1k0S1hYzNhLTRANG UtODUxNy0wNDNmNWYyZTUwNDUiLCJjbGllbnRTZWNyZXQi0iJGSUtMVVpKTG5WUE1hdGtGIiwib3duZXJ0YW11 IjoiQXl1c2giLCJvd251ckVtYWlsIjoiYWdhbmRld2FAZ210YW0uaW4iLCJyb2xsTm8i0iJIVTIxQ1NFTjAxMD E5MzAifQ.DYLORyuLywFj1rTvMQGdPr64LKd12-HUSXelFS1Lg68";
const app = express();
const port = 9876;

const WINDOW_SIZE = 10;

const baseNumberIds = ['primes', 'fibo', 'even', 'rand'];

const aliasToBase = {
    'p': 'primes',
    'primes': 'primes',
    'f': 'fibo',
    'fibo': 'fibo',
    'e': 'even',
    'even': 'even',
    'r': 'rand',
    'rand': 'rand',
};

const baseToURL = {
    'primes': 'http://20.244.56.144/test/primes',
    'fibo': 'http://20.244.56.144/test/fibo',
    'even': 'http://20.244.56.144/test/even',
    'rand': 'http://20.244.56.144/test/rand',
};

const numberWindows = new Map();
baseNumberIds.forEach(id => {
    numberWindows.set(id, []);
});

app.get('/numbers/:numberid', async (req, res) => {
    const { numberid } = req.params;

    const baseId = aliasToBase[numberid.toLowerCase()];
    if (!baseId) {
        return res.status(400).json({ error: 'Invalid number ID. Valid IDs are p, f, e, r or primes, fibo, even, rand.' });
    }

    const url = baseToURL[baseId];
    const currentWindow = numberWindows.get(baseId) || [];
    const windowPrevState = [...currentWindow]; 

    let numbersFetched = [];
    try {
        const response = await axios.get(url, { timeout: 450,
            headers: {
                'Authorization': `Bearer ${AUTH_TOKEN}` 
            }
         });

        if (response.status === 200 && response.data && Array.isArray(response.data.numbers)) {
            numbersFetched = response.data.numbers;

            numbersFetched.forEach(num => {
                if (!currentWindow.includes(num)) {
                    currentWindow.push(num);
                    if (currentWindow.length > WINDOW_SIZE) {
                        currentWindow.shift(); 
                    }
                }
            });

            numberWindows.set(baseId, currentWindow);
        }
    } catch (error) {
        numbersFetched = [];
    }

    const windowCurrState = [...currentWindow]; 

    let avg = 0.00;
    if (currentWindow.length > 0) {
        const sum = currentWindow.reduce((acc, val) => acc + val, 0);
        avg = parseFloat((sum / currentWindow.length).toFixed(2));
    }

    const responseObj = {
        windowPrevState: windowPrevState,
        windowCurrState: windowCurrState,
        numbers: numbersFetched,
        avg: avg,
    };

    res.json(responseObj);
});

app.listen(port, () => {
    console.log(`Average Calculator microservice is running at http://localhost:${port}`);
});
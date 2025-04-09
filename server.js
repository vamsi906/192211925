import express from 'express';
import fetch from 'node-fetch';

const app = express();
const port = 3000;
const WINDOW_SIZE = 10;
const API_TIMEOUT = 500;
const BASE_URL = 'http://20.244.56.144/evaluation-service';

let numberWindow = [];

const calculateAverage = (numbers) => {
  if (numbers.length === 0) return 0;
  const sum = numbers.reduce((acc, curr) => acc + curr, 0);
  return Number((sum / numbers.length).toFixed(2));
};

const fetchWithTimeout = async (url) => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), API_TIMEOUT);

  try {
    const response = await fetch(url, { signal: controller.signal });
    
    if (!response.ok) {
      console.error(`API returned error: ${response.status} ${response.statusText}`);
      return [];
    }

    const data = await response.json();
    console.log("Fetched data:", data);
    return data.numbers;
  } catch (error) {
    console.error("Error fetching data:", error.message);
    return [];
  } finally {
    clearTimeout(timeout);
  }
};


const apiEndpoints = {
  p: `${BASE_URL}/primes`,
  prime: `${BASE_URL}/primes`,
  f: `${BASE_URL}/fibo`,
  fibonacci: `${BASE_URL}/fibo`,
  e: `${BASE_URL}/even`,
  even: `${BASE_URL}/even`,
  r: `${BASE_URL}/rand`,
  random: `${BASE_URL}/rand`,
  l: `${BASE_URL}/rand`
};

app.get('/numbers/:numberid', async (req, res) => {
  const numberid = req.params.numberid.toLowerCase();
  console.log("Received number ID:", numberid);

  if (!apiEndpoints[numberid]) {
    return res.status(400).json({ error: 'Invalid number ID' });
  }

  const windowPrevState = [...numberWindow];

  try {
    const fetchedNumbers = await fetchWithTimeout(apiEndpoints[numberid]);

    for (const num of fetchedNumbers) {
      if (!numberWindow.includes(num)) {
        if (numberWindow.length >= WINDOW_SIZE) {
          numberWindow.shift();
        }
        numberWindow.push(num);
      }
    }

    const response = {
      windowPrevState,
      windowCurrState: [...numberWindow],
      numbers: fetchedNumbers,
      avg: calculateAverage(numberWindow)
    };

    res.json(response);
  } catch (error) {
    console.error("Server error:", error.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.listen(port, () => {
  console.log(`✅ Average Calculator service running on http://localhost:${port}`);
});

const express = require('express');
// const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const cookieParser = require('cookie-parser')

// store Puppeteer in an executable path
const { executablePath } = require('puppeteer');

// Add stealth plugin to puppeteer
puppeteer.use(StealthPlugin());

const app = express();
app.use(cookieParser());
app.use(express.json());
app.use(express.static(path.join(__dirname)));

app.post('/start-scraping', async (req, res) => {
    const { baseUrl, csvUrl, email, password, maxLeads } = req.body;

    let leadCount = 0;

    // Ensure the csvUrl ends with .csv
    const csvFileName = csvUrl.endsWith('.csv') ? csvUrl : `${csvUrl}.csv`;

    // Construct the CSV file path with the user's email
    const userCsvPath = path.join(__dirname, 'csv', `${email}_${csvFileName}`);

    // Check if the CSV file exists, if not, write the header
    if (!fs.existsSync(userCsvPath)) {
        const header = `"Name","Job Title","Company","Email"\n`;
        fs.writeFileSync(userCsvPath, header);
    }

    try {
        // Start the Puppeteer browser
        console.time("ScriptRunTime");
        const browser = await puppeteer.launch({
            executablePath: executablePath(),
            headless: true, // Set to true to run headless
            defaultViewport: null,
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-accelerated-2d-canvas',
                '--disable-gpu',
            ],
        });
    
        const page = await browser.newPage();
        // Set a user-agent to mimic a real browser
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.3');
    
        // Preserve cookies and local storage
        // const cookies = fs.existsSync('cookies.json') ? JSON.parse(fs.readFileSync('cookies.json')) : [];
        // await page.setCookie(...cookies);
    
        // // Save cookies after login
        // const currentCookies = await page.cookies();
        // fs.writeFileSync('cookies.json', JSON.stringify(currentCookies));

        // Introduce random delays between actions
        function randomDelay(min, max) {
            return Math.floor(Math.random() * (max - min + 1)) + min;
        }
    
        // Use random delays in your loops
        await new Promise(resolve => setTimeout(resolve, randomDelay(4000, 8000)));
    
        await page.goto('https://app.apollo.io/#/login');
        await page.waitForSelector('input[name="email"]', { visible: true });
        await page.waitForSelector('input[name="password"]', { visible: true });
        await page.type('input[name="email"]', email);
        await page.type('input[name="password"]', password);
        await page.click('button[type="submit"]');
        await new Promise(resolve => setTimeout(resolve, 8000));

        // Navigate to the baseUrl
        try {
            await page.goto(baseUrl, { waitUntil: 'networkidle2', timeout: 5000 });
            console.log(`Navigated to ${baseUrl}`);
        } catch (error) {
            console.error(`Failed to navigate to ${baseUrl}: ${error}`);
        }
    
        // After successful login and navigation
        await new Promise(resolve => setTimeout(resolve, 10000));
    
        // Extract the total number of entries from the specified div
        const totalEntriesText = await page.$eval('.zp_xAPpZ', el => el.textContent);
    
        // Use a regular expression to extract the number from the text
        const totalEntriesMatch = totalEntriesText.match(/of\s([\d,]+)/);
        const totalEntries = totalEntriesMatch ? parseInt(totalEntriesMatch[1].replace(/,/g, ''), 10) : 0;
    
        // Calculate the total number of pages
        const entriesPerPage = 25;
        const totalPages = Math.ceil(totalEntries / entriesPerPage);
    
        console.log(`Total entries: ${totalEntries}, Total pages: ${totalPages}`);

        // Set maxLeads to totalEntries if not provided
        const maxLeadsToProcess = maxLeads || totalEntries;
        console.log(`Max leads to process: ${maxLeadsToProcess}`);
    
        for (let e = 0; e < totalPages; e++) {
            for (let i = 0; i < 25; i++) {
                if (leadCount >= maxLeadsToProcess) {
                    console.log(`Reached the maximum number of leads: ${maxLeads}`);
                    await browser.close();
                    console.timeEnd("ScriptRunTime");
                    return; // Exit the function
                }
    
                try {
                    // Fetch the URL from the anchor tag inside the element with ID "table-row-0"
    
                    const url = await page.$eval(`#table-row-${i} a`, anchor => anchor.href);
                    // console.log(`URL: ${url}`);
                    console.log(`Page:${e+1}: URL from table-row-${i+1}: ${url}`);
    
                    // Navigate to the URL
                    await page.goto(url, { waitUntil: 'networkidle2' });
                    await new Promise(resolve => setTimeout(resolve, 5000)); // Wait for 2 seconds
    
                    // Click the first button with class "zp_zoimv"
                    // const button = await page.$('.zp_zoimv');
                    const button = await page.$('.zp_zoimv button');
                    if (button) {
                        await button.click();
                        console.log(`Clicked button with class "zp_zoimv" on page for table-row-${i+1}`);
                        await new Promise(resolve => setTimeout(resolve, 5000)); // Wait for 2 seconds
                    } else {
                        console.log(`Button with class "zp_zoimv" not found on page for table-row-${i+1}`);
                    }
    
                    // Extract data from the page
                    const name = await page.$eval('.zp_JXY28', el => el.textContent.trim());
                    const title = await page.$eval('.zp_usEUk', el => el.textContent.trim());
                    const companyName = await page.$eval('.zp_VcDyf', el => el.textContent.trim());
                    const email = await page.$eval('.zp_kOWmA', el => el.textContent.trim());
    
                    console.log(`Name: ${name}, Title: ${title}, Company: ${companyName}, Email: ${email}`);
    
                    // Store data in CSV format
                    const csvData = `"${name}","${title}","${companyName}","${email}"\n`;
                    fs.appendFileSync(userCsvPath, csvData);

                    leadCount++;
    
                    // Go back to the previous page
                    await page.goBack({ waitUntil: 'networkidle2' });
    
                    await new Promise(resolve => setTimeout(resolve, 7000));
    
                } catch (error) {
                    console.error(`Failed to process button ${i + 1}: ${error}`);
                }
            }
            const buttons = await page.$$('button:has(i.apollo-icon-chevron-arrow-right)');
            if (buttons) {
                await buttons[0].click();
                console.log(`Moving on to next page: ${e+2}`);
                await new Promise(resolve => setTimeout(resolve, 5000)); // Wait for 5 seconds
            } else {
                console.log(`Button with class "apollo-icon-chevron-arrow-right" not found on page for table-row-${i}`);
            }
        }

        await browser.close();
        console.timeEnd("ScriptRunTime");
        res.status(200).send('Scraping started successfully!');
    } catch (error) {
        console.error('Error during scraping:', error);
        res.status(500).send('Failed to start scraping.');
    }
});


// Endpoint to fetch files for a specific email
app.get('/fetch-files', (req, res) => {
    const email = req.query.email;
    const csvDir = path.join(__dirname, 'csv');
    const files = fs.readdirSync(csvDir).filter(file => file.startsWith(`${email}_`));
    res.json(files);
});

// Endpoint to download a specific file
app.get('/download/:file', (req, res) => {
    const file = req.params.file;
    const filePath = path.join(__dirname, 'csv', file);
    res.download(filePath);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

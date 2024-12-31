# Web Scraper Express App

This is a web scraping application built using Node.js, Express, and Puppeteer. It allows users to scrape data from a specified website and save it in CSV format.

## Prerequisites

- Node.js (v14 or later)
- npm (Node Package Manager)

## Installation

1. **Clone the repository:**

   ```bash
   git clone https://github.com/vinayjain18/apollo-scrapper.git
   cd apollo-scrapper
   ```

2. **Install dependencies:**

   ```bash
   npm install
   ```

## Configuration

- Ensure you have a `csv` directory in the root of your project to store the CSV files.

## Running the Application

1. **Start the server:**

   ```bash
   node server.js
   ```

   Alternatively, you can use `nodemon` for automatic restarts:

   ```bash
   npx nodemon server.js
   ```

2. **Access the application:**

   Open your browser and navigate to `http://localhost:3000` (or the port specified in your environment).

## API Endpoints

- **POST `/start-scraping`**: Initiates the scraping process. Requires a JSON body with the following fields:
  - `baseUrl`: The base URL to start scraping from.
  - `csvUrl`: The name of the CSV file to save data.
  - `email`: User's email for login.
  - `password`: User's password for login.
  - `maxLeads`: (Optional) Maximum number of leads to scrape.

- **GET `/fetch-files`**: Fetches a list of CSV files for a specific email. Requires an `email` query parameter.

- **GET `/download/:file`**: Downloads a specific CSV file. Replace `:file` with the actual file name.

## Troubleshooting

- If you encounter issues with Puppeteer, ensure that all necessary dependencies for Chromium are installed on your system.
- Check the console for any error messages and adjust the selectors or configurations as needed.
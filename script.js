document.getElementById('scraperForm').addEventListener('submit', async function(event) {
    event.preventDefault();

    const baseUrl = document.getElementById('baseUrl').value;
    const csvUrl = document.getElementById('csvUrl').value;
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const maxLeads = document.getElementById('maxLeads').value;

    // Notify the user that scraping has started
    alert('Scraping process has been initiated.');

    const response = await fetch('/start-scraping', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ baseUrl, csvUrl, email, password, maxLeads })
    });

    if (response.ok) {
        alert('Scraping started successfully!');
    } else {
        alert('Failed to start scraping.');
    }
});

document.getElementById('downloadForm').addEventListener('submit', async function(event) {
    event.preventDefault();

    const email = document.getElementById('email').value;

    const response = await fetch(`/fetch-files?email=${encodeURIComponent(email)}`);
    const files = await response.json();

    const fileList = document.getElementById('fileList');
    fileList.innerHTML = '';

    if (files.length > 0) {
        files.forEach(file => {
            const link = document.createElement('a');
            link.href = `/download/${file}`;
            link.textContent = file;
            link.className = 'd-block';
            link.download = file;
            fileList.appendChild(link);
            fileList.appendChild(document.createElement('br'));
        });
    } else {
        fileList.textContent = 'No files found for this email.';
    }
});

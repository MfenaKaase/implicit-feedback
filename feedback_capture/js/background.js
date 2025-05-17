function bookmarkListener() {
    chrome.bookmarks.onCreated.addListener(function handleCreated() {
        chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
            chrome.tabs.sendMessage(tabs[0].id, { type: 'bookmark', bookmark: 1 }, function (response) {
                //console.log(response.farewell);
            });
        });
    });
}



chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
    if (request.type === 'save_data') {
        const data = request.payload;

        // Send data to the server using fetch or XMLHttpRequest
        fetch('http://localhost:8000/api/implicit-feedback', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${data.token}`
            },
            body: JSON.stringify(data)
        }).then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        }).then(data => {
            console.log('Data successfully sent:', data);
        }).catch(error => {
            console.error('Error sending data:', error);
        });
    }
});



bookmarkListener();

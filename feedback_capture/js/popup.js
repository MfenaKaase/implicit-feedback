const displaySearchResults = (el, docs) => {
    let htmlString = '<p class="text-danger">No Results Found in Your Group!</p>';
    if (docs && docs.length > 0) {
        const urlMap = new Map(); // Create a map to store unique URLs and their associated objects

        // Iterate over each object in the `docs` array
        docs.forEach(doc => {
            // If the URL already exists in the map
            if (urlMap.has(doc.url)) {
                // Update the interestWeight and aggregatedWeight properties of existing object
                const existingDoc = urlMap.get(doc.url);
                existingDoc.interestWeight += (0.281 * doc.total_copy + 0.002 * doc.total_active_time + 2.9778);
                existingDoc.aggregatedWeight += (existingDoc.interestWeight + doc.score);
                existingDoc.count++; // Increment the count for averaging later
            } else {
                // If URL doesn't exist in the map, add it along with the object
                doc.interestWeight = 0.281 * doc.total_copy + 0.002 * doc.total_active_time + 2.9778;
                doc.aggregatedWeight = doc.interestWeight + doc.score;
                doc.count = 1; // Initialize count for averaging
                urlMap.set(doc.url, doc);
            }
        });

        // Convert map values back to an array
        const uniqueDocs = Array.from(urlMap.values());

        console.log(uniqueDocs);

        // Calculate average for objects with duplicate URLs
        uniqueDocs.forEach(doc => {
            doc.interestWeight /= doc.count * 10;
            doc.aggregatedWeight /= doc.count * 10;
        });

        // Sort the uniqueDocs array based on aggregatedWeight in descending order
        uniqueDocs.sort((a, b) => b.aggregatedWeight - a.aggregatedWeight);

        htmlString = `<div class="list-group">`;
        uniqueDocs.forEach(doc => {
            htmlString += `<div class="list-group-item list-group-item-action flex-column align-items-start" data-bs-toggle="tooltip" data-bs-html="true" title="${doc.leading_paragraph}">
                <div class="d-flex w-100 justify-content-between">
                <h5 class="mb-1">${doc.page_title}</h5>
                <span class="position-absolute top-0 start-10 translate-middle badge rounded-pill bg-danger">
                <i class='bx bx-star'></i>
                ${doc.aggregatedWeight.toFixed(2)}
                </span>
                </div>
                <a href="${doc.url}" target="_blank">${doc.url}</a>
                <small class="">${doc.leading_paragraph ? doc.leading_paragraph[0].substring(0, 100) + "..." : "Couldn't find any paragraphs with up to 100 characters"}</small>
            </div>`;
        });
        htmlString += `</div>`;
    }
    el.innerHTML = htmlString;
}


document.addEventListener('DOMContentLoaded', function () {
    const loginTab = document.querySelector('button[data-bs-target="#profile-settings"]');
    const signupTab = document.querySelector('button[data-bs-target="#profile-edit"]');
    const resultsTab = document.querySelector('button[data-bs-target="#profile-overview"]');
    const dataTab = document.querySelector('button[data-bs-target="#download-options"]');
    const logoutButton = document.getElementById('logoutButton');
    const signupForm = document.getElementById('signup-form')
    const submitBtn = document.querySelector('.submit-btn');
    const submitBtn2 = document.querySelector('.submit-btn-2');

    chrome.storage.local.get(['authToken'], function (result) {
        const isAuthenticated = !!result.authToken;

        if (isAuthenticated) {
            // Hide login and signup tabs
            loginTab.style.display = 'none';
            signupTab.style.display = 'none';

            // Show results, download data tabs, and logout button
            resultsTab.style.display = 'block';
            dataTab.style.display = 'block';
            logoutButton.style.display = 'block';
        } else {
            // Show login and signup tabs
            loginTab.style.display = 'block';
            signupTab.style.display = 'block';

            // Hide results, download data tabs, and logout button
            resultsTab.style.display = 'none';
            dataTab.style.display = 'none';
            logoutButton.style.display = 'none';
        }

        // Logout functionality
        logoutButton.addEventListener('click', () => {
            chrome.storage.local.remove('authToken', () => {
                console.log('Logged out successfully');
                // Refresh the UI after logout
                loginTab.style.display = 'block';
                signupTab.style.display = 'block';
                resultsTab.style.display = 'none';
                dataTab.style.display = 'none';
                logoutButton.style.display = 'none';
            });
        });
    });

    let tabs = document.querySelectorAll('.nav-link');

    const loginForm = document.getElementById('login-form');

    loginForm.addEventListener('submit', (evt) => {
        submitBtn.classList.add('loading');
        evt.preventDefault();
        login(loginForm[0].value, loginForm[1].value);

    })

    signupForm.addEventListener('submit', evt => {
        evt.preventDefault();
        // Show spinner
        submitBtn2.classList.add('loading');
        const formdata = new FormData();
        formdata.append("name", signupForm[0].value);
        formdata.append("email", signupForm[1].value);
        formdata.append("password", signupForm[2].value);
        formdata.append("password_confirmation", signupForm[3].value);

        const requestOptions = {
            method: "POST",
            body: formdata,
            redirect: "follow"
        };

        fetch("http://localhost:8000/api/users", requestOptions)
            .then((response) => response.json())
            .then((result) => {
                console.log(result);
                submitBtn2.classList.remove('loading');
            })
            .catch((error) => {
                console.error(error);
                submitBtn2.classList.remove('loading');
            });
    })

    // download data 
    document.getElementById('downloadButton').addEventListener('click', () => {
        // Retrieve the authToken from chrome.storage.local
        chrome.storage.local.get(['authToken'], (result) => {
            const authToken = result.authToken;

            // Ensure the authToken exists
            if (!authToken) {
                console.error('Auth token not found.');
                return;
            }

            // Send a request to the backend with the authToken
            fetch('http://localhost:8000/api/export-data', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${authToken}`,
                    "Content-Type": "application/json"
                }
            })
                .then(response => {
                    if (!response.ok) {
                        throw new Error('Network response was not ok');
                    }
                    return response.blob(); // Parse the response as a blob (binary data)
                })
                .then(blob => {
                    // Create a URL for the blob
                    const downloadUrl = URL.createObjectURL(blob);

                    // Create an invisible anchor element and trigger the download
                    const anchor = document.createElement('a');
                    anchor.href = downloadUrl;
                    anchor.download = 'data.csv'; // Filename for the download
                    document.body.appendChild(anchor);
                    anchor.click();

                    // Cleanup
                    document.body.removeChild(anchor);
                    URL.revokeObjectURL(downloadUrl); // Revoke the object URL to free up memory
                })
                .catch(error => {
                    console.error('Error:', error);
                });
        });
    });


    tabs.forEach(function (tab) {
        tab.addEventListener('click', function () {
            let target = tab.getAttribute('data-bs-target');

            // Remove active class from all tabs
            tabs.forEach(function (t) {
                t.classList.remove('active');
            });

            // Add active class to the clicked tab
            tab.classList.add('active');

            // Hide all tab content
            let tabContents = document.querySelectorAll('.tab-pane');
            tabContents.forEach(function (content) {
                content.classList.remove('show', 'active');
            });

            // Show the corresponding tab content
            document.querySelector(target).classList.add('show', 'active');
        });
    });

    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
        chrome.tabs.sendMessage(tabs[0].id, { type: "msg_from_popup" }, function (response) {
            const container = document.getElementById('feedbackResultsContainer');
            console.log(response)
            if (response) displaySearchResults(container, response.docs);
            else container.innerHTML = "<p class='text-danger'>An error has occured! Check your internet connection!</p>"

        });
    });

    async function login(email, password) {
        const url = 'http://localhost:8000/api/login'; // Replace with your actual login URL

        const formdata = new FormData();
        formdata.append("email", email);
        formdata.append("password", password);

        try {
            // Send a POST request with the email and password
            const response = await fetch(url, {
                method: 'POST',
                body: formdata,
            });

            // Check if the request was successful
            if (!response.ok) {
                throw new Error('Login failed');
            }

            // Parse the JSON response
            const result = await response.json();

            console.log(result);
            // Assuming the token is returned in the response
            const token = result.token;

            chrome.storage.local.set({ authToken: token }, () => {
                console.log('Value saved');
            });

            loginTab.style.display = 'none';
            signupTab.style.display = 'none';
            resultsTab.style.display = 'block';
            dataTab.style.display = 'block';
            logoutButton.style.display = 'block';
            submitBtn.classList.remove('loading');
            console.log('Login successful, token stored in sessionStorage');
            document.querySelector('.message').innerHTML = `Login successful, Switch to results tab`

            // Automatically switch to the "results" tab
            resultsTab.click();

        } catch (error) {
            submitBtn.classList.remove('loading');
            console.error('Error during login:', error.message);
            console.error('Details:', error);
        }
    }
})











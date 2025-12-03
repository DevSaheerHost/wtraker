// A. Initialize Firebase (Replace with your actual config)
const firebaseConfig = {
  apiKey: "AIzaSyBBaxN0W160emYqQ-0KnDBDriwyJWJUZTQ",
  authDomain: "postgramdata.firebaseapp.com",
  databaseURL: "https://postgramdata-default-rtdb.firebaseio.com",
  projectId: "postgramdata",
  storageBucket: "postgramdata.appspot.com",
  messagingSenderId: "230004880062",
  appId: "1:230004880062:web:06cf694a871488d3f7e4ef"
};

firebase.initializeApp(firebaseConfig);

// Get a reference to the database service
const db = firebase.database();
const devicesRef = db.ref('devices');







// B. Global Variables and Event Listeners
const form = document.getElementById('imei-form');
const deviceList = document.getElementById('device-list');
const saveBtn = document.getElementById('save-btn');
const showAddBtn = document.getElementById('show-add-btn');
const cancelBtn = document.getElementById('cancel-btn');
const formSection = document.getElementById('data-form-section');
const searchInput = document.getElementById('search-input');

let editingKey = null; // Key for the item being edited

// Toggle form visibility
showAddBtn.addEventListener('click', () => {
    form.classList.remove('hidden');
    showAddBtn.classList.add('hidden');
    form.reset();
    editingKey = null;
    saveBtn.textContent = 'Save Data';
});

cancelBtn.addEventListener('click', () => {
    form.classList.add('hidden');
    showAddBtn.classList.remove('hidden');
});

// C. SAVE / ADD / EDIT (Create & Update)
form.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const imei = document.getElementById('imei').value;
    const deviceData = {
        IMEI: imei,
        Model: document.getElementById('model').value,
        Storage: document.getElementById('storage').value,
        'Battery Health': document.getElementById('battery-health').value,
        Color: document.getElementById('color').value,
        'Blacklist Status': document.getElementById('blacklist-status').value,
        Condition: document.getElementById('condition').value,
        'Buyer Name': document.getElementById('buyer-name').value,
        'Buying Price': document.getElementById('buying-price').value,
        'Warranty Start': document.getElementById('warranty-start').value,
        'Warranty End': document.getElementById('warranty-end').value,
    };

    if (editingKey) {
        // UPDATE: Use the existing key
        devicesRef.child(editingKey).set(deviceData)
            .then(() => alert('Device updated successfully!'))
            .catch(error => console.error('Update failed:', error));
    } else {
        // ADD NEW: Use the IMEI as the key (or push for unique ID)
        // Using IMEI as key: devicesRef.child(imei).set(deviceData)
        // Using push() for unique key:
        devicesRef.push(deviceData) 
            .then(() => alert('New device added successfully!'))
            .catch(error => console.error('Add failed:', error));
    }

    form.classList.add('hidden');
    showAddBtn.classList.remove('hidden');
    form.reset();
    editingKey = null;
});


// D. READ (Fetch and Display Data)
devicesRef.on('value', (snapshot) => {
    deviceList.innerHTML = ''; // Clear existing list
    const devices = snapshot.val();
    
    if (!devices) {
        deviceList.innerHTML = '<p>No devices in inventory yet.</p>';
        return;
    }

    Object.keys(devices).forEach(key => {
        const device = devices[key];
        const card = createDeviceCard(key, device);
        deviceList.appendChild(card);
    });
});

// Helper function to create the mobile-friendly card
function createDeviceCard(key, device) {
    const card = document.createElement('div');
    card.className = 'device-card';
    card.setAttribute('data-key', key);

 // 1. Calculate Warranty Status
    const warranty = calculateWarrantyStatus(device['Warranty End']); // <-- ഫങ്ഷൻ കോൾ
    
    // 2. Build the display content
    let content = `
        <h3>IMEI: ${device.IMEI}</h3>
        <p><strong>Model:</strong> ${device.Model} (${device.Color} / ${device.Storage})</p>
        <p><strong>Condition:</strong> ${device.Condition} | <strong>Blacklist:</strong> ${device['Blacklist Status']}</p>
        <p><strong>B. Health:</strong> ${device['Battery Health']} | <strong>Price:</strong> $${device['Buying Price']}</p>
        <p><strong>Warranty:</strong> ${warranty.status} (End: ${device['Warranty End']})</p> <p><strong>Buyer:</strong> ${device['Buyer Name']}</p>
    `;

    card.innerHTML = content;

    // Add Edit and Delete Buttons
    const actions = document.createElement('div');
    actions.className = 'card-actions';

    const editBtn = document.createElement('button');
    editBtn.className = 'edit-btn';
    editBtn.textContent = 'Edit';
    editBtn.addEventListener('click', () => editDevice(key, device));

    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'delete-btn';
    deleteBtn.textContent = 'Delete';
    deleteBtn.addEventListener('click', () => deleteDevice(key));

    actions.appendChild(editBtn);
    actions.appendChild(deleteBtn);
    card.appendChild(actions);

    return card;
}

// E. DELETE
function deleteDevice(key) {
    if (confirm('Are you sure you want to delete this device?')) {
        devicesRef.child(key).remove()
            .then(() => console.log('Device deleted!'))
            .catch(error => console.error('Delete failed:', error));
    }
}

// F. EDIT (Populate form)
function editDevice(key, device) {
    // Show the form
    form.classList.remove('hidden');
    showAddBtn.classList.add('hidden');

    // Set the key for updating
    editingKey = key;
    saveBtn.textContent = 'Update Data';

    // Populate the form fields
    document.getElementById('imei').value = device.IMEI;
    document.getElementById('model').value = device.Model;
    document.getElementById('storage').value = device.Storage;
    document.getElementById('battery-health').value = device['Battery Health'];
    document.getElementById('color').value = device.Color;
    document.getElementById('blacklist-status').value = device['Blacklist Status'];
    document.getElementById('condition').value = device.Condition;
    document.getElementById('buyer-name').value = device['Buyer Name'];
    document.getElementById('buying-price').value = device['Buying Price'];
    document.getElementById('warranty-start').value = device['Warranty Start'];
    document.getElementById('warranty-status').value = device['Warranty Status'];
}

// G. SEARCH/FILTER (Basic client-side filtering)
searchInput.addEventListener('keyup', (e) => {
    const searchTerm = e.target.value.toLowerCase();
    const cards = document.querySelectorAll('.device-card');

    cards.forEach(card => {
        const imeiText = card.querySelector('h3').textContent.toLowerCase();
        const modelText = card.querySelector('p').textContent.toLowerCase();
        
        if (imeiText.includes(searchTerm) || modelText.includes(searchTerm)) {
            card.style.display = 'block';
        } else {
            card.style.display = 'none';
        }
    });
});






// calculate warranty date

function calculateWarrantyStatus(endDateString) {
    const today = new Date();
    const endDate = new Date(endDateString);
    
    // Convert to days difference (ignoring time component)
    const timeDiff = endDate.getTime() - today.getTime();
    const daysLeft = Math.ceil(timeDiff / (1000 * 3600 * 24)); 
    
    let statusText;
    
    if (daysLeft < 0) {
        statusText = `EXPIRED (${Math.abs(daysLeft)} days ago)`;
    } else if (daysLeft === 0) {
        statusText = `EXPIRES TODAY`;
    } else if (daysLeft <= 90) { // Highlight if less than 90 days left
        statusText = `ACTIVE (${daysLeft} days left) - LOW`;
    } else {
        statusText = `ACTIVE (${daysLeft} days left)`;
    }
    
    return { status: statusText, daysLeft: daysLeft };
}
import { initializeApp } from 'firebase/app';
import { getFirestore, doc, getDoc } from 'firebase/firestore';
import { getStorage, ref, getDownloadURL, listAll } from 'firebase/storage';

const firebaseConfig = {
    apiKey: "AIzaSyBFU2ZnJ1oh-7R5QkFEmoUOevQcTQ0mZ_w",
    authDomain: "qr-menu-383cd.firebaseapp.com",
    projectId: "qr-menu-383cd",
    storageBucket: "qr-menu-383cd.appspot.com",
    messagingSenderId: "98382457208",
    appId: "1:98382457208:web:d7d5acb86901141134008d"
};

initializeApp(firebaseConfig);

const db = getFirestore();
const storage = getStorage();

const clientNameElement = document.getElementById('client-name');
const pdfListElement = document.querySelector('.pdf-list');

function getClientIdFromUrl() {
    const params = new URLSearchParams(window.location.search);
    return params.get('clientId');
}

async function loadClientData(clientId) {
    const userDocRef = doc(db, 'clients', clientId);
    const docSnapshot = await getDoc(userDocRef);
    if (docSnapshot.exists()) {
        const userData = docSnapshot.data();
        clientNameElement.textContent = userData.name;
        listUploadedPDFs(clientId);
    } else {
        clientNameElement.textContent = 'Client not found';
    }
}

async function listUploadedPDFs(clientId) {
    const userStorageRef = ref(storage, `pdfs/${clientId}`);
    try {
        const res = await listAll(userStorageRef);
        pdfListElement.innerHTML = '';
        for (const itemRef of res.items) {
            const url = await getDownloadURL(itemRef);
            const listItem = document.createElement('li');
            const link = document.createElement('a');
            link.href = url;
            link.textContent = itemRef.name;
            listItem.appendChild(link);
            pdfListElement.appendChild(listItem);
        }
    } catch (error) {
        console.log(error.message);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const clientId = getClientIdFromUrl();
    if (clientId) {
        loadClientData(clientId);
    } else {
        clientNameElement.textContent = 'Invalid client ID';
    }
});

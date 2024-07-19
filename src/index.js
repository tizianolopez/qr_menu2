import QRCode from 'qrcode';

// Firebase initialization
import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc, getDoc } from 'firebase/firestore';
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { getStorage, ref, uploadBytes, listAll, getDownloadURL } from 'firebase/storage';

const firebaseConfig = {
    apiKey: "AIzaSyBFU2ZnJ1oh-7R5QkFEmoUOevQcTQ0mZ_w",
    authDomain: "qr-menu-383cd.firebaseapp.com",
    projectId: "qr-menu-383cd",
    storageBucket: "qr-menu-383cd.appspot.com",
    messagingSenderId: "98382457208",
    appId: "1:98382457208:web:d7d5acb86901141134008d"
};

initializeApp(firebaseConfig);

// INIT SERVICES
const db = getFirestore();
const auth = getAuth();
const storage = getStorage();

function listUploadedPDFs(userId, pdfListElement) {
    const userStorageRef = ref(storage, `pdfs/${userId}`);
    listAll(userStorageRef).then((res) => {
        pdfListElement.innerHTML = '';
        res.items.forEach((itemRef) => {
            getDownloadURL(itemRef).then((url) => {
                const listItem = document.createElement('li');
                const link = document.createElement('a');
                link.href = url;
                link.textContent = itemRef.name;
                listItem.appendChild(link);
                pdfListElement.appendChild(listItem);
            });
        });
    }).catch((error) => {
        console.log(error.message);
    });
}

// Code specific to index.html
if (document.querySelector('.nav-login')) {
    // Navbar buttons
    const navLogin = document.querySelector('.nav-login');
    const navSignup = document.querySelector('.nav-signup');
    const logoutButton = document.querySelector('.logout');

    // Forms
    const signupForm = document.querySelector('.signup');
    const loginForm = document.querySelector('.login');
    const uploadPdfForm = document.querySelector('.upload-pdf');
    const dashboard = document.querySelector('.dashboard');

    // Display elements
    const userNameElement = document.getElementById('user-name');
    const userQrElement = document.getElementById('qr-image');
    const qrDownloadElement = document.getElementById('qr-download');
    const pdfListElement = document.querySelector('.pdf-list');

    // Show/hide forms
    navLogin.addEventListener('click', () => {
        loginForm.style.display = 'block';
        signupForm.style.display = 'none';
    });

    navSignup.addEventListener('click', () => {
        signupForm.style.display = 'block';
        loginForm.style.display = 'none';
    });

    logoutButton.addEventListener('click', () => {
        signOut(auth).then(() => {
            dashboard.style.display = 'none';
            logoutButton.style.display = 'none';
            navLogin.style.display = 'block';
            navSignup.style.display = 'block';
        }).catch((error) => {
            console.log(error.message);
        });
    });

    // Sign up
    signupForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const name = signupForm.name.value;
        const email = signupForm.email.value;
        const password = signupForm.password.value;
        createUserWithEmailAndPassword(auth, email, password).then((userCredential) => {
            const user = userCredential.user;
            const clientUrl = generateUniqueUrl(user.uid); // Generar URL única

            const userDocRef = doc(db, 'clients', user.uid);
            setDoc(userDocRef, { name, email, clientUrl }).then(() => {
                signupForm.reset();
                showDashboard(user);
            });
        }).catch((error) => {
            console.log(error.message);
        });
    });

    // Log in
    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const email = loginForm.loginEmail.value;
        const password = loginForm.loginPassword.value;
        signInWithEmailAndPassword(auth, email, password).then((userCredential) => {
            const user = userCredential.user;
            showDashboard(user);
        }).catch((error) => {
            console.log(error.message);
        });
    });

    // Google login
    const googleLoginButton = document.getElementById('google-login');
    const provider = new GoogleAuthProvider();

    googleLoginButton.addEventListener('click', () => {
        signInWithPopup(auth, provider).then((result) => {
            const user = result.user;
            showDashboard(user);
        }).catch((error) => {
            console.log(error.message);
        });
    });

    // Generate a QR code URL using qrcode.js
    function generateQRCodeUrl(text) {
        return new Promise((resolve, reject) => {
            QRCode.toDataURL(text, {
                errorCorrectionLevel: 'M',
                width: 200,
                margin: 0
            }, (err, url) => {
                if (err) {
                    reject(err);
                    return;
                }
                resolve(url);
            });
        });
    }

    // Generate a unique URL for the client
    function generateUniqueUrl(clientId) {
        return `https://tizianolopez.github.io/qr_menu2/dist/menu?clientId=${clientId}`;
    }

    // Show dashboard with user details
    async function showDashboard(user) {
        const userDocRef = doc(db, 'clients', user.uid);
        const docSnapshot = await getDoc(userDocRef);
        const userData = docSnapshot.data();
        userNameElement.textContent = userData.name;

        // Generate QR code URL and set it to the image and download link
        const qrCodeUrl = await generateQRCodeUrl(userData.clientUrl);
        userQrElement.src = qrCodeUrl;
        qrDownloadElement.href = qrCodeUrl;
        qrDownloadElement.download = 'qr-code.png';

        dashboard.style.display = 'block';
        logoutButton.style.display = 'block';
        navLogin.style.display = 'none';
        navSignup.style.display = 'none';
        loginForm.style.display = 'none';
        signupForm.style.display = 'none';
        listUploadedPDFs(user.uid, pdfListElement);
    }

    // Upload PDF
    uploadPdfForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const file = uploadPdfForm.pdfFile.files[0];
        const user = auth.currentUser;
        if (user && file) {
            const fileRef = ref(storage, `pdfs/${user.uid}/${file.name}`);
            uploadBytes(fileRef, file).then(() => {
                uploadPdfForm.reset();
                listUploadedPDFs(user.uid, pdfListElement);
            }).catch((error) => {
                console.log(error.message);
            });
        }
    });

    // Subscribe to auth state changes
    onAuthStateChanged(auth, (user) => {
        if (user) {
            showDashboard(user);
        } else {
            dashboard.style.display = 'none';
            logoutButton.style.display = 'none';
            navLogin.style.display = 'block';
            navSignup.style.display = 'block';
        }
    });
}

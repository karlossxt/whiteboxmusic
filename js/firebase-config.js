(function() {
    if (!window.firebase) {
        throw new Error('Firebase App SDK no disponible');
    }

    var firebaseConfig = {
        apiKey: "AIzaSyB6iO4kQhR1LHRpzickOWf6vprmsMSnsC8",
        authDomain: "whitebox-music-cms.firebaseapp.com",
        projectId: "whitebox-music-cms",
        storageBucket: "whitebox-music-cms.firebasestorage.app",
        messagingSenderId: "719501768552",
        appId: "1:719501768552:web:e20ede5b2580925aa288dd"
    };

    if (!firebase.apps.length) {
        firebase.initializeApp(firebaseConfig);
    }

    window.WhiteBoxFirebase = {
        app: firebase.app(),
        auth: typeof firebase.auth === 'function'
            ? firebase.auth()
            : null,
        db: typeof firebase.firestore === 'function'
            ? firebase.firestore()
            : null
    };
})();

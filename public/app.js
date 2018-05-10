
const app = {
  logged: null,
  user: null,
  loader: true,
  chat: null,
  lastSection: null,
  messages: [],
};

app.showLoader = function () {
  document.getElementById('loader').style.display = 'block';
  app.loader = true;
};

app.hideLoader = function () {
  document.getElementById('loader').style.display = 'none';
  app.loader = false;
};

app.hideSections = function() {
  document.querySelectorAll('.section').forEach(function(item){
    item.style.display = 'none';
  });
};

app.showSection = function (section) {
  app.hideSections();
  document.getElementById(section).style.display = 'block';
  app.lastSection = section;
};

app.onAuthStateChanged = function (user) {
  if (user) {
    app.setUser(user);
  } else {
    app.removeUser();
  }
};

app.setUser = function (user) {
  app.user = user;
  app.logged = true;
  document.getElementById('firebaseui-auth-container').style.display = 'none';
  document.querySelectorAll('.login-links').forEach(function (item) {
    item.style.display = 'block';
  });

  app.showLoader();
};

app.removeUser = function () {
  app.user = null;
  app.logged = false;
  document.getElementById('firebaseui-auth-container').style.display = 'block';
  document.querySelectorAll('.login-actions').forEach(function (item) {
    item.style.display = 'none';
  });
  app.hideLoader();
  app.ui.start('#firebaseui-auth-container', app.uiConfig);
};

app.domListeners = function () {
  document.getElementById('logout').addEventListener('click', function () {
    if (app.user === null) return;
    firebase.auth().signOut();
  });
};


app.initialize = function () {
  const config = {
    apiKey: "AIzaSyCdEmUioxXUbh-Uiw8qwdwmwIvA0d5KhQc",
    authDomain: "io-2018-guatemala.firebaseapp.com",
    databaseURL: "https://io-2018-guatemala.firebaseio.com",
    projectId: "io-2018-guatemala",
    storageBucket: "io-2018-guatemala.appspot.com",
    messagingSenderId: "538490676986"
  };

  firebase.initializeApp(config);

  app.auth = firebase.auth();

  app.uiConfig = {
    callbacks: {
      signInSuccess: function(currentUser, credential, redirectUrl) {
        // User successfully signed in.
        // Return type determines whether we continue the redirect automatically
        // or whether we leave that to developer to handle.
        return false;
      },
      uiShown: function() {
        // The widget is rendered.
        // Hide the loader.
        app.hideLoader();
      }
    },
    // Will use popup for IDP Providers sign-in flow instead of the default, redirect.
    signInFlow: 'popup',
    signInSuccessUrl: '/',
    signInOptions: [
      // Leave the lines as is for the providers you want to offer your users.
      firebase.auth.EmailAuthProvider.PROVIDER_ID,
      firebase.auth.GoogleAuthProvider.PROVIDER_ID,
      firebase.auth.PhoneAuthProvider.PROVIDER_ID
      // firebase.auth.FacebookAuthProvider.PROVIDER_ID,
      // firebase.auth.TwitterAuthProvider.PROVIDER_ID,
      // firebase.auth.GithubAuthProvider.PROVIDER_ID
    ],
    // Terms of service url.
    tosUrl: '/terms'
  };


  app.ui = new firebaseui.auth.AuthUI(app.auth);
  app.auth.onAuthStateChanged(app.onAuthStateChanged);
  app.domListeners();
};

app.initialize();

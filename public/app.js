
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


app.initialize = function () {

  const config = {
    apiKey: "AIzaSyBECuj7NS4PbVvr_LuJbKA1l6YDf1VBgPk",
    authDomain: "io-2018-e8ad5.firebaseapp.com",
    databaseURL: "https://io-2018-e8ad5.firebaseio.com",
    projectId: "io-2018-e8ad5",
    storageBucket: "io-2018-e8ad5.appspot.com",
    messagingSenderId: "853007609697"
  };

  firebase.initializeApp(config);
};

app.initialize();

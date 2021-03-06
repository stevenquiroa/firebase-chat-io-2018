
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
  if (app.lastSection === 'room') {
    app.realtimeDB.ref('messages').child(app.actualRoom).off('child_added', app.printMessages);
    app.actualRoom = null;
    app.messages = [];
    document.getElementById('conversation').innerHTML = '';
  }
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

  app.getRooms();
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
app.getUserName = function () {
  if (app.user.displayName) {
    return app.user.displayName;
  } else if (app.user.phoneNumber) {
    return `${app.user.phoneNumber.substring(0, 4)}..${app.user.phoneNumber.substring(7)}`;
  } else if(app.user.email) {
    return app.user.email;
  } else {
    return 'N/A';
  }
};

app.storeRoom = function (name, callback) {
  if (app.user === null) return;
  app.showLoader();
  const roomsRef = app.db.collection('rooms');

  roomsRef.add({
    name: name,
    owner: app.user.uid,
    created_at: new Date(),
    owner_name: app.getUserName(),
    official: false,
  })
    .then(function(docRef) {
      app.getRooms();
      callback(null);
    })
    .catch(function(error) {
      app.hideLoader();
      callback(error);
    });

};
app.updateRooms = function (callback) {
  const list = document.getElementById('rooms-list');

  cleanRooms = function () {
    list.innerText = '';
  };

  appendRoom = function (id, room) {
    const li = document.createElement('li');
    li.id = id;
    li.className = 'mdc-list-item mdc-ripple-upgraded mdc-ripple-upgraded--foreground-activation';
    li.innerHTML = `
      <span class="mdc-list-item__graphic" role="presentation">
        <i class="material-icons" aria-hidden="true">${room.icon || 'general'}</i>
      </span>
        <span class="mdc-list-item__text">
            <span class="mdc-list-item__secondary-text">${room.owner_name}</span>
            ${room.name}
        
      </span>      
    `;

    if (room.owner === app.user.uid) {
      const del = document.createElement('span');
      del.className = 'mdc-list-item__graphic';
      del.style.position = 'absolute';
      del.style.right = 0;

      del.innerHTML = '<i class="material-icons" aria-hidden="true">delete</i>';

      del.addEventListener('click', function(event) {
        event.stopPropagation();
        app.deleteRoom(id);
      });
      li.appendChild(del);
    }

    li.addEventListener('click', function() {
      app.openRoom(id);
    });

    list.appendChild(li);
  };

  const roomsRef = app.db.collection('rooms');

  roomsRef
    .orderBy("created_at", "asc")
    .get().then(function(querySnapshot){
    cleanRooms();
    querySnapshot.forEach(function(doc) {
      if (doc.exists) {
        appendRoom(doc.id, doc.data());
      } else {
        // doc.data() will be undefined in this case
        console.log("No such document!");
      }

      callback();

    });
  }).catch(function(error) {
    console.log("Error getting document:", error);
  });
};
app.getRooms = function () {
  app.showLoader();

  app.updateRooms(function() {
    app.showSection('rooms');
    app.hideLoader();
  });

};
app.deleteRoom = function(id) {
  if (app.user === null) return;
  app.showLoader();
  const roomsRef = app.db.collection('rooms');

  roomsRef.doc(id).delete().then(function() {
    app.hideLoader();
    const li = document.getElementById(id);
    if (li) {
      li.parentNode.removeChild(li);
    }
  }).catch(function(error){
    console.log(error);
    app.hideLoader();
    alert("No tienes permisos");
  });


};
app.openRoom = function(id) {
  app.showSection('room');
  app.showLoader();
  app.actualRoom = id;

  app.realtimeDB.ref('messages').child(id).orderByChild('created_at').limitToLast(20).on('child_added', app.onAddedMessages);
};

app.printMessages = function () {
  if (app.messages.length === 0) return;
  let virtualList = '';
  const list = document.getElementById('conversation');
  const li = document.createElement('li');

  app.messages.forEach(function(item) {
    virtualList = virtualList + `
      <li class="mdc-list-item mdc-ripple-upgraded mdc-ripple-upgraded--foreground-activation" dir="ltr">
        <span class="mdc-list-item__text ${(item.owner === app.user.uid) ? 'message-right' : ''}">
            <span class="mdc-list-item__secondary-text">${item.owner_name}</span>
            ${item.message}        
      </span>
      </li>
    `
  });

  list.innerHTML = virtualList;

  list.scrollTop = list.scrollHeight;
};
app.onAddedMessages = function(snapshot) {
  if (snapshot) {
    app.messages = app.messages.concat(snapshot.val());
  }

  app.printMessages();
  app.hideLoader();
};
app.openRoom = function(id) {
  app.showSection('room');
  app.showLoader();
  app.actualRoom = id;

  app.realtimeDB.ref('messages').child(id).orderByChild('created_at').limitToLast(20).on('child_added', app.onAddedMessages);
};
app.sendMessage = function (message, callback) {
  if (app.user === null || app.actualRoom === null) return;
  const messagesRef = app.realtimeDB.ref('messages').child(app.actualRoom);

  messagesRef.push({
    message: message,
    type: 'text',
    owner: app.user.uid,
    created_at: Date.now(),
    owner_name: app.getUserName(),

  })
    .then(function(docRef) {
      callback(null);
    })
    .catch(function(error) {
      callback(error);
    });
};


app.domListeners = function () {
  document.getElementById('logout').addEventListener('click', function () {
    if (app.user === null) return;
    firebase.auth().signOut();
  });

  document.getElementById('add').addEventListener('click', function() {
    if (app.user === null) return;
    app.showSection('addNewRoom');
  });

  document.getElementById('home').addEventListener('click', function() {
    if (app.user === null) return;
    app.hideSections();
    app.showSection('rooms');
  });

  document.getElementById('reload').addEventListener('click', function() {
    if (app.user === null) return;
    app.showLoader();
    app.updateRooms(function() {
      app.hideLoader();
    });
  });

  document.getElementById('storeRoom').addEventListener('submit', function(event) {
    event.preventDefault();
    if (app.user === null) return;

    const name = document.getElementById('name');

    const value = name.value.trim();
    if (value === '') return;

    name.value = '';
    name.disabled = true;
    app.storeRoom(value, function(error){
      if (error) {
        console.log("hubo un error", error);
        return;
      }
      name.disabled = false;
    });
  });

  document.getElementById('sendMessage').addEventListener('submit', function(event) {
    event.preventDefault();
    if (app.user === null) return;

    const message = document.getElementById('message');

    const value = message.value.trim();
    if (value === '') return;

    message.value = '';
    message.disabled = true;
    app.sendMessage(value, function(error){
      if (error) {
        console.log("hubo un error", error);
        return;
      }
      message.disabled = false;
    });
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

  app.db = firebase.firestore();
  app.db.settings({timestampsInSnapshots: true});

  app.realtimeDB = firebase.database();

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

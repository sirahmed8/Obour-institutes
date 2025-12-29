/* eslint-disable no-undef */
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js');

const firebaseConfig = {
  apiKey: "AIzaSyDSJeoNeXeGF8OegC5xp2AHQ2qmUWjq_OE",
  authDomain: "obour-institutes-a607d.firebaseapp.com",
  projectId: "obour-institutes-a607d",
  storageBucket: "obour-institutes-a607d.firebasestorage.app",
  messagingSenderId: "761134603194",
  appId: "1:761134603194:web:dddcd24031105654935b83",
  measurementId: "G-M6ETHD5FLV"
};

firebase.initializeApp(firebaseConfig);

const messaging = firebase.messaging();

messaging.onBackgroundMessage(function(payload) {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  
  const notificationTitle = payload.notification.title || 'New Notification';
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/obour-logo.png', // Ensure this file exists in public/
    badge: '/favicon.ico'
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
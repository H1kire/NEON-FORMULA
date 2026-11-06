"use strict";

(function(){
  const config={
    apiKey:"AIzaSyBObB697j70JCrXLjpAWFtoUp_bcWY4n04",
    authDomain:"formula-ascent.firebaseapp.com",
    databaseURL:"https://formula-ascent-default-rtdb.europe-west1.firebasedatabase.app",
    projectId:"formula-ascent",
    storageBucket:"formula-ascent.firebasestorage.app",
    messagingSenderId:"35756034391",
    appId:"1:35756034391:web:0c6429873f3bfa2e575612",
    measurementId:"G-XCW34QMY5Y"
  };

  const $=id=>document.getElementById(id);
  const loginButton=$("googleSignInBtn");
  const logoutButton=$("googleSignOutBtn");
  const avatar=$("accountAvatar");
  const name=$("accountName");
  const description=$("accountDesc");
  const status=$("accountStatus");
  const errorBox=$("accountError");
  let auth=null;
  let currentUser=null;
  let busy=false;
  const DEVELOPER_UID="ZcdUu9qeDTTTHiFeUIGSoLbbf0H3";
  window.FAAuth={getCurrentUser:()=>currentUser,isDeveloper:()=>!!currentUser&&currentUser.uid===DEVELOPER_UID};

  const messages={
    en:{
      signedOut:"NOT SIGNED IN",
      signedIn:"GOOGLE ACCOUNT CONNECTED",
      signedInDescription:"You are signed in. Save your progress to the cloud to access it on another device.",
      signedOutDescription:"Sign in with Google to save your progress to your personal cloud slot.",
      signInError:"Could not sign in. Please try again.",
      signOutError:"Could not sign out. Please try again.",
      popupClosed:"The sign-in window was closed before completing.",
      popupBlocked:"Your browser blocked the sign-in window. Allow pop-ups for this site and try again.",
      domain:"This domain is not authorized in Firebase Authentication.",
      network:"Network error. Check your connection and try again.",
      unavailable:"Google sign-in is not enabled for this Firebase project.",
      loading:"Connecting to Firebase…"
    },
    ru:{
      signedOut:"НЕ ВОШЁЛ В АККАУНТ",
      signedIn:"АККАУНТ GOOGLE ПОДКЛЮЧЁН",
      signedInDescription:"Вы вошли в аккаунт. Сохраните прогресс в облако, чтобы использовать его на другом устройстве.",
      signedOutDescription:"Войдите через Google, чтобы сохранять прогресс в своём облачном хранилище.",
      signInError:"Не удалось войти. Попробуйте ещё раз.",
      signOutError:"Не удалось выйти из аккаунта. Попробуйте ещё раз.",
      popupClosed:"Окно входа было закрыто до завершения авторизации.",
      popupBlocked:"Браузер заблокировал окно входа. Разрешите всплывающие окна для этого сайта.",
      domain:"Этот домен не разрешён в Firebase Authentication.",
      network:"Ошибка сети. Проверьте подключение и попробуйте ещё раз.",
      unavailable:"Вход через Google не включён для этого проекта Firebase.",
      loading:"Подключение к Firebase…"
    }
  };

  const lang=()=>document.documentElement.lang==="ru"?"ru":"en";
  const message=key=>messages[lang()][key]||messages.en[key]||key;
  const showError=value=>{
    if(!errorBox)return;
    errorBox.textContent=value||"";
    errorBox.hidden=!value;
  };
  const errorMessage=error=>{
    const code=error&&error.code||"";
    if(code.includes("popup-closed-by-user"))return message("popupClosed");
    if(code.includes("popup-blocked"))return message("popupBlocked");
    if(code.includes("unauthorized-domain"))return message("domain");
    if(code.includes("network-request-failed"))return message("network");
    if(code.includes("operation-not-allowed"))return message("unavailable");
    return message("signInError");
  };

  function render(){
    if(!loginButton||!logoutButton)return;
    const signedIn=!!currentUser;
    const developerPanel=$("developerPanel");
    const developerAccess=!!currentUser&&currentUser.uid===DEVELOPER_UID;
    if(developerPanel){
      developerPanel.hidden=!developerAccess;
      if(developerAccess&&typeof window.getDeveloperValues==="function"){
        const values=window.getDeveloperValues();
        const timeInput=$("developerTimeInput"),apInput=$("developerAPInput"),gpInput=$("developerGPInput");
        if(timeInput)timeInput.value=String(values.t);
        if(apInput)apInput.value=String(values.ap);
        if(gpInput)gpInput.value=String(values.gp);
      }
    }
    loginButton.hidden=signedIn;
    logoutButton.hidden=!signedIn;
    loginButton.disabled=busy;
    logoutButton.disabled=busy;
    if(status)status.textContent=signedIn?message("signedIn"):message("signedOut");
    if(name)name.textContent=signedIn?(currentUser.displayName||currentUser.email||"Player account"):(lang()==="ru"?"Аккаунт игрока":"Player account");
    if(description)description.textContent=signedIn?message("signedInDescription"):message("signedOutDescription");
    if(avatar){
      avatar.textContent=signedIn?(currentUser.displayName||currentUser.email||"P").trim().charAt(0).toUpperCase():"?";
      avatar.style.backgroundImage=signedIn&&currentUser.photoURL?"url(\""+currentUser.photoURL.replace(/[\"\\]/g,"")+"\")":"none";
      avatar.classList.toggle("has-photo",!!(signedIn&&currentUser.photoURL));
    }
  }

  window.refreshFirebaseAuthUI=render;

  function setBusy(value){
    busy=!!value;
    render();
  }

  async function signIn(){
    if(!auth||busy)return;
    showError("");
    setBusy(true);
    try{
      const provider=new firebase.auth.GoogleAuthProvider();
      await auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL);
      await auth.signInWithPopup(provider);
    }catch(error){
      showError(errorMessage(error));
    }finally{
      setBusy(false);
    }
  }

  async function signOut(){
    if(!auth||busy)return;
    showError("");
    setBusy(true);
    try{
      await auth.signOut();
    }catch(error){
      showError(message("signOutError"));
    }finally{
      setBusy(false);
    }
  }

  if(loginButton)loginButton.addEventListener("click",signIn);
  if(logoutButton)logoutButton.addEventListener("click",signOut);

  try{
    if(!window.firebase||!firebase.initializeApp)throw new Error("Firebase SDK failed to load.");
    const app=firebase.apps.length?firebase.app():firebase.initializeApp(config);
    auth=firebase.auth(app);
    auth.onAuthStateChanged(user=>{
      currentUser=user||null;
      showError("");
      render();
    },error=>{
      currentUser=null;
      showError(errorMessage(error));
      render();
    });
    auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL).catch(error=>showError(errorMessage(error)));
  }catch(error){
    currentUser=null;
    showError(message("signInError"));
    if(loginButton)loginButton.disabled=true;
    if(status)status.textContent="FIREBASE UNAVAILABLE";
  }

  render();
})();

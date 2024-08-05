
import { collection, addDoc, query, where, getDocs, updateDoc, doc, increment, getDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";




let name;
let userId;
let balance = 0;
let tapFarm = 1;
let mining2 = 50; // Початкове значення mining2
let db;
let userDocId;
let mst = null;
let miningDuration = 2 * 60 * 60 * 1000;
let updateTimeout = null;

function formatBalance(balance) {
  return balance.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
}

function animateValue(start, end, duration, updateCallback, finalCallback) {
  let startTime = null;

  function step(timestamp) {
    if (!startTime) startTime = timestamp;
    const progress = timestamp - startTime;
    const percent = Math.min(progress / duration, 1);
    const value = Math.floor(start + (end - start) * percent);
    updateCallback(value);
    if (percent < 1) {
      requestAnimationFrame(step);
    } else {
      if (finalCallback) finalCallback();
    }
  }

  requestAnimationFrame(step);
}










function updateMiningProgress() {
  const currentTime = new Date().getTime();
  const elapsed = currentTime - mst;
  const remaining = miningDuration - elapsed;

  const miningButton = document.querySelector('.home__mining');

  if (remaining > 0) {
    const hours = Math.floor(remaining / (1000 * 60 * 60));
    const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((remaining % (1000 * 60)) / 1000);

    document.querySelector('.home__mining-num').textContent = `${hours}h ${minutes}m ${seconds}s`;
    const percent = Math.floor((elapsed / miningDuration) * 100);
    miningButton.textContent = `${percent}%`;
    miningButton.classList.remove('ended');

    const minedTokens = Math.floor((elapsed / miningDuration) * mining2);
    document.querySelector('.home__mining-info').textContent = `${minedTokens} / ${mining2}`;
  } else {
    document.querySelector('.home__mining-num').textContent = '0h 0m 0s';
    miningButton.textContent = 'Claim';
    miningButton.classList.add('ended');
    document.querySelector('.home__mining-info').textContent = `${mining2} / ${mining2}`;
  }
}

function claimMining() {
  if (document.querySelector('.home__mining').textContent === 'Claim') {
    const newBalance = balance + mining2;
    animateValue(balance, newBalance, 1000, value => {
      balance = value;
      document.querySelectorAll('.balance__m').forEach(balanceElement => {
        balanceElement.textContent = formatBalance(balance);
      });
    });

    const userRef = doc(db, "users", userDocId);
    updateDoc(userRef, {
      balance: newBalance,
      mst: new Date().getTime()
    }).then(() => {
      console.log("Баланс і час початку майнінгу оновлено в базі даних");
      document.querySelectorAll('.balance__m').forEach(balanceElement => {
        balanceElement.textContent = formatBalance(newBalance);
      });
      mst = new Date().getTime();
    }).catch((error) => {
      console.error("Помилка оновлення даних в базі даних:", error);
    });
  }
}







const boostButtons = document.querySelectorAll('.mining__boost');
const popup = document.querySelector('.mining__popup');
const closeButton = document.querySelector('.mining__popup-clbtn');
const buyButton = popup.querySelector('.mining__popup-buy');
const popupName = popup.querySelector('.mining__popup-name');
const popupPrice = popup.querySelector('.mining__popup-pricetxt');
const popupContent = popup.querySelector('.mining__popup-content');
const alertMaxMining = document.getElementById('alertMaxMining');
const alertPassedSuccessfully = document.getElementById('PassedSuccessfully');

let selectedBoostMultiplier = 1;
let selectedBoostPrice = 0;
const MAX_MINING2 = 20000; // Максимальне значення mining2

boostButtons.forEach(boostButton => {
  boostButton.addEventListener('click', (event) => {
    event.stopPropagation();
    const info = boostButton.querySelector('.boost__info').textContent;
    const price = boostButton.querySelector('.boost_price').textContent.replace('k', '000');

    popupName.textContent = info;
    popupPrice.textContent = price;

    if (info.includes('X2')) {
      selectedBoostMultiplier = 2;
    } else if (info.includes('X5')) {
      selectedBoostMultiplier = 5;
    } else if (info.includes('X10')) {
      selectedBoostMultiplier = 10;
    } else if (info.includes('X15')) {
      selectedBoostMultiplier = 15;
    }

    selectedBoostPrice = parseInt(price);

    popup.classList.add('show');
    popup.style.bottom = '-20px';
  });
});

closeButton.addEventListener('click', () => {
  closeMiningPopup();
});

document.addEventListener('click', (event) => {
  if (!popup.contains(event.target)) {
    closeMiningPopup();
  }
});

buyButton.addEventListener('click', () => {
  const potentialMining2 = mining2 * selectedBoostMultiplier;

  if (balance >= selectedBoostPrice) {
    if (potentialMining2 > MAX_MINING2) {
      // Показуємо кастомний алерт
      alertMaxMining.style.display = 'flex';
      setTimeout(() => {
        alertMaxMining.classList.add('show');
      }, 10);

      setTimeout(() => {
        alertMaxMining.classList.remove('show');
        setTimeout(() => {
          alertMaxMining.style.display = 'none';
        }, 500);
      }, 3000);
    } else {
      balance -= selectedBoostPrice;
      mining2 = potentialMining2;

      console.log(`New mining power: ${mining2}, Remaining balance: ${balance}`);

      const userRef = doc(db, "users", userDocId);
      updateDoc(userRef, {
        balance: balance,
        mining2: mining2
      }).then(() => {
        console.log("Баланс і прокачка майнінгу оновлено в базі даних");
        document.querySelectorAll('.balance__m').forEach(balanceElement => {
          balanceElement.textContent = formatBalance(balance);
        });
        document.querySelector('.home__mining-info').textContent = `0 / ${mining2}`;
        updateMiningProgress();

        // Показуємо алерт "PassedSuccessfully"
        alertPassedSuccessfully.style.display = 'flex';
        setTimeout(() => {
          alertPassedSuccessfully.classList.add('show');
        }, 10);

        setTimeout(() => {
          alertPassedSuccessfully.classList.remove('show');
          setTimeout(() => {
            alertPassedSuccessfully.style.display = 'none';
          }, 500);
        }, 3000);

      }).catch((error) => {
        console.error("Помилка оновлення даних в базі даних:", error);
      });

      closeMiningPopup();
    }
  } else {
    const alertDiv = document.getElementById('alertMiningBalance');
    alertDiv.style.display = 'flex';
    setTimeout(() => {
      alertDiv.classList.add('show');
    }, 10);

    setTimeout(() => {
      alertDiv.classList.remove('show');
      setTimeout(() => {
        alertDiv.style.display = 'none';
      }, 500);
    }, 3000);
  }
});

// Оголошення функції closeMiningPopup
function closeMiningPopup() {
  popup.classList.remove('show');
  popup.style.bottom = '-100%';
}








function closePopup() {
  popup.classList.remove('show');
  popup.style.bottom = '-290px';
}

export function initializeDatabase(firebaseDb) {
  db = firebaseDb;










//   async function addToDatabase(name, userId) {
//     try {
//         const q = query(collection(db, "users"), where("userId", "==", userId));
//         const querySnapshot = await getDocs(q);

//         let friend = 0; // Визначення змінної friend

//         if (querySnapshot.empty) {
//             // Реєстрація нового користувача
//             const docRef = await addDoc(collection(db, "users"), {
//                 sv: false,
//                 // username: name,
//                 userId: userId,
//                 balance: 0,
//                 tapFarm: 1,
//                 mining2: 50,
//                 mst: new Date().getTime(),
//                 friend: 0,
//             });
//             console.log("Документ з ID доданий: ", docRef.id);
//             userDocId = docRef.id;
//             mst = new Date().getTime();
//             friend = 0;
//         } else {
//             querySnapshot.forEach((doc) => {
//                 const data = doc.data();
//                 balance = data.balance;
//                 tapFarm = data.tapFarm;
//                 mining2 = data.mining2;
//                 mst = data.mst;
//                 userDocId = doc.id;
//                 friend = data.friend; // Отримання значення friend з бази даних
//             });
//             mst = mst || new Date().getTime();
//         }

//         document.querySelectorAll('.balance__m').forEach(balanceElement => {
//             balanceElement.textContent = formatBalance(balance);
//         });

//         // Оновлення елемента friend__stats-num
//         document.querySelectorAll('.friend__stats-num').forEach(friendElement => {
//             friendElement.textContent = friend;
//         });

//         csv();

//         updateMiningProgress();
//         setInterval(updateMiningProgress, 1000);
//     } catch (error) {
//         console.error("Помилка додавання документа: ", error);
//     }

    
// }










async function addToDatabase(name, userId) {
  try {
      const q = query(collection(db, "users"), where("userId", "==", userId));
      const querySnapshot = await getDocs(q);

      let friend = 0; // Визначення змінної friend

      if (querySnapshot.empty) {
          // Реєстрація нового користувача
          const docRef = await addDoc(collection(db, "users"), {
              sv: false,
              // username: name,
              userId: userId,
              balance: 0,
              tapFarm: 1,
              mining2: 50,
              mst: new Date().getTime(),
              friend: 0,
          });
          console.log("Документ з ID доданий: ", docRef.id);
          userDocId = docRef.id;
          mst = new Date().getTime();
          friend = 0;
      } else {
          querySnapshot.forEach((doc) => {
              const data = doc.data();
              balance = data.balance;
              tapFarm = data.tapFarm;
              mining2 = data.mining2;
              mst = data.mst;
              userDocId = doc.id;
              friend = data.friend; // Отримання значення friend з бази даних
          });
          mst = mst || new Date().getTime();
      }

      document.querySelectorAll('.balance__m').forEach(balanceElement => {
          balanceElement.textContent = formatBalance(balance);
      });

      // Оновлення елемента friend__stats-num
      document.querySelectorAll('.friend__stats-num').forEach(friendElement => {
          friendElement.textContent = friend;
      });

      // Перевірка значення friend і відповідне відображення main__drop
      const mainDropElement = document.querySelector('.main__drop');
      if (friend > 893930) {
          mainDropElement.style.display = 'block';
      } else {
          mainDropElement.style.display = 'none';
      }

      csv();

      updateMiningProgress();
      setInterval(updateMiningProgress, 1000);
  } catch (error) {
      console.error("Помилка додавання документа: ", error);
  }
}




// Функція для перевірки, чи користувач вже активував реферальний код
async function checkReferralCodeActivated(userId) {
  const usersRef = collection(db, "users");
  const q = query(usersRef, where("userId", "==", userId));
  const querySnapshot = await getDocs(q);

  if (!querySnapshot.empty) {
    const userDoc = querySnapshot.docs[0];
    if (userDoc.exists() && userDoc.data().referralCodeActivated) {
      return true;
    }
  }
  return false;
}

// Функція для оновлення балансу в DOM
function updateBalanceInDOM(userId, newBalance) {
  const balanceElement = document.getElementById(`balance-${userId}`);
  if (balanceElement) {
    balanceElement.textContent = newBalance;
  }
}

// Функція для активації реферального коду
async function activateReferralCode() {
  // Приховуємо всі alert-повідомлення
  document.querySelectorAll('.code__alert, .code__alert-done, .code__alert-activated').forEach(alert => {
    alert.classList.remove('show');
  });

  console.log("Триває перевірка");

  const referralCodeInput = parseInt(document.getElementById('custom-input').value.trim(), 10);

  if (!referralCodeInput || isNaN(referralCodeInput)) {
    document.querySelector('.code__alert').classList.add('show');
    setTimeout(() => {
      document.querySelector('.code__alert').classList.remove('show');
    }, 3000); // Видаляємо через 3 секунди
    return;
  }

  console.log('Введений реферальний код (перетворений на число):', referralCodeInput);

  try {
    // Перевірка, чи вже активований реферальний код для цього користувача
    if (await checkReferralCodeActivated(userId)) {
      document.querySelector('.code__alert-activated').classList.add('show');
      setTimeout(() => {
        document.querySelector('.code__alert-activated').classList.remove('show');
      }, 3000); // Видаляємо через 3 секунди
      return;
    }

    const usersRef = collection(db, "users");
    const q = query(usersRef, where("userId", "==", referralCodeInput));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      console.log('Користувача з введеним userId не знайдено.');
      document.querySelector('.code__alert-activated').classList.add('show');
      setTimeout(() => {
        document.querySelector('.code__alert-activated').classList.remove('show');
      }, 3000); // Видаляємо через 3 секунди
      return;
    }

    console.log('Всі userId знайдені в базі:');
    querySnapshot.forEach(doc => {
      const referrerUserId = doc.data().userId;
      console.log(referrerUserId);
    });

    const referrerDoc = querySnapshot.docs[0];
    const referrerData = referrerDoc.data();

    const referrerRef = doc(db, "users", referrerDoc.id);
    const newReferrerBalance = referrerData.balance + 3000;

    await updateDoc(referrerRef, {
      balance: newReferrerBalance,
      friend: referrerData.friend + 1,
    });

    console.log(`Баланс користувача ${referrerData.userId} оновлено на 3000 і додано одного друга.`);

    // Оновлення балансу реферера в DOM
    updateBalanceInDOM(referrerData.userId, newReferrerBalance);

    // Збереження інформації про активований реферальний код у базу даних
    const currentUserQuery = query(usersRef, where("userId", "==", userId));
    const currentUserSnapshot = await getDocs(currentUserQuery);

    if (!currentUserSnapshot.empty) {
      const currentUserDoc = currentUserSnapshot.docs[0];
      const currentUserData = currentUserDoc.data();
      const currentUserRef = doc(db, "users", currentUserDoc.id);

      const newCurrentUserBalance = currentUserData.balance + 3000;
      await updateDoc(currentUserRef, {
        balance: newCurrentUserBalance, // Додаємо баланс поточному користувачу
        referralCodeActivated: true,
      });

      // Оновлення балансу поточного користувача в DOM
      updateBalanceInDOM(userId, newCurrentUserBalance);

      balance = newCurrentUserBalance; // Оновлення локального балансу

      document.querySelector('.code__alert-done').classList.add('show');
      setTimeout(() => {
        document.querySelector('.code__alert-done').classList.remove('show');
      }, 3000); // Видаляємо через 3 секунди
    } else {
      console.error('Користувач не знайдений у базі даних.');
      document.querySelector('.code__alert-done').classList.add('show');
      setTimeout(() => {
        document.querySelector('.code__alert-done').classList.remove('show');
      }, 3000); // Видаляємо через 3 секунди
    }
  } catch (error) {
    console.error('Помилка при пошуку або оновленні користувача:', error);
    alert('Error while processing referral code. Please try again later.');
  }
}

document.querySelector('.code__btn').addEventListener('click', activateReferralCode);

// Функція для оновлення балансу при натисканні
function handleTap(x, y) {
  const floatingNumber = document.createElement('div');
  floatingNumber.classList.add('floating-number');
  floatingNumber.innerHTML = formatBalance(tapFarm);

  document.body.appendChild(floatingNumber);

  floatingNumber.style.left = `${x}px`;
  floatingNumber.style.top = `${y}px`;

  const oldBalance = balance;
  balance += tapFarm;

  animateValue(oldBalance, balance, 1000, value => {
    document.querySelectorAll('.balance__m').forEach(balanceElement => {
      balanceElement.textContent = formatBalance(value);
    });
  });

  // Оновлення балансу в пам'яті, а не в базі даних
  setTimeout(() => {
    floatingNumber.remove();
  }, 1000);

  // Запуск таймауту перед оновленням в базі даних
  clearTimeout(updateTimeout);
  updateTimeout = setTimeout(() => {
    batchUpdateBalance();
  }, 2000); // Затримка перед оновленням в базі даних (2 секунди)
}

// Функція для пакетного оновлення балансу в базі даних
async function batchUpdateBalance() {
  const userRef = doc(db, "users", userDocId);
  try {
    const userSnap = await getDoc(userRef);
    if (userSnap.exists()) {
      const userData = userSnap.data();
      const currentBalanceInDb = userData.balance;

      const newBalance = currentBalanceInDb + (balance - currentBalanceInDb);

      await updateDoc(userRef, {
        balance: newBalance
      });

      balance = newBalance; // Оновлюємо локальний баланс після оновлення в базі даних
      console.log("Баланс оновлено в базі даних");
      document.querySelectorAll('.balance__m').forEach(balanceElement => {
        balanceElement.textContent = formatBalance(newBalance);
      });
    } else {
      console.error("Документ користувача не знайдено");
    }
  } catch (error) {
    console.error("Помилка оновлення балансу в базі даних:", error);
  }
}






var input = document.getElementById('custom-input');

input.addEventListener('focus', function() {
    var viewportMeta = document.querySelector('meta[name="viewport"]');
    viewportMeta.content = 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no';
});

input.addEventListener('blur', function() {
    var viewportMeta = document.querySelector('meta[name="viewport"]');
    viewportMeta.content = 'width=device-width, initial-scale=1.0';
});













// Функція для приховування елемента, якщо реферальний код вже активовано
async function hideReferralCodeSectionIfActivated(userId) {
  if (await checkReferralCodeActivated(userId)) {
      document.querySelector('.main__code').classList.add('hidden');
  }
}

// Виклик функції при завантаженні сторінки
document.addEventListener('DOMContentLoaded', async () => {

  // Переконайтеся, що змінна userId доступна на цьому етапі
  if (typeof userId !== 'undefined') {
      await hideReferralCodeSectionIfActivated(userId);
  } else {
      console.error('userId is not defined.');
  }
});











  
  
  async function csv() {
    try {
      const userRef = doc(db, "users", userDocId);
      const docSnap = await getDoc(userRef);

      if (docSnap.exists()) {
        const userData = docSnap.data();
        const sv = userData.sv;

        if (sv) {
          const mainSub = document.getElementById('main__sub');
          if (mainSub) {
            mainSub.classList.add('hidden');
            setTimeout(() => {
              mainSub.style.display = 'none';
            }, 500); // Зникає через 0.5 секунди
          }
        }
      } else {
        console.error("Документ користувача не знайдено в базі даних");
      }
    } catch (error) {
      console.error("Помилка отримання даних з бази даних:", error);
    }
  }

  window.onload = function () {
    name = name || 'user0';
    userId = userId || 'user0';
    addToDatabase(name, userId);
  };
}






document.addEventListener('DOMContentLoaded', async function() {
  Telegram.WebApp.ready();

  const user = Telegram.WebApp.initDataUnsafe.user;

  function updateUserText(selector, text) {
    const elements = document.querySelectorAll(selector);
    elements.forEach(element => {
      element.textContent = text;
    });
  }

  if (user) {
    userId = user.id;
    if (user.username && user.username.startsWith('@')) {
      name = user.username;
    } else if (user.first_name) {
      name = user.first_name;
    } else {
      name = 'user0';
    }

    updateUserText(".home__user", name);

    try {
      const q = query(collection(db, "users"), where("userId", "==", userId));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        const userDoc = querySnapshot.docs[0];
        const userData = userDoc.data();
        userDocId = userDoc.id; // Зберігаємо ідентифікатор документа
        balance = userData.balance; // Оновлюємо поточний баланс
        tapFarm = userData.tapFarm; // Оновлюємо значення tapFarm
        mining2 = userData.mining2; // Оновлюємо значення mining2
        mst = userData.mst; // Оновлюємо час початку майнінгу

        document.querySelectorAll('.balance__m').forEach(balanceElement => {
          balanceElement.textContent = formatBalance(balance);
        });

        document.querySelector('.home__mining-info').textContent = `0 / ${mining2}`;
        updateMiningProgress();
        setInterval(updateMiningProgress, 1000);

        // Перевірка значення subVaard та приховання блоку при необхідності
        checkSubVaard();
      } else {
        console.error("Користувач не знайдений в базі даних");
      }
    } catch (error) {
      console.error("Помилка отримання даних з бази даних:", error);
    }
  } else {
    name = 'error';
    updateUserText(".home__user", name);
  }
});

document.getElementById('mainBtn').addEventListener('click', function (event) {
  handleTap(event.clientX, event.clientY);

  // Вібрація під час тапання
  if (navigator.vibrate) {
    navigator.vibrate(10); // Коротка вібрація на 50 мс
  }
});

document.getElementById('mainBtn').addEventListener('touchstart', function (event) {
  event.preventDefault(); // Запобігаємо стандартній обробці події
  const touches = event.touches;
  for (let i = 0; i < Math.min(touches.length, 3); i++) {
    handleTap(touches[i].clientX, touches[i].clientY);

    // Вібрація під час тапання
    if (navigator.vibrate) {
      navigator.vibrate(10); // Коротка вібрація на 50 мс
    }
  }
});

document.querySelector('.home__mining').addEventListener('click', function() {
  claimMining();

  // Вібрація під час клеймінгу майнінгу
  if (navigator.vibrate) {
    navigator.vibrate(100); // Коротка вібрація на 100 мс
  }
});








document.addEventListener('DOMContentLoaded', async function() {
  const link1 = document.getElementById('sub__check-vaard-1');
  const link2 = document.querySelector('.vaard__channel-link');

  if (link1) {
    link1.addEventListener('click', async function(event) {
      await updateSubVaard(true);
      window.location.href = link1.href;
    });
  }

  if (link2) {
    link2.addEventListener('click', async function(event) {
      await updateSubVaard(true);
      window.location.href = link2.href;
    });
  }
});

async function updateSubVaard(value) {
  const userRef = doc(db, "users", userDocId);
  try {
    await updateDoc(userRef, {
      sv: value
    });
    console.log("Поле subVaard оновлено в базі даних");
    checkSubVaard(); // Перевірка значення subVaard та приховання блоку при необхідності
  } catch (error) {
    console.error("Помилка оновлення поля subVaard в базі даних:", error);
  }
}












document.addEventListener('DOMContentLoaded', function() {


  const copyReferralMessage = async (button) => {
      const alertDiv = document.getElementById('alertFriendRef');
      const referralMessage = `Invite friends, get airdrops and prizes!🎉👫💰\n\n😺 Code for a friend 😺 - ${userId}\n\n🔗 Link 🔗 - https://t.me/VaardTokenbot`;

      try {
          await navigator.clipboard.writeText(referralMessage);

          // Вібрація на мобільних пристроях
          if (navigator.vibrate) {
              navigator.vibrate(40); // 40 мс вібрації
          }

          alertDiv.style.display = 'flex';
          setTimeout(() => {
              alertDiv.classList.add('show');
          }, 10);

          setTimeout(() => {
              alertDiv.classList.remove('show');
              setTimeout(() => {
                  alertDiv.style.display = 'none';
              }, 500);
          }, 3000);

          // Додавання реферального коду у відповідний елемент
          const referralCodeElement = document.querySelector('.ref__input-txt');
          if (referralCodeElement) {
              referralCodeElement.textContent = `Code: ${userId}`;
              console.log(`Referral code updated: Code: ${userId}`);
          } else {
              console.log('Referral code element not found.');
          }
      } catch (err) {
          console.error('Failed to copy text: ', err);
      }
  };

  const copyReferralLinkBtn1 = document.getElementById('ref__button-input');
  const copyReferralLinkBtn2 = document.getElementById('main__ref-code');

  copyReferralLinkBtn1.addEventListener('click', () => copyReferralMessage(copyReferralLinkBtn1));
  copyReferralLinkBtn2.addEventListener('click', () => copyReferralMessage(copyReferralLinkBtn2));
});








document.addEventListener("DOMContentLoaded", function() {
    setTimeout(function() {
        const logoText = document.getElementById('logo-text');
        const text = 'Token';
        let index = 0;

        logoText.style.visibility = 'visible'; // Показуємо текст після затримки

        function typeWriter() {
            if (index < text.length) {
                logoText.innerHTML += text.charAt(index);
                index++;
                setTimeout(typeWriter, 200); // Швидкість друкування (100 мс на символ)
            }
        }

        typeWriter();
    }, 1200); // Затримка 1.2 секунди
});





document.addEventListener("DOMContentLoaded", function() {
    setTimeout(function() {
        var preloader = document.querySelector(".main__preloader");
        preloader.classList.add("hidden");
    }, 3000); // Встановлюємо затримку в 2.5 секунди
});











document.querySelector('.user__ref-btn').addEventListener('click', function() {
  document.querySelector('.main__code').style.display = 'block';
  document.querySelector('.code__skip').style.display = 'none';
});








document.addEventListener('DOMContentLoaded', () => {
    const navLinks = document.querySelectorAll('.nav__link');
    const userLinks = document.querySelectorAll('.main__user-link');

    navLinks.forEach(link => {
        link.addEventListener('click', function(event) {
            event.preventDefault();
            const target = link.getAttribute('data-target');
            showPage(target);
            setActiveLink(link);
        });
    });

    userLinks.forEach(link => {
        link.addEventListener('click', function(event) {
            event.preventDefault();
            showPage('main__user');
            setActiveLink(null);
        });
    });

    function showPage(className) {
        let pages = document.querySelectorAll('main');
        pages.forEach(page => {
            if (page.classList.contains(className)) {
                page.style.display = 'block';
            } else {
                page.style.display = 'none';
            }
        });
    }

    function setActiveLink(activeLink) {
        navLinks.forEach(link => link.classList.remove('active'));
        if (activeLink) {
            activeLink.classList.add('active');
        }
    }
});



document.addEventListener('DOMContentLoaded', function() {
    // Отримання кнопок
    var timerBtn = document.querySelector('.timer__shh');
    var refBtn = document.querySelector('.ref__back');
    var mainTime = document.querySelector('.main__time');

    // Додавання обробника події для кнопки timer__shh
    timerBtn.addEventListener('click', function() {
        mainTime.classList.add('hidden'); // Додаємо клас, щоб сховати main__time
    });

    // Додавання обробника події для кнопки ref__back
    refBtn.addEventListener('click', function() {
        mainTime.classList.remove('hidden'); // Видаляємо клас, щоб показати main__time
    });
});






document.querySelectorAll('.user__btn').forEach(button => {
  button.addEventListener('click', function() {
    const alertUser = document.getElementById('alertUser');
    
    // Показуємо сповіщення
    alertUser.classList.add('show');
    
    // Ховаємо сповіщення через 2 секунди
    setTimeout(() => {
      alertUser.classList.remove('show');
      alertUser.classList.add('hide');
      
      // Зробимо display none після завершення анімації
      setTimeout(() => {
        alertUser.classList.remove('hide');
      }, 500); // Час, що відповідає анімації ховання
    }, 2000);
  });
});











// const targetDate = new Date();

// targetDate.setDate(targetDate.getDate() + 0);
// targetDate.setHours(0);                         
// targetDate.setMinutes(0);                      
// targetDate.setSeconds(0);                       

// const timer = document.getElementById('timer');
// const days = document.getElementById('days');
// const hours = document.getElementById('hours');
// const minutes = document.getElementById('minutes');
// const seconds = document.getElementById('seconds');

// const mainTime = document.querySelector('.main__time');
// const mainRef = document.querySelector('.main__ref');

// function updateTime() {
//   const now = new Date();
//   const timeLeft = targetDate.getTime() - now.getTime();

//   const daysRemaining = Math.floor(timeLeft / (1000 * 60 * 60 * 24));
//   const hoursRemaining = Math.floor((timeLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
//   const minutesRemaining = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
//   const secondsRemaining = Math.floor((timeLeft % (1000 * 60)) / 1000);

//   days.textContent = `${daysRemaining}D`;
//   hours.textContent = `${hoursRemaining}h`;
//   minutes.textContent = `${minutesRemaining}m`;
//   seconds.textContent = `${secondsRemaining}s`;

//   if (timeLeft <= 0) {
//     clearInterval(intervalId);
//     mainTime.classList.add('hidden');
//     mainRef.classList.add('hidden');
//   }
// }

// const intervalId = setInterval(updateTime, 1000);






document.addEventListener("DOMContentLoaded", function() {
  // Отримати елементи
  var menu = document.querySelector('.menu');
  var mainPreloader = document.querySelector('.main__preloader');
  var mainTime = document.querySelector('.main__time');
  var mainRef = document.querySelector('.main__ref');
  var mainSub = document.querySelector('.main__sub');
  var mainCode = document.querySelector('.main__code'); // Додано новий елемент

  // Функція перевірки стану всіх елементів
  function checkAllHidden() {
      if (mainPreloader.classList.contains('hidden') &&
          // mainTime.classList.contains('hidden') &&
          // mainRef.classList.contains('hidden') &&
          mainSub.classList.contains('hidden') &&
          mainCode.classList.contains('hidden')) { // Додано перевірку нового елементу
          menu.style.position = 'fixed';
      } else {
          menu.style.position = 'relative';
      }
  }

  // Створити спостерігача змін класів
  var observer = new MutationObserver(function(mutations) {
      mutations.forEach(function(mutation) {
          if (mutation.attributeName === 'class') {
              checkAllHidden();
          }
      });
  });

  // Налаштування спостерігача
  var config = {
      attributes: true,
      attributeFilter: ['class']
  };

  // Почати спостереження за всіма main елементами
  observer.observe(mainPreloader, config);
  observer.observe(mainTime, config);
  observer.observe(mainRef, config);
  observer.observe(mainSub, config);
  observer.observe(mainCode, config); // Додано спостереження за новим елементом

  // Перевірити стан елементів на початку
  checkAllHidden();
});

document.getElementById('custom-input').addEventListener('input', function() {
  if (this.value) {
      this.classList.add('modified');
  } else {
      this.classList.remove('modified');
  }
});



document.querySelector('.code__skip').addEventListener('click', function() {
  document.querySelector('.main__code').classList.toggle('hidden');
});









// Відключення контекстного меню
document.addEventListener('contextmenu', function(e) {
  e.preventDefault();
});

// Відключення вибору тексту
document.addEventListener('selectstart', function(e) {
  e.preventDefault();
});














// Отримуємо всі кнопки friend__btn
const btns1 = document.querySelectorAll('.friend__btn');
const popup1 = document.querySelector('.friend__popup');
const popupInfo1 = document.querySelector('.friend__popup-name');
const popupPrice1 = document.querySelector('.friend__popup-pricetxt');
const closeBtn1 = document.querySelector('.friend__popup-clbtn');

btns1.forEach(btn1 => {
    btn1.addEventListener('click', function(event1) {
        const actualBtn1 = event1.target.closest('.friend__btn');
        const btnText1 = actualBtn1.querySelector('.friend__btn-info').textContent;
        const btnPrice1 = actualBtn1.querySelector('.friend__btn-num').textContent;
        popupInfo1.textContent = btnText1;
        popupPrice1.textContent = btnPrice1;
        popup1.classList.add('show');
    });
});

closeBtn1.addEventListener('click', function() {
    popup1.classList.remove('show');
});

document.addEventListener('click', function(event2) {
    if (!popup1.contains(event2.target) && !event2.target.closest('.friend__btn')) {
        popup1.classList.remove('show');
    }
});








// Функція для оновлення поля CheckTask та балансу
async function updateCheckTaskAndBalance(taskNumber, taskPrice, taskLink) {
  try {
    const userRef = doc(db, "users", userDocId);
    const userSnap = await getDoc(userRef);
    const alertTaskCompleted = document.getElementById('alertTaskCompleted');
    const alertTaskCongratulations = document.getElementById('alertTaskCongratulations');
    const balanceElement = document.getElementById('balanceTxt'); // Додаємо елемент балансу

    if (userSnap.exists()) {
      const userData = userSnap.data();
      let checkTask = userData.CheckTask || ''; // Отримуємо поточне значення CheckTask

      // Перевіряємо, чи завдання вже виконане
      if (checkTask.includes(taskNumber)) {
        // Показуємо алерт про те, що завдання вже виконане
        alertTaskCompleted.style.display = 'flex';
        setTimeout(() => {
          alertTaskCompleted.classList.add('show');
        }, 10);

        setTimeout(() => {
          alertTaskCompleted.classList.remove('show');
          setTimeout(() => {
            alertTaskCompleted.style.display = 'none';
          }, 500);
        }, 3000);

        return; // Виходимо з функції, якщо завдання вже виконане
      }

      const newBalance = userData.balance + parseInt(taskPrice, 10);

      // Оновлюємо CheckTask, додаючи новий номер завдання
      checkTask += taskNumber;

      await updateDoc(userRef, {
        CheckTask: checkTask,
        balance: newBalance
      });

      // Оновлюємо баланс на фронтенді
      balance = newBalance; // Оновлюємо локальний баланс
      balanceElement.innerText = newBalance;

      // Показуємо кастомний алерт про успішне виконання завдання
      const showAlert = () => {
        alertTaskCongratulations.style.display = 'flex';
        setTimeout(() => {
          alertTaskCongratulations.classList.add('show');
        }, 10);

        setTimeout(() => {
          alertTaskCongratulations.classList.remove('show');
          setTimeout(() => {
            alertTaskCongratulations.style.display = 'none';
          }, 500);
        }, 3000);
      };

      // Затримка перед показом алерту, якщо є посилання
      if (taskLink.trim() !== '') {
        setTimeout(showAlert, 3500);
      } else {
        showAlert();
      }

      console.log(`Завдання ${taskNumber} виконане та баланс оновлено`);

      // Перевіряємо наявність посилання і перекидуємо, якщо воно є
      if (taskLink.trim() !== '') {
        setTimeout(() => {
          window.location.href = taskLink.trim();
        }, 3500);
      }

    } else {
      console.error("Документ користувача не знайдено");
    }
  } catch (error) {
    console.error(`Помилка оновлення завдання ${taskNumber} та оновлення балансу:`, error);
  }
}

// Функція для обробки зендл тапу (додавання числа до балансу з анімацією)
function handleTap(x, y) {
  const floatingNumber = document.createElement('div');
  floatingNumber.classList.add('floating-number');
  floatingNumber.innerHTML = formatBalance(tapFarm);

  document.body.appendChild(floatingNumber);

  floatingNumber.style.left = `${x}px`;
  floatingNumber.style.top = `${y}px`;

  const oldBalance = balance;
  balance += tapFarm;

  animateValue(oldBalance, balance, 1000, value => {
    document.querySelectorAll('.balance__m').forEach(balanceElement => {
      balanceElement.textContent = formatBalance(value);
    });
  });

  // Оновлення балансу в пам'яті, а не в базі даних
  setTimeout(() => {
    floatingNumber.remove();
  }, 1000);

  // Запуск таймауту перед оновленням в базі даних
  clearTimeout(updateTimeout);
  updateTimeout = setTimeout(() => {
    batchUpdateBalance();
  }, 1000); // Затримка перед оновленням в базі даних (1 секунда)
}

async function batchUpdateBalance() {
  const userRef = doc(db, "users", userDocId);
  try {
    const userSnap = await getDoc(userRef);
    if (userSnap.exists()) {
      const userData = userSnap.data();
      const currentBalanceInDb = userData.balance;

      const newBalance = currentBalanceInDb + (balance - currentBalanceInDb);

      await updateDoc(userRef, {
        balance: newBalance
      });

      balance = newBalance; // Оновлюємо локальний баланс після оновлення в базі даних
      console.log("Баланс оновлено в базі даних");
      document.querySelectorAll('.balance__m').forEach(balanceElement => {
        balanceElement.textContent = formatBalance(newBalance);
      });
    } else {
      console.error("Документ користувача не знайдено");
    }
  } catch (error) {
    console.error("Помилка оновлення балансу в базі даних:", error);
  }
}

// Ініціалізація бази даних та користувача
window.initializeOcsScript = (firebaseDb, userId) => {
  db = firebaseDb;
  userDocId = userId;
}

// Отримуємо всі кнопки task__btn
const taskBtns = document.querySelectorAll('.task__btn');
// Отримуємо popup для завдань
const taskPopup = document.querySelector('.task__popup');
// Отримуємо елемент, в якому буде відображатися інформація про завдання
const taskPopupName = document.querySelector('.task__popup-name');
// Отримуємо елемент, в якому буде відображатися ціна
const taskPopupPrice = document.querySelector('.task__popup-pricetxt');
// Отримуємо елемент, в якому буде відображатися посилання
const taskPopupLink = document.querySelector('.task__link');
// Отримуємо кнопку закриття popup для завдань
const taskCloseBtn = document.querySelector('.task__popup-clbtn');

// Додаємо обробник події для кожної кнопки завдання
taskBtns.forEach(btn => {
  btn.addEventListener('click', function (event) {
    const actualBtn = event.target.closest('.task__btn');
    // Отримуємо текст з кнопки завдання
    const btnText = actualBtn.querySelector('.btn__info').textContent;
    // Отримуємо ціну з кнопки завдання
    const btnPrice = actualBtn.querySelector('.task__num').textContent;
    // Отримуємо посилання з кнопки завдання
    const btnLink = actualBtn.querySelector('.task__link').textContent;

    // Змінюємо вміст popup в залежності від тексту кнопки завдання
    taskPopupName.textContent = btnText;
    // Змінюємо вміст popup в залежності від ціни кнопки завдання
    taskPopupPrice.textContent = btnPrice;
    // Змінюємо вміст popup в залежності від посилання кнопки завдання
    taskPopupLink.textContent = btnLink;

    // Відображаємо popup для завдань
    taskPopup.classList.add('show');
  });
});

// Додаємо обробник події для кнопки закриття popup для завдань
taskCloseBtn.addEventListener('click', function () {
  taskPopup.classList.remove('show');
});

// Додаємо обробник події для кнопки "Let's go"
document.getElementById("taskButton").addEventListener("click", async () => {
  const taskNumber = taskPopupName.textContent;
  const taskPrice = taskPopupPrice.textContent;
  const taskLink = taskPopupLink.textContent;
  await updateCheckTaskAndBalance(taskNumber, taskPrice, taskLink);
});











// Функція для вібрації
function vibrateDevice() {
  if ("vibrate" in navigator) {
    navigator.vibrate(20); // Вібрація на 20 мілісекунд
  }
}

// Додаємо обробник події для кнопки "Let's go" з класом task__popup-buy
document.querySelector('.task__popup-buy').addEventListener("click", async () => {
  // Вібрація при кліку на кнопку "Let's go"
  vibrateDevice();
});

// Додаємо обробник події для кнопки закриття popup з класом task__popup-clbtn
document.querySelector('.task__popup-clbtn').addEventListener("click", async () => {
  // Вібрація при кліку на кнопку закриття popup
  vibrateDevice();
});

// Додаємо обробник події для кнопок завдань з класом task__btn
const taskButtons = document.querySelectorAll('.task__btn');
taskButtons.forEach(button => {
  button.addEventListener('click', async () => {
    // Вібрація при кліку на кнопку завдання
    vibrateDevice();
  });
});







    











document.addEventListener('DOMContentLoaded', () => {
    const links = document.querySelectorAll('.nav__link');
    const texts = document.querySelectorAll('.menu__list-text');

    function setActiveLink(activeLink) {
        links.forEach(link => {
            const text = link.querySelector('.menu__list-text');
            if (link === activeLink) {
                link.classList.add('active');
                text.classList.add('active');
            } else {
                link.classList.remove('active');
                text.classList.remove('active');
            }
        });
    }

    links.forEach(link => {
        link.addEventListener('click', (event) => {
            event.preventDefault();
            setActiveLink(link);
        });
    });

    if (links.length > 0) {
        setActiveLink(links[0]);
    }
});






function checkDeviceType() {
  const mainPcElement = document.querySelector('.main__pc');
  if (!mainPcElement) {
    console.error("Element with class 'main__pc' not found.");
    return;
  }

  const isMobile = /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
  if (!isMobile) {
    mainPcElement.classList.add('visible');
    mainPcElement.classList.remove('hidden');
  } else {
    mainPcElement.classList.remove('visible');
    mainPcElement.classList.add('hidden');
  }
}

document.addEventListener('DOMContentLoaded', () => {
  checkDeviceType();
});










window.onerror = function (message, source, lineno, colno, error) {
  return true;
};

window.addEventListener('unhandledrejection', function (event) {
  event.preventDefault();
});





  // async function countUsers() {
  //   try {
  //     const querySnapshot = await getDocs(collection(db, "users"));
  //     const count = querySnapshot.size;
  //     console.log("Кількість користувачів в базі: ", count);
  //   } catch (error) {
  //     console.error("Помилка отримання кількості користувачів: ", error);
  //   }
  // }
  
  // // Викликаємо функцію для підрахунку користувачів
  // countUsers();
  



  function showAlert() {
    // Очистка інпуту
    document.getElementById('customdrop-input').value = '';

    // Вивід тексту алерту в консоль
    const alertText = document.querySelector('.drop__alert-txt').innerText;
    console.log(alertText);

    // Показ кастомного алерту
    const alert = document.getElementById('dropAlert');
    alert.style.display = 'block';
    setTimeout(() => {
        alert.classList.add('show');
        setTimeout(() => {
            alert.classList.remove('show');
            setTimeout(() => {
                alert.style.display = 'none';
            }, 500);
        }, 2000);
    }, 10);
}

document.getElementById('dropBtn').addEventListener('click', showAlert);
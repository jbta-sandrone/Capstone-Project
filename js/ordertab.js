const homeLink = document.getElementById('home-link');
const orderLink = document.getElementById('order-link');
const historyLink = document.getElementById('history-link');
const cardGroup = document.getElementById('card-group');
const homeSection = document.getElementById('home');
const milkteaPart = document.querySelector('.milktea-part');
const espressoPart = document.querySelector('.espresso-part');
const fteaPart = document.querySelector('.ftea-part');
const silogPart = document.querySelector('.silog-part');
const sandwichPart = document.querySelector('.sandwich-part');
const snackPart = document.querySelector('.snacks-part');
const ricePart = document.querySelector('.ricemeal-part');
const noodlepastaPart = document.querySelector('.noodlepasta-part');
const friesPart = document.querySelector('.fries-part');
const extrasPart = document.querySelector('.extras-part');
const bestsellerPart = document.querySelector('.bestseller-part');



// CARD 1 PART!!!!!!!!!!!
const card1 = document.getElementById('card1');
const milkteaSections = document.querySelectorAll('.milktea-section');

card1.addEventListener('click', function (event) {
    event.preventDefault();
    hideAllSections();
    milkteaPart.style.display = 'block';
    document.querySelectorAll('.milktea-section').forEach(section => section.style.display = 'block');
});



// CARD 2 PART!!!!!!!!!!!
const card2 = document.getElementById('card2');
const espressoSections = document.querySelectorAll('.espresso-section');

card2.addEventListener('click', function (event) {
    event.preventDefault();
    hideAllSections();
    espressoPart.style.display = 'block';
    document.querySelectorAll('.espresso-section').forEach(section => section.style.display = 'block');
});


// CARD 3 PART!!!!!!!!!!!
const card3 = document.getElementById('card3');
const fteaSections = document.querySelectorAll('.ftea-section');

card3.addEventListener('click', function (event) {
    event.preventDefault();
    hideAllSections();
    fteaPart.style.display = 'block';
    document.querySelectorAll('.ftea-section').forEach(section => section.style.display = 'block');
});


// CARD 4 PART!!!!!!!!!!!
const card4 = document.getElementById('card4');
const silogSections = document.querySelectorAll('.silog-section');

card4.addEventListener('click', function (event) {
    event.preventDefault();
    hideAllSections();
    silogPart.style.display = 'block';
    silogSections.forEach(section => section.style.display = 'block');
});


// CARD 5 PART!!!!!!!!!!!
const card5 = document.getElementById('card5');
const sandwichSections = document.querySelectorAll('.sandwich-section');

card5.addEventListener('click', function (event) {
    event.preventDefault();
    hideAllSections();
    sandwichPart.style.display = 'block';
    sandwichSections.forEach(section => section.style.display = 'block');
});


// CARD 6 PART!!!!!!!!!!!
const card6 = document.getElementById('card6');
const snackSections = document.querySelectorAll('.snacks-section');

card6.addEventListener('click', function (event) {
    event.preventDefault();
    hideAllSections();
    snackPart.style.display = 'block';
    snackSections.forEach(section => section.style.display = 'block');
});

// CARD 7 PART!!!!!!!!!!!
const card7 = document.getElementById('card7');
const riceSections = document.querySelectorAll('.ricemeal-section');

card7.addEventListener('click', function (event) {
    event.preventDefault();
    hideAllSections();
    ricePart.style.display = 'block';
    riceSections.forEach(section => section.style.display = 'block');
});


// CARD 8 PART!!!!!!!!!!!
const card8 = document.getElementById('card8');
const noodlepastaSections = document.querySelectorAll('.noodlepasta-section');

card8.addEventListener('click', function (event) {
    event.preventDefault();
    hideAllSections();
    noodlepastaPart.style.display = 'block';
    noodlepastaSections.forEach(section => section.style.display = 'block');
});

// CARD 9 PART!!!!!!!!!!!
const card9 = document.getElementById('card9');
const friesSections = document.querySelectorAll('.fries-section');

card9.addEventListener('click', function (event) {
    event.preventDefault();
    hideAllSections();
    friesPart.style.display = 'block';
    friesSections.forEach(section => section.style.display = 'block');
});

// CARD 10 PART!!!!!!!!!!!
const card10 = document.getElementById('card10');
const extrasSections = document.querySelectorAll('.extras-section');

card10.addEventListener('click', function (event) {
    event.preventDefault();
    hideAllSections();
    extrasPart.style.display = 'block';
    extrasSections.forEach(section => section.style.display = 'block');
});

// CARD 11 PART!!!!!!!!!!!
const card11 = document.getElementById('card11');
const bestsellerSections = document.querySelectorAll('.bestseller-section');

card11.addEventListener('click', function (event) {
    event.preventDefault();
    hideAllSections();
    bestsellerPart.style.display = 'block';
    bestsellerSections.forEach(section => section.style.display = 'block');
});




function hideAllSections() {
    //cardGroup.style.display = 'none';
    homeSection.style.display = 'none';
    milkteaPart.style.display = 'none';
    espressoPart.style.display = 'none'; 
    fteaPart.style.display = 'none';
    silogPart.style.display = 'none';
    sandwichPart.style.display = 'none';
    snackPart.style.display = 'none';
    ricePart.style.display = 'none';
    noodlepastaPart.style.display = 'none';
    friesPart.style.display = 'none';
    extrasPart.style.display = 'none';
    bestsellerPart.style.display = 'none';
}

homeLink.addEventListener('click', function (event) {
    event.preventDefault();
    hideAllSections();
    homeSection.style.display = 'block';
});

orderLink.addEventListener('click', function (event) {
    event.preventDefault();
    hideAllSections();
    cardGroup.style.display = 'flex';
    card1.click();
});

historyLink.addEventListener('click', function (event) {
    event.preventDefault();
    hideAllSections();
    
});




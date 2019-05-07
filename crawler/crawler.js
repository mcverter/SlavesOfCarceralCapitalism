const {Builder, By, Key, until} = require('selenium-webdriver');
const Promise = require("bluebird");
const process = require('process');

let globalButtonIndex;
let START_FAC_NUM = process.argv[2];

let crawlCorrectSolutions = (async function crawlCorrectSolutions(startFacilityNumber) {

  let driver;
  let allFacilities = [];
  let allInmates = [];


  function createNewInmate(rawHtml, facility) {
    if (!rawHtml || rawHtml.match("Select Inmate")) {
      return null;
    } else {
      let regex = /<tr>.*\n\s*<td>(.*)<.*\n\s*<td>(.*)<.*\n\s*<td>(.*)<.*\n\s*<td>(.*)</;
      let [, , first, last, dob] = rawHtml.match(regex);
      return new Inmate(first, last, dob, facility.number);
    }
  }

  function createNewFacility(rawHtml, pageNum) {
    if (rawHtml.match("Select Facility")) {
      return null;
    } else {
      let regex = /<tr>\n\s*.*confirmFacility\('(\d*).*\n\s*<td>(.*)<.*\n\s*<td>(.*)<.*\n\s*<td>(.*)</;
      let [, number, name, city, state] = rawHtml.match(regex);
      return new Facility(number,name,city,state, pageNum);
    }
  }

  async function extractFacilitiesFromListPage(pageNum) {
    await driver.sleep(2000);
    let list = await driver.findElements(By.tagName("tr"));
    let buttons = await driver.findElements(By.className("glyphicon glyphicon-ok"));
    let trs = await Promise.all(list.map(item => {
      let outerHtml = item.getAttribute("outerHTML");
      return outerHtml;
    }));
    trs.forEach(async function(tr) {
      let f = createNewFacility(tr, pageNum);
      if (f) {
        allFacilities.push(f);
      }
    });
    return trs;
  }

  async function extractInmatesFromListPage(pageNum, facility) {
//    console.log(`extracting inmates from ${facility.name} on page ${pageNum}`)
    let list = await driver.findElements(By.tagName("tr"));

    let trs = await Promise.all(list.map(item => {
      let outerHtml = item.getAttribute("outerHTML");
      return outerHtml;
    }));
    trs.forEach(async function(tr) {
      let i = createNewInmate(tr, facility);
      if (i) {
        allInmates.push(i);
      }
    });

    return trs;
  }

  async function gotoInmateListPage(pageNum, facility) {
    await driver.get(`https://csgpay.com/order/select-inmate?page=${pageNum}`);

    let right = await driver.findElement(By.className("fa-chevron-right"))
      .catch(err=>{
        console.log("error caught:", err);
        debugger;
        crawlCorrectSolutions(START_FAC_NUM);
      });

    await extractInmatesFromListPage(pageNum, facility);

    let grandparentElement = await right.findElement(By.xpath("./../.."))
      .catch(err=>{
        console.log("error caught:", err);
        debugger;
        crawlCorrectSolutions(START_FAC_NUM);
      });
    let grandparentClass = await grandparentElement.getAttribute("class");
    if (!grandparentClass.match("disabled")) {
      gotoInmateListPage(pageNum+1, facility)
    } else {

      console.log(`<hr />`);
      console.log(`<a name="facility${facility.number}-inmates"><h2>Here are the inmates in ${facility.name} (${facility.city}, ${facility.state})</h2></a>`);
      console.log(`<table>`);
      console.log(`<tr><th>First Name</th><th>Last Name</th><th>Date of Birth</th></tr>`);


      allInmates.forEach(i => i.print());
      console.log("</table>\n")
      driver.quit();
      allInmates = allInmates.slice(0, 0);
      let facilityWithInmates = allFacilities.shift();
      if (facilityWithInmates) {
        await facilityWithInmates.findInmatesInFacility();
        START_FAC_NUM = facilityWithInmates.number;
//        console.log("last processed", START_FAC_NUM)
      }
    }
  }


  async function handleLastFacilityListPage() {
    /* Last Page Reached. Print Results */
    console.log("<h1>FACILITY LIST:</h1>");
    console.log(`<table>`);
    console.log(`<tr><th>NAME</th><th>CITY</th><th>STATE</th></tr>`);
    allFacilities.forEach(f=>{f.print()});
    console.log(`</table>`);

    driver.quit();

    if (startFacilityNumber) {
//      allFacilities = allFacilities.filter(f => f.number === "" + TEST_VALUE);
      allFacilities = allFacilities.slice(allFacilities.findIndex(f=>f.number === ""+startFacilityNumber))
    }

    // find inmates
    let facilityWithInmates = allFacilities.shift();
    await facilityWithInmates.findInmatesInFacility();
  }
  async function gotoFacilityListPage(pageNum, recursive) {
    await driver.get(`https://csgpay.com/order/select-facility?page=${pageNum}`);

    let right = await driver.findElement(By.className("fa-chevron-right"))
      .catch(err=>{});

    await extractFacilitiesFromListPage(pageNum);

    let grandparentElement = await right.findElement(By.xpath("./../.."));
    let grandparentClass = await grandparentElement.getAttribute("class");
    if (!grandparentClass.match("disabled")) {
      if (recursive) {
        await gotoFacilityListPage(pageNum + 1, true);
      }
    } else {
      await handleLastFacilityListPage();
    }
  }

  const screen = {
    width: 640,
    height: 480
  };

  async function login() {
    driver = await new Builder()
      .forBrowser('firefox')
//      .setChromeOptions(new chrome.Options().headless().windowSize(screen))
      .build();
    await driver.get('https://csgpay.com/account/login');
    await driver.findElement(By.css("input[type='email']")).sendKeys('mitchell.verter@gmail.com');
    await driver.findElement(By.css("input[type='password']")).sendKeys('olga');
    await driver.findElement(By.css("input[type='submit']")).click();
  }

  /* main */
  await login();
  await gotoFacilityListPage(1, true)
});

crawlCorrectSolutions(START_FAC_NUM)
  .catch(err=>{
    console.log("error caught:", err);
    debugger;
    crawlCorrectSolutions(START_FAC_NUM);
  });


/**
 * (node:26896) UnhandledPromiseRejectionWarning: Unhandled promise rejection. This error originated either by throwing inside of an async function without a catch block, or by rejecting a promise which was not handled with .catch(). (rejection id: 79)
 extracting inmates from Jackson Parish Correctional Center - Phase 1 (Jonesboro, LA) on page 63
 (node:26896) UnhandledPromiseRejectionWarning: TypeError: Cannot read property 'Symbol(Symbol.iterator)' of null
 at createNewInmate (/home/mitchell/ComputerScience_UBUNTU/SlavesOfCarcerelCapitalism/index.js:140:44)
 at /home/mitchell/ComputerScience_UBUNTU/SlavesOfCarcerelCapitalism/index.js:181:15
 at Array.forEach (<anonymous>)
 at extractInmatesFromListPage (/home/mitchell/ComputerScience_UBUNTU/SlavesOfCarcerelCapitalism/index.js:180:9)
 at <anonymous>

 */

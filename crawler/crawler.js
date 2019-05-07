const {Builder, By, Key, until} = require('selenium-webdriver');
const Promise = require("bluebird");
const process = require('process');

const Facility = require("./Facility");
const Inmate = require("./Inmate");

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
        await findInmatesInFacility(facilityWithInmates);
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
    await findInmatesInFacility(facilityWithInmates);
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
  async function hitModalContinueButton() {
    /* Wait for a long time before pressing button */
//      await driver.sleep(250);
    let modal = await driver.wait(until.elementIsVisible(driver.wait(until.elementLocated(By.className("modal-dialog")))));
    let continueButton = await driver.wait(until.elementIsVisible(driver.wait(until.elementLocated(By.linkText("Continue")))));
    // let continueButton = modal.findElement(By.linkText("Continue"));
    await continueButton.click();
  }
  async function chooseRedProduct() {
    /* Click on Product #1 */
    let selectButton = await driver.wait(until.elementLocated(By.className("fa-arrow-circle-right")));
    selectButton.click();

    /* pick deposit amount */
    let depositAmount = await driver.wait(until.elementLocated(By.name("deposit")))
    await depositAmount.sendKeys('3');
    let continueDeposit = await driver.wait(until.elementLocated(By.className("btn-success")));
    continueDeposit.click();

    /* confirm deposit amount */
    await hitModalContinueButton();

    /* pick pre-paid collect phone */
    let collectPhoneButton = await driver.wait(until.elementLocated(By.className("funkyradio-primary")));
    await collectPhoneButton.click();

    /* confirm phone */
    await hitModalContinueButton();
  }
  async function chooseYellowOrGreenProduct(idx) {
    let selectButtons = await driver.wait(until.elementsLocated(By.className("fa-arrow-circle-right")));
    let selectButton = selectButtons[idx];
    selectButton.click();

    let depositAmount = await driver.wait(until.elementLocated(By.name("deposit")))
    await depositAmount.sendKeys('3')
    let continueDeposit = await driver.wait(until.elementLocated(By.className("btn-success")));
    continueDeposit.click();

    await hitModalContinueButton();
  }
  async function findInmatesInFacility(facility) {
    await login();

    /* Go to correct facility list page */
    await ( driver.get(`https://csgpay.com/order/select-facility?page=${facility.pageNum}`));

    /* Click on the button corresonding to facility */
    let buttons = await driver.findElements(By.className("glyphicon glyphicon-ok"));
    let list = await driver.findElements(By.tagName("tr"));
    if (list.length === buttons.length + 1) {list.shift();}
    let trs = await Promise.all(list.map(item => item.getAttribute("outerHTML")));
    let matchFacilityString = trs.filter(e=>e.match(`'${facility.number}'`))[0];
    let clickIndex = trs.indexOf(matchFacilityString);
    await buttons[clickIndex].click();

    /* Confirm Facility */
    await hitModalContinueButton();

    let matchRed = (className) => !!(className.match("panel-red"));
    /* figure our what panels we have and their color */
    let panels = await driver.wait(until.elementsLocated(By.className("panel")));

    let secondPanelClass,
      thirdPanelClass,
      firstPanelClass = await panels[0].getAttribute("class");

    let isSecondRed,
      isThirdRed,
      isFirstRed = matchRed(firstPanelClass);

    if (panels.length>1) {
      secondPanelClass = await panels[1].getAttribute("class");
      isSecondRed = matchRed(secondPanelClass)
    }
    if (panels.length>2) {
      thirdPanelClass = await panels[2].getAttribute("class");
      isThirdRed = matchRed(thirdPanelClass)
    }

//      console.log("color is red", isFirstRed, isSecondRed, isThirdRed)
    if (isFirstRed && panels.length < 2) {
//        console.log('only one red panel');
    }

    if (! isFirstRed) {
      globalButtonIndex = 0;
      await chooseYellowOrGreenProduct(0);
    } else if (panels.length === 1) {
      globalButtonIndex = "0red";
      await chooseRedProduct();
    } else if (! isSecondRed) {
      globalButtonIndex = 1;
      await chooseYellowOrGreenProduct(1);
    } else if (! isThirdRed) {
      globalButtonIndex = 2;
      await chooseYellowOrGreenProduct(2);
    } else {
      console.error("Did not press a button");
    }

//      let facilityInfo = `${facility.number})`
    await gotoInmateListPage(1, facility);
  }
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


const {Builder, By, Key, until} = require('selenium-webdriver');
const Promise = require("bluebird");
const process = require('process');
const fs = require('fs');

const Facility = require("./Facility");
const Inmate = require("./Inmate");
const InmatePrinter = require("./InmatePrinter");
const FacilityPrinter = require("./FacilityPrinter")


let globalButtonIndex;
let START_FAC_NUM = process.argv[2];

let crawlCorrectSolutions = (async function crawlCorrectSolutions(startFacilityNumber) {

  let driver;
  let allFacilities = [];
  let allInmates = [];



  /**
   *
   * @param pageNum
   * @param facility
   * @returns {Promise<*>}

   Extracting inmates from ${facility.name} on page ${pageNum}
   */
  async function createInmatesFromListPage(pageNum, facility) {
    let list = await driver.findElements(By.tagName("tr"));

    let trs = await Promise.all(list.map(item => {
      let outerHtml = item.getAttribute("outerHTML");
      return outerHtml;
    }));
    trs.forEach(async function(tr) {
      let i = createNewInmateFromListPage(tr, facility);
      if (i) {
        allInmates.push(i);
      }
    });

    return trs;

    function createNewInmateFromListPage(rawHtml, facility) {
      if (!rawHtml || rawHtml.match("Select Inmate")) {
        return null;
      } else {
        let regex = /<tr>.*\n\s*<td>(.*)<.*\n\s*<td>(.*)<.*\n\s*<td>(.*)<.*\n\s*<td>(.*)</;
        let [, , first, last, dob] = rawHtml.match(regex);
        return new Inmate(first, last, dob, facility.number);
      }
    }
  }
  /**
   *
   * @param pageNum
   * @returns {Promise<*>}
   */
  async function createFacilitiesFromListPage(pageNum) {
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
    function createNewFacility(rawHtml, pageNum) {
      if (rawHtml.match("Select Facility")) {
        return null;
      } else {
        let regex = /<tr>\n\s*.*confirmFacility\('(\d*).*\n\s*<td>(.*)<.*\n\s*<td>(.*)<.*\n\s*<td>(.*)</;
        let [, number, name, city, state] = rawHtml.match(regex);
        return new Facility(number,name,city,state, pageNum);
      }
    }

  }


  async function gotoInmateListPage(pageNum, facility) {
    await driver.get(`https://csgpay.com/order/select-inmate?page=${pageNum}`);

    let right = await driver.findElement(By.className("fa-chevron-right"))
      .catch(err=>{
        console.log("error caught:", err);
        debugger;
        crawlCorrectSolutions(START_FAC_NUM);
      });

    await createInmatesFromListPage(pageNum, facility);

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
      driver.quit();
      allInmates = allInmates.slice(0, 0);
      let facilityWithInmates = allFacilities.shift();
      if (facilityWithInmates) {
        await findInmatesInFacility(facilityWithInmates);
        let inmatePrinter = new InmatePrinter(facilityWithInmates, allInmates);
        inmatePrinter.printInmatesTable(facilityWithInmates, allInmates);
        START_FAC_NUM = facilityWithInmates.number;
      }
    }
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
//    await gotoInmateListPage(1, facility);
    await enterFacilityListPages(facility);
  }
  async function enterFacilityListPages(facility){
    await gotoInmateListPage(1, facility);
  }
  async function exitFacilityListPages() {
    /* Last Page Reached. Print Results */
    let facilityPrinter = new FacilityPrinter(allFacilities);
    facilityPrinter.printFacilitiesTable();

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

    await createFacilitiesFromListPage(pageNum);

    let grandparentElement = await right.findElement(By.xpath("./../.."));
    let grandparentClass = await grandparentElement.getAttribute("class");
    if (!grandparentClass.match("disabled")) {
      if (recursive) {
        await gotoFacilityListPage(pageNum + 1, true);
      }
    } else {
      await exitFacilityListPages();
    }
  }

  /* Modals */
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

  /* login */
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


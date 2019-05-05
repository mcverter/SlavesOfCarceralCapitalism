const {Builder, By, Key, until} = require('selenium-webdriver');
const Promise = require("bluebird");
let globalButtonIndex;
let START_FAC_NUM = 74;

let crawlCorrectSolutions = (async function crawlCorrectSolutions(startFacilityNumber) {

  let driver;
  let allFacilities = [];
  let allInmates = [];

  class Facility {
    constructor(number,name,city,state, pageNum) {
      this.number = number;
      this.name = name;
      this.city = city;
      this.state = state;
      this.pageNum = pageNum;
      this.homepage = `https://csgpay.com/order/facility/${number}/product/2/select-inmate`
    }

    async hitModalContinueButton() {
      /* Wait for a long time before pressing button */
//      await driver.sleep(250);
      let modal = await driver.wait(until.elementIsVisible(driver.wait(until.elementLocated(By.className("modal-dialog")))));
      let continueButton = await driver.wait(until.elementIsVisible(driver.wait(until.elementLocated(By.linkText("Continue")))));
      // let continueButton = modal.findElement(By.linkText("Continue"));
      await continueButton.click();
    }

    async chooseRedProduct() {
      /* Click on Product #1 */
      let selectButton = await driver.wait(until.elementLocated(By.className("fa-arrow-circle-right")));
      selectButton.click();

      /* pick deposit amount */
      let depositAmount = await driver.wait(until.elementLocated(By.name("deposit")))
      await depositAmount.sendKeys('3');
      let continueDeposit = await driver.wait(until.elementLocated(By.className("btn-success")));
      continueDeposit.click();

      /* confirm deposit amount */
      await this.hitModalContinueButton();

      /* pick pre-paid collect phone */
      let collectPhoneButton = await driver.wait(until.elementLocated(By.className("funkyradio-primary")));
      await collectPhoneButton.click();

      /* confirm phone */
      await this.hitModalContinueButton();
    }

    async chooseYellowOrGreenProduct(idx) {
      let selectButtons = await driver.wait(until.elementsLocated(By.className("fa-arrow-circle-right")));
      let selectButton = selectButtons[idx];
      selectButton.click();

      let depositAmount = await driver.wait(until.elementLocated(By.name("deposit")))
      await depositAmount.sendKeys('3')
      let continueDeposit = await driver.wait(until.elementLocated(By.className("btn-success")));
      continueDeposit.click();

      await this.hitModalContinueButton();
    }

    async findInmatesInFacility() {
      let self = this;

      await login();

      /* Go to correct facility list page */
      await ( driver.get(`https://csgpay.com/order/select-facility?page=${this.pageNum}`));

      /* Click on the button corresonding to this facility */
      let buttons = await driver.findElements(By.className("glyphicon glyphicon-ok"));
      let list = await driver.findElements(By.tagName("tr"));
      if (list.length === buttons.length + 1) {list.shift();}
      let trs = await Promise.all(list.map(item => item.getAttribute("outerHTML")));
      let matchFacilityString = trs.filter(e=>e.match(`'${self.number}'`))[0];
      let clickIndex = trs.indexOf(matchFacilityString);
      await buttons[clickIndex].click();

      /* Confirm Facility */
      await this.hitModalContinueButton();

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

      console.log("color is red", isFirstRed, isSecondRed, isThirdRed)
      if (isFirstRed && panels.length < 2) {
        console.log('only one red panel');
      }

      if (! isFirstRed) {
        globalButtonIndex = 0;
        await this.chooseYellowOrGreenProduct(0);
      } else if (panels.length === 1) {
        globalButtonIndex = "0red";
        await this.chooseRedProduct();
      } else if (! isSecondRed) {
        globalButtonIndex = 1;
        await this.chooseYellowOrGreenProduct(1);
      } else if (! isThirdRed) {
        globalButtonIndex = 2;
        await this.chooseYellowOrGreenProduct(2);
      } else {
        console.error("Did not press a button");
      }

      let facilityInfo = `${self.number})`
      await gotoInmateListPage(1, facilityInfo);
    }

    print() {
      console.log(`${this.name}\t${this.city}\t${this.state}`)
    }
    printHTML() {
      console.log(`<tr><td>${this.name}</td><td>${this.city}</td><td>${this.state}</td></tr>`)
    }
    printJSON(){
      console.log(`{"name": "${this.name}", city: "${this.city}", state: "${this.state}"}`)
    }

    printSQL(){
      console.log(`(${this.number},${this.name},${this.city},${this.state})`)

    }

  }

  class Inmate {
    constructor(first,last,dob, facility) {
      this.first = first;
      this.last = last;
      this.dob = dob;
      this.facility = facility;
    }

    print() {
      console.log(`${this.first}\t${this.last}\t${this.dob}\t${this.facility}`)
    }
    printHTML() {
      console.log(`<tr><td>${this.first}</td><td>${this.last}</td><td>${this.dob}</td><td>${this.facility}</td></tr>`)
    }

    printJSON(){
      console.log(`{"first": "${this.first}", "last": "${this.last}", "dob": "${this.dob}", "facility": "${this.facility}"}`)
    }
    printSQL() {
      console.log(`(${this.first},${this.last},${this.dob},${this.facility})`)
    }

  }

  function createNewInmate(rawHtml, facility) {
    if (!rawHtml || rawHtml.match("Select Inmate")) {
      return null;
    } else {
      let regex = /<tr>.*\n\s*<td>(.*)<.*\n\s*<td>(.*)<.*\n\s*<td>(.*)<.*\n\s*<td>(.*)</;
      let [, , first, last, dob] = rawHtml.match(regex);
      return new Inmate(first, last, dob, facility);
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

  async function extractInmatesFromListPage(pageNum, facilityInfo) {
    console.log(`extracting inmates from ${facilityInfo} on page ${pageNum}`)
    let list = await driver.findElements(By.tagName("tr"));

    let trs = await Promise.all(list.map(item => {
      let outerHtml = item.getAttribute("outerHTML");
      return outerHtml;
    }));
    trs.forEach(async function(tr) {
      let i = createNewInmate(tr, facilityInfo);
      if (i) {
        allInmates.push(i);
      }
    });

    return trs;
  }

  async function gotoInmateListPage(pageNum, facilityInfo) {
    await driver.get(`https://csgpay.com/order/select-inmate?page=${pageNum}`);

    let right = await driver.findElement(By.className("fa-chevron-right"))
      .catch(err=>{
        console.log("error caught:", err);
        debugger;
        crawlCorrectSolutions(START_FAC_NUM);
      });

    await extractInmatesFromListPage(pageNum, facilityInfo);

    let grandparentElement = await right.findElement(By.xpath("./../.."))
      .catch(err=>{
        console.log("error caught:", err);
        debugger;
        crawlCorrectSolutions(START_FAC_NUM);
      });
    let grandparentClass = await grandparentElement.getAttribute("class");
    if (!grandparentClass.match("disabled")) {
      gotoInmateListPage(pageNum+1, facilityInfo)
    } else {
      console.log(`\n\n======================================`);
      console.log(`Here are the inmates in ${facilityInfo}`);
      console.log(`======================================\n`);

      allInmates.forEach(i => i.printSQL());
      driver.quit();
      allInmates = allInmates.slice(0, 0);
      let facilityWithInmates = allFacilities.shift();
      if (facilityWithInmates) {
        await facilityWithInmates.findInmatesInFacility();
        START_FAC_NUM = facilityWithInmates.number;
        console.log("last processed", START_FAC_NUM)
      }
    }
  }


  async function handleLastFacilityListPage() {
    /* Last Page Reached. Print Results */
    console.log(`\n\n======================================`);
    console.log("Here are the facilities:");
    console.log(`======================================\n`);
    allFacilities.forEach(f=>{f.printSQL()});

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

const {Builder, By, Key, until} = require('selenium-webdriver');
const Promise = require("bluebird");

(async function crawlCorrectSolutions() {

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
      await driver.wait(until.elementLocated(By.className("modal-dialog")))
      let continueButton = await driver.wait(until.elementLocated(By.linkText("Continue")))
      await continueButton.click();
    }

    async chooseRedProduct() {
      /* Click on Product #1 */
      let selectButtons = await driver.wait(until.elementsLocated(By.className("fa-arrow-circle-right")));
      selectButtons[0].click();

      /* pick deposit amount */
      let depositAmount = await driver.wait(until.elementLocated(By.name("deposit")))
      await depositAmount.sendKeys('3')
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

    async chooseYellowProduct() {
      let yellowPanel = await driver.wait(until.elementLocated(By.className("panel-yellow")))
      let selectButtons = await driver.wait(until.elementsLocated(By.className("fa-arrow-circle-right")));
      selectButtons[1].click();

      let depositAmount = await driver.wait(until.elementLocated(By.name("deposit")))
      await depositAmount.sendKeys('3')
      let continueDeposit = await driver.wait(until.elementLocated(By.className("btn-success")));
      continueDeposit.click();

      await this.hitModalContinueButton();
    }

    async chooseGreenProduct() {

    }

    async processFacility() {
      let self = this;
      console.log('processing facility', self.name, self.number)
      await login();

      /* Go to right facility list page */
      await ( driver.get(`https://csgpay.com/order/select-facility?page=${this.pageNum}`));

      /* Click on the right facility */
      let buttons = await driver.findElements(By.className("glyphicon glyphicon-ok"));
      let list = await driver.findElements(By.tagName("tr"));
      if (list.length === buttons.length + 1) {list.shift();}
      let trs = await Promise.all(list.map(item => item.getAttribute("outerHTML")));
      let matchFacilityString = trs.filter(e=>e.match(`'${self.number}'`))[0];
      let clickIndex = trs.indexOf(matchFacilityString);
      await buttons[clickIndex].click();

      /* Confirm Facility */
      await this.hitModalContinueButton();

      /* figure our what panels we have and their color */
      let panels = await driver.wait(until.elementsLocated(By.className("panel")));

      let firstPanelClass = await panels[0].getAttribute("class");

      if (firstPanelClass.match("panel-yellow")) {
        console.log("first panel is yellow");
        await this.chooseYellowProduct()

      } else if (firstPanelClass.match("panel-red")) {
        /* pick first button */
        console.log("first panel is red");
        await this.chooseRedProduct()
      } else if (firstPanelClass.match("panel-green")) {
        /* pick first button */
        console.error("first panel is green.  no path yet");
//        await this.chooseRedProduct()
      } else {
        console.error("no product found???")
      }



      await getNextInmatePage(1, self.name);
    }

    print() {
      console.log(`${this.name}\t${this.city}\t${this.state}`)
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
  }

  function createNewInmate(rawHtml, facility) {
    if (rawHtml.match("Select Inmate")) {
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

  async function processFacilityListPage(pageNum) {
    let pageFacilities = [];

    let list = await driver.findElements(By.tagName("tr"));
    let buttons = await driver.findElements(By.className("glyphicon glyphicon-ok"));
    let trs = await Promise.all(list.map(item => {
      let outerHtml = item.getAttribute("outerHTML");
      return outerHtml;
    }));
    trs.forEach(async function(tr) {
      let f = createNewFacility(tr, pageNum);
      if (f) {
//        await processFacility(f, trs, buttons, pageNum);
        pageFacilities.push(f);
        allFacilities.push(f);
      }
    });
    return trs;
  }

  async function processInmateListPage(pageNum, facilityName) {

    let list = await driver.findElements(By.tagName("tr"));

    let trs = await Promise.all(list.map(item => {
      let outerHtml = item.getAttribute("outerHTML");
      return outerHtml;
    }));
    trs.forEach(async function(tr) {
      let i = createNewInmate(tr, facilityName);
      if (i) {
        allInmates.push(i);
      }
    });

    return trs;
  }

  async function getNextInmatePage(pageNum, facilityName) {
    await driver.get(`https://csgpay.com/order/select-inmate?page=${pageNum}`);

    let right = await driver.findElement(By.className("fa-chevron-right"))
      .catch(err=>{});

    await processInmateListPage(pageNum, facilityName);

    let grandparentElement = await right.findElement(By.xpath("./../.."));
    let grandparentClass = await grandparentElement.getAttribute("class");
    if (!grandparentClass.match("disabled")) {
      getNextInmatePage(pageNum+1, facilityName)
    } else {
      console.log(`\n\n**************************************`);
      console.log(`Here are the inmates in ${facilityName}`);
      console.log(`**************************************\n`);

      allInmates.forEach(i => i.print());
      driver.quit();
      allInmates = allInmates.slice(0, 0);
      let facilityWithInmates = allFacilities.shift();
      if (facilityWithInmates) {
        await facilityWithInmates.processFacility();
      }
    }
  }

  async function getNextFacilityPage(pageNum, recursive) {
    await driver.get(`https://csgpay.com/order/select-facility?page=${pageNum}`);

    let right = await driver.findElement(By.className("fa-chevron-right"))
      .catch(err=>{
        allFacilities = allFacilities.filter(f=>f!=null);
        Promise.all(allFacilities.map(facility=>{
          console.log('process facility in catch')
//          facility.processFacility()
          //return driver.get(facility.homepage);
        }))});

    await processFacilityListPage(pageNum);

    let grandparentElement = await right.findElement(By.xpath("./../.."));
    let grandparentClass = await grandparentElement.getAttribute("class");
    if (!grandparentClass.match("disabled")) {
      if (recursive) {
        await getNextFacilityPage(pageNum + 1, true);
      }
    } else {
      console.log(`\n\n**************************************`);
      console.log("Here are the facilities:");
      console.log(`**************************************\n`);
      allFacilities.forEach(f=>{f.print()});

//      allFacilities = allFacilities.slice(0,1);
      driver.quit();
      let facilityWithInmates = allFacilities.shift();
      await facilityWithInmates.processFacility();
    }
  }

  async function login() {
    driver = await new Builder().forBrowser('chrome').build();
    await driver.get('https://csgpay.com/account/login');
    await driver.findElement(By.css("input[type='email']")).sendKeys('mitchell.verter@gmail.com');
    await driver.findElement(By.css("input[type='password']")).sendKeys('olga');
    await driver.findElement(By.css("input[type='submit']")).click();
  }
  // main
  await login();
  await getNextFacilityPage(1, true)

})();

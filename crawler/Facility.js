
class Facility {
  constructor(number,name,city,state, pageNum) {
    this.number = number;
    this.name = name;
    this.city = city;
    this.state = state;
    this.pageNum = pageNum;
    this.immigrantProportionScore = undefined;
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

//      console.log("color is red", isFirstRed, isSecondRed, isThirdRed)
    if (isFirstRed && panels.length < 2) {
//        console.log('only one red panel');
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

//      let facilityInfo = `${self.number})`
    await gotoInmateListPage(1, self);
  }

  print() {
    this.printHTML();
  }
  printConsole() {
    console.log(`${this.name}\t${this.city}\t${this.state}`)
  }
  printHTML() {
    console.log(`<tr><td>${this.name}</td><td>${this.city}</td><td>${this.state}</td><td><a href="#facility${this.number}-inmates">(See inmates)</a></td></tr>`)
  }
  printJSON(){
    console.log(`{"name": "${this.name}", city: "${this.city}", state: "${this.state}"}`)
  }

  printSQL(){
    console.log(`(${this.number},${this.name},${this.city},${this.state})`)

  }

}

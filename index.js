const {Builder, By, Key, until} = require('selenium-webdriver');


(async function crawlCorrectSolutions() {



  let allFacilities = [];


  class Facility {
    constructor(number,name,city,state, pageNum) {
      this.number = number;
      this.name = name;
      this.city = city;
      this.state = state;
      this.pageNum = pageNum;
      this.homepage = `https://csgpay.com/order/facility/${number}/product/2/select-inmate`
    }

    async processFacility() {
//      let driver = await new Builder().forBrowser('chrome').build();
      await driver.navigate(`https://csgpay.com/order/select-facility?page=${this.pageNum}`);
      let list = await driver.findElements(By.tagName("tr"));
      let buttons = await driver.findElements(By.className("glyphicon glyphicon-ok"));

      console.log(list, buttons);
    let matchFacilityString = list.filter(e=>e.match(`'${facility.number}'`))[0];
    let clickIndex = list.indexOf(matchFacilityString);
    return await buttons[clickIndex].click();
      // return null;
    }

    print() {
      console.log(`${this.name}\t${this.city}\t${this.state}`)
    }
  }

  class Inmate {
    constructor(facilityNumber,first,last,dob) {}
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

  async function getNextInmatePage(pageNum) {}

  async function getNextFacilityPage(pageNum) {
    await driver.get(`https://csgpay.com/order/select-facility?page=${pageNum}`);
    //let right = await driver.findElement(By.css(".fa-chevron-right"))
    let right = await driver.findElement(By.className("fa-chevron-right"))
      .catch(err=>{
        allFacilities = allFacilities.filter(f=>f!=null);
        Promise.all(allFacilities.map(facility=>{
          console.log('process facility in catch')
//          facility.processFacility()
          //return driver.get(facility.homepage);
        }))});

    let grandparentElement = await right.findElement(By.xpath("./../.."));
    let grandparentClass = await grandparentElement.getAttribute("class");

    if (!grandparentClass.match("disabled")) {
      await processFacilityListPage(pageNum);
      await getNextFacilityPage(pageNum+1);
    } else {
      console.log(`There are ${pageNum} facility pages`);
      console.log("Here are the facilities:");
      Promise.all(allFacilities.map(async function(f) {
          console.log('process facility in promise map')
          await f.processFacility()
        }
      ))
      allFacilities.forEach(async function(f) {
        console.log('process facility in for each')
//        await f.processFacility()
      });

      allFacilities.forEach(f=>{
        f.print()
      })
    }
  }

  // main
  let driver = await new Builder().forBrowser('chrome').build();
  try {
    await driver.get('https://csgpay.com/account/login');
    await driver.findElement(By.css("input[type='email']")).sendKeys('mitchell.verter@gmail.com');
    await driver.findElement(By.css("input[type='password']")).sendKeys('olga');
    await driver.findElement(By.css("input[type='submit']")).click();
    await getNextFacilityPage(1)
  } finally {
//    await driver.quit();
  }
})();

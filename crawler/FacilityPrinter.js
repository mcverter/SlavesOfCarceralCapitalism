const fs = require('fs');


class FacilityPrinter {
  constructor(facilities) {
    this.facilities = facilities;
  }

  printFacilitiesTable(){
    let facilitiesTable = `
      <h1>FACILITY LIST:</h1>
      <table>
          <tr><th>NAME</th><th>CITY</th><th>STATE</th></tr>`;
    facilitiesTable = this.facilities.reduce((accumulator, current) => {
      return `${accumulator}\n${this.printFacility(current, true)}`;
    }, facilitiesTable);
    facilitiesTable += "</table>\n";

    console.log(facilitiesTable);
    this.writeFacilitiesPage(facilitiesTable);
//    return output;
  }

  writeFacilitiesPage(facilitiesTable){
    let completeFacilitiesPage = `    
<html>
<head>
<title>Facilities List</title>
</head>
<body>
    <h1>Facilities List</h1>
    
    ${facilitiesTable}

</body>    
</html>
    `;

    fs.writeFile(`./facilities.html`, completeFacilitiesPage, function(err) {
      if(err) {
        return console.log(err);
      }

      console.log("The facility file was saved!");
    });

  }

  printFacility(facility, forSeparatePage) {
    return this.printFacilityHTML(facility, forSeparatePage);
  }
  printFacilityConsole(facility) {
    return (`${facility.name}\t${facility.city}\t${facility.state}`)
  }
  printFacilityHTML(facility, forSeparatePage) {
    let linkToFacility= forSeparatePage ?
      `"facility${facility.number}-inmates.html" target="_blank"` :
      `#facility${facility.number}-inmates"`;
    return `\n<tr><td>${facility.name}</td><td>${facility.city}</td><td>${facility.state}</td><td><a href=${linkToFacility}>(See inmates)</a></td></tr>\n`;
  }
  printFacilityJSON(facility){
    return (`{"name": "${facility.name}", city: "${facility.city}", state: "${facility.state}"}`)
  }

  printFacilitySQL(facility){
    return (`(${facility.number},${facility.name},${facility.city},${facility.state})`)
  }

}

module.exports = FacilityPrinter;
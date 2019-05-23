const fs = require('fs');

class InmatePrinter {
  constructor(facility, inmates) {
    this.facility = facility;
    this.inmates = inmates;
  }

  printOutFacilities(){

  }
  printInmatesTable(){
    debugger;
    let inmatesTable = `
        <hr />
            <h2><a name="facility${this.facility.number}-inmates">Here are the inmates in ${this.facility.name} (${this.facility.city}, ${this.facility.state})</a></h2>
            <table>
                <tr><th>First Name</th><th>Last Name</th><th>Date of Birth</th></tr>`;
    inmatesTable = this.inmates.reduce((accumulator, current) => {
      return `${accumulator}\n${this.printInmate(current)}`;
    }, inmatesTable);
    inmatesTable += "</table>\n";
    this.writeInmatesPage(inmatesTable)
  }

  writeInmatesPage(inmatesTable){
    debugger
    let {name, city, state, number} = this.facility;
    let completeInmatesPage = `    
<html>
<head>
<title>Inmates in ${name} (${city}, ${state})</title>
</head>
<body>
<a href="facilities.html" target="_blank"> See all Detention Facilities </a>

    <h1>Inmates in ${name} (${city}, ${state})</h1>
    
    ${inmatesTable}

<a href="facilities.html" target="_blank"> See all Detention Facilities </a>

</body>    
</html>
    `;

    fs.writeFile(`./facility${number}-inmates.html`, completeInmatesPage, function(err) {
      if(err) {
        return console.log(err);
      }

      console.log("The inmate file was saved!");
    });


  }

  writeOutSection(){

  }

  printInmate(inmate) {
    return this.printInmateHTML(inmate);
  }
  printInmateConsole(inmate) {
    return (`${inmate.first}\t${inmate.last}\t${inmate.dob}\t${inmate.facility}`)
  }
  printInmateHTML(inmate) {
    return (`<tr><td>${inmate.first}</td><td>${inmate.last}</td><td>${inmate.dob}</td></tr>`)
  }

  printInmateJSON(inmate){
    return (`{"first": "${inmate.first}", "last": "${inmate.last}", "dob": "${inmate.dob}", "facility": "${inmate.facility}"}`)
  }
  printInmateSQL(inmate) {
    return (`(${inmate.first},${inmate.last},${inmate.dob},${inmate.facility})`)
  }

}

module.exports = InmatePrinter;
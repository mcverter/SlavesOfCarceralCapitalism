DROP TABLE IF EXISTS facilities CASCADE;
CREATE TABLE "facilities" (
  id INTEGER PRIMARY KEY,
  facilityName TEXT,
  city TEXT,
  state CHARACTER(2),
  UNIQUE (id, facilityName, city, state)
) ;

DROP TABLE IF EXISTS "inmates" CASCADE;
CREATE TABLE inmates (
    firstname TEXT,
    lastname TEXT,
    dob DATE,
    facilityId INTEGER REFERENCES facilities(id),
    entered DATE,
    exited DATE,
    UNIQUE (firstname, lastname, dob, facilityId)
);

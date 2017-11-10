//  Placeholder file
//  This progam could be wrapped in a cron job a la meter maid
//  Its primary function will be to evaluate Readings data and then
//  determine if there should be a trigger activity created
//  If so, then it will create it.
//  Currently, there are 7 triggers...
//  1.  Store Closed and Permanent Hold set on meter at an "inappropriate" temp.  "inappropriate" is defined as cooling during the summer and heating during the winter.
//  2.  Store closed and Temporary Hold set on meter at an "inappropriate" temp.
//  3.  Store Open and Permanent Hold.  This is potentially overriding the programmed schedule.
//  4.  Store Open and Temporary Hold.  This is potentially overriding the programmed schedule.
//  5.  Lost contact with Thermostat.  We have no readings to determine anything.
//  6.  No Google Place identified. or missing hours.  Owner is missing out on ability to promote their business and/or autopopulate operating hours.
//  7.  Missing hours.  Cannot reliably enable triggers 1-4.

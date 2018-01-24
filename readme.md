# Meter Miser v2


## Overview:
Small business owners that operate retail storefronts have a lot to do every day.  Remembering to turn down/up the thermostat often falls to the very bottom of a very long "To Do" list.  Yet, forgetting this task can cost this small business owner hundreds or even thousands of dollars per year depending on the number an size of their retail locations.
What if there were a way to intelligently monitor and alert the small business owner when there are opportunities to adjust the thermostat and generate cost savings?


**Features:**
* Automated and periodic polling of wi-fi enabled thermostats in each location
* Persistent storage of collected data for analysis and actionable insights
* SMS alerts via Twilio when savings opportunities are identified
* Mobile first design to leverage the small business owners most powerful tool -- the smart phone
* Dynamic and interactive charts to quickly identify trends and compare locations


## Github Link: [MeterMiser](https://github.com/YankeeSoccerNut/MeterMiser)

## Team Members & Roles:
*Click on each member's name to see their GitHub profile*

All team members are students in the [Digital Crafts](https://digitalcrafts.com) September 2017 cohort. This first project applied agile principles to get a MVP completed in a relatively short timeframe.


* [Scott Anderson](https://https://github.com/YankeeSoccerNut/)
Product Owner and Backend Developer <br/>
**Key contributions:** All the backend polling, data capture, and API for client GET requests.  Google maps integration with dynamic zoom based on marker boundaries.  All integration with Twilio.

* [Mikayla Kelhofer](https://github.com/mkelhofer/) Primary Data Analyst and Data Visualizations<br />
**Key contributions:** Data analysis, d3.js charting, dynamic timeline filtering.

* [Michael McFarland](https://github.com/mcfarland422)
Front-End Development and User Interface<br />
**Key contributions:** Overall look and feel of the application.  Custom HTML layout using Bootstrap and custom CSS for all aspects of application.

## Tools and Technologies
**Languages:**
* Node
* JavaScript
* HTML5
* CSS

**Frameworks:**
* Express
* Bootstrap
* d3.js

**API's**
* [Google Maps](https://developers.google.com/maps/documentation/) for mapping thermostat locations
* Honeywell "red link":  [MobileV2](https://tccna.honeywell.com/ws/MobileV2.asmx) to support thermostat polling
* [Twilio](https://www.twilio.com/docs/api) to enable outbound and inbound text messaging

**Other:**
* mySQL
* Sequel Pro as our GUI for mySQL administration
* [nGrok](https://ngrok.com/) helped us with testing as a team and with integration to Twilio
* AWS EC2 to host the polling server (meterMaid), activityEngine, and Express site


## MVP (Minimum Viable Product):

* List locations for user
* Map locations on google map
* Provide historical view
* Provide current, realtime snapshot of thermostat settings
* Identify opportunities for cost savings
* Push notifications of savings opportunities

#### Stretch Goals
* Sign up and authentication
* SMS-based, chatbot-like interactions

## Challenges & Solutions:
**Some of the biggest challenges we faced with this project build included:**

1.  **Challenge:** Back-end implementation for polling, persistent storage and client APIs

    **Solution:**  We had some team member experiences with relational databases and SQL but not with any particular backend technologies.  After consultation with the DigitalCrafts instructor, we chose Express as the "front-end" to our back-end services.  This choice enabled us to leverage javascript and have a working solution up quickly.  The fact that the API responds with JSON makes it very easy to consume these services from our front-end client.

2.  **Challenge:**   Front-End Styling<br>
    We ran into a few issues regarding elements of bootstrap not working correctly. Toggles would not toggle, drop down menus did not function properly, and CDNs were not responding as anticipated.

    **Solution:** These issues were resolved by time searching the internet and developer communities such as Stackoverflow.com, and talking with our instructor.

3.  **Challenge: **  Data Analysis and Visualization <br>
    D3.JS is a challenging library to learn.  We ran into some early obstacles related to some significant changes between v3 and v4 of the library.

    **Solution:**  Stackoverflow, Google and our instructor helped us overcome the initial obstacles in time to meet our "ship" date for the project.


## Screenshots:
![Locations](/public/images/LocationsScreenShot.png)
![History](/public/images/HistoryScreenShot.png)
![SMS Alert](/public/images/resizedVerticalTwilio.png)

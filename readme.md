# Meter Miser v2


## Overview:
Small business owners that operate retail storefronts have a lot to do every day.  Remembering to turn down/up the thermostat often falls to the very bottom of a very long "To Do" list.  Yet, forgetting this task can cost this small business owner hundreds or even thousands of dollars per year depending on the number an size of their retail locations.
What if there were a way to intelligently monitor and alert the small business owner when there are opportunities to adjust the thermostat and generate cost savings?


**Concept:**
* Automated and periodic polling of wi-fi enabled thermostats in each location
* Persistent storage of collected data for analysis and actionable insights
* Mobile first design to leverage the small business owners most powerful tool -- the smart phone
* Dynamic and interactive charts to quickly identify trends and compare locations
* Ability to take action (adjust/turn off) on the thermostat

##Github Link:
[MeterMiser]()

##Team Members & Roles:
**Click on each member's name to see their GitHub profile**
All team members are students in the [Digital Crafts](https://digitalcrafts.com) September 2017 cohort. This first project applied agile principles to get a MVP completed in a relatively short timeframe.

##The Team
* [Scott Anderson](https://https://github.com/YankeeSoccerNut/)  
**Primary team role:** blah blah <br />
**Contributions:**  blah blah<br />
**Key code portions:** All the backend polling, data capture, and API for client GET requests.  Google maps integration with dynamic zoom based on marker boundaries.

* [Mikayla Kelhofer](https://github.com/mkelhofer/)  
**Primary team role:** blah blah<br />
**Contributions:** blah blah <br />
**Key code portions:** Data analysis, d3.js charting, dynamic timeline filtering.

* [Michael McFarland](https://github.com/mcfarland422)  
**Primary team role:** Front-End Development and User Interface<br />
**Contributions:** Built custom HTML layout using Bootstrap framework and created custom CSS styling for all aspects of application. Scheduled daily meetings and worked alongside with Scrum team on application from concept to completion. Developed visual and UI aspects of MeterMiser.<br />
**Key code portions:** All of the HTML and CSS.  Overall style and flow.


##What we used:
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
* Google Maps
* Honeywell "red link"
  * [MobileV2](https://tccna.honeywell.com/ws/MobileV2.asmx)

**Other:**  
* 1
* 2
* 3
* 4
* 5


##MVP (Minimum Viable Product):

* List locations for user
* Map locations on google map
* Provide historical view
* Provide current, realtime snapshot of thermostat settings
* Identify opportunities for cost savings

**Stretch Goals**
* Sign up and authentication
* Push notifications of savings opportunities
* SMS-based interactions

## Challenges & Solutions:
**Some of the biggest challenges we faced with this project build included:**

1.  **Challenge:** Back-end implementation for polling, persistent storage and client APIs

    **Solution:**  We had some team member experiences with relational databases and SQL but not with any particular backend technologies.  After consultation with the DigitalCrafts instructor, we chose Express as the "front-end" to our back-end services.  This choice enabled us to leverage javascript and have a working solution up quickly.  The fact that the API responds with JSON makes it very easy to consume these services from our front-end client.


2.  **Challenge:**   Front-End:
    We ran into a few issues regarding elements of bootstrap not working correctly. Toggles would not toggle, drop down menus did not function properly, and CDNs were not responding as anticipated.

    **Solution:**

    These issues were resolved by spending hours upon hours searching the internet and developer communities such as Stackoverflow.com, and talking with our instructor Rob.  we found solutions to all of
    the front-end issues by using these methods and was successfully able to implement them into our application.

3.  **Challenge:**  

    **Solution:**


##Code Snippets

<!-- Insert code here -->
We created a front-end service to access the API we built on the back-end.  

```JavaScript
//App Service for accessing the API
A large portion of the front-end work was c
```

## Screenshots:
![Homepage](static/img/screenshots/splash_page.png)
![Search for Destination](static/img/screenshots/search_view.png)
![Search Result 1](static/img/screenshots/search_result_chipotle.png)
![Search Result 2](static/img/screenshots/search_result_D1.png)
![Navigation View](static/img/screenshots/nav_view_chipotle.png)
![Navigation - Origin](static/img/screenshots/nav_view_origin.png)
![Navigation - Destination](static/img/screenshots/nav_view_destination.png)
![Example of Ionic Build in Emulation (Android/Iphone)](static/img/ionic_ss.png)
<!-- ![iPhone6](static/img/iphone6.png)
![iPad](static/img/ipad.png)
![Android](static/img/android.png) -->


##Project History
10/24/2017 - Demo MVP  
10/17/2017 - Project Start  

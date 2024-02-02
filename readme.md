# Aware Chicago

Aware Chicago is a public safety map that only shows crime that you might actually experience while walking in the city.

My hope is that it will help you stay safe and informed - but not overly terrified, which is what woud happen if I threw a whole year of crime data at you.

The code has been shared publicly to provide the community with a neat example of how to use React, OpenLayers maps, public data, and serverless computing, as well as to invite ideas and contributions. 

## Attributions

This is only possible because of these awesome projects and resources:

* [Chicago Data Portal](https://data.cityofchicago.org/) and specifically the dataset [Crimes - One Year Prior to Present](https://data.cityofchicago.org/Public-Safety/Crimes-One-year-prior-to-present/x2n5-8w5q").
* [OpenLayers](https://openlayers.org/) and the [OpenStreetMap](https://www.openstreetmap.org/) community.
* [React](https://react.dev/) web framework and the [Create React App](https://create-react-app.dev/) project by Facebook Open Source.
* [Intro.js](https://introjs.com/).
* Articles by [Max Dietrich](https://mxd.codes/articles/how-to-create-a-web-map-with-open-layers-and-react) and [Taylor Callsen](https://taylor.callsen.me/using-openlayers-with-react-functional-components/)

## How It Works

**Important Files**

The entire app is only about 400 lines of custom code. If you'd like to understand how the app works, you can review it easily.

* [src/MappWrapper.js](https://github.com/superchordate/aware-chicago/blob/main/src/MapWrapper.js): All the UI stuff (React 18) including buttons, intro.js, OpenLayers. 
* [public/index.html](https://github.com/superchordate/aware-chicago/blob/main/public/index.html): Web page stuff. 
* [cloud-functions/get-crime.js](https://github.com/superchordate/aware-chicago/blob/main/cloud-functions/get-crime.js): API call to the Chicago Data Portal and contextual data filtering. 

**Run Locally**

* To run locally, install [Node](https://nodejs.org/en/download) and run `npm install` in the project directory. Then run the app with `npm start`. 
* By default, the app will call my cloud function at ~line 173 of `src/MapWrapper.js` but you can also copy in the code from `cloud-functions/get-crime.js` if you want to change how that part works. You'll need to get an API key from https://data.cityofchicago.org/. 

**Publishing**

The publishing process is really interesting, so I share it here even though I don't expect many people to follow it. Hopefully it'll help you publish your own serverless app!

* Run `npm build` to compile the app into the build/static folder. 
* Upload your app files to a Google Cloud Storage bucket (this can also be done at AWS but I prefer GCP).
* Follow [this guide](https://cloud.google.com/storage/docs/hosting-static-website) to set up your bucket as a website. 
* Create a [cloud function](https://cloud.google.com/functions/?hl=en), set your API key from https://data.cityofchicago.org/ as a runtime environment variable called `api_key`, and paste in the code from `cloud-functions/get-crime.js`.
* If you want a custom URL, [the guide](https://cloud.google.com/storage/docs/hosting-static-website) also has steps for that. You'll need to set up a load balancer, SSL certificate, static IP, DNS routing etc. which sounds complicated but GCP actually makes it pretty easy. 

## Get Involved

I am an independent contractor. Please reach out to me if you would like some help building a custom cloud app or leveraging data science, visual analytics, or AI in your business. 

If you would like to contribute, please reach out as well! I'll happily accept Issues and Pull Requests if you would like to add features or data. 

Good luck and enjoy!

Bryce Chamberlain  
_Independent Technical Contractor_  
superchordate@gmail.com  


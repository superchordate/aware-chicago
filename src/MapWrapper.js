// https://mxd.codes/articles/how-to-create-a-web-map-with-open-layers-and-react
// https://taylor.callsen.me/using-openlayers-with-react-functional-components/
// https://github.com/fedosejev/checkboxes-in-react-16

import React, { useState, useEffect, useRef } from 'react'
import 'ol/ol.css'
import introJs from 'intro.js'
import 'intro.js/introjs.css'
import { Map, View } from 'ol'
import TileLayer from 'ol/layer/Tile'
import OSM from 'ol/source/OSM'
import { fromLonLat, transformExtent, toLonLat } from 'ol/proj'
import Feature from 'ol/Feature.js'
import Point from 'ol/geom/Point.js'
import VectorLayer from 'ol/layer/Vector.js'
import VectorSource from 'ol/source/Vector.js'
import Collection from 'ol/Collection.js'
import GeoJSON from 'ol/format/GeoJSON.js'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faLocationCrosshairs } from '@fortawesome/free-solid-svg-icons'
import { DateTime } from "luxon"

import {
  Circle as CircleStyle,
  Fill,
  Style,
  Text,
} from 'ol/style.js';

const init_lonlat = [-87.6359, 41.8789];
var updateYouAreHere = true

function weekDay(date){ return  ! [6,0].includes( date.getDay() ); }
const isweekday = weekDay(new Date());

function MapWrapper(props) {

    // set intial state - used to track references to OpenLayers 
    //  objects for use in hooks, event handlers, etc.
    const [ map, setMap ] = useState()
    const [ featuresLayer, featuresLayer_set ] = useState()
    const [ youAreHereLayer, youAreHereLayer_set ] = useState()
    const last20days_checkbox = useRef()
    const weekdaytype_checkbox = useRef()

    // get ref to div element - OpenLayers will render into this div
    const mapElement = useRef()

    // initial load.
    useEffect(() => {

        const featuresLayer_init = new VectorLayer({ source: new VectorSource() })
        const youAreHereLayer_init = new VectorLayer({ source: new VectorSource() })
        
        const initialMap  = new Map({
          target: mapElement.current,
          layers: [
            new TileLayer({
              source: new OSM({attributions:[]}), opacity: 0.65
            }),
            featuresLayer_init,
            youAreHereLayer_init
          ],
          view: new View({
            //projection: 'EPSG:3857',
            center: fromLonLat(init_lonlat),
            zoom: 16
          }),
          controls:[]
        });   

        // save map and vector layer references to state
        setMap(initialMap)    

        initialMap.on('moveend', function(){
          getData(initialMap, featuresLayer_init, youAreHereLayer_init, true, true)
          updateYouAreHere = false
        })

        getData(initialMap, featuresLayer_init, youAreHereLayer_init, true, true)

        featuresLayer_set(featuresLayer_init)
        youAreHereLayer_set(youAreHereLayer_init)

        introJs().start()

        return () => initialMap.setTarget(null)

    }, []);

    // findme button click handler.
    const handleFindMeClick = () => { if(navigator.geolocation ) {

        navigator.geolocation.getCurrentPosition((position) => {
          updateYouAreHere = true
          map.getView().animate({
            center: fromLonLat([position.coords.longitude, position.coords.latitude]),
            duration: 500
          })
  
    });}}

    const change_checkbox = () => { getData(
      map, featuresLayer, youAreHereLayer,
      weekdaytype_checkbox.current.checked,
      last20days_checkbox.current.checked      
    )}
    
    // render component.
    return(
        <div>
            <div 
              ref={mapElement} 
              className="map-container"  
              data-title="Welcome to Aware Chicago!" 
              data-intro="
                This is a public safety map that only shows crime that you might actually experience while 
                walking in the city.<br/><br/>My hope is that it will help you stay safe and informed - 
                but not overly terrified, which is what woud happen if I threw a whole year of crime data at you.
              "
            ></div>
            <div className="controls">
              <button 
                  className="button-findme" 
                  onClick={handleFindMeClick}
                  data-title="Your Location" 
                  data-intro="
                    Click this button to recenter the map to your location.<br/><br/>
                    The map only shows crime in Chicago, so if you aren't in Chicago I'd advise a
                    gainst clicking and instead recommend just moving the map around.
                    <br/><br/>If you would like me to add your city's data, just let me know!
                  "
                >
                <FontAwesomeIcon icon={faLocationCrosshairs} />
              </button>
              <div 
                  className="checkboxes" 
                  data-title="Filters" 
                  data-intro="
                    You can change these to see how messy the full dataset is.<br/><br/>
                    And to see how important data context is. 
                    Always keep context in mind when working with data.
                  "
                >
                <label>
                  <input
                    type="checkbox"
                    ref={weekdaytype_checkbox}
                    defaultChecked={true}
                    onChange={change_checkbox}
                  />
                  {isweekday ? "Weekdays" : "Weekends"} Only
                </label>
                <br/>
                <label>
                  <input
                    type="checkbox"
                    name="last20days"
                    ref={last20days_checkbox}
                    defaultChecked={true}
                    onChange={change_checkbox}
                  />
                  Last 20 Matching Days
                </label>
              </div>
            </div>
            <div className="attributions">                
              Serverless React app by 
                <a href="https://www.linkedin.com/in/brycechamberlain/"  target="_blank">Bryce Chamberlain</a>.
              Code on 
                <a href="https://github.com/superchordate/aware-chicago/" target="_blank">GitHub</a>
              <br/>
                <a href="https://data.cityofchicago.org/">Chicago Data Portal:</a> <a href="https://data.cityofchicago.org/Public-Safety/Crimes-One-year-prior-to-present/x2n5-8w5q">Crimes - One Year Prior to Present</a>
              <br/>© 
                <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a> contributors
            </div>
        </div>
    )

}
  
export default MapWrapper;

// get nearby street crimes from API.
function getData(map, featuresLayer, youAreHereLayer, weekdaytype, last20days){

  const query_lonlat = toLonLat(map.getView().getCenter())
  const glbox = map.getView().calculateExtent(map.getSize())
  const box = transformExtent(glbox, 'EPSG:3857','EPSG:4326')

  if(updateYouAreHere) setYouAreHere(query_lonlat, youAreHereLayer)

  const body = {box: box, weekdaytype: weekdaytype, last20days: last20days}

  fetch(
    'https://us-central1-aware-chicago-413022.cloudfunctions.net/get-crime', 
    {
      // https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch
      "method": "POST",
      "body": JSON.stringify(body)
  }).then(response => {
    return response.json()
  }).then((data) => {

    const relabel = {
        'CONCEALED CARRY LICENSE VIOLATION':'Concealed Carry Violation','CRIM SEXUAL ASSAULT' : 'Sexual Assault','CRIMINAL DAMAGE':'Damage',
        'MOTOR VEHICLE THEFT' : 'Car Stolen','PUBLIC PEACE VIOLATION' : 'Disturb Peace','WEAPONS VIOLATION' : 'Weapon','OTHER NARCOTIC VIOLATION':'Narcotics'
    };

    // modify data format for easier display.
    var mapdata = []
    for(var row in data){

        row = data[row]

        // check for relabel, otherwise return proper case.
        var irl = row['_primary_decsription']
        if(Object.keys(relabel).includes(irl)){
            irl = relabel[irl]; 
        } else { 
            irl = properCase(irl);
        }

        mapdata.push({
            'case' : row['case_'],
            'descr' : irl,
            'descr2' : row['_secondary_description'],
            'happened' : DateTime.fromISO(row['date_of_occurrence']),
            'latitude' : parseFloat(row['latitude']),
            'longitude' : parseFloat(row['longitude'])
        });
    }

    setFeatures(mapdata, featuresLayer);

  })}

function properCase(x) {
  var smallwordsarray = [ 'of','a','the','and','an','or','nor','but','is','if','then','else','when','at','from','by','on','off','for','in','out','over','to','into','with' ]; 
  return x.split(" ").map( function(ele){ 
      if( smallwordsarray.includes(ele) ){
          return ele;
      } else {
          return ele[0].toUpperCase() + ele.slice(1).toLowerCase();
      }
  }).join(" ");
};

function createCircleStyle(data) {
  
  return new Style({
    image: new CircleStyle({
      radius: 6,
      fill: new Fill({color: data.color}),
      displacement: [-7, -1]
      //stroke: new Stroke({color: 'red', width: 1}),
    }),
    text: new Text({
      font: '16px sans-serif',
      textAlign: 'left',
      text: data.text,
      backgroundFill: new Fill({
        color: [255, 255, 255, 0.8],
      }),
      padding: [2, 2, 2, 2],
    }),
  });
}

function addPoints(features, layer){

    layer.setSource(new VectorSource({
      features: new Collection(
        features.map((featureOptions) => {
          const feature = new Feature({
            geometry: featureOptions.geometry,
          });
          feature.setStyle(createCircleStyle(featureOptions));
          return feature;
        })
      ),
      format: new GeoJSON(),
    }))

}

// Set features into map.
function setFeatures(mapdata, featuresLayer){

    // Build the features.
    var features = [];
    for(var i = 0; i < mapdata.length; i++){
        var idt = mapdata[i];
        features.push({
          geometry: new Point(fromLonLat([idt.longitude, idt.latitude])),
          color: 'rgba(255, 0, 0, 1)',
          text: idt.descr + ': ' + 
            idt.happened.setLocale('en-US').toFormat('ccc M/d @ h:mm a')
        });
    };

    addPoints(features, featuresLayer);

}

function setYouAreHere(query_lonlat, youAreHereLayer){ addPoints([{ 
  geometry: new Point(fromLonLat(query_lonlat)),
  text: 'You Are Here',
  color: 'yellow'
}], youAreHereLayer)}


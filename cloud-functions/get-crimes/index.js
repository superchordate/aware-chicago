// include package.json from cloud-functions/get-crimes/package.json
// add your app_token runtime environment variable. this only works after you deploy the function, 
//    so you'll need to paste it in below for testing prior to deployment.
// test data:
// {"box": [-87.65, 41.87, -87.61, 41.88], "last20days": true, "weekdaytype": true}

const functions = require('@google-cloud/functions-framework')
const { DateTime } = require("luxon")

functions.http('getCrime', async(req, res) => {

    res.set('Access-Control-Allow-Origin', '*')
    
    var params = req.body
    if(typeof params === 'string'){ params = JSON.parse(params) }
    const app_token = process.env.app_token

    // https://moment.github.io/luxon/
    // see format presets and parts at https://github.com/moment/luxon/blob/master/docs/formatting.md
    // we need to get the hour and time in Chicago's time zone to match the dataset.
    // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/DateTimeFormat/DateTimeFormat for options.
    const now_chicago = DateTime.local().setZone('America/Chicago')
    const hrmin_now_chicago = minutes_with_hours(now_chicago)

    // Defined exclusion and renaming of types.
    // const exclude_primary_descr = "'ARSON','CRIMINAL TRESPASS','DECEPTIVE PRACTICE','LIQUOR LAW VIOLATION','INTERFERENCE WITH PUBLIC OFFICER','GAMBLING','OTHER OFFENSE','NON-CRIMINAL','OBSCENITY','OFFENSE INVOLVING CHILDREN','BURGLARY','CRIMINAL DAMAGE'";
    const exclude_primary_descr = false

    // get matching day types. 
    const isweekday = isWeekDay(now_chicago)
    const weekdays = isweekday ? '(1,2,3,4,5)' : '(0,6)' // 6, 0 = sat, sun.

    // find the date to start at - we want the last 20 of each day type. 
    const max_daysoftype = 20
    var num_daysoftype = 0
    var loopday = now_chicago.minus({days: 7}) // the dataset lags 7 days so start there.
    do{
        loopday = loopday.minus({days: 1})
        // if there is a match on yes/no weekday, increment the day counter. we'll keep going 'till we reach our needed limit, and then we'll have the date.
        if(isWeekDay(loopday) === isweekday) num_daysoftype++;
    } while(num_daysoftype < max_daysoftype)

    // finish the api query.
    // https://data.cityofchicago.org/Public-Safety/Crimes-One-year-prior-to-present/x2n5-8w5q
    // https://dev.socrata.com/docs/functions
    var where = `_location_description in ('STREET','SIDEWALK') AND domestic='N' ` // within d (m?) and on the street.
        + (params.last20days ? ` and date_of_occurrence >= '${loopday.toFormat('yyyy-MM-dd')}' `: ``)
        + (params.weekdaytype ? ` and date_extract_dow(date_of_occurrence) in ${weekdays}`: ``) // match weekday type.
        + (exclude_primary_descr ? ` and _primary_decsription not in (${exclude_primary_descr})`: ``)
        + ` and within_box(location,${params['box'][1]},${params['box'][0]},${params['box'][3]},${params['box'][2]}) `

    // finish the query.
    const url = 'https://data.cityofchicago.org/resource/3uz7-d32j.json?$$app_token=' + app_token + '&$WHERE=' + encodeURIComponent(where)

    // fetch and filter the data. 
    const response = await fetch(url)
    const data = await response.json()

    // additional filtering.
    const filtered = data.filter(function(x){ 
        const dateofocurrence = DateTime.fromISO(x.date_of_occurrence, {zone: 'America/Chicago'});
        const hrmin_dateofocurrence = minutes_with_hours(dateofocurrence)
        return distMod(60*24, hrmin_dateofocurrence, hrmin_now_chicago) <= 2 * 60 // within 2 hours earlier or later.
    })

    res.send(filtered)

})

function minutes_with_hours(datetime){    
    const hours = Number(datetime.toFormat('H')) 
    const minutes = Number(datetime.toFormat('m'))
    return hours * 60 + minutes
}

function distMod(mod, a, b){ 
    var diff = Math.abs(b-a); 
    return (diff< (mod/2)) ? diff : mod - diff; 
}

function isWeekDay(datetime){ 

    const weekday = {
        'Sunday': 0,
        'Monday': 1,
        'Tueday': 2,
        'Wednesday': 3,
        'Thursday': 4,
        'Friday': 5,
        'Saturday': 6
    }[datetime.toLocaleString({weekday: 'long'})]

    return  ![6,0].includes(weekday)

}

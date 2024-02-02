const functions = require('@google-cloud/functions-framework');

// !! don't forget to add your app_token runtime environment variable. this only works after you deploy the function, 
//    so you'll need to paste it in below for testing prior to deployment.
// test data:
// {"box": [-87.65, 41.87, -87.61, 41.88], "last20days": true, "weekdaytype": true}
functions.http('getCrime', async(req, res) => {

    res.set('Access-Control-Allow-Origin', '*')
    
    var params = req.body
    console.log(params)
    console.log(typeof params)

    const app_token = process.env.app_token

    if(typeof params === 'string'){ params = JSON.parse(params) }
    console.log(params)

    const time = new Date()
    const hrmin_now = time.getHours() * 60 + time.getMinutes()

    // Defined exclusion and renaming of types.
    // const exclude_primary_descr = "'ARSON','CRIMINAL TRESPASS','DECEPTIVE PRACTICE','LIQUOR LAW VIOLATION','INTERFERENCE WITH PUBLIC OFFICER','GAMBLING','OTHER OFFENSE','NON-CRIMINAL','OBSCENITY','OFFENSE INVOLVING CHILDREN','BURGLARY','CRIMINAL DAMAGE'";
    const exclude_primary_descr = false

    // get matching day types. 
    const isweekday = weekDay(time)
    const weekdays = isweekday ? '(1,2,3,4,5)' : '(0,6)' // 6, 0 = sat, sun.

    // find the date to start at - we want the last 20 of each day type. 
    const max_daysoftype = 20
    var num_daysoftype = 0
    var loopday = new Date()
    loopday.setDate(loopday.getDate() - 5) // the dataset lags 7 days so start there.
    do{
        loopday.setDate(loopday.getDate() - 1)
        // if there is a match on yes/no weekday, increment the day counter. we'll keep going 'till we reach our needed limit, and then we'll have the date.
        if(weekDay(loopday) === isweekday) num_daysoftype++;
    } while(num_daysoftype < max_daysoftype)

    // finish the api query.
    // https://data.cityofchicago.org/Public-Safety/Crimes-One-year-prior-to-present/x2n5-8w5q
    // https://dev.socrata.com/docs/functions
    var where = `_location_description in ('STREET','SIDEWALK') AND domestic='N' ` // within d (m?) and on the street.
        + (params.last20days ? ` and date_of_occurrence >= '${formatDate(loopday)}' `: ``) //y-m-d
        + (params.weekdaytype ? ` and date_extract_dow(date_of_occurrence) in ${weekdays}`: ``) // match weekday type.
        + (exclude_primary_descr ? ` and _primary_decsription not in (${exclude_primary_descr})`: ``)
        + ` and within_box(location,${params['box'][1]},${params['box'][0]},${params['box'][3]},${params['box'][2]}) `

    // finish the query.
    var url = 'https://data.cityofchicago.org/resource/3uz7-d32j.json?$$app_token=' + app_token + '&$WHERE=' + encodeURIComponent(where)

    // fetch and filter the data. 
    const response = await fetch(url)
    const data = await response.json()

    // additional filtering.
    const filtered = data.filter(function(x){ 
        var doc = new Date(x.date_of_occurrence)
        var hrmin = doc.getHours() * 60 + doc.getMinutes()
        return distMod(60*24, hrmin, hrmin_now) <= 2 * 60 // within 2 hours earlier or later.
    })

    res.send(filtered)

})

function distMod(mod, a, b){ 
var diff = Math.abs(b-a); 
return (diff< (mod/2)) ? diff : mod - diff; 
}

function formatDate(date, format = 'ymd', sep = '-') {
    var d = new Date(date), month = '' + (d.getMonth() + 1), day = '' + d.getDate(), year = d.getFullYear()
    if (month.length < 2) month = '0' + month
    if (day.length < 2) day = '0' + day
    if(format === 'ymd') return [year, month, day].join(sep)
    if(format === 'mdy') return [month, day, year ].join(sep)
}

function weekDay(date){ return  ! [6,0].includes( date.getDay() ); }
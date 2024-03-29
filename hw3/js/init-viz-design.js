// GLOBAL
var allData = [];
var metaData = {};
var dispatcher = {};
var dateParser = d3.time.format('%Y-%m-%d').parse;
var prioNames = [];

var loadData = function(){
    queue()
      .defer( d3.json, 'data/perDayData.json' )
      .defer( d3.json, 'data/MYWorld_fields.json' )
      .await( dataLoaded );
};

var dataLoaded = function ( error, _allData, _metaData ) {
    if ( !error ) {

        allData = _allData.map( function ( d ) {

            var ageMap = d3.map( d.age, function( val ) { return val.age; } );
            var res = {
                time: dateParser( d.day ),
                count: parseInt( d[ 'count(*)' ] ),
                prios: [],
                ages: []
            };

            for ( var i = 0; i < 16; i++ ) {
                res.prios.push( d[ 'sum(p' + i + ')' ] );
            }

            res.ages = d3.range( 0, 100 ).map( function( age ) {
                var count = ageMap.get( age );

                if ( count ) {
                    return count[ 'count(*)' ];
                } else {
                    return 0;
                }

            } );

            return res;
        });

        metaData = _metaData;
        initVis();
    }
};

function initDispatcher( myCount, myPrio, myAge, myStacked ) {
    var dispatch = d3.dispatch( 'selectionChanged' );
    var mouseoverDispatch = d3.dispatch( 'stackedMouseover' );
    var mouseoutDispatch = d3.dispatch( 'stackedMouseout' );

    myCount.brush.on( 'brushend', function() {
      dispatch.selectionChanged( myCount.brush.extent() );
    });

    myStacked.rects.on( 'mouseover', function() {
        mouseoverDispatch.stackedMouseover( this.parentNode );
    });

    myStacked.rects.on( 'mouseout', function() {
        mouseoutDispatch.stackedMouseout( this.parentNode );
    });

    dispatch.on( 'selectionChanged', function( extent ) {
        var from = d3.time.day.round( extent[0] );
        var to = d3.time.day.round( extent[1] );
        myCount.updateBrushText( from, to );
        myPrio.onSelectionChange( from, to );
        myAge.onSelectionChange( from, to );
        myStacked.onSelectionChange( from, to );
    });

    mouseoverDispatch.on( 'stackedMouseover', function( hoveredParent ) {
        myStacked.updateSelectedText( hoveredParent );
    });

    mouseoutDispatch.on( 'stackedMouseout', function( hoveredParent ) {
        myStacked.clearSelectedText( hoveredParent );
    });

    return dispatch;
}

var initVis = function(){

    var myPrio = new PrioViz( d3.select( '#prioVis' ), allData, metaData ),
        myCount = new CountViz( d3.select( '#countVis' ), allData ),
        myAge = new AgeViz( d3.select( '#ageVis' ), allData, metaData )
        myStacked = new StackedViz( d3.select( '#stacked-viz' ), allData, metaData );

    prioNames = getPrioNames();

    dispatcher = initDispatcher( myCount, myPrio, myAge, myStacked );
};

var getPrioNames = function() {
    var res = d3.range( 0, 15 );

    for ( var i = 0; i < 16; i++ ) {
        res[i] = this.metaData.priorities[i][ 'item-title' ];
    }

    return res;
};

// from answer by Lukas Eder:
// http://stackoverflow.com/questions/4413590/javascript-get-array-of-dates-between-2-dates
Date.prototype.addDays = function( days ) {
    var dat = new Date( this.valueOf() );
    dat.setDate( dat.getDate() + days );
    return dat;
};

function getDates( startDate, stopDate ) {
    var dateArray = [];
    var currentDate = startDate;
    while ( currentDate <= stopDate ) {
        dateArray.push( new Date( currentDate ) );
        currentDate = currentDate.addDays( 1 );
    }
    return dateArray;
}

loadData();

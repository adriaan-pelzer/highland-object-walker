const R = require ( 'ramda' );
const H = require ( 'highland' );

const objectWalker = R.curry ( ( conf, O ) => {
    const thisWalker = objectWalker ( conf );

    if ( R.type ( O ) === 'Array' ) {
        return H ( R.map ( thisWalker, O ) )
            .parallel ( 100 )
            .collect ();
    }

    if ( R.type ( O ) === 'Object' ) {
        return H ( R.map ( thisWalker, R.values ( O ) ) )
            .parallel ( 100 )
            .collect ()
            .map ( R.zip ( R.keys ( O ) ) )
            .map ( R.fromPairs );
    }

    if ( R.contains ( R.type ( O ), R.keys ( conf ) ) && R.type ( conf[R.type ( O )] ) === 'Function' ) {
        return conf[R.type ( O )]( O );
    }

    return H ( [ O ] );
} );

module.exports = objectWalker;

if ( ! module.parent ) {
    const assert = ( truth, msg ) => { if ( ! truth ) { throw new Error ( msg ); } };
    const testConf = {
        String: s => H ( [ s ] ).map ( s => ( { type: 'String', value: s } ) ),
        Date: d => H ( [ d ] ).map ( d => ( { type: 'Date', value: d } ) ),
        Number: n => H ( [ n ] ).map ( n => ( { type: 'Number', value: n } ) )
    };
    const testWalker = objectWalker ( testConf );

    const testThing = R.curry ( ( thing, o ) => {
        assert ( R.type ( o ) === 'Object', 'Output is not an object' );
        assert ( o.type === R.type ( thing ), `Output type is not '${R.type(thing)}', but '${o.type}'` );
        assert ( o.value === thing, `Output value is not '${thing}', but '${o.value}'` );
        console.log ( '- Success' );
    } );

    const testUnit = thing => {
        console.log ( `Test with ${R.type(thing)} '${thing}'` );
        testWalker ( thing ).errors ( R.unary ( console.error ) ).each ( testThing ( thing ) );
    };

    testUnit ( 'hallo' );
    testUnit ( new Date () );
    testUnit ( 35678 );

    const testArray = input => ( o, index ) => {
        const thing = input[index];
        console.log ( `Test array item ${R.type(thing)} '${thing}'` );
        testThing ( thing, o );
    };

    const arrayTest = [ 'hallo', new Date (), 35678 ];

    testWalker ( arrayTest ).each ( o => o.forEach ( testArray ( arrayTest ) ) );

    const testObject = input => ( o, index ) => {
        const key = R.toPairs ( input )[index][0]
        const thing = R.toPairs ( input )[index][1];

        console.log ( `Test ${R.type ( input )} item ${R.type(thing)} '${thing}'` );
        testThing ( thing, o );
    };

    const objectTest = {
        myDate: new Date (),
        myNumber: 1234,
        myString: 'hallo'
    };

    testWalker ( objectTest ).each ( o => R.toPairs ( o ).forEach ( ( pair, index ) => {
        assert ( pair[0] === R.keys ( objectTest )[index], `Object item key is not '${R.keys ( objectTest )[index]}', but '${pair[0]}'` );
        testObject ( objectTest )( pair[1], index );
    } ) );
}

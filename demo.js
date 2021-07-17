// demo.js

// This is used by demo.html to demonstrate parseq.js. It includes a widget
// function that represents a service factory, a show callback that displays the
// final result, and a parseq routine written as an annotated nested array.

// This interacts with the browser using Plain Old DOM.

/*jslint
    browser
*/

/*property
    addEventListener, appendChild, backgroundColor, body, createElement,
    createTextNode, fallback, getElementById, location, onclick, parallel,
    race, reload, sequence, stringify, style, type, value
*/

import parseq from "./parseq.js";

document.getElementById("reset").onclick = function (ignore) {
    window.location.re
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
    window.location.reload(true);
};

function widget(name) {
    return function widget_requestor(callback, value) {
        let result = (
            value !== undefined
            ? value + ">" + name
            : name
        );
        let demo = document.getElementById("demo");
        let fieldset = document.createElement("fieldset");
        let legend = document.createElement("legend");
        let success = document.createElement("input");
        let failure = document.createElement("input");
        fieldset.appendChild(legend);
        fieldset.appendChild(success);
        fieldset.appendChild(failure);
        legend.appendChild(document.createTextNode(name));
        success.type = "button";
        success.value = "success";
        success.addEventListener(
            "click",
            function success_handler() {
                fieldset.style.backgroundColor = "lightgreen";
                return callback(result);
            },
            false
        );
        failure.type = "button";
        failure.value = "failure";
        failure.addEventListener(
            "click",
            function failure_handler() {
                fieldset.style.backgroundColor = "pink";
                return callback(undefined, result);
            },
            false
        );
        demo.appendChild(fieldset);
        return function widget_cancel() {
            fieldset.style.backgroundColor = "darkgray";
        };
    };
}

function show(value, reason) {
    let body;
    let color;
    let demo = document.getElementById("demo");
    let fieldset = document.createElement("fieldset");
    let legend = document.createElement("legend");
    let result;
    let title;
    if (value !== undefined) {
        result = JSON.stringify(value);
        title = "success";
        color = "lightgreen";
        body = "mintcream";
    } else {
        result = JSON.stringify(reason);
        title = "failure";
        color = "pink";
        body = "mistyrose";
    }
    fieldset.appendChild(legend);
    legend.appendChild(document.createTextNode(title));
    fieldset.appendChild(document.createTextNode(result));
    fieldset.style.backgroundColor = color;
    legend.style.backgroundColo
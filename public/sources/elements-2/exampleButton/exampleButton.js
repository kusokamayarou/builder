import {getService} from 'vc-cake';
getService('cook').add(
  {
  "tag": {
    "type": "string",
    "access": "protected",
    "value": "exampleButton"
  },
  "name": {
    "type": "string",
    "access": "protected",
    "value": "Example Button 1.0"
  },
  "color": {
    "type": "string",
    "access": "public",
    "value": "red",
    "title": "Color",
    "options": {
      "data": "colors"
    }
  }
},
  // Component callback
  function(component) {
    var React = require('react');
    component.add(React.createClass({
      render: function() {
        // import settings vars
        var {tag, name, color, id, ...other} = this.props;

        // import template
        return <button type="button" className="color-{color}" {...other}>
              {tag}
            </button>;
      }
    }));
  },
  // css settings // css for element
  {},
  // javascript callback
  function(){},
  // editor js
 null
);